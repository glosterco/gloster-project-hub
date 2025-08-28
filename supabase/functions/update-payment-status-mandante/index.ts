import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdatePaymentStatusRequest {
  paymentId: string;
  status: 'Aprobado' | 'Rechazado';
  notes: string;
  mandanteEmail: string; // Para verificación de acceso
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId, status, notes, mandanteEmail }: UpdatePaymentStatusRequest = await req.json();
    
    console.log('🔄 Mandante update payment status request:', { 
      paymentId, 
      status, 
      notes: notes?.substring(0, 100) + '...',
      mandanteEmail,
      timestamp: new Date().toISOString()
    });

    // Validation
    if (!paymentId || !status || !notes || !mandanteEmail) {
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

    // STEP 1: Verify that the mandante has access to this payment
    console.log('🔍 Verifying mandante access to payment...');
    const { data: paymentData, error: paymentError } = await supabase
      .from('Estados de pago')
      .select(`
        id,
        Project,
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
      .eq('id', parseInt(paymentId))
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

    // STEP 2: Verify mandante email access
    const mandanteContactEmail = paymentData.projectData?.ownerData?.ContactEmail;
    if (!mandanteContactEmail || mandanteContactEmail.toLowerCase() !== mandanteEmail.toLowerCase()) {
      console.error('❌ Mandante email verification failed:', {
        provided: mandanteEmail,
        expected: mandanteContactEmail
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

    console.log('✅ Mandante access verified, updating payment status...');

    // STEP 3: Update payment status (using service role, bypasses all RLS)
    const { error: updateError } = await supabase
      .from('Estados de pago')
      .update({ 
        Status: status,
        Notes: notes
      })
      .eq('id', parseInt(paymentId));

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

    console.log('✅ Payment status updated successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Payment ${paymentId} status updated to ${status}`,
        paymentId,
        status
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