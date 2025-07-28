
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

interface NotificationRequest {
  paymentId: string;
  contratista?: string;
  mes?: string;
  año?: number;
  proyecto?: string;
  mandanteEmail: string;
  mandanteCompany?: string;
  contractorCompany?: string;
  amount?: number;
  dueDate?: string;
  accessUrl?: string;
  currency?: string;
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
  console.log('💰 formatCurrency called with amount:', amount, 'currency:', currency);
  
  // Normalizar currency - manejar casos null, undefined, o vacío
  const normalizedCurrency = currency?.trim()?.toUpperCase() || 'CLP';
  console.log('💰 Normalized currency:', normalizedCurrency);

  if (normalizedCurrency === 'UF') {
    const formatted = `${amount.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UF`;
    console.log('💰 UF formatted result:', formatted);
    return formatted;
  } else if (normalizedCurrency === 'USD') {
    const formatted = new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
    console.log('💰 USD formatted result:', formatted);
    return formatted;
  } else {
    // Default to CLP for any other case (including null, undefined, empty, or 'CLP')
    const formatted = new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
    console.log('💰 CLP formatted result:', formatted);
    return formatted;
  }
};


const createEmailHtml = (data: NotificationRequest): string => {
  const accessInstructions = `
          <div class="important-note">
            <strong>Nota Importante:</strong> Este enlace le dará acceso directo y seguro al estado de pago donde podrá revisar toda la documentación adjunta y proceder con la aprobación o solicitar modificaciones según corresponda.
          </div>
  `;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Estado de Pago - ${data.proyecto}</title>
      <style>
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          margin: 0; 
          padding: 0; 
          background-color: #f5f5f5;
        }
        .container { 
          max-width: 600px; 
          margin: 20px auto; 
          background: #ffffff; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        .header { 
          background: #F5DF4D; 
          padding: 25px 20px; 
          text-align: center; 
        }
        .title { 
          color: #1e293b; 
          font-size: 22px; 
          font-weight: bold; 
          margin: 0; 
        }
        .content { 
          padding: 30px 25px; 
        }
        .greeting {
          font-size: 16px;
          color: #1e293b;
          margin-bottom: 20px;
        }
        .highlight-box { 
          background: #f8fafc; 
          border: 1px solid #e2e8f0;
          border-left: 4px solid #F5DF4D; 
          padding: 20px; 
          margin: 25px 0; 
          border-radius: 4px;
        }
        .section-title {
          color: #1e293b;
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 15px 0;
        }
        .info-table { 
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        .info-table td {
          padding: 8px 12px;
          border-bottom: 1px solid #e2e8f0;
        }
        .info-label { 
          font-weight: 600; 
          color: #64748b; 
          width: 30%;
        }
        .info-value { 
          font-weight: 500; 
          color: #1e293b; 
        }
        .amount { 
          color: #059669; 
          font-size: 16px; 
          font-weight: 700;
        }
        .cta-section {
          text-align: center;
          margin: 30px 0;
          padding: 20px;
          background: #f8fafc;
          border-radius: 6px;
        }
        .cta-button { 
          display: inline-block; 
          background: #F5DF4D; 
          color: #1e293b; 
          padding: 14px 28px; 
          text-decoration: none; 
          border-radius: 6px; 
          font-weight: 600; 
          margin: 15px 0;
          border: 2px solid #F5DF4D;
        }
        .cta-button:hover {
          background: #f0d935;
        }
        .important-note {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          padding: 15px;
          border-radius: 4px;
          margin: 20px 0;
          font-size: 14px;
        }
        .footer { 
          background: #f8fafc; 
          padding: 25px 20px; 
          text-align: center; 
          color: #64748b; 
          font-size: 13px;
          border-top: 1px solid #e2e8f0;
        }
        .footer-title {
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 5px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="title">Estado de Pago - Gloster</h1>
          <p style="margin: 5px 0 0 0; color: #64748b; font-size: 14px;">Sistema de Gestion de Proyectos</p>
        </div>
        
        <div class="content">
          <div class="greeting">
            Estimado equipo de <strong>${data.mandanteCompany}</strong>,
          </div>
          
          <p>Se ha registrado un nuevo estado de pago que requiere su revisión y aprobación. A continuación se detallan los datos correspondientes:</p>
          
          <div class="highlight-box">
            <h3 class="section-title">Información del Estado de Pago</h3>
            <table class="info-table">
              <tr>
                <td class="info-label">Proyecto:</td>
                <td class="info-value">${data.proyecto}</td>
              </tr>
              <tr>
                <td class="info-label">Empresa Contratista:</td>
                <td class="info-value">${data.contractorCompany}</td>
              </tr>
              <tr>
                <td class="info-label">Período de Facturación:</td>
                <td class="info-value">${data.mes} ${data.año}</td>
              </tr>
              <tr>
                <td class="info-label">Monto Solicitado:</td>
                <td class="info-value amount">${formatCurrency(data.amount, data.currency)}</td>
              </tr>
              <tr>
                <td class="info-label">Fecha de Vencimiento:</td>
                <td class="info-value">${data.dueDate}</td>
              </tr>
            </table>
          </div>
          
          <div class="cta-section">
            <p style="margin: 0 0 10px 0; font-weight: 500;">Para proceder con la revisión de la documentación:</p>
            <a href="${data.accessUrl}" class="cta-button">Acceder al Estado de Pago</a>
          </div>
          
          ${accessInstructions}
          
          <p style="color: #64748b; font-size: 14px; margin-top: 25px;">
            Este es un mensaje automático del sistema de gestion de proyectos Gloster. Si tiene alguna consulta técnica, puede contactarnos a través del correo de soporte.
          </p>
        </div>
        
        <div class="footer">
          <div class="footer-title">Gloster - Sistema de Gestion de Proyectos</div>
          <p style="margin: 5px 0;">Consultas técnicas: soporte.gloster@gmail.com</p>
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
    console.log("📧 Sending notification with data:", data);


    const accessToken = await getAccessToken();
    const fromEmail = Deno.env.get("GMAIL_FROM_EMAIL");

    const emailHtml = createEmailHtml(data);
    const subject = `Estado de Pago ${data.mes} ${data.año} - ${data.proyecto}`;
    
    const emailPayload = {
      raw: encodeBase64UTF8(
        `From: Gloster Gestion de Proyectos <${fromEmail}>
To: ${data.mandanteEmail}
Subject: ${subject}
Reply-To: soporte.gloster@gmail.com
Content-Type: text/html; charset=utf-8
MIME-Version: 1.0
X-Mailer: Gloster Project Management System
Message-ID: <payment-${data.paymentId}-${Date.now()}@gloster.com>

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
