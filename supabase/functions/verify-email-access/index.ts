
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyEmailAccessRequest {
  paymentId?: string;
  contractorId?: string; // Para URLCC
  mandanteId?: string;
  projectId?: string; // Para deep links de adicionales/RFI
  token: string;
  email?: string; // Añadido para verificación de email CC
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId, contractorId, mandanteId, projectId, token, email }: VerifyEmailAccessRequest = await req.json();

    console.log('🔍 Inicio de verificación - PaymentId:', paymentId, 'ContractorId:', contractorId, 'MandanteId:', mandanteId, 'ProjectId:', projectId, 'Token:', token, 'Email:', email);

    if ((!paymentId && !contractorId && !mandanteId && !projectId) || !token) {
      return new Response(
        JSON.stringify({ error: 'PaymentId, ContractorId, MandanteId o ProjectId y token son requeridos' }),
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

    // CASO 3: Acceso via projectId (deep links para adicionales/RFI)
    if (projectId) {
      console.log('🔍 Verificando acceso por projectId:', projectId);
      
      const { data: projectData, error: projectError } = await supabaseAdmin
        .from('Proyectos')
        .select('id, URL, Contratista, Owner')
        .eq('id', projectId)
        .single();

      if (projectError || !projectData) {
        console.log('❌ Proyecto no encontrado:', projectError);
        return new Response(
          JSON.stringify({ error: 'Proyecto no encontrado' }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Verificar que el token coincida con el URL del proyecto
      if (projectData.URL !== token) {
        console.log('❌ Token no coincide con URL del proyecto');
        console.log('   Token esperado:', projectData.URL);
        console.log('   Token recibido:', token);
        return new Response(
          JSON.stringify({ error: 'Token de acceso inválido' }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log('✅ Token de proyecto verificado exitosamente');

      // Si hay email, verificar que pertenezca al mandante, contratista, aprobador o especialista
      if (email) {
        // Verificar email del mandante
        const { data: mandante } = await supabaseAdmin
          .from('Mandantes')
          .select('ContactEmail')
          .eq('id', projectData.Owner)
          .single();

        const mandanteEmailMatch = mandante?.ContactEmail && 
          mandante.ContactEmail.toLowerCase().trim() === email.toLowerCase().trim();

        // Verificar email del contratista
        const { data: contractor } = await supabaseAdmin
          .from('Contratistas')
          .select('ContactEmail')
          .eq('id', projectData.Contratista)
          .single();

        const contratistaEmailMatch = contractor?.ContactEmail && 
          contractor.ContactEmail.toLowerCase().trim() === email.toLowerCase().trim();

        // Verificar si es aprobador (usando project_approvers)
        const { data: approverConfig } = await supabaseAdmin
          .from('project_approval_config')
          .select('id')
          .eq('project_id', projectId)
          .single();

        let isApprover = false;
        if (approverConfig) {
          const { data: approver } = await supabaseAdmin
            .from('project_approvers')
            .select('approver_email')
            .eq('config_id', approverConfig.id)
            .ilike('approver_email', email)
            .maybeSingle();
          
          isApprover = !!approver;
        }

        // Verificar si es un contacto/especialista del proyecto
        const { data: contacto } = await supabaseAdmin
          .from('contactos')
          .select('id, email')
          .eq('proyecto_id', projectId)
          .ilike('email', email)
          .maybeSingle();

        const isSpecialist = !!contacto;

        if (mandanteEmailMatch || isApprover) {
          console.log('✅ Email verificado como MANDANTE/APROBADOR');
          return new Response(
            JSON.stringify({ userType: 'mandante', accessType: 'mandante' }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        } else if (contratistaEmailMatch) {
          console.log('✅ Email verificado como CONTRATISTA');
          return new Response(
            JSON.stringify({ userType: 'contratista', accessType: 'contratista' }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        } else if (isSpecialist) {
          // Especialistas tienen acceso de lectura para responder RFIs
          console.log('✅ Email verificado como ESPECIALISTA');
          return new Response(
            JSON.stringify({ userType: 'mandante', accessType: 'specialist' }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        } else {
          console.log('❌ Email no autorizado para este proyecto');
          return new Response(
            JSON.stringify({ error: 'Email no autorizado para este proyecto' }),
            { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }

      // Sin email, retornar tipo mandante por defecto (para deep links de adicionales/RFI)
      return new Response(
        JSON.stringify({ userType: 'mandante', accessType: 'mandante' }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // CASO 4: Acceso via mandanteId
    if (mandanteId) {
      console.log('🔍 Verificando acceso por mandanteId:', mandanteId);
      
      const { data: mandante, error: mandanteError } = await supabaseAdmin
        .from('Mandantes')
        .select('CC, ContactEmail')
        .eq('id', mandanteId)
        .single();

      if (mandanteError || !mandante) {
        return new Response(
          JSON.stringify({ error: 'Mandante no encontrado' }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (mandante.CC && mandante.CC.includes(`token=${token}`)) {
        console.log('✅ Token CC de mandante verificado exitosamente');
        
        if (email) {
          if (mandante.ContactEmail && mandante.ContactEmail.toLowerCase().trim() === email.toLowerCase().trim()) {
            console.log('✅ Email de mandante verificado exitosamente');
            return new Response(
              JSON.stringify({ userType: 'mandante', accessType: 'cc' }),
              { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          } else {
            return new Response(
              JSON.stringify({ error: 'Email no autorizado' }),
              { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }
        }
        
        return new Response(
          JSON.stringify({ userType: 'mandante', accessType: 'cc' }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } else {
        return new Response(
          JSON.stringify({ error: 'Token de acceso inválido' }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    // CASO 5: Acceso via URLMandante/URLContratista (paymentId)
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
        // ESCENARIO 1: Verificar ContactEmail del mandante, campo CC, O aprobadores del proyecto
        const { data: mandante } = await supabaseAdmin
          .from('Mandantes')
          .select('ContactEmail, CC')
          .eq('id', project.Owner)
          .single();

        const contactEmailMatch = mandante?.ContactEmail && mandante.ContactEmail.toLowerCase().trim() === email.toLowerCase().trim();
        const ccEmailMatch = mandante?.CC && mandante.CC.toLowerCase().trim() === email.toLowerCase().trim();

        // NUEVO: Verificar si el email está en la lista de aprobadores del proyecto
        const { data: approverAccess } = await supabaseAdmin
          .rpc('verify_approver_email_access', { 
            payment_id: parseInt(paymentId),
            user_email: email 
          });

        if (contactEmailMatch || ccEmailMatch || approverAccess) {
          console.log('✅ Email MANDANTE/APROBADOR verificado exitosamente');
        } else {
          console.log('❌ Email MANDANTE/APROBADOR no coincide');
          console.log('    ContactEmail esperado:', mandante?.ContactEmail || 'null');
          console.log('    CC esperado:', mandante?.CC || 'null');
          console.log('    Es aprobador:', approverAccess);
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
