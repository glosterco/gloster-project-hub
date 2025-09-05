import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnsureUrlRequest {
  paymentId: string | number;
  token: string; // token from contractor email-access URL
  baseUrl: string; // origin to build URL
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId, token, baseUrl }: EnsureUrlRequest = await req.json();

    if (!paymentId || !token || !baseUrl) {
      return new Response(JSON.stringify({ error: 'Faltan parámetros' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch URLs for validation
    const { data: paymentUrls, error: urlsError } = await supabaseAdmin
      .from('Estados de pago')
      .select('URLContratista, URLMandante')
      .eq('id', paymentId)
      .single();

    if (urlsError || !paymentUrls) {
      return new Response(JSON.stringify({ error: 'Pago no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Validate contractor token ownership
    const isContractorToken = !!(
      paymentUrls.URLContratista && paymentUrls.URLContratista.includes(`token=${token}`)
    );

    if (!isContractorToken) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // If URLMandante exists and matches correct origin, reuse it
    const correctBaseUrl = 'https://gloster-project-hub.lovable.app';
    if (paymentUrls.URLMandante) {
      try {
        const existing = new URL(paymentUrls.URLMandante);
        const target = new URL(correctBaseUrl);
        if (existing.origin === target.origin) {
          return new Response(JSON.stringify({ accessUrl: paymentUrls.URLMandante }), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          });
        }
      } catch {
        // If parsing fails, regenerate below
      }
    }

    // Generate new URLMandante with new token - ALWAYS use correct domain
    const newToken = crypto.randomUUID();
    const correctBaseUrl = 'https://gloster-project-hub.lovable.app';
    const accessUrl = `${correctBaseUrl}/email-access?paymentId=${paymentId}&token=${newToken}`;

    const { error: updateError } = await supabaseAdmin
      .from('Estados de pago')
      .update({ URLMandante: accessUrl })
      .eq('id', paymentId);

    if (updateError) {
      return new Response(JSON.stringify({ error: 'No se pudo guardar el enlace' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ accessUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Error in ensure-unique-access-url:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
