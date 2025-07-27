import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TemporaryAccessRequest {
  paymentId: string;
  email: string;
}

const generateTemporaryCode = () => {
  // Generar código de 6 dígitos
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId, email }: TemporaryAccessRequest = await req.json();
    console.log(`Generating temporary access code for payment ${paymentId} and email ${email}`);

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar que el paymentId existe y el email corresponde
    const parsedPaymentId = parseInt(paymentId, 10);
    if (isNaN(parsedPaymentId)) {
      throw new Error('ID de pago inválido');
    }

    const { data: paymentData, error: paymentError } = await supabase
      .from('Estados de pago')
      .select(`
        id,
        Proyectos!inner (
          id,
          Mandantes!inner (
            ContactEmail
          )
        )
      `)
      .eq('id', parsedPaymentId)
      .single();

    if (paymentError || !paymentData) {
      throw new Error('Estado de pago no encontrado');
    }

    const mandanteEmail = paymentData?.Proyectos?.Mandantes?.ContactEmail;
    if (!mandanteEmail || email.toLowerCase() !== mandanteEmail.toLowerCase()) {
      throw new Error('Email no autorizado para este estado de pago');
    }

    // Verificar si ya existe un código temporal válido
    const { data: existingCode } = await supabase
      .from('temporary_access_codes')
      .select('*')
      .eq('payment_id', parsedPaymentId)
      .eq('email', email.toLowerCase())
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    let temporaryCode;
    let expiresAt;

    if (existingCode) {
      // Si ya existe un código válido, usarlo
      console.log('⚡ Using existing valid temporary code');
      temporaryCode = existingCode.code;
      expiresAt = new Date(existingCode.expires_at);
    } else {
      // Invalidar códigos temporales anteriores para este payment y email
      await supabase
        .from('temporary_access_codes')
        .update({ used: true })
        .eq('payment_id', parsedPaymentId)
        .eq('email', email.toLowerCase())
        .eq('used', false);

      // Generar nuevo código temporal
      temporaryCode = generateTemporaryCode();
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // Válido por 24 horas

      // Guardar código en la base de datos
      const { error: insertError } = await supabase
        .from('temporary_access_codes')
        .insert({
          payment_id: parsedPaymentId,
          email: email.toLowerCase(),
          code: temporaryCode,
          expires_at: expiresAt.toISOString(),
          used: false
        });

      if (insertError) {
        console.error('Error saving temporary code:', insertError);
        throw new Error('Error al generar código temporal');
      }
    }

    // Preparar datos para el email
    const gmailFunction = Deno.env.get('GMAIL_CLIENT_ID') ? 'send-mandante-notification' : null;
    
    if (gmailFunction) {
      // Usar la función existente de notificación de mandante adaptada
      const notificationPayload = {
        paymentId: paymentId,
        mandanteEmail: email,
        temporaryCode: temporaryCode,
        isTemporaryAccess: true,
        expiresAt: expiresAt.toISOString()
      };

      const { error: emailError } = await supabase.functions.invoke(gmailFunction, {
        body: notificationPayload,
      });

      if (emailError) {
        console.error('Error sending email:', emailError);
        // No fallar completamente si el email falla
      }
    }

    console.log('✅ Temporary access code generated successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Código temporal enviado exitosamente',
        expiresAt: expiresAt.toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error generating temporary access code:", error);
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