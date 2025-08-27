
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyEmailAccessRequest {
  paymentId: string;
  token: string;
  email?: string; // Añadido para verificación de email CC
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId, token, email }: VerifyEmailAccessRequest = await req.json();

    if (!paymentId || !token) {
      return new Response(
        JSON.stringify({ error: 'PaymentId y token son requeridos' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch payment data to check token validity
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('Estados de pago')
      .select('URLContratista, URLMandante, Notes, Project')
      .eq('id', paymentId)
      .single();

    if (paymentError) {
      return new Response(
        JSON.stringify({ error: 'Pago no encontrado' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let userType = null;

    // PRIORIDAD 1: Si se proporciona email, verificar coincidencia directa con CCEmail
    if (email) {
      console.log('🔍 Verificando acceso por email CC:', email, 'para pago:', paymentId);
      
      // Get project data to find contractor
      const { data: project } = await supabaseAdmin
        .from('Proyectos')
        .select('Contratista')
        .eq('id', payment.Project)
        .single();

      if (project) {
        // Check if email matches contractor's CCEmail
        const { data: contractor } = await supabaseAdmin
          .from('Contratistas')
          .select('CCEmail, URLCC')
          .eq('id', project.Contratista)
          .single();

        console.log('🔍 Datos del contratista:', contractor);
        
        if (contractor?.CCEmail && contractor.CCEmail.toLowerCase() === email.toLowerCase()) {
          console.log('✅ Email CC verificado exitosamente');
          userType = 'mandante'; // CC users access executive summary like mandantes
        } else {
          console.log('❌ Email CC no coincide. Esperado:', contractor?.CCEmail, 'Recibido:', email);
        }
      }
    }

    // PRIORIDAD 2: Verificar tokens en URLs si no se verificó por email
    if (!userType) {
      // Check if token matches contratista URL
      if (payment.URLContratista && payment.URLContratista.includes(`token=${token}`)) {
        userType = 'contratista';
      }
      // Check if token matches mandante URL
      else if (payment.URLMandante && payment.URLMandante.includes(`token=${token}`)) {
        userType = 'mandante';
      }
      // Check if token matches CC token in Notes field
      else if (payment.Notes && payment.Notes.includes(`CC_TOKEN:${token}`)) {
        userType = 'mandante'; // CC users access executive summary like mandantes
      }
      // Check if token matches URLCC of the contractor associated with this payment's project
      else {
        // Get project data to find contractor
        const { data: project } = await supabaseAdmin
          .from('Proyectos')
          .select('Contratista')
          .eq('id', payment.Project)
          .single();

        if (project) {
          // Check if token matches contractor's URLCC
          const { data: contractor } = await supabaseAdmin
            .from('Contratistas')
            .select('URLCC')
            .eq('id', project.Contratista)
            .single();

          if (contractor?.URLCC && contractor.URLCC.includes(`token=${token}`)) {
            userType = 'mandante'; // CC users access executive summary like mandantes
          }
        }
      }
    }

    if (!userType) {
      return new Response(
        JSON.stringify({ error: 'Token o email inválido' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ userType }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error in verify-email-access function:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
