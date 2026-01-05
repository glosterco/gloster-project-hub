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

interface MessageNotificationRequest {
  rfiId: number;
  projectId: number;
  authorEmail: string;
  authorName: string;
  messageText: string;
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

const createEmailHtml = (data: {
  rfi: any;
  project: any;
  authorName: string;
  messageText: string;
  accessUrl: string;
  recipientName: string;
}): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #3b82f6; padding: 25px 20px; text-align: center; }
        .title { color: #ffffff; font-size: 22px; font-weight: bold; margin: 0; }
        .content { padding: 30px 25px; }
        .info-box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .message-box { background: #eff6ff; border: 1px solid #bfdbfe; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .cta-section { text-align: center; margin: 30px 0; }
        .cta-button { display: inline-block; background: #3b82f6; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="title">💬 Nueva respuesta en RFI</h1>
        </div>
        
        <div class="content">
          <p>Estimado/a <strong>${data.recipientName}</strong>,</p>
          
          <p>Se ha recibido una nueva respuesta en el RFI <strong>"${data.rfi.Titulo || 'Sin título'}"</strong>.</p>
          
          <div class="info-box">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #64748b;">Proyecto:</td>
                <td style="padding: 8px 0;">${data.project.Name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600; color: #64748b;">Respondido por:</td>
                <td style="padding: 8px 0;">${data.authorName}</td>
              </tr>
            </table>
          </div>
          
          <div class="message-box">
            <h4 style="margin-top: 0; color: #1e40af;">📝 Mensaje:</h4>
            <p style="margin-bottom: 0; white-space: pre-wrap;">${data.messageText.substring(0, 500)}${data.messageText.length > 500 ? '...' : ''}</p>
          </div>
          
          <div class="cta-section">
            <p style="margin-bottom: 15px;">Para ver la conversación completa:</p>
            <a href="${data.accessUrl}" class="cta-button">Ver RFI</a>
          </div>
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

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: MessageNotificationRequest = await req.json();
    console.log("📧 Sending RFI message notification:", data.rfiId);

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
      .select('*, URL')
      .eq('id', data.projectId)
      .single();

    if (projectError || !project) {
      throw new Error(`Project not found: ${projectError?.message}`);
    }

    // Fetch contratista
    const { data: contratista } = await supabase
      .from('Contratistas')
      .select('*')
      .eq('id', project.Contratista)
      .single();

    // Fetch mandante
    const { data: mandante } = await supabase
      .from('Mandantes')
      .select('*')
      .eq('id', project.Owner)
      .single();

    const accessToken = await getAccessToken();
    const fromEmail = Deno.env.get("GMAIL_FROM_EMAIL");
    const baseUrl = 'https://gloster-project-hub.lovable.app';
    const sentEmailSet = new Set<string>();
    const authorEmailLower = data.authorEmail.toLowerCase().trim();

    // Collect all involved parties
    const recipients: { email: string; name: string; type: string }[] = [];

    // Add contratista
    if (contratista?.ContactEmail && isValidEmail(contratista.ContactEmail)) {
      recipients.push({
        email: contratista.ContactEmail,
        name: contratista.ContactName || contratista.CompanyName,
        type: 'contratista'
      });
    }

    // Add mandante
    if (mandante?.ContactEmail && isValidEmail(mandante.ContactEmail)) {
      recipients.push({
        email: mandante.ContactEmail,
        name: mandante.ContactName || mandante.CompanyName,
        type: 'mandante'
      });
    }

    // Add approvers
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
            if ((approver as any).approver_email && isValidEmail((approver as any).approver_email)) {
              recipients.push({
                email: (approver as any).approver_email,
                name: (approver as any).approver_name || (approver as any).approver_email,
                type: 'mandante'
              });
            }
          }
        }
      }
    } catch (e) {
      console.error("⚠️ Failed to fetch approvers:", e);
    }

    // Add RFI destinatarios (specialists)
    try {
      const { data: destinatarios } = await supabase
        .from('rfi_destinatarios')
        .select('contacto_id, contactos(email, nombre)')
        .eq('rfi_id', data.rfiId);

      if (destinatarios) {
        for (const dest of destinatarios) {
          const contacto = (dest as any).contactos;
          if (contacto?.email && isValidEmail(contacto.email)) {
            recipients.push({
              email: contacto.email,
              name: contacto.nombre || contacto.email,
              type: 'especialista'
            });
          }
        }
      }
    } catch (e) {
      console.error("⚠️ Failed to fetch destinatarios:", e);
    }

    // Send emails to all recipients except author
    for (const recipient of recipients) {
      const recipientEmail = recipient.email.toLowerCase().trim();
      
      if (recipientEmail === authorEmailLower || sentEmailSet.has(recipientEmail)) {
        continue;
      }

      try {
        const accessUrl = `${baseUrl}/email-access?projectId=${data.projectId}&token=${project.URL}&rfiId=${data.rfiId}&type=${recipient.type}`;

        const emailHtml = createEmailHtml({
          rfi,
          project,
          authorName: data.authorName,
          messageText: data.messageText,
          accessUrl,
          recipientName: recipient.name,
        });

        const subject = sanitizeSubject(`Nueva respuesta en RFI: ${rfi.Titulo || 'Sin titulo'} | ${project.Name}`);

        const emailPayload = {
          raw: encodeBase64UTF8(
            `From: Gloster Gestion de Proyectos <${fromEmail}>
To: ${recipient.email}
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
          sentEmailSet.add(recipientEmail);
          console.log("✅ Sent to:", recipient.email);
        } else {
          console.error("❌ Failed to send to:", recipient.email, response.status);
        }
      } catch (e) {
        console.error("❌ Error sending to:", recipient.email, e);
      }
    }

    console.log(`✅ Sent notifications to ${sentEmailSet.size} recipients`);

    return new Response(
      JSON.stringify({ success: true, sentTo: Array.from(sentEmailSet) }),
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
