
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  paymentId: string;
  contratista: string;
  mes: string;
  año: number;
  proyecto: string;
  mandanteEmail: string;
  mandanteCompany: string;
  contractorCompany: string;
  amount: number;
  dueDate: string;
  accessUrl: string;
}

// UTF-8 compatible base64 encoding function
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
  const clientId = Deno.env.get("GMAIL_CLIENT_ID");
  const clientSecret = Deno.env.get("GMAIL_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GMAIL_REFRESH_TOKEN");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken!,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();
  return data.access_token;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
};

const createEmailHtml = (data: NotificationRequest): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: #F5DF4D; padding: 20px; text-align: center; }
        .logo { width: 32px; height: 32px; vertical-align: middle; margin-right: 10px; }
        .title { color: #1e293b; font-size: 24px; font-weight: bold; margin: 0; }
        .content { padding: 30px 20px; }
        .highlight-box { background: #f8fafc; border-left: 4px solid #F5DF4D; padding: 20px; margin: 20px 0; }
        .info-grid { display: grid; gap: 15px; margin: 20px 0; }
        .info-item { display: flex; align-items: center; }
        .info-label { font-weight: 600; color: #64748b; margin-right: 10px; }
        .info-value { font-weight: 700; color: #1e293b; }
        .amount { color: #059669; font-size: 18px; }
        .cta-button { 
          display: inline-block; 
          background: #F5DF4D; 
          color: #1e293b; 
          padding: 15px 30px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600; 
          margin: 20px 0; 
        }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="title">🏢 Nuevo Estado de Pago - Gloster</h1>
        </div>
        
        <div class="content">
          <p>Estimado equipo de <strong>${data.mandanteCompany}</strong>,</p>
          
          <p>Se ha enviado un nuevo estado de pago que requiere su revisión y aprobación:</p>
          
          <div class="highlight-box">
            <h3 style="margin-top: 0; color: #1e293b;">📋 Detalles del Estado de Pago</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">📁 Proyecto:</span>
                <span class="info-value">${data.proyecto}</span>
              </div>
              <div class="info-item">
                <span class="info-label">🏢 Contratista:</span>
                <span class="info-value">${data.contractorCompany}</span>
              </div>
              <div class="info-item">
                <span class="info-label">📅 Período:</span>
                <span class="info-value">${data.mes} ${data.año}</span>
              </div>
              <div class="info-item">
                <span class="info-label">💰 Monto:</span>
                <span class="info-value amount">${formatCurrency(data.amount)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">⏰ Vencimiento:</span>
                <span class="info-value">${data.dueDate}</span>
              </div>
            </div>
          </div>
          
          <div style="text-align: center;">
            <p>Para revisar el estado de pago y la documentación adjunta:</p>
            <a href="${data.accessUrl}" class="cta-button">📋 Revisar Estado de Pago</a>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">
            ⚠️ <strong>Importante:</strong> Este enlace le permitirá acceder de forma segura al estado de pago para su revisión y aprobación.
          </p>
        </div>
        
        <div class="footer">
          <p><strong>Gloster - Gestión de Proyectos</strong></p>
          <p>Para consultas técnicas: soporte.gloster@gmail.com</p>
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
    const data: NotificationRequest = await req.json();
    console.log("Sending mandante notification:", data);

    const accessToken = await getAccessToken();
    const fromEmail = Deno.env.get("GMAIL_FROM_EMAIL");

    const emailHtml = createEmailHtml(data);
    
    const emailData = {
      raw: encodeBase64UTF8(
        `From: Gloster <${fromEmail}>
To: ${data.mandanteEmail}
Subject: Nuevo Estado de Pago - ${data.proyecto} (${data.mes} ${data.año})
Content-Type: text/html; charset=utf-8

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
        body: JSON.stringify(emailData),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gmail API error:", errorData);
      throw new Error(`Gmail API error: ${response.status}`);
    }

    const result = await response.json();
    console.log("Email sent successfully:", result);

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending mandante notification:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

serve(handler);
