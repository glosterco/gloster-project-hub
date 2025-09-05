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
    const contractorEmail = contractor.ContactEmail;

    // Check if we have CC email to send to
    if (!ccEmail) {
      console.log('No CC email found for contractor:', contractor.id);
      return new Response(
        JSON.stringify({ message: 'No CC email configured for this contractor' }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get Gmail credentials directly from environment variables
    const gmailClientId = Deno.env.get('GMAIL_CLIENT_ID');
    const gmailClientSecret = Deno.env.get('GMAIL_CLIENT_SECRET');
    const gmailRefreshToken = Deno.env.get('GMAIL_REFRESH_TOKEN');
    
    if (!gmailClientId || !gmailClientSecret || !gmailRefreshToken) {
      throw new Error('Missing Gmail credentials');
    }

    // Get fresh access token using refresh token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: gmailClientId,
        client_secret: gmailClientSecret,
        refresh_token: gmailRefreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Failed to refresh Gmail token: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    if (!accessToken) {
      throw new Error('No access token received from refresh');
    }

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
    const baseUrl = 'https://gloster-project-hub.lovable.app';
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

    // Create email HTML with brand identity
    const createEmailHtml = (): string => {
      return `
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { 
                font-family: 'Rubik', Arial, sans-serif; 
                line-height: 1.6; 
                color: #333; 
                margin: 0; 
                padding: 0; 
                background-color: #f8f9fa;
              }
              .container { 
                max-width: 600px; 
                margin: 0 auto; 
                padding: 20px; 
                background-color: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
              }
              .header { 
                background: linear-gradient(135deg, #F5DF4D 0%, #F4D03F 100%);
                padding: 30px 20px; 
                border-radius: 12px 12px 0 0; 
                margin: -20px -20px 20px -20px;
                text-align: center;
                color: #333;
              }
              .logo {
                width: 60px;
                height: 60px;
                background-color: #333;
                border-radius: 8px;
                margin: 0 auto 15px auto;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 24px;
                color: #F5DF4D;
              }
              .content { 
                background: white; 
                padding: 20px; 
                border-radius: 8px; 
              }
              .button { 
                display: inline-block; 
                background: linear-gradient(135deg, #F5DF4D 0%, #F4D03F 100%);
                color: #333 !important; 
                padding: 14px 28px; 
                text-decoration: none; 
                border-radius: 8px; 
                margin: 20px 0; 
                font-weight: bold;
                text-align: center;
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(245, 223, 77, 0.3);
              }
              .button:hover {
                background: linear-gradient(135deg, #F4D03F 0%, #F5DF4D 100%);
                box-shadow: 0 4px 12px rgba(245, 223, 77, 0.4);
                transform: translateY(-1px);
              }
              .details { 
                background: #f8f9fa; 
                padding: 20px; 
                border-radius: 8px; 
                margin: 20px 0; 
                border-left: 4px solid #F5DF4D;
              }
              .footer { 
                margin-top: 20px; 
                padding-top: 20px; 
                border-top: 1px solid #ddd; 
                font-size: 12px; 
                color: #939597; 
                text-align: center;
              }
              h2 { margin: 0 0 10px 0; color: #333; }
              h3 { margin: 0 0 15px 0; color: #333; }
              p { margin: 10px 0; }
              strong { color: #333; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Notificacion de Estado de Pago Enviado</h2>
                <p>Se ha enviado un estado de pago al mandante</p>
              </div>
              
              <div class="content">
                
                <p>Te informamos que se ha enviado un estado de pago al mandante <strong>${mandante.CompanyName}</strong> correspondiente al proyecto:</p>
                
                <div class="details">
                  <h3>Detalles del Estado de Pago</h3>
                  <p><strong>Proyecto:</strong> ${payment.Proyectos.Name}</p>
                  <p><strong>Estado de Pago:</strong> ${payment.Name}</p>
                  <p><strong>Periodo:</strong> ${payment.Mes} ${payment.Año}</p>
                  <p><strong>Monto:</strong> ${formatCurrency(payment.Total || 0, payment.Proyectos.Currency)}</p>
                  <p><strong>Fecha de Vencimiento:</strong> ${payment.ExpiryDate || 'No especificada'}</p>
                  <p><strong>Contratista:</strong> ${contractor.CompanyName}</p>
                  <p><strong>Mandante:</strong> ${mandante.CompanyName}</p>
                </div>
                
                <p>Puedes revisar el estado de los ultimos estados de pago del proyecto haciendo clic en el siguiente boton:</p>
                
                <div style="text-align: center;">
                  <a href="${accessUrl}" class="button">Revisar Estados de Pago</a>
                </div>
                
                <p style="font-size: 14px; color: #939597;">Este enlace te permitira acceder al resumen ejecutivo despues de verificar tu direccion de email.</p>
              </div>
              
              <div class="footer">
                <p>Este es un correo automatico generado por el sistema de gestion de proyectos.</p>
                <p>Si tienes alguna pregunta, ponte en contacto con el equipo del proyecto.</p>
              </div>
            </div>
          </body>
        </html>
      `;
    };

    // Prepare emails to send - only CC email
    const emailsToSend = [];
    
    // Add CC email if exists
    if (ccEmail) {
      emailsToSend.push({
        email: ccEmail,
        type: 'CC'
      });
    }

    if (emailsToSend.length === 0) {
      console.log('ℹ️ No emails to send (no CC email configured)');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No CC email configured'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Send emails to all recipients
    const emailResults = [];
    const emailHtml = createEmailHtml();
    const subject = `Notificacion: Estado de pago enviado - ${payment.Proyectos.Name}`;
    
    for (const recipient of emailsToSend) {
      try {
        console.log(`📧 Sending CC notification to ${recipient.type}: ${recipient.email}`);
        
        const emailPayload = {
          raw: btoa(`From: ${Deno.env.get('GMAIL_FROM_EMAIL')}
To: ${recipient.email}
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
          console.error(`❌ Gmail API error for ${recipient.type}:`, errorText);
          emailResults.push({
            email: recipient.email,
            type: recipient.type,
            success: false,
            error: `${gmailResponse.status} ${errorText}`
          });
        } else {
          const result = await gmailResponse.json();
          console.log(`✅ Email sent successfully to ${recipient.type}:`, result.id);
          emailResults.push({
            email: recipient.email,
            type: recipient.type,
            success: true,
            messageId: result.id
          });
        }
      } catch (error) {
        console.error(`❌ Error sending to ${recipient.type}:`, error);
        emailResults.push({
          email: recipient.email,
          type: recipient.type,
          success: false,
          error: error.message
        });
      }
    }

    // Check if at least one email was sent successfully
    const successfulSends = emailResults.filter(r => r.success);
    const failedSends = emailResults.filter(r => !r.success);

    if (successfulSends.length > 0) {
      console.log(`✅ CC notifications sent successfully to ${successfulSends.length} recipients`);
      return new Response(
        JSON.stringify({ 
          success: true, 
          emailResults: emailResults,
          successCount: successfulSends.length,
          failureCount: failedSends.length,
          message: `CC notifications sent to ${successfulSends.length} recipients`
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    } else {
      console.error('❌ Failed to send to any recipients');
      return new Response(
        JSON.stringify({ 
          success: false, 
          emailResults: emailResults,
          error: 'Failed to send to any recipients'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

  } catch (error) {
    console.error('Error in send-cc-copy function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Error interno del servidor' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);