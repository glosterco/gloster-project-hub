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

const formatCurrency = (amount: number, currency?: string, projectBudget?: number): string => {
  console.log('💰 formatCurrency called with amount:', amount, 'currency:', currency, 'projectBudget:', projectBudget);
  
  // Si el proyecto tiene budget 0 o NULL, mostrar "sin informar"
  if (projectBudget === 0 || projectBudget === null || projectBudget === undefined) {
    console.log('💰 Project budget is 0/null/undefined, returning "sin informar"');
    return "sin informar";
  }
  
  // If amount is 0, return "sin informar"
  if (amount === 0) {
    console.log('💰 Amount is zero, returning "sin informar"');
    return "sin informar";
  }
  
  // Verificar si el amount es válido
  if (amount === null || amount === undefined || isNaN(amount)) {
    console.warn('⚠️ Invalid amount received:', amount);
    return '$0';
  }
  
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


const createEmailHtml = (data: NotificationRequest & { projectBudget?: number; approverName?: string; totalApprovers?: number }): string => {
  const accessInstructions = `
          <div class="important-note">
            <strong>Nota Importante:</strong> Este enlace le dará acceso directo y seguro al estado de pago donde podrá revisar toda la documentación adjunta y proceder con la aprobación o solicitar modificaciones según corresponda.
          </div>
  `;

  // Add multi-approver info if applicable
  const multiApproverInfo = data.totalApprovers && data.totalApprovers > 1 ? `
          <div class="multi-approver-info" style="background: #e0f2fe; border: 1px solid #0ea5e9; padding: 12px; border-radius: 4px; margin: 15px 0; font-size: 14px;">
            <strong>Proceso de Aprobación:</strong> Este estado de pago requiere la aprobación de ${data.totalApprovers} personas. Su aprobación será registrada individualmente.
          </div>
  ` : '';

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
            ${data.approverName ? `Estimado/a <strong>${data.approverName}</strong>,` : `Estimado equipo de <strong>${data.mandanteCompany}</strong>,`}
          </div>
          
          <p>Se ha registrado un nuevo estado de pago que requiere su revisión y aprobación. A continuación se detallan los datos correspondientes:</p>
          
          ${multiApproverInfo}
          
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
                <td class="info-value amount">${formatCurrency(data.amount || 0, data.currency, data.projectBudget)}</td>
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


const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: NotificationRequest = await req.json();
    console.log("📧 Sending mandante notification with data:", JSON.stringify({...data, accessUrl: data.accessUrl ? '***hidden***' : undefined}, null, 2));

    // Validar que tenemos los datos mínimos necesarios
    if (!data.paymentId) {
      console.error("❌ Missing paymentId");
      throw new Error('paymentId is required');
    }

    // Validar que el email del mandante sea válido
    if (!data.mandanteEmail || !isValidEmail(data.mandanteEmail)) {
      console.error("❌ Invalid mandante email format:", data.mandanteEmail);
      throw new Error(`Invalid email format: ${data.mandanteEmail}`);
    }

    // Validar que el amount no sea null/undefined y convertir a número si es necesario
    let validAmount = 0;
    if (data.amount !== null && data.amount !== undefined) {
      validAmount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
      if (isNaN(validAmount)) {
        console.warn("⚠️ Invalid amount provided, using 0:", data.amount);
        validAmount = 0;
      }
    }

    console.log("💰 Validated amount:", validAmount);

    // Get project data, CC email, budget, and approvers list
    let ccEmail: string | null = null;
    let projectBudget: number | null = null;
    let approvers: Array<{ email: string; name: string | null }> = [];
    let projectId: number | null = null;

    try {
      // First get the project ID from the payment
      const { data: paymentData, error: paymentError } = await supabase
        .from('Estados de pago')
        .select('Project')
        .eq('id', data.paymentId)
        .single();
      
      if (paymentError) {
        console.error('❌ Error fetching payment:', paymentError);
        throw paymentError;
      }
      
      projectId = paymentData?.Project;
      console.log('📋 Found project ID:', projectId);

      if (projectId) {
        // Get project details including budget
        const { data: projectData, error: projectError } = await supabase
          .from('Proyectos')
          .select('Budget, Owner')
          .eq('id', projectId)
          .single();
        
        if (!projectError && projectData) {
          projectBudget = projectData.Budget;
          console.log('💰 Found project budget:', projectBudget);

          // Get mandante CC email
          if (projectData.Owner) {
            const { data: mandanteData, error: mandanteError } = await supabase
              .from('Mandantes')
              .select('CC')
              .eq('id', projectData.Owner)
              .single();
            
            if (!mandanteError && mandanteData?.CC) {
              ccEmail = mandanteData.CC;
              console.log('📧 Found CC email:', ccEmail);
            }
          }
        }

        // Get approvers from project_approval_config and project_approvers
        const { data: configData, error: configError } = await supabase
          .from('project_approval_config')
          .select('id, required_approvals')
          .eq('project_id', projectId)
          .single();

        if (!configError && configData) {
          console.log('📋 Found approval config:', configData);
          
          const { data: approversData, error: approversError } = await supabase
            .from('project_approvers')
            .select('approver_email, approver_name, approval_order')
            .eq('config_id', configData.id)
            .order('approval_order', { ascending: true });

          if (!approversError && approversData) {
            approvers = approversData.map(a => ({ email: a.approver_email, name: a.approver_name }));
            console.log('👥 Found approvers:', approvers.length);
          }
        }
      }
    } catch (dbError) {
      console.warn('⚠️ Error fetching project data:', dbError);
      // Continue without extra data, don't fail the main notification
    }

    const accessToken = await getAccessToken();
    const fromEmail = Deno.env.get("GMAIL_FROM_EMAIL");

    // Build recipients list - include mandante email plus all approvers
    const allRecipients = new Set<string>();
    allRecipients.add(data.mandanteEmail);
    
    // Add all approvers to recipients
    approvers.forEach(approver => {
      if (approver.email && isValidEmail(approver.email)) {
        allRecipients.add(approver.email.toLowerCase());
      }
    });

    // Add CC if valid
    if (ccEmail && isValidEmail(ccEmail)) {
      allRecipients.add(ccEmail);
    }

    console.log('📧 All recipients:', Array.from(allRecipients));

    // Create email data with default values
    const emailData = {
      ...data,
      amount: validAmount,
      proyecto: data.proyecto || 'Proyecto no especificado',
      mes: data.mes || 'Mes no especificado',
      año: data.año || new Date().getFullYear(),
      contractorCompany: data.contractorCompany || 'Empresa no especificada',
      mandanteCompany: data.mandanteCompany || 'Empresa no especificada',
      dueDate: data.dueDate || 'Fecha no especificada',
      currency: data.currency || 'CLP',
      projectBudget: projectBudget,
      totalApprovers: approvers.length > 0 ? approvers.length : undefined
    };

    const emailHtml = createEmailHtml(emailData);
    const subject = `Estado de Pago ${emailData.mes} ${emailData.año} - ${emailData.proyecto}`;
    
    const recipients = Array.from(allRecipients).join(', ');

    const emailPayload = {
      raw: encodeBase64UTF8(
        `From: Gloster Gestion de Proyectos <${fromEmail}>
To: ${recipients}
Subject: ${subject}
Reply-To: soporte.gloster@gmail.com
Content-Type: text/html; charset=utf-8
MIME-Version: 1.0
X-Mailer: Gloster Project Management System
Message-ID: <payment-${data.paymentId}-${Date.now()}@gloster.com>

${emailHtml}`
      ),
    };

    console.log("📧 Sending email to Gmail API...");
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
      throw new Error(`Gmail API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log("✅ Email sent successfully to", allRecipients.size, "recipients:", result);

    // Reset approval records for this payment (clear any previous approvals when re-sending)
    try {
      await supabase
        .from('payment_approvals')
        .delete()
        .eq('payment_id', parseInt(data.paymentId));
      
      // Reset approval progress on the payment
      await supabase
        .from('Estados de pago')
        .update({ 
          approval_progress: 0,
          total_approvals_required: approvers.length > 0 ? approvers.length : 1
        })
        .eq('id', parseInt(data.paymentId));
      
      console.log('🔄 Reset approval records for payment:', data.paymentId);
    } catch (resetError) {
      console.warn('⚠️ Could not reset approval records:', resetError);
    }

    return new Response(
      JSON.stringify({ success: true, messageId: result.id, recipientCount: allRecipients.size }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Error sending mandante notification:", error);
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
