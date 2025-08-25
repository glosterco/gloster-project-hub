import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UpdatePaymentStatusRequest {
  paymentId: string;
  email: string;
  status: 'Aprobado' | 'Rechazado';
  notes: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId, email, status, notes }: UpdatePaymentStatusRequest = await req.json();

    console.log('🔄 Updating payment status for mandante:', { paymentId, email, status });

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // First verify that the mandante has access to this payment
    const { data: verificationData, error: verificationError } = await supabaseAdmin
      .from('Estados de pago')
      .select(`
        id,
        Project,
        Proyectos!inner (
          id,
          Owner,
          Mandantes!inner (
            id,
            ContactEmail
          )
        )
      `)
      .eq('id', parseInt(paymentId))
      .single();

    if (verificationError || !verificationData) {
      console.error('❌ Payment not found or access error:', verificationError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No se puede acceder a este estado de pago o no existe' 
        }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify that the email matches the mandante email (case insensitive)
    const mandanteEmail = verificationData.Proyectos.Mandantes.ContactEmail;
    const hasAccess = mandanteEmail && 
      mandanteEmail.toLowerCase() === email.toLowerCase();

    if (!hasAccess) {
      console.error('❌ Email does not match mandante email');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No tienes permisos para modificar este estado de pago' 
        }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log('✅ Access verified, proceeding with update...');

    // Update the payment status
    const { data: updateData, error: updateError } = await supabaseAdmin
      .from('Estados de pago')
      .update({ 
        Status: status,
        Notes: notes
      })
      .eq('id', parseInt(paymentId))
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating payment status:', updateError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Error al actualizar el estado del pago: ${updateError.message}` 
        }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`✅ Payment status updated to ${status} successfully`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: updateData,
        message: `Estado de pago actualizado a ${status}` 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error in update-payment-status-mandante function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Error interno del servidor' 
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);