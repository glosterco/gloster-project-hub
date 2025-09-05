import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegenerateUrlsRequest {
  baseUrl: string; // Base URL to use for regenerating access URLs
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { baseUrl }: RegenerateUrlsRequest = await req.json();

    if (!baseUrl) {
      return new Response(JSON.stringify({ error: 'BaseUrl es requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('🔄 Starting URL regeneration process...');

    // Fetch all payment states
    const { data: payments, error: fetchError } = await supabaseAdmin
      .from('Estados de pago')
      .select('id');

    if (fetchError) {
      console.error('Error fetching payments:', fetchError);
      return new Response(JSON.stringify({ error: 'Error al obtener estados de pago' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    let successCount = 0;
    let errorCount = 0;

    // Process each payment
    for (const payment of payments) {
      try {
        // Generate new tokens
        const contractorToken = crypto.randomUUID();
        const mandanteToken = crypto.randomUUID();
        
        // Generate new URLs
        const contractorUrl = `${baseUrl}/email-access?paymentId=${payment.id}&token=${contractorToken}`;
        const mandanteUrl = `${baseUrl}/email-access?paymentId=${payment.id}&token=${mandanteToken}`;

        // Update the payment with new URLs
        const { error: updateError } = await supabaseAdmin
          .from('Estados de pago')
          .update({
            URLContratista: contractorUrl,
            URLMandante: mandanteUrl
          })
          .eq('id', payment.id);

        if (updateError) {
          console.error(`Error updating payment ${payment.id}:`, updateError);
          errorCount++;
        } else {
          console.log(`✅ Updated URLs for payment ${payment.id}`);
          successCount++;
        }
      } catch (error) {
        console.error(`Error processing payment ${payment.id}:`, error);
        errorCount++;
      }
    }

    console.log(`🎉 URL regeneration completed. Success: ${successCount}, Errors: ${errorCount}`);

    return new Response(JSON.stringify({ 
      success: true,
      message: `URLs regeneradas exitosamente. Actualizados: ${successCount}, Errores: ${errorCount}`,
      successCount,
      errorCount
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Error in regenerate-access-urls:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);