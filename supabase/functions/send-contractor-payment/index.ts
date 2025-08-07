import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContractorPaymentRequest {
  paymentId: string;
  contractorEmail: string;
  contractorName: string;
  contractorCompany: string;
  mandanteCompany: string;
  proyecto: string;
  mes: string;
  año: number;
  amount: number;
  dueDate: string;
  currency?: string;
  urlContratista: string;
  isReminder: boolean; // true para recordatorio automático, false para notificación manual
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

const formatCurrency = (amount: number, currency?: string): string => {
  if (currency === 'UF') {
    return `${amount.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UF`;
  } else if (currency === 'USD') {
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

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-CL', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const createEmailHtml = (data: ContractorPaymentRequest): string => {
  const formattedDueDate = formatDate(data.dueDate);
  const emailTitle = data.isReminder ? 
    '⏰ Recordatorio: Estado de Pago por Vencer' : 
    '📋 Completar Estado de Pago';

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
        .alert-box { 
          background: #fef3c7; 
          border-left: 4px solid #f59e0b; 
          padding: 20px; 
          margin: 20px 0; 
          text-align: center;
        }
        .alert-title { 
          color: #d97706; 
          font-size: 18px; 
          font-weight: bold; 
          margin: 0 0 10px 0; 
        }
        .info-grid { display: grid; gap: 15px; margin: 20px 0; }
        .info-item { display: flex; align-items: center; }
        .info-label { font-weight: 600; color: #64748b; margin-right: 10px; }
        .info-value { font-weight: 700; color: #1e293b; }
        .amount { color: #059669; font-size: 18px; }
        .due-date { color: #dc2626; font-weight: bold; }
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
          <h1 class="title">${emailTitle} - Gloster</h1>
        </div>
        
        <div class="content">
          <p>Estimado/a <strong>${data.contractorName}</strong> de <strong>${data.contractorCompany}</strong>,</p>
          
          <div class="alert-box">
            <h2 class="alert-title">
              ${data.isReminder ? '⏰ Su estado de pago está próximo a vencer' : '📋 Estado de pago pendiente de completar'}
            </h2>
            <p style="margin: 0; color: #92400e;">
              ${data.isReminder ? 
                'Le recordamos que debe completar la información de su estado de pago antes de la fecha límite.' : 
                'El mandante le solicita completar la información de su estado de pago.'
              }
            </p>
          </div>
          
          <div style="background: #f8fafc; border-left: 4px solid #F5DF4D; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e293b;">📋 Detalles del Estado de Pago</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">🏢 Mandante:</span>
                <span class="info-value">${data.mandanteCompany}</span>
              </div>
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
                <span class="info-value amount">${formatCurrency(data.amount, data.currency)}</span>
              </div>
              <div class="info-item">
                <span class="info-label">📅 Fecha Límite:</span>
                <span class="info-value due-date">${formattedDueDate}</span>
              </div>
            </div>
          </div>
          
          <div style="background: #fef3c7; border: 1px solid #fcd34d; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #d97706; margin-top: 0;">📝 Información Requerida:</h4>
            <ul style="margin: 10px 0; color: #1e293b;">
              <li>📄 Documentos requeridos por el proyecto</li>
              <li>💰 Monto total o porcentaje de avance</li>
              <li>📋 Información adicional del estado de pago</li>
            </ul>
          </div>
          
          <div style="text-align: center;">
            <a href="${data.urlContratista}" class="cta-button">
              🚀 Completar Estado de Pago
            </a>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 15px;">
              Haga clic en el botón superior para acceder a la plataforma y completar su estado de pago.
            </p>
          </div>
          
          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 30px;">
            <p style="color: #64748b; font-size: 14px; margin: 0;">
              💡 <strong>Importante:</strong> Debe completar la información antes de la fecha límite para evitar retrasos en el procesamiento de su pago.
            </p>
          </div>
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
    const data: ContractorPaymentRequest = await req.json();
    console.log("Sending contractor payment notification:", data);

    const accessToken = await getAccessToken();
    const fromEmail = Deno.env.get("GMAIL_FROM_EMAIL");

    const emailHtml = createEmailHtml(data);
    const subject = `${data.isReminder ? '⏰ Recordatorio' : '📋 Completar'} Estado de Pago - ${data.proyecto} (${data.mes} ${data.año})`;
    
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
    console.log("Contractor payment notification sent successfully:", result);

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending contractor payment notification:", error);
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