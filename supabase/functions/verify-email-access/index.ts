
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyEmailAccessRequest {
  paymentId?: string;
  contractorId?: string; // Para URLCC
  token: string;
  email?: string; // Añadido para verificación de email CC
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId, contractorId, token, email }: VerifyEmailAccessRequest = await req.json();

    console.log('🔍 Inicio de verificación - PaymentId:', paymentId, 'ContractorId:', contractorId, 'Token:', token, 'Email:', email);

    if ((!paymentId && !contractorId) || !token) {
      return new Response(
        JSON.stringify({ error: 'PaymentId o ContractorId y token son requeridos' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let payment = null;
    let project = null;

    // CASO 1: Acceso via URLCC (contractorId)
    if (contractorId) {
      console.log('🔍 Verificando acceso CC para contractorId:', contractorId);
      
      const { data: contractor, error: contractorError } = await supabaseAdmin
        .from('Contratistas')
        .select('URLCC, CCEmail, id')
        .eq('id', contractorId)
        .single();

      if (contractorError || !contractor) {
        return new Response(
          JSON.stringify({ error: 'Contratista no encontrado' }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (contractor.URLCC && contractor.URLCC.includes(`token=${token}`)) {
        console.log('✅ Token CC verificado exitosamente');
        
        if (email && contractor.CCEmail && contractor.CCEmail.toLowerCase().trim() === email.toLowerCase().trim()) {
          console.log('✅ Email CC verificado exitosamente');
          return new Response(
            JSON.stringify({ userType: 'cc', accessType: 'cc' }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        } else if (!email) {
          return new Response(
            JSON.stringify({ userType: 'cc', accessType: 'cc' }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        } else {
          return new Response(
            JSON.stringify({ error: 'Token o email inválido' }),
            { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      } else {
        return new Response(
          JSON.stringify({ error: 'Token de acceso inválido' }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // CASO 2: Acceso via URLMandante/URLContratista (paymentId)
    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: 'PaymentId requerido' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch payment data to check token validity
    const { data: paymentData, error: paymentError } = await supabaseAdmin
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

    payment = paymentData;

    // Get project data to find contractor
    const { data: projectData, error: projectError } = await supabaseAdmin
      .from('Proyectos')
      .select('Contratista, Owner')
      .eq('id', payment.Project)
      .single();

    if (projectError) {
      return new Response(
        JSON.stringify({ error: 'Proyecto no encontrado' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    project = projectData;

    let userType = null;
    let accessType = null; // 'cc', 'mandante', 'contratista'

    // PASO 1: Identificar el tipo de acceso basado en el token
    if (payment.URLContratista && payment.URLContratista.includes(`token=${token}`)) {
      console.log('🔍 Token identificado como CONTRATISTA');
      userType = 'contratista';
      accessType = 'contratista';
    } else if (payment.URLMandante && payment.URLMandante.includes(`token=${token}`)) {
      console.log('🔍 Token identificado como MANDANTE');
      userType = 'mandante';
      accessType = 'mandante';
    } else {
      // Check if token matches URLCC of the contractor
      const { data: contractor } = await supabaseAdmin
        .from('Contratistas')
        .select('URLCC, CCEmail')
        .eq('id', project.Contratista)
        .single();

      console.log('🔍 Verificando URLCC del contratista:', {
        contractorId: project.Contratista,
        urlcc: contractor?.URLCC,
        tokenBuscado: token
      });

      if (contractor?.URLCC && contractor.URLCC.includes(`token=${token}`)) {
        console.log('🔍 Token identificado como CC (URLCC)');
        userType = 'cc';
        accessType = 'cc';
      } else if (payment.Notes && payment.Notes.includes(`CC_TOKEN:${token}`)) {
        console.log('🔍 Token identificado como CC (Notes)');
        userType = 'cc';
        accessType = 'cc';
      } else {
        console.log('❌ Token no encontrado en URLCC ni en Notes');
      }
    }

    // PASO 2: Verificar email según el tipo de acceso identificado
    if (userType && email) {
      console.log(`🔍 Verificando email para tipo de acceso: ${accessType}`);
      
      if (accessType === 'cc') {
        // ESCENARIO 2: Verificar CCEmail del contratista
        const { data: contractor } = await supabaseAdmin
          .from('Contratistas')
          .select('CCEmail')
          .eq('id', project.Contratista)
          .single();

        if (contractor?.CCEmail && contractor.CCEmail.toLowerCase().trim() === email.toLowerCase().trim()) {
          console.log('✅ Email CC verificado exitosamente');
        } else {
          console.log('❌ Email CC no coincide');
          console.log('    Esperado:', contractor?.CCEmail || 'null');
          console.log('    Recibido:', email);
          userType = null;
        }
      } else if (accessType === 'mandante') {
        // ESCENARIO 1: Verificar ContactEmail del mandante
        const { data: mandante } = await supabaseAdmin
          .from('Mandantes')
          .select('ContactEmail')
          .eq('id', project.Owner)
          .single();

        if (mandante?.ContactEmail && mandante.ContactEmail.toLowerCase().trim() === email.toLowerCase().trim()) {
          console.log('✅ Email MANDANTE verificado exitosamente');
        } else {
          console.log('❌ Email MANDANTE no coincide');
          console.log('    Esperado:', mandante?.ContactEmail || 'null');
          console.log('    Recibido:', email);
          userType = null;
        }
      } else if (accessType === 'contratista') {
        // ESCENARIO 3: Verificar ContactEmail del contratista
        const { data: contractor } = await supabaseAdmin
          .from('Contratistas')
          .select('ContactEmail')
          .eq('id', project.Contratista)
          .single();

        if (contractor?.ContactEmail && contractor.ContactEmail.toLowerCase().trim() === email.toLowerCase().trim()) {
          console.log('✅ Email CONTRATISTA verificado exitosamente');
        } else {
          console.log('❌ Email CONTRATISTA no coincide');
          console.log('    Esperado:', contractor?.ContactEmail || 'null');
          console.log('    Recibido:', email);
          userType = null;
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
      JSON.stringify({ userType, accessType }),
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
