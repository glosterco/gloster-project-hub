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

interface RFIResponseRequest {
  rfiId: number;
  respuesta: string;
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

const createEmailHtml = (data: {
  rfi: any;
  project: any;
  contratista: any;
  mandante: any;
  respuesta: string;
  accessUrl: string;
}): string => {
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
        .status-banner { background: #22c55e; color: white; padding: 10px; text-align: center; font-weight: 600; }
        .content { padding: 30px 25px; }
        .info-box { background: #f8fafc; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 4px; }
        .info-table { width: 100%; border-collapse: collapse; }
        .info-table td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
        .info-label { font-weight: 600; color: #64748b; width: 30%; }
        .info-value { color: #1e293b; }
        .response-box { background: #f0fdf4; border: 1px solid #bbf7d0; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .original-question { background: #eff6ff; border: 1px solid #bfdbfe; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .cta-section { text-align: center; margin: 30px 0; }
        .cta-button { display: inline-block; background: #22c55e; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="title">✅ RFI Respondido</h1>
        </div>
        
        <div class="status-banner">
          Su solicitud de información ha sido respondida
        </div>
        
        <div class="content">
          <p>Estimado/a <strong>${data.contratista.ContactName || 'Contratista'}</strong> de <strong>${data.contratista.CompanyName}</strong>,</p>
          
          <p>El equipo del proyecto ha respondido su solicitud de información (RFI).</p>
          
          <div class="info-box">
            <h3 style="margin-top: 0; color: #1e293b;">📋 Información del RFI</h3>
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
                <td class="info-label">Respondido por:</td>
                <td class="info-value">${data.mandante.CompanyName}</td>
              </tr>
              <tr>
                <td class="info-label">Fecha de Respuesta:</td>
                <td class="info-value">${new Date().toLocaleDateString('es-CL')}</td>
              </tr>
            </table>
          </div>
          
          ${data.rfi.Descripcion ? `
          <div class="original-question">
            <h4 style="margin-top: 0; color: #1e40af;">📝 Su Consulta Original:</h4>
            <p style="margin-bottom: 0; white-space: pre-wrap; color: #64748b;">${data.rfi.Descripcion}</p>
          </div>
          ` : ''}
          
          <div class="response-box">
            <h4 style="margin-top: 0; color: #15803d;">💬 Respuesta:</h4>
            <p style="margin-bottom: 0; white-space: pre-wrap;">${data.respuesta}</p>
          </div>
          
          <div class="cta-section">
            <p style="margin-bottom: 15px;">Para ver el detalle completo:</p>
            <a href="${data.accessUrl}" class="cta-button">Ver RFI Completo</a>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">
            Si tiene alguna consulta adicional, puede crear un nuevo RFI desde la plataforma.
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

const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: RFIResponseRequest = await req.json();
    console.log("📧 Sending RFI response notification:", data);

    if (!data.rfiId || !data.respuesta) {
      throw new Error('rfiId and respuesta are required');
    }

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
      .eq('id', rfi.Proyecto)
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
    const accessUrl = `${baseUrl}/email-access?projectId=${project.id}&rfiId=${data.rfiId}&type=contratista`;

    const accessToken = await getAccessToken();
    const fromEmail = Deno.env.get("GMAIL_FROM_EMAIL");

    const emailHtml = createEmailHtml({
      rfi,
      project,
      contratista,
      mandante,
      respuesta: data.respuesta,
      accessUrl
    });

    const subject = `✅ RFI Respondido: ${rfi.Titulo || 'Sin título'} | ${project.Name}`;

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
    console.log("✅ RFI response notification sent:", result.id);

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
