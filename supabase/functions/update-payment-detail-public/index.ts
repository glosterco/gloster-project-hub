import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UpdatePaymentRequest {
  paymentId: string | number;
  token: string;
  amount: number;
  percentage: number; // already rounded client-side
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId, token, amount, percentage }: UpdatePaymentRequest = await req.json();

    if (!paymentId || !token || amount === undefined || percentage === undefined) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate token against stored URLs
    const { data: paymentForValidation, error: paymentValidationError } = await supabaseAdmin
      .from('Estados de pago')
      .select('URLContratista, URLMandante')
      .eq('id', paymentId)
      .single();

    if (paymentValidationError || !paymentForValidation) {
      return new Response(JSON.stringify({ error: 'Pago no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Only allow updates for contratista token (owner side shouldn't change amount/progress)
    const isContractorToken = !!(
      paymentForValidation.URLContratista && paymentForValidation.URLContratista.includes(`token=${token}`)
    );

    if (!isContractorToken) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const { error: updateError } = await supabaseAdmin
      .from('Estados de pago')
      .update({ Total: amount, Progress: Math.round(percentage) })
      .eq('id', paymentId);

    if (updateError) {
      return new Response(JSON.stringify({ error: 'No se pudo actualizar' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Error in update-payment-detail-public:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
