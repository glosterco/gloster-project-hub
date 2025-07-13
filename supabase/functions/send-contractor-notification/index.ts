
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContractorNotificationRequest {
  paymentId: string;
  contractorEmail: string;
  contractorName: string;
  contractorCompany: string;
  mandanteCompany: string;
  proyecto: string;
  mes: string;
  año: number;
  amount: number;
  status: 'Aprobado' | 'Rechazado';
  rejectionReason?: string;
  platformUrl: string;
}

const getAccessToken = async (): Promise<string> => {
  console.log('📧 Getting Gmail access token via token manager...');
  
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
    console.error('❌ Gmail token validation failed:', tokenResult.error);
    throw new Error(`Gmail authentication failed: ${tokenResult.error}`);
  }

  console.log('✅ Gmail access token obtained and validated successfully');
  return tokenResult.access_token;
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
};

const createEmailHtml = (data: ContractorNotificationRequest): string => {
  const isApproved = data.status === 'Aprobado';
  const statusColor = isApproved ? '#059669' : '#dc2626';
  const statusIcon = isApproved ? '✅' : '❌';
  const statusMessage = isApproved ? 'APROBADO' : 'RECHAZADO';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Arial', sans-serif; line-height: 1.6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: #F5DF4D; padding: 20px; text-align: center; }
        .title { color: #1e293b; font-size: 24px; font-weight: bold; margin: 0; }
        .content { padding: 30px 20px; }
        .status-box { 
          background: ${isApproved ? '#f0fdf4' : '#fef2f2'}; 
          border-left: 4px solid ${statusColor}; 
          padding: 20px; 
          margin: 20px 0; 
          text-align: center;
        }
        .status-title { 
          color: ${statusColor}; 
          font-size: 20px; 
          font-weight: bold; 
          margin: 0 0 10px 0; 
        }
        .info-grid { display: grid; gap: 15px; margin: 20px 0; }
        .info-item { display: flex; align-items: center; }
        .info-label { font-weight: 600; color: #64748b; margin-right: 10px; }
        .info-value { font-weight: 700; color: #1e293b; }
        .amount { color: #059669; font-size: 18px; }
        .rejection-box { 
          background: #fef2f2; 
          border: 1px solid #fecaca; 
          padding: 15px; 
          border-radius: 8px; 
          margin: 20px 0; 
        }
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
          <h1 class="title">🏢 Notificación Estado de Pago - Gloster</h1>
        </div>
        
        <div class="content">
          <p>Estimado/a <strong>${data.contractorName}</strong> de <strong>${data.contractorCompany}</strong>,</p>
          
          <div class="status-box">
            <h2 class="status-title">${statusIcon} Estado de Pago ${statusMessage}</h2>
            <p style="margin: 0; color: #64748b;">
              El mandante <strong>${data.mandanteCompany}</strong> ha ${isApproved ? 'aprobado' : 'rechazado'} su estado de pago
            </p>
          </div>
          
          <div style="background: #f8fafc; border-left: 4px solid #F5DF4D; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e293b;">📋 Detalles del Estado de Pago</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">📁 Proyecto:</span>
                <span class="info-value">${data.proyecto}</span>
              </div>
              <div class="info-item">
                <span class="info-label">📅 Período:</span>
                <span class="info-value">${data.mes} ${data.año}</span>
              </div>
              <div class="info-item">
                <span class="info-label">💰 Monto:</span>
                <span class="info-value amount">${formatCurrency(data.amount)}</span>
              </div>
            </div>
          </div>
          
          ${!isApproved && data.rejectionReason ? `
            <div class="rejection-box">
              <h4 style="color: #dc2626; margin-top: 0;">📝 Motivo del Rechazo:</h4>
              <p style="margin-bottom: 0; color: #1e293b;">${data.rejectionReason}</p>
            </div>
          ` : ''}
          
          <div style="text-align: center;">
            <p>
              ${isApproved 
                ? '🎉 ¡Felicitaciones! Su estado de pago ha sido aprobado.' 
                : '⚠️ Por favor revise los comentarios e ingrese a la plataforma para realizar las correcciones necesarias.'
              }
            </p>
            <a href="${data.platformUrl}" class="cta-button">
              ${isApproved ? '👀 Ver Detalles' : '🔧 Corregir Estado de Pago'}
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">
            💡 <strong>Recordatorio:</strong> Puede acceder a la plataforma en cualquier momento para revisar el estado de sus proyectos.
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
    const data: ContractorNotificationRequest = await req.json();
    console.log("Sending contractor notification:", data);

    const accessToken = await getAccessToken();
    const fromEmail = Deno.env.get("GMAIL_FROM_EMAIL");

    const emailHtml = createEmailHtml(data);
    const subject = `Estado de Pago ${data.status} - ${data.proyecto} (${data.mes} ${data.año})`;
    
    // Use TextEncoder to handle UTF-8 characters properly
    const emailContent = `From: Gloster <${fromEmail}>
To: ${data.contractorEmail}
Subject: ${subject}
Content-Type: text/html; charset=utf-8

${emailHtml}`;
    
    const uint8Array = new TextEncoder().encode(emailContent);
    const base64String = btoa(String.fromCharCode(...uint8Array));
    
    const emailData = {
      raw: base64String.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''),
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
    console.log("Contractor notification sent successfully:", result);

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending contractor notification:", error);
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
