import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RecordApprovalRequest {
  paymentId: string;
  approverEmail: string;
  approverName: string;
  status: 'Aprobado' | 'Rechazado';
  notes: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId, approverEmail, approverName, status, notes }: RecordApprovalRequest = await req.json();
    
    console.log('📝 Recording payment approval:', { 
      paymentId, 
      approverEmail,
      approverName,
      status,
      timestamp: new Date().toISOString()
    });

    // Validation
    if (!paymentId || !approverEmail || !status) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters: paymentId, approverEmail, status' 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Initialize Supabase with service role (bypasses RLS)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const normalizedEmail = approverEmail.toLowerCase().trim();
    const paymentIdNum = parseInt(paymentId);

    // STEP 1: Verify that this email is an authorized approver for this payment
    console.log('🔍 Verifying approver access...');
    
    // Get payment and project info
    const { data: payment, error: paymentError } = await supabase
      .from('Estados de pago')
      .select('id, Project')
      .eq('id', paymentIdNum)
      .single();

    if (paymentError || !payment) {
      console.error('❌ Payment not found:', paymentError);
      return new Response(
        JSON.stringify({ success: false, error: 'Payment not found' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Verify approver access via RPC function
    const { data: hasAccess, error: accessError } = await supabase
      .rpc('verify_approver_email_access', { 
        payment_id: paymentIdNum,
        user_email: normalizedEmail 
      });

    // Also check if user is the mandante
    const { data: isMandante } = await supabase
      .rpc('verify_mandante_email_access', { 
        payment_id: paymentIdNum,
        email: normalizedEmail 
      });

    if (!hasAccess && !isMandante) {
      console.error('❌ User is not authorized to approve this payment');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No tienes permisos para aprobar este pago' 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    console.log('✅ Approver verified:', { hasAccess, isMandante });

    // STEP 2: Check if this user already has an approval record
    const { data: existing, error: existingError } = await supabase
      .from('payment_approvals')
      .select('id, approval_status')
      .eq('payment_id', paymentIdNum)
      .eq('approver_email', normalizedEmail)
      .maybeSingle();

    if (existingError) {
      console.error('❌ Error checking existing approval:', existingError);
      return new Response(
        JSON.stringify({ success: false, error: existingError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // STEP 3: Insert or update approval record
    if (existing) {
      console.log('📝 Updating existing approval record:', existing.id);
      const { error: updateError } = await supabase
        .from('payment_approvals')
        .update({
          approval_status: status,
          approver_name: approverName,
          notes: notes || null,
          approved_at: status === 'Aprobado' ? new Date().toISOString() : null
        })
        .eq('id', existing.id);

      if (updateError) {
        console.error('❌ Error updating approval:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: updateError.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
      console.log('✅ Updated approval to', status);
    } else {
      console.log('📝 Inserting new approval record');
      const { data: inserted, error: insertError } = await supabase
        .from('payment_approvals')
        .insert({
          payment_id: paymentIdNum,
          approver_email: normalizedEmail,
          approver_name: approverName,
          approval_status: status,
          notes: notes || null,
          approved_at: status === 'Aprobado' ? new Date().toISOString() : null
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('❌ Error inserting approval:', insertError);
        return new Response(
          JSON.stringify({ success: false, error: insertError.message }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
      console.log('✅ Inserted new approval with id:', inserted?.id);
    }

    // STEP 4: Count current approved approvals
    const { data: approvals, error: countError } = await supabase
      .from('payment_approvals')
      .select('id, approver_email')
      .eq('payment_id', paymentIdNum)
      .eq('approval_status', 'Aprobado');

    if (countError) {
      console.error('❌ Error counting approvals:', countError);
      return new Response(
        JSON.stringify({ success: false, error: countError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const approvalCount = approvals?.length || 0;
    console.log('📊 Current approval count:', approvalCount, 'approvers:', approvals?.map(a => a.approver_email));

    // STEP 5: Get required approvals from config
    const { data: config } = await supabase
      .from('project_approval_config')
      .select('required_approvals')
      .eq('project_id', payment.Project)
      .single();

    const requiredApprovals = config?.required_approvals || 1;
    console.log('📋 Required approvals:', requiredApprovals);

    return new Response(
      JSON.stringify({ 
        success: true, 
        approvalCount,
        requiredApprovals,
        isFullyApproved: approvalCount >= requiredApprovals,
        message: `Approval recorded successfully. ${approvalCount}/${requiredApprovals} approvals.`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("❌ Error in record-payment-approval:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

serve(handler);
