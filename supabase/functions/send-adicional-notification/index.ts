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

interface AdicionalNotificationRequest {
  adicionalId: number;
  projectId: number;
  senderEmail?: string; // Email del contratista que envía (para excluirlo y enviarle confirmación)
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
  console.log('📧 Getting Gmail access token...');
  
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

const formatCurrency = (amount: number, currency?: string): string => {
  if (!amount) return 'No especificado';
  
  const normalizedCurrency = currency?.trim()?.toUpperCase() || 'CLP';

  if (normalizedCurrency === 'UF') {
    return `${amount.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UF`;
  } else if (normalizedCurrency === 'USD') {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  } else {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  }
};

// Email con enlace de acceso para MANDANTE (quien aprueba)
const createRecipientEmailHtml = (data: {
  adicional: any;
  project: any;
  contratista: any;
  mandante: any;
  accessUrl: string;
  recipientName?: string;
}): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nuevo Adicional - ${data.project.Name}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
        .header { background: #F5DF4D; padding: 25px 20px; text-align: center; }
        .title { color: #1e293b; font-size: 22px; font-weight: bold; margin: 0; }
        .content { padding: 30px 25px; }
        .greeting { font-size: 16px; color: #1e293b; margin-bottom: 20px; }
        .highlight-box { background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; padding: 20px; margin: 25px 0; border-radius: 4px; }
        .section-title { color: #1e293b; font-size: 18px; font-weight: 600; margin: 0 0 15px 0; }
        .info-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .info-table td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
        .info-label { font-weight: 600; color: #64748b; width: 35%; }
        .info-value { font-weight: 500; color: #1e293b; }
        .amount { color: #059669; font-size: 16px; font-weight: 700; }
        .cta-section { text-align: center; margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 6px; }
        .cta-button { display: inline-block; background: #3b82f6; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 15px 0; }
        .footer { background: #f8fafc; padding: 25px 20px; text-align: center; color: #64748b; font-size: 13px; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="title">📋 Nuevo Adicional Presentado</h1>
          <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">Gloster - Sistema de Gestion de Proyectos</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            ${data.recipientName ? `Estimado/a <strong>${data.recipientName}</strong>,` : `Estimado equipo de <strong>${data.mandante.CompanyName}</strong>,`}
          </div>
          
          <p>Se ha presentado un nuevo adicional que requiere su revision y aprobacion. A continuacion los detalles:</p>
          
          <div class="highlight-box">
            <h3 class="section-title">Informacion del Adicional</h3>
            <table class="info-table">
              <tr>
                <td class="info-label">Proyecto:</td>
                <td class="info-value">${data.project.Name}</td>
              </tr>
              <tr>
                <td class="info-label">Contratista:</td>
                <td class="info-value">${data.contratista.CompanyName}</td>
              </tr>
              <tr>
                <td class="info-label">Titulo:</td>
                <td class="info-value">${data.adicional.Titulo || 'Sin titulo'}</td>
              </tr>
              <tr>
                <td class="info-label">Categoria:</td>
                <td class="info-value">${data.adicional.Categoria || 'No especificada'}</td>
              </tr>
              <tr>
                <td class="info-label">Especialidad:</td>
                <td class="info-value">${data.adicional.Especialidad || 'No especificada'}</td>
              </tr>
              <tr>
                <td class="info-label">Monto Presentado:</td>
                <td class="info-value amount">${formatCurrency(data.adicional.Monto_presentado, data.project.Currency)}</td>
              </tr>
              ${data.adicional.Vencimiento ? `
              <tr>
                <td class="info-label">Fecha de Vencimiento:</td>
                <td class="info-value">${new Date(data.adicional.Vencimiento).toLocaleDateString('es-CL')}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          ${data.adicional.Descripcion ? `
          <div style="margin: 20px 0;">
            <h4 style="color: #64748b; margin-bottom: 8px;">Descripcion:</h4>
            <p style="background: #f8fafc; padding: 15px; border-radius: 4px; margin: 0;">${data.adicional.Descripcion}</p>
          </div>
          ` : ''}
          
          <div class="cta-section">
            <p style="margin: 0 0 10px 0; font-weight: 500;">Para revisar y aprobar/rechazar el adicional:</p>
            <a href="${data.accessUrl}" class="cta-button">Ver y Aprobar Adicional</a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 25px;">
            Este es un mensaje automatico del sistema Gloster.
          </p>
        </div>
        
        <div class="footer">
          <div style="font-weight: 600; color: #1e293b; margin-bottom: 5px;">Gloster - Sistema de Gestion de Proyectos</div>
          <p style="margin: 5px 0;">Consultas tecnicas: soporte.gloster@gmail.com</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Email de confirmación para el EMISOR (contratista) - SIN enlace de acceso
const createSenderConfirmationHtml = (data: {
  adicional: any;
  project: any;
  recipientName: string;
  sentToList: string[];
}): string => {
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
          <h1 class="title">✅ Adicional Enviado Exitosamente</h1>
        </div>
        
        <div class="content">
          <p>Estimado/a <strong>${data.recipientName}</strong>,</p>
          
          <p>Su solicitud de adicional ha sido enviada correctamente para revision. A continuacion el resumen:</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #1e293b;">📋 Resumen del Adicional</h3>
            <table class="info-table">
              <tr>
                <td class="info-label">Proyecto:</td>
                <td class="info-value">${data.project.Name}</td>
              </tr>
              <tr>
                <td class="info-label">Titulo:</td>
                <td class="info-value">${data.adicional.Titulo || 'Sin titulo'}</td>
              </tr>
              <tr>
                <td class="info-label">Categoria:</td>
                <td class="info-value">${data.adicional.Categoria || 'No especificada'}</td>
              </tr>
              <tr>
                <td class="info-label">Monto:</td>
                <td class="info-value" style="color: #059669; font-weight: bold;">${formatCurrency(data.adicional.Monto_presentado, data.project.Currency)}</td>
              </tr>
            </table>
          </div>
          
          <div class="recipients-box">
            <h4 style="margin-top: 0; color: #166534;">📧 Notificacion enviada a:</h4>
            <ul style="margin-bottom: 0; padding-left: 20px;">
              ${data.sentToList.map(email => `<li>${email}</li>`).join('')}
            </ul>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">
            Recibira una notificacion cuando el adicional sea aprobado o rechazado.
          </p>
        </div>
        
        <div class="footer">
          <p><strong>Gloster - Gestion de Proyectos</strong></p>
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
    const data: AdicionalNotificationRequest = await req.json();
    console.log("📧 Sending adicional notification:", data);

    if (!data.adicionalId || !data.projectId) {
      throw new Error('adicionalId and projectId are required');
    }

    // Fetch adicional
    const { data: adicional, error: adicionalError } = await supabase
      .from('Adicionales')
      .select('*')
      .eq('id', data.adicionalId)
      .single();

    if (adicionalError || !adicional) {
      throw new Error(`Adicional not found: ${adicionalError?.message}`);
    }

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from('Proyectos')
      .select('*, Contratista, Owner')
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

    // Email del emisor (contratista)
    const senderEmail = data.senderEmail?.toLowerCase().trim() || contratista.ContactEmail?.toLowerCase().trim();

    const projectToken = project.URL;
    if (!projectToken) {
      throw new Error('Project URL token not found');
    }

    const accessToken = await getAccessToken();
    const fromEmail = Deno.env.get("GMAIL_FROM_EMAIL");
    const baseUrl = 'https://gloster-project-hub.lovable.app';
    const sentEmailSet = new Set<string>();

    // ========================================
    // ENVIAR A MANDANTE (con link de acceso para aprobar)
    // ========================================
    if (mandante.ContactEmail && isValidEmail(mandante.ContactEmail) &&
        mandante.ContactEmail.toLowerCase().trim() !== senderEmail) {
      
      const accessUrl = `${baseUrl}/email-access?projectId=${data.projectId}&token=${projectToken}&adicionalId=${data.adicionalId}&type=mandante`;

      const emailHtml = createRecipientEmailHtml({
        adicional,
        project,
        contratista,
        mandante,
        accessUrl,
        recipientName: mandante.ContactName
      });

      const subject = sanitizeSubject(`Nuevo Adicional - ${adicional.Titulo || 'Sin titulo'} | ${project.Name}`);

      const emailPayload = {
        raw: encodeBase64UTF8(
          `From: Gloster Gestion de Proyectos <${fromEmail}>
To: ${mandante.ContactEmail}
Subject: ${subject}
Reply-To: soporte.gloster@gmail.com
Content-Type: text/html; charset=utf-8
MIME-Version: 1.0
X-Mailer: Gloster Project Management System
Message-ID: <adicional-${data.adicionalId}-${Date.now()}@gloster.com>

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
        console.log("✅ Sent adicional to mandante:", mandante.ContactEmail);
      } else {
        console.error("❌ Failed to mandante:", mandante.ContactEmail, response.status);
      }
    }

    // ========================================
    // ENVIAR A APROBADORES (con link de acceso)
    // ========================================
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

            const accessUrl = `${baseUrl}/email-access?projectId=${data.projectId}&token=${projectToken}&adicionalId=${data.adicionalId}&type=mandante`;

            const emailHtml = createRecipientEmailHtml({
              adicional,
              project,
              contratista,
              mandante,
              accessUrl,
              recipientName: approverName
            });

            const subject = sanitizeSubject(`Nuevo Adicional - ${adicional.Titulo || 'Sin titulo'} | ${project.Name}`);

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
              console.log("✅ Sent adicional to approver:", approverEmail);
            }
          }
        }
      }
    } catch (e) {
      console.error("⚠️ Approvers notification failed:", e);
    }

    // ========================================
    // ENVIAR CONFIRMACIÓN AL EMISOR (sin link de acceso)
    // ========================================
    if (senderEmail && isValidEmail(senderEmail)) {
      const confirmationHtml = createSenderConfirmationHtml({
        adicional,
        project,
        recipientName: contratista.ContactName || 'Usuario',
        sentToList: Array.from(sentEmailSet),
      });

      const confirmSubject = sanitizeSubject(`Confirmacion: Adicional enviado - ${adicional.Titulo || 'Sin titulo'} | ${project.Name}`);

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

    console.log("✅ Adicional notifications sent to:", Array.from(sentEmailSet));

    return new Response(
      JSON.stringify({ success: true, sentTo: Array.from(sentEmailSet) }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Error sending adicional notification:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

serve(handler);
