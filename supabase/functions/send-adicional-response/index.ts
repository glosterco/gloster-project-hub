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

interface AdicionalResponseRequest {
  adicionalId: number;
  status: 'Aprobado' | 'Rechazado';
  rejectionNotes?: string;
  montoAprobado?: number;
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
    return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
  }
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(amount);
};

const createEmailHtml = (data: {
  adicional: any;
  project: any;
  contratista: any;
  mandante: any;
  status: string;
  rejectionNotes?: string;
  accessUrl: string;
}): string => {
  const isApproved = data.status === 'Aprobado';
  const statusColor = isApproved ? '#059669' : '#dc2626';
  const statusIcon = isApproved ? '✅' : '❌';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: 'Segoe UI', sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #F5DF4D; padding: 25px 20px; text-align: center; }
        .title { color: #1e293b; font-size: 22px; font-weight: bold; margin: 0; }
        .content { padding: 30px 25px; }
        .status-box { background: ${isApproved ? '#f0fdf4' : '#fef2f2'}; border-left: 4px solid ${statusColor}; padding: 20px; margin: 20px 0; text-align: center; }
        .status-title { color: ${statusColor}; font-size: 20px; font-weight: bold; margin: 0 0 10px 0; }
        .info-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        .info-table td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
        .info-label { font-weight: 600; color: #64748b; width: 35%; }
        .info-value { color: #1e293b; }
        .rejection-box { background: #fef2f2; border: 1px solid #fecaca; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .cta-button { display: inline-block; background: #F5DF4D; color: #1e293b; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="title">📋 Respuesta a Adicional</h1>
        </div>
        
        <div class="content">
          <p>Estimado/a <strong>${data.contratista.ContactName || 'Contratista'}</strong> de <strong>${data.contratista.CompanyName}</strong>,</p>
          
          <div class="status-box">
            <h2 class="status-title">${statusIcon} Adicional ${data.status.toUpperCase()}</h2>
            <p style="margin: 0; color: #64748b;">
              El mandante <strong>${data.mandante.CompanyName}</strong> ha ${isApproved ? 'aprobado' : 'rechazado'} su adicional
            </p>
          </div>
          
          <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e293b;">📋 Detalles del Adicional</h3>
            <table class="info-table">
              <tr>
                <td class="info-label">Proyecto:</td>
                <td class="info-value">${data.project.Name}</td>
              </tr>
              <tr>
                <td class="info-label">Título:</td>
                <td class="info-value">${data.adicional.Titulo || 'Sin título'}</td>
              </tr>
              <tr>
                <td class="info-label">Monto Presentado:</td>
                <td class="info-value">${formatCurrency(data.adicional.Monto_presentado, data.project.Currency)}</td>
              </tr>
              ${isApproved && data.adicional.Monto_aprobado ? `
              <tr>
                <td class="info-label">Monto Aprobado:</td>
                <td class="info-value" style="color: #059669; font-weight: bold;">${formatCurrency(data.adicional.Monto_aprobado, data.project.Currency)}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          ${!isApproved && data.rejectionNotes ? `
          <div class="rejection-box">
            <h4 style="color: #dc2626; margin-top: 0;">📝 Motivo del Rechazo:</h4>
            <p style="margin-bottom: 0; color: #1e293b;">${data.rejectionNotes}</p>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.accessUrl}" class="cta-button">
              ${isApproved ? '👀 Ver Detalles' : '🔧 Revisar y Corregir'}
            </a>
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

// Sanitize email subject - remove accents and special chars
const sanitizeSubject = (str: string): string => {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^\x20-\x7E]/g, '')    // Remove non-ASCII
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
    const data: AdicionalResponseRequest = await req.json();
    console.log("📧 Sending adicional response notification:", data);

    if (!data.adicionalId || !data.status) {
      throw new Error('adicionalId and status are required');
    }

    // Fetch adicional with project
    const { data: adicional, error: adicionalError } = await supabase
      .from('Adicionales')
      .select('*, Proyecto')
      .eq('id', data.adicionalId)
      .single();

    if (adicionalError || !adicional) {
      throw new Error(`Adicional not found: ${adicionalError?.message}`);
    }

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from('Proyectos')
      .select('*')
      .eq('id', adicional.Proyecto)
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

    // Send to contratista
    if (!contratista.ContactEmail || !isValidEmail(contratista.ContactEmail)) {
      throw new Error('Contratista has no valid email');
    }

    const baseUrl = 'https://gloster-project-hub.lovable.app';
    const accessUrl = `${baseUrl}/email-access?projectId=${project.id}&adicionalId=${data.adicionalId}&type=contratista`;

    const accessToken = await getAccessToken();
    const fromEmail = Deno.env.get("GMAIL_FROM_EMAIL");

    const emailHtml = createEmailHtml({
      adicional,
      project,
      contratista,
      mandante,
      status: data.status,
      rejectionNotes: data.rejectionNotes,
      accessUrl
    });

    const rawSubject = `Adicional ${data.status} - ${adicional.Titulo || 'Sin titulo'} | ${project.Name}`;
    const subject = sanitizeSubject(rawSubject);

    const emailPayload = {
      raw: encodeBase64UTF8(
        `From: Gloster Gestión de Proyectos <${fromEmail}>
To: ${contratista.ContactEmail}
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

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Gmail API error:", errorData);
      throw new Error(`Gmail API error: ${response.status}`);
    }

    const result = await response.json();
    console.log("✅ Adicional response notification sent:", result.id);

    return new Response(
      JSON.stringify({ success: true, messageId: result.id }),
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
