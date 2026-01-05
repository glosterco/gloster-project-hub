
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Mensaje de error unificado para seguridad
const ACCESS_DENIED_MESSAGE = 'Acceso no autorizado. Verifique que su email corresponda al destinatario del enlace.';

interface VerifyEmailAccessRequest {
  paymentId?: string;
  contractorId?: string;
  mandanteId?: string;
  projectId?: string;
  rfiId?: string;        // ID específico del RFI para filtrar
  adicionalId?: string;  // ID específico del adicional para filtrar
  token: string;
  email?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      paymentId, contractorId, mandanteId, projectId, 
      rfiId, adicionalId, token, email 
    }: VerifyEmailAccessRequest = await req.json();

    console.log('🔍 Verificación de acceso:', { paymentId, contractorId, mandanteId, projectId, rfiId, adicionalId, token: token?.substring(0, 8) + '...', email });

    // Validación básica
    if ((!paymentId && !contractorId && !mandanteId && !projectId) || !token) {
      return new Response(
        JSON.stringify({ error: 'Enlace inválido o incompleto.' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ============================================
    // CASO 1: Acceso via URLCC (contractorId)
    // ============================================
    if (contractorId) {
      console.log('🔍 Verificando acceso CC para contractorId:', contractorId);
      
      const { data: contractor, error: contractorError } = await supabaseAdmin
        .from('Contratistas')
        .select('URLCC, CCEmail, id')
        .eq('id', contractorId)
        .single();

      if (contractorError || !contractor) {
        return new Response(
          JSON.stringify({ error: ACCESS_DENIED_MESSAGE }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (!contractor.URLCC || !contractor.URLCC.includes(`token=${token}`)) {
        return new Response(
          JSON.stringify({ error: ACCESS_DENIED_MESSAGE }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Verificar email si se proporciona
      if (email && contractor.CCEmail) {
        if (contractor.CCEmail.toLowerCase().trim() !== email.toLowerCase().trim()) {
          return new Response(
            JSON.stringify({ error: ACCESS_DENIED_MESSAGE }),
            { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }

      console.log('✅ Acceso CC verificado');
      return new Response(
        JSON.stringify({ userType: 'cc', accessType: 'cc' }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ============================================
    // CASO 2: Acceso via projectId (RFI/Adicionales)
    // ============================================
    if (projectId) {
      console.log('🔍 Verificando acceso por projectId:', projectId, 'rfiId:', rfiId, 'adicionalId:', adicionalId);
      
      const { data: projectData, error: projectError } = await supabaseAdmin
        .from('Proyectos')
        .select('id, URL, Contratista, Owner')
        .eq('id', projectId)
        .single();

      if (projectError || !projectData) {
        console.log('❌ Proyecto no encontrado');
        return new Response(
          JSON.stringify({ error: ACCESS_DENIED_MESSAGE }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Verificar token del proyecto
      if (projectData.URL !== token) {
        console.log('❌ Token de proyecto inválido');
        return new Response(
          JSON.stringify({ error: ACCESS_DENIED_MESSAGE }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      console.log('✅ Token de proyecto verificado');

      // Si hay email, determinar permisos específicos
      if (email) {
        const emailLower = email.toLowerCase().trim();
        
        // Obtener datos del proyecto completos
        const { data: mandante } = await supabaseAdmin
          .from('Mandantes')
          .select('ContactEmail')
          .eq('id', projectData.Owner)
          .single();

        const { data: contractor } = await supabaseAdmin
          .from('Contratistas')
          .select('ContactEmail')
          .eq('id', projectData.Contratista)
          .single();

        const mandanteEmail = mandante?.ContactEmail?.toLowerCase().trim();
        const contratistaEmail = contractor?.ContactEmail?.toLowerCase().trim();

        // Verificar si es aprobador
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
            .ilike('approver_email', emailLower)
            .maybeSingle();
          isApprover = !!approver;
        }

        // Verificar si es especialista (contacto del proyecto)
        const { data: contacto } = await supabaseAdmin
          .from('contactos')
          .select('id, email')
          .eq('proyecto_id', projectId)
          .ilike('email', emailLower)
          .maybeSingle();
        const isSpecialist = !!contacto;

        // ===========================================
        // VALIDACIÓN DE ACCESO A RFI ESPECÍFICO
        // ===========================================
        if (rfiId) {
          // Obtener el RFI para verificar quién puede accederlo
          const { data: rfi } = await supabaseAdmin
            .from('RFI')
            .select('id, Proyecto')
            .eq('id', rfiId)
            .single();

          if (!rfi || rfi.Proyecto !== parseInt(projectId)) {
            return new Response(
              JSON.stringify({ error: ACCESS_DENIED_MESSAGE }),
              { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }

          // Verificar si el usuario es destinatario del RFI
          const { data: destinatarios } = await supabaseAdmin
            .from('rfi_destinatarios')
            .select('contacto_id, contactos!inner(email)')
            .eq('rfi_id', rfiId);

          const destinatarioEmails = destinatarios?.map((d: any) => 
            d.contactos?.email?.toLowerCase().trim()
          ).filter(Boolean) || [];

          // ===== REGLA CRÍTICA: EL CONTRATISTA (EMISOR) NO PUEDE ACCEDER =====
          // El contratista envía el RFI, por lo tanto NO debe poder acceder vía token
          if (emailLower === contratistaEmail) {
            console.log('❌ Contratista (emisor) intentando acceder a RFI - DENEGADO');
            return new Response(
              JSON.stringify({ error: ACCESS_DENIED_MESSAGE }),
              { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }

          // Usuarios autorizados para RFI: mandante, aprobadores, especialistas destinatarios
          const canAccessRFI = 
            emailLower === mandanteEmail || 
            isApprover || 
            destinatarioEmails.includes(emailLower);

          if (!canAccessRFI) {
            console.log('❌ Email no autorizado para este RFI');
            return new Response(
              JSON.stringify({ error: ACCESS_DENIED_MESSAGE }),
              { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }

          console.log('✅ Acceso a RFI verificado para:', emailLower);
          return new Response(
            JSON.stringify({ 
              userType: 'mandante', 
              accessType: isSpecialist ? 'specialist' : 'mandante',
              authorizedRfiId: rfiId,
              canRespond: true
            }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // ===========================================
        // VALIDACIÓN DE ACCESO A ADICIONAL ESPECÍFICO
        // ===========================================
        if (adicionalId) {
          const { data: adicional } = await supabaseAdmin
            .from('Adicionales')
            .select('id, Proyecto')
            .eq('id', adicionalId)
            .single();

          if (!adicional || adicional.Proyecto !== parseInt(projectId)) {
            return new Response(
              JSON.stringify({ error: ACCESS_DENIED_MESSAGE }),
              { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }

          // ===== REGLA CRÍTICA: EL CONTRATISTA (EMISOR) NO PUEDE APROBAR SU PROPIO ADICIONAL =====
          if (emailLower === contratistaEmail) {
            console.log('❌ Contratista (emisor) intentando acceder a adicional - DENEGADO');
            return new Response(
              JSON.stringify({ error: ACCESS_DENIED_MESSAGE }),
              { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }

          // Solo mandante y aprobadores pueden acceder a adicionales
          const canAccessAdicional = emailLower === mandanteEmail || isApprover;

          if (!canAccessAdicional) {
            console.log('❌ Email no autorizado para este adicional');
            return new Response(
              JSON.stringify({ error: ACCESS_DENIED_MESSAGE }),
              { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
            );
          }

          console.log('✅ Acceso a adicional verificado para:', emailLower);
          return new Response(
            JSON.stringify({ 
              userType: 'mandante', 
              accessType: 'mandante',
              authorizedAdicionalId: adicionalId,
              canApprove: true
            }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }

        // ===========================================
        // ACCESO GENERAL AL PROYECTO (sin item específico)
        // ===========================================
        if (emailLower === mandanteEmail || isApprover) {
          console.log('✅ Email verificado como MANDANTE/APROBADOR');
          return new Response(
            JSON.stringify({ userType: 'mandante', accessType: 'mandante' }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        } else if (emailLower === contratistaEmail) {
          // Contratista puede ver el proyecto pero NO acceder a items específicos via deep link
          console.log('✅ Email verificado como CONTRATISTA (solo lectura general)');
          return new Response(
            JSON.stringify({ userType: 'contratista', accessType: 'contratista', readOnly: true }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        } else if (isSpecialist) {
          console.log('✅ Email verificado como ESPECIALISTA');
          return new Response(
            JSON.stringify({ userType: 'mandante', accessType: 'specialist' }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        } else {
          console.log('❌ Email no autorizado para este proyecto');
          return new Response(
            JSON.stringify({ error: ACCESS_DENIED_MESSAGE }),
            { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }

      // Sin email, retornar acceso básico (se requerirá verificación de email)
      return new Response(
        JSON.stringify({ userType: 'mandante', accessType: 'mandante', requiresEmailVerification: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ============================================
    // CASO 3: Acceso via mandanteId (CC del mandante)
    // ============================================
    if (mandanteId) {
      console.log('🔍 Verificando acceso por mandanteId:', mandanteId);
      
      const { data: mandante, error: mandanteError } = await supabaseAdmin
        .from('Mandantes')
        .select('CC, ContactEmail')
        .eq('id', mandanteId)
        .single();

      if (mandanteError || !mandante) {
        return new Response(
          JSON.stringify({ error: ACCESS_DENIED_MESSAGE }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (!mandante.CC || !mandante.CC.includes(`token=${token}`)) {
        return new Response(
          JSON.stringify({ error: ACCESS_DENIED_MESSAGE }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (email && mandante.ContactEmail) {
        if (mandante.ContactEmail.toLowerCase().trim() !== email.toLowerCase().trim()) {
          return new Response(
            JSON.stringify({ error: ACCESS_DENIED_MESSAGE }),
            { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }

      console.log('✅ Acceso CC mandante verificado');
      return new Response(
        JSON.stringify({ userType: 'mandante', accessType: 'cc' }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // ============================================
    // CASO 4: Acceso via paymentId (Estados de pago)
    // ============================================
    if (paymentId) {
      console.log('🔍 Verificando acceso por paymentId:', paymentId);
      
      const { data: payment, error: paymentError } = await supabaseAdmin
        .from('Estados de pago')
        .select('URLContratista, URLMandante, Notes, Project')
        .eq('id', paymentId)
        .single();

      if (paymentError || !payment) {
        return new Response(
          JSON.stringify({ error: ACCESS_DENIED_MESSAGE }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const { data: project } = await supabaseAdmin
        .from('Proyectos')
        .select('Contratista, Owner')
        .eq('id', payment.Project)
        .single();

      if (!project) {
        return new Response(
          JSON.stringify({ error: ACCESS_DENIED_MESSAGE }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      let userType: string | null = null;
      let accessType: string | null = null;

      // Identificar tipo de acceso por token
      if (payment.URLContratista?.includes(`token=${token}`)) {
        userType = 'contratista';
        accessType = 'contratista';
      } else if (payment.URLMandante?.includes(`token=${token}`)) {
        userType = 'mandante';
        accessType = 'mandante';
      } else {
        // Verificar URLCC del contratista
        const { data: contractor } = await supabaseAdmin
          .from('Contratistas')
          .select('URLCC, CCEmail')
          .eq('id', project.Contratista)
          .single();

        if (contractor?.URLCC?.includes(`token=${token}`)) {
          userType = 'cc';
          accessType = 'cc';
        } else if (payment.Notes?.includes(`CC_TOKEN:${token}`)) {
          userType = 'cc';
          accessType = 'cc';
        }
      }

      if (!userType) {
        return new Response(
          JSON.stringify({ error: ACCESS_DENIED_MESSAGE }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Verificar email si se proporciona
      if (email) {
        let emailValid = false;

        if (accessType === 'cc') {
          const { data: contractor } = await supabaseAdmin
            .from('Contratistas')
            .select('CCEmail')
            .eq('id', project.Contratista)
            .single();
          emailValid = contractor?.CCEmail?.toLowerCase().trim() === email.toLowerCase().trim();
        } else if (accessType === 'mandante') {
          const { data: mandante } = await supabaseAdmin
            .from('Mandantes')
            .select('ContactEmail')
            .eq('id', project.Owner)
            .single();
          
          const { data: approverAccess } = await supabaseAdmin
            .rpc('verify_approver_email_access', { 
              payment_id: parseInt(paymentId),
              user_email: email 
            });

          emailValid = mandante?.ContactEmail?.toLowerCase().trim() === email.toLowerCase().trim() || approverAccess;
        } else if (accessType === 'contratista') {
          const { data: contractor } = await supabaseAdmin
            .from('Contratistas')
            .select('ContactEmail')
            .eq('id', project.Contratista)
            .single();
          emailValid = contractor?.ContactEmail?.toLowerCase().trim() === email.toLowerCase().trim();
        }

        if (!emailValid) {
          return new Response(
            JSON.stringify({ error: ACCESS_DENIED_MESSAGE }),
            { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }

      console.log('✅ Acceso a payment verificado:', userType);
      return new Response(
        JSON.stringify({ userType, accessType }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ error: ACCESS_DENIED_MESSAGE }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error en verify-email-access:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor.' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
