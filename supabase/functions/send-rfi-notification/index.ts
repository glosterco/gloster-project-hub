import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface RFINotificationRequest {
  rfiId: number;
  projectId: number;
  destinatarioIds?: number[];
  selectedContactIds?: number[];
  senderEmail?: string; // Email del usuario que envía el RFI (para excluirlo y enviarle confirmación)
}

const encodeBase64UTF8 = (str: string): string => {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const getAccessToken = async (): Promise<string> => {
  const tokenManagerResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/gmail-token-manager`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
    },
    body: JSON.stringify({ action: 'validate' }),
  });

  const tokenResult = await tokenManagerResponse.json();

  if (!tokenResult.valid) {
    throw new Error(`Gmail authentication failed: ${tokenResult.error}`);
  }

  return tokenResult.access_token;
};

const getUrgenciaLabel = (urgencia: string | null): string => {
  switch (urgencia?.toLowerCase()) {
    case 'muy_urgente': return '🔴 Muy Urgente';
    case 'urgente': return '🟠 Urgente';
    default: return '🟢 No Urgente';
  }
};

const getUrgenciaColor = (urgencia: string | null): string => {
  switch (urgencia?.toLowerCase()) {
    case 'muy_urgente': return '#dc2626';
    case 'urgente': return '#f97316';
    default: return '#22c55e';
  }
};

// Email con enlace de acceso para destinatarios
const createRecipientEmailHtml = (data: {
  rfi: any;
  project: any;
  contratista: any;
  accessUrl: string;
  recipientName?: string;
  isForSpecialist?: boolean;
}): string => {
  const urgenciaColor = getUrgenciaColor(data.rfi.Urgencia);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #F5DF4D; padding: 25px 20px; text-align: center; }
        .title { color: #1e293b; font-size: 22px; font-weight: bold; margin: 0; }
        .urgency-banner { background: ${urgenciaColor}; color: white; padding: 10px; text-align: center; font-weight: 600; }
        .content { padding: 30px 25px; }
        .info-box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .info-table { width: 100%; border-collapse: collapse; }
        .info-table td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
        .info-label { font-weight: 600; color: #64748b; width: 30%; }
        .info-value { color: #1e293b; }
        .description-box { background: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .cta-section { text-align: center; margin: 30px 0; }
        .cta-button { display: inline-block; background: #3b82f6; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="title">❓ Nueva Solicitud de Información (RFI)</h1>
        </div>
        
        <div class="urgency-banner">
          ${getUrgenciaLabel(data.rfi.Urgencia)}
        </div>
        
        <div class="content">
          <p>Estimado/a <strong>${data.recipientName || 'Usuario'}</strong>,</p>
          
          <p>${data.isForSpecialist 
            ? 'Se le ha reenviado una solicitud de información que requiere su revisión como especialista.' 
            : 'Se ha recibido una nueva solicitud de información (RFI) que requiere su atención.'}</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #1e293b;">📋 Información del RFI</h3>
            <table class="info-table">
              <tr>
                <td class="info-label">Proyecto:</td>
                <td class="info-value">${data.project.Name}</td>
              </tr>
              <tr>
                <td class="info-label">Solicitante:</td>
                <td class="info-value">${data.contratista.CompanyName}</td>
              </tr>
              <tr>
                <td class="info-label">Título:</td>
                <td class="info-value">${data.rfi.Titulo || 'Sin título'}</td>
              </tr>
              <tr>
                <td class="info-label">Urgencia:</td>
                <td class="info-value" style="color: ${urgenciaColor}; font-weight: bold;">${getUrgenciaLabel(data.rfi.Urgencia)}</td>
              </tr>
              ${data.rfi.Fecha_Vencimiento ? `
              <tr>
                <td class="info-label">Fecha Límite:</td>
                <td class="info-value" style="color: #f97316; font-weight: 600;">${new Date(data.rfi.Fecha_Vencimiento).toLocaleDateString('es-CL')}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          ${data.rfi.Descripcion ? `
          <div class="description-box">
            <h4 style="margin-top: 0; color: #1e40af;">📝 Consulta/Pregunta:</h4>
            <p style="margin-bottom: 0; white-space: pre-wrap;">${data.rfi.Descripcion}</p>
          </div>
          ` : ''}
          
          <div class="cta-section">
            <p style="margin-bottom: 15px;">Para responder esta solicitud:</p>
            <a href="${data.accessUrl}" class="cta-button">Ver y Responder RFI</a>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">
            Este es un mensaje automático del sistema Gloster.
          </p>
        </div>
        
        <div class="footer">
          <p><strong>Gloster - Gestión de Proyectos</strong></p>
          <p>Consultas: soporte.gloster@gmail.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Email de confirmación para el EMISOR (sin enlace de acceso)
const createSenderConfirmationHtml = (data: {
  rfi: any;
  project: any;
  recipientName: string;
  sentToList: string[];
}): string => {
  const urgenciaColor = getUrgenciaColor(data.rfi.Urgencia);
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #22c55e; padding: 25px 20px; text-align: center; }
        .title { color: #ffffff; font-size: 22px; font-weight: bold; margin: 0; }
        .content { padding: 30px 25px; }
        .info-box { background: #f8fafc; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .info-table { width: 100%; border-collapse: collapse; }
        .info-table td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
        .info-label { font-weight: 600; color: #64748b; width: 30%; }
        .info-value { color: #1e293b; }
        .recipients-box { background: #f0fdf4; border: 1px solid #86efac; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="title">✅ RFI Enviado Exitosamente</h1>
        </div>
        
        <div class="content">
          <p>Estimado/a <strong>${data.recipientName}</strong>,</p>
          
          <p>Su solicitud de información (RFI) ha sido enviada correctamente. A continuación el resumen:</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #1e293b;">📋 Resumen del RFI</h3>
            <table class="info-table">
              <tr>
                <td class="info-label">Proyecto:</td>
                <td class="info-value">${data.project.Name}</td>
              </tr>
              <tr>
                <td class="info-label">Título:</td>
                <td class="info-value">${data.rfi.Titulo || 'Sin título'}</td>
              </tr>
              <tr>
                <td class="info-label">Urgencia:</td>
                <td class="info-value" style="color: ${urgenciaColor}; font-weight: bold;">${getUrgenciaLabel(data.rfi.Urgencia)}</td>
              </tr>
              ${data.rfi.Fecha_Vencimiento ? `
              <tr>
                <td class="info-label">Fecha Límite:</td>
                <td class="info-value">${new Date(data.rfi.Fecha_Vencimiento).toLocaleDateString('es-CL')}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div class="recipients-box">
            <h4 style="margin-top: 0; color: #166534;">📧 Notificación enviada a:</h4>
            <ul style="margin-bottom: 0; padding-left: 20px;">
              ${data.sentToList.map(email => `<li>${email}</li>`).join('')}
            </ul>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">
            Recibirá una notificación cuando el RFI sea respondido.
          </p>
        </div>
        
        <div class="footer">
          <p><strong>Gloster - Gestión de Proyectos</strong></p>
          <p>Consultas: soporte.gloster@gmail.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const sanitizeSubject = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .trim();
};

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: RFINotificationRequest = await req.json();
    console.log("📧 Sending RFI notification:", data);

    if (!data.rfiId || !data.projectId) {
      throw new Error('rfiId and projectId are required');
    }

    const destinatarioIds = (Array.isArray(data.destinatarioIds) && data.destinatarioIds.length > 0)
      ? data.destinatarioIds
      : (Array.isArray(data.selectedContactIds) ? data.selectedContactIds : []);

    // Fetch RFI
    const { data: rfi, error: rfiError } = await supabase
      .from('RFI')
      .select('*')
      .eq('id', data.rfiId)
      .single();

    if (rfiError || !rfi) {
      throw new Error(`RFI not found: ${rfiError?.message}`);
    }

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from('Proyectos')
      .select('*')
      .eq('id', data.projectId)
      .single();

    if (projectError || !project) {
      throw new Error(`Project not found: ${projectError?.message}`);
    }

    // Fetch contratista
    const { data: contratista, error: contratistaError } = await supabase
      .from('Contratistas')
      .select('*')
      .eq('id', project.Contratista)
      .single();

    if (contratistaError || !contratista) {
      throw new Error(`Contratista not found: ${contratistaError?.message}`);
    }

    // Fetch mandante
    const { data: mandante, error: mandanteError } = await supabase
      .from('Mandantes')
      .select('*')
      .eq('id', project.Owner)
      .single();

    if (mandanteError || !mandante) {
      throw new Error(`Mandante not found: ${mandanteError?.message}`);
    }

    const accessToken = await getAccessToken();
    const fromEmail = Deno.env.get("GMAIL_FROM_EMAIL");
    const baseUrl = 'https://gloster-project-hub.lovable.app';
    const sentEmailSet = new Set<string>();

    const projectToken = project.URL;
    if (!projectToken) {
      throw new Error('Project URL token not found');
    }

    // Identificar email del emisor (contratista) para excluirlo de links de acceso
    const senderEmail = data.senderEmail?.toLowerCase().trim() || contratista.ContactEmail?.toLowerCase().trim();

    // ========================================
    // ENVIAR A DESTINATARIOS (con link de acceso)
    // ========================================

    // 1. Mandante (si no es el emisor)
    if (mandante.ContactEmail && isValidEmail(mandante.ContactEmail) && 
        mandante.ContactEmail.toLowerCase().trim() !== senderEmail) {
      const accessUrl = `${baseUrl}/email-access?projectId=${data.projectId}&token=${projectToken}&rfiId=${data.rfiId}&type=mandante`;

      const emailHtml = createRecipientEmailHtml({
        rfi,
        project,
        contratista,
        accessUrl,
        recipientName: mandante.ContactName,
        isForSpecialist: false,
      });

      const subject = sanitizeSubject(`Nuevo RFI: ${rfi.Titulo || 'Sin titulo'} | ${project.Name}`);

      const emailPayload = {
        raw: encodeBase64UTF8(
          `From: Gloster Gestion de Proyectos <${fromEmail}>
To: ${mandante.ContactEmail}
Subject: ${subject}
Reply-To: soporte.gloster@gmail.com
Content-Type: text/html; charset=utf-8
MIME-Version: 1.0

${emailHtml}`
        ),
      };

      const response = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailPayload),
        }
      );

      if (response.ok) {
        sentEmailSet.add(mandante.ContactEmail);
        console.log("✅ Sent RFI to mandante:", mandante.ContactEmail);
      } else {
        console.error("❌ Failed to mandante:", mandante.ContactEmail, response.status);
      }
    }

    // 2. Aprobadores del proyecto (si no son el emisor)
    try {
      const { data: approverConfig } = await supabase
        .from('project_approval_config')
        .select('id')
        .eq('project_id', data.projectId)
        .maybeSingle();

      if (approverConfig?.id) {
        const { data: approvers } = await supabase
          .from('project_approvers')
          .select('approver_email, approver_name')
          .eq('config_id', approverConfig.id);

        if (approvers) {
          for (const approver of approvers) {
            const approverEmail = (approver as any).approver_email?.toLowerCase().trim();
            const approverName = (approver as any).approver_name;

            if (!approverEmail || !isValidEmail(approverEmail) || 
                sentEmailSet.has(approverEmail) || approverEmail === senderEmail) continue;

            const accessUrl = `${baseUrl}/email-access?projectId=${data.projectId}&token=${projectToken}&rfiId=${data.rfiId}&type=mandante`;
            const emailHtml = createRecipientEmailHtml({
              rfi,
              project,
              contratista,
              accessUrl,
              recipientName: approverName || approverEmail,
              isForSpecialist: false,
            });

            const subject = sanitizeSubject(`Nuevo RFI: ${rfi.Titulo || 'Sin titulo'} | ${project.Name}`);

            const emailPayload = {
              raw: encodeBase64UTF8(
                `From: Gloster Gestion de Proyectos <${fromEmail}>
To: ${approverEmail}
Subject: ${subject}
Reply-To: soporte.gloster@gmail.com
Content-Type: text/html; charset=utf-8
MIME-Version: 1.0

${emailHtml}`
              ),
            };

            const response = await fetch(
              "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
              {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(emailPayload),
              }
            );

            if (response.ok) {
              sentEmailSet.add(approverEmail);
              console.log("✅ Sent RFI to approver:", approverEmail);
            }
          }
        }
      }
    } catch (e) {
      console.error("⚠️ Approvers notification failed:", e);
    }

    // 3. Especialistas seleccionados (si no son el emisor)
    if (destinatarioIds.length > 0) {
      const { data: contactos } = await supabase
        .from('contactos')
        .select('*')
        .in('id', destinatarioIds);

      if (contactos) {
        for (const contacto of contactos) {
          const contactoEmail = contacto.email?.toLowerCase().trim();
          if (!contactoEmail || !isValidEmail(contactoEmail) || 
              sentEmailSet.has(contactoEmail) || contactoEmail === senderEmail) continue;

          const accessUrl = `${baseUrl}/email-access?projectId=${data.projectId}&token=${projectToken}&rfiId=${data.rfiId}&type=specialist`;

          const emailHtml = createRecipientEmailHtml({
            rfi,
            project,
            contratista,
            accessUrl,
            recipientName: contacto.nombre,
            isForSpecialist: true
          });

          const subject = sanitizeSubject(`RFI Reenviado: ${rfi.Titulo || 'Sin titulo'} | ${project.Name}`);

          const emailPayload = {
            raw: encodeBase64UTF8(
              `From: Gloster Gestion de Proyectos <${fromEmail}>
To: ${contactoEmail}
Subject: ${subject}
Reply-To: soporte.gloster@gmail.com
Content-Type: text/html; charset=utf-8
MIME-Version: 1.0

${emailHtml}`
            ),
          };

          const response = await fetch(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
            {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(emailPayload),
            }
          );

          if (response.ok) {
            sentEmailSet.add(contactoEmail);
            console.log("✅ Sent RFI to specialist:", contactoEmail);
          }
        }
      }
    }

    // ========================================
    // ENVIAR CONFIRMACIÓN AL EMISOR (sin link de acceso)
    // ========================================
    if (senderEmail && isValidEmail(senderEmail)) {
      const confirmationHtml = createSenderConfirmationHtml({
        rfi,
        project,
        recipientName: contratista.ContactName || 'Usuario',
        sentToList: Array.from(sentEmailSet),
      });

      const confirmSubject = sanitizeSubject(`Confirmacion: RFI enviado - ${rfi.Titulo || 'Sin titulo'} | ${project.Name}`);

      const confirmPayload = {
        raw: encodeBase64UTF8(
          `From: Gloster Gestion de Proyectos <${fromEmail}>
To: ${senderEmail}
Subject: ${confirmSubject}
Reply-To: soporte.gloster@gmail.com
Content-Type: text/html; charset=utf-8
MIME-Version: 1.0

${confirmationHtml}`
        ),
      };

      const confirmResponse = await fetch(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(confirmPayload),
        }
      );

      if (confirmResponse.ok) {
        console.log("✅ Sent confirmation to sender:", senderEmail);
      }
    }

    const sentTo = Array.from(sentEmailSet);
    console.log("✅ RFI notifications sent to:", sentTo);

    return new Response(
      JSON.stringify({ success: true, sentTo }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
};

serve(handler);
