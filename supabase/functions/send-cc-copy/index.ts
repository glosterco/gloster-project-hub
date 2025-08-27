import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CCCopyRequest {
  paymentId: string;
  contractorEmail?: string;
  contractorName?: string;
  contractorCompany?: string;
  mandanteCompany?: string;
  proyecto?: string;
  mes?: string;
  año?: number;
  amount?: number;
  dueDate?: string;
  currency?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: CCCopyRequest = await req.json();
    const { paymentId } = requestData;

    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: 'PaymentId es requerido' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get payment and project details
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('Estados de pago')
      .select(`
        *,
        Proyectos!inner (
          *,
          Contratistas!inner (
            id,
            CompanyName,
            ContactName,
            ContactEmail,
            CCEmail
          ),
          Mandantes!inner (
            CompanyName,
            ContactEmail,
            ContactName
          )
        )
      `)
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      console.error('Error fetching payment data:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Pago no encontrado' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const contractor = payment.Proyectos.Contratistas;
    const mandante = payment.Proyectos.Mandantes;
    const ccEmail = contractor.CCEmail;

    if (!ccEmail) {
      console.log('No CC email found for contractor:', contractor.id);
      return new Response(
        JSON.stringify({ message: 'No CC email configured for this contractor' }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get access token for Gmail
    const getAccessToken = async (): Promise<string> => {
      const { data, error } = await supabaseAdmin.functions.invoke('gmail-token-manager');
      if (error) throw new Error(`Error getting access token: ${error.message}`);
      if (!data?.access_token) throw new Error('No access token received');
      return data.access_token;
    };

    const accessToken = await getAccessToken();

    // Format currency
    const formatCurrency = (amount: number, currency?: string): string => {
      if (currency === 'UF') {
        return `${amount.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UF`;
      } else if (currency === 'USD') {
        return `$${amount.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} USD`;
      } else {
        return `$${amount.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} CLP`;
      }
    };

    // Generate access URL for executive summary
    const token = crypto.randomUUID();
    const baseUrl = 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com';
    const accessUrl = `${baseUrl}/email-access?paymentId=${paymentId}&token=${token}&redirect=/executive-summary`;

    // Update payment with CC access token
    await supabaseAdmin
      .from('Estados de pago')
      .update({ 
        URLContratista: payment.URLContratista || `${baseUrl}/email-access?paymentId=${paymentId}&token=${crypto.randomUUID()}`,
        // Store CC token in Notes field temporarily (we could add a dedicated field later)
        Notes: (payment.Notes || '') + `\nCC_TOKEN:${token}`
      })
      .eq('id', paymentId);

    // Create email HTML
    const createEmailHtml = (): string => {
      return `
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .content { background: white; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
              .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0; }
              .details { background: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0; }
              .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Notificación de Estado de Pago Enviado</h2>
                <p>Se ha enviado un estado de pago al mandante</p>
              </div>
              
              <div class="content">
                <p>Estimado/a ${ccEmail},</p>
                
                <p>Te informamos que se ha enviado un estado de pago al mandante <strong>${mandante.CompanyName}</strong> correspondiente al proyecto:</p>
                
                <div class="details">
                  <h3>Detalles del Estado de Pago</h3>
                  <p><strong>Proyecto:</strong> ${payment.Proyectos.Name}</p>
                  <p><strong>Estado de Pago:</strong> ${payment.Name}</p>
                  <p><strong>Período:</strong> ${payment.Mes} ${payment.Año}</p>
                  <p><strong>Monto:</strong> ${formatCurrency(payment.Total || 0, payment.Proyectos.Currency)}</p>
                  <p><strong>Fecha de Vencimiento:</strong> ${payment.ExpiryDate || 'No especificada'}</p>
                  <p><strong>Contratista:</strong> ${contractor.CompanyName}</p>
                  <p><strong>Mandante:</strong> ${mandante.CompanyName}</p>
                </div>
                
                <p>Puedes revisar el estado de los últimos estados de pago del proyecto haciendo clic en el siguiente botón:</p>
                
                <a href="${accessUrl}" class="button">Revisar Estados de Pago</a>
                
                <p><small>Este enlace te permitirá acceder al resumen ejecutivo después de verificar tu dirección de email.</small></p>
              </div>
              
              <div class="footer">
                <p>Este es un correo automático generado por el sistema de gestión de proyectos.</p>
                <p>Si tienes alguna pregunta, ponte en contacto con el equipo del proyecto.</p>
              </div>
            </div>
          </body>
        </html>
      `;
    };

    // Send email using Gmail API
    const emailHtml = createEmailHtml();
    const subject = `Notificación: Estado de pago enviado - ${payment.Proyectos.Name}`;
    
    const emailPayload = {
      raw: btoa(`From: ${Deno.env.get('GMAIL_FROM_EMAIL')}
To: ${ccEmail}
Subject: ${subject}
Content-Type: text/html; charset=utf-8

${emailHtml}`).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    };

    const gmailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!gmailResponse.ok) {
      const errorText = await gmailResponse.text();
      console.error('Gmail API error:', errorText);
      throw new Error(`Gmail API error: ${gmailResponse.status} - ${errorText}`);
    }

    const result = await gmailResponse.json();
    console.log('CC notification sent successfully to:', ccEmail);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: result.id,
        ccEmail: ccEmail,
        message: 'CC notification sent successfully'
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error in send-cc-copy function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error interno del servidor' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);