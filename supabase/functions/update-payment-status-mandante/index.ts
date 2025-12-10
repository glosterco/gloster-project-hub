import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdatePaymentStatusRequest {
  paymentId: string;
  status: string;
  notes: string;
  mandanteEmail: string;
  approvalProgress?: number;
  totalRequired?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId, status, notes, mandanteEmail, approvalProgress, totalRequired }: UpdatePaymentStatusRequest = await req.json();
    
    console.log('═══════════════════════════════════════════════════════════');
    console.log('🔄 update-payment-status-mandante INICIANDO');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 Request:', { 
      paymentId, 
      status, 
      notes: notes?.substring(0, 100) + '...',
      mandanteEmail,
      approvalProgress,
      totalRequired,
      timestamp: new Date().toISOString()
    });

    // Validation
    if (!paymentId || !status || !notes || !mandanteEmail) {
      console.error('❌ Missing required parameters');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required parameters' 
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

    const paymentIdNum = parseInt(paymentId);

    // STEP 1: Get payment data with project info
    console.log('🔍 Step 1: Fetching payment data...');
    const { data: paymentData, error: paymentError } = await supabase
      .from('Estados de pago')
      .select(`
        id,
        Project,
        Status,
        approval_progress,
        total_approvals_required,
        projectData:Proyectos!Project (
          id,
          Name,
          Owner,
          ownerData:Mandantes!Owner (
            id,
            ContactEmail,
            CompanyName
          )
        )
      `)
      .eq('id', paymentIdNum)
      .single();

    if (paymentError || !paymentData) {
      console.error('❌ Error fetching payment data:', paymentError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Payment not found' 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    console.log('📋 Payment data:', {
      id: paymentData.id,
      currentStatus: paymentData.Status,
      projectId: paymentData.Project
    });

    // STEP 2: Verify mandante email access OR approver access
    console.log('🔍 Step 2: Verifying access...');
    const mandanteContactEmail = paymentData.projectData?.ownerData?.ContactEmail;
    let hasAccess = mandanteContactEmail && mandanteContactEmail.toLowerCase() === mandanteEmail.toLowerCase();
    let accessType = hasAccess ? 'mandante' : 'none';

    // If not mandante, check if user is an approver
    if (!hasAccess) {
      const { data: approverAccess } = await supabase
        .rpc('verify_approver_email_access', { 
          payment_id: paymentIdNum,
          user_email: mandanteEmail 
        });
      hasAccess = approverAccess === true;
      if (hasAccess) accessType = 'approver';
    }

    if (!hasAccess) {
      console.error('❌ Access verification failed:', {
        provided: mandanteEmail,
        mandanteEmail: mandanteContactEmail,
        accessType
      });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Unauthorized access' 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403,
        }
      );
    }

    console.log('✅ Access verified:', { accessType, email: mandanteEmail });

    // ═══════════════════════════════════════════════════════════════════════
    // STEP 3: CRITICAL - Verify approval requirements before setting "Aprobado"
    // ═══════════════════════════════════════════════════════════════════════
    let finalStatus = status;
    let finalNotes = notes;
    let finalApprovalProgress = approvalProgress ?? 0;
    let finalTotalRequired = totalRequired ?? 1;

    if (status === 'Aprobado') {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('🔍 Step 3: VERIFYING APPROVAL REQUIREMENTS');
      console.log('═══════════════════════════════════════════════════════════');

      // Get approval config for this project
      const { data: config } = await supabase
        .from('project_approval_config')
        .select('id, required_approvals, approval_order_matters')
        .eq('project_id', paymentData.Project)
        .single();

      const requiredApprovals = config?.required_approvals || 1;
      console.log('📋 Required approvals from config:', requiredApprovals);

      // Count actual approved approvals in payment_approvals table
      const { data: approvals, error: approvalsError } = await supabase
        .from('payment_approvals')
        .select('id, approver_email, approval_status, approved_at')
        .eq('payment_id', paymentIdNum)
        .eq('approval_status', 'Aprobado');

      if (approvalsError) {
        console.error('❌ Error counting approvals:', approvalsError);
      }

      const actualApprovals = approvals?.length || 0;
      console.log('📊 Actual approvals in payment_approvals:', actualApprovals);
      console.log('📊 Approvers:', approvals?.map(a => a.approver_email));

      // Update final values
      finalApprovalProgress = actualApprovals;
      finalTotalRequired = requiredApprovals;

      // CRITICAL DECISION: Only allow "Aprobado" if enough approvals exist
      if (actualApprovals < requiredApprovals) {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('⚠️ INSUFFICIENT APPROVALS - BLOCKING FINAL APPROVAL');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`📊 ${actualApprovals}/${requiredApprovals} aprobaciones`);
        
        // Override status to "En Revisión" since not all approvals are in
        finalStatus = 'En Revisión';
        finalNotes = `${actualApprovals}/${requiredApprovals} aprobaciones completadas. Esperando ${requiredApprovals - actualApprovals} aprobación(es) adicional(es).`;
        
        console.log('📝 Overriding status to:', finalStatus);
      } else {
        console.log('═══════════════════════════════════════════════════════════');
        console.log('✅ ALL APPROVALS RECEIVED - ALLOWING FINAL APPROVAL');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`📊 ${actualApprovals}/${requiredApprovals} aprobaciones`);
      }
    }

    // STEP 4: Update payment status
    console.log('📝 Step 4: Updating payment record...');
    console.log('📝 Final values:', {
      Status: finalStatus,
      Notes: finalNotes.substring(0, 100) + '...',
      approval_progress: finalApprovalProgress,
      total_approvals_required: finalTotalRequired
    });

    const { error: updateError } = await supabase
      .from('Estados de pago')
      .update({ 
        Status: finalStatus,
        Notes: finalNotes,
        approval_progress: finalApprovalProgress,
        total_approvals_required: finalTotalRequired
      })
      .eq('id', paymentIdNum);

    if (updateError) {
      console.error('❌ Error updating payment status:', updateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Failed to update payment status: ${updateError.message}` 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✅ update-payment-status-mandante COMPLETED');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('📋 Final status:', finalStatus);
    console.log('📋 Approval progress:', `${finalApprovalProgress}/${finalTotalRequired}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Payment ${paymentId} status updated to ${finalStatus}`,
        paymentId,
        status: finalStatus,
        approvalProgress: finalApprovalProgress,
        totalRequired: finalTotalRequired,
        wasOverridden: status !== finalStatus
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("❌ Error in update-payment-status-mandante:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

serve(handler);
