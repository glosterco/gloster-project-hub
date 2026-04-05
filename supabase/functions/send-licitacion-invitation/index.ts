import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHead = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHead });
  }

  try {
    const body = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get Gmail access token
    const gmailClientId = Deno.env.get('GMAIL_CLIENT_ID')!;
    const gmailClientSecret = Deno.env.get('GMAIL_CLIENT_SECRET')!;
    const gmailRefreshToken = Deno.env.get('GMAIL_REFRESH_TOKEN')!;
    const fromEmail = Deno.env.get('GMAIL_FROM_EMAIL')!;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: gmailClientId,
        client_secret: gmailClientSecret,
        refresh_token: gmailRefreshToken,
        grant_type: 'refresh_token',
      }),
    });
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'No se pudo obtener token de Gmail' }), {
        status: 500, headers: { ...corsHead, 'Content-Type': 'application/json' }
      });
    }

    // === Direct single-email call from upload-licitacion-documents ===
    if (body.email && body.isDocumentNotification) {
      // Build the bidder portal URL
      const siteUrl = Deno.env.get('SITE_URL') || 'https://gloster-project-hub.lovable.app';
      const portalUrl = body.licitacionId
        ? `${siteUrl}/licitacion-acceso/${body.licitacionId}`
        : body.urlAcceso || '';

      const subject = `Nuevos documentos disponibles - ${body.licitacionNombre}`;
      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #1a1a2e; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 20px;">Nuevos Documentos Disponibles</h1>
          </div>
          <div style="border: 1px solid #e0e0e0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-top: 0;">${body.licitacionNombre}</h2>
            <p style="color: #666;">Se han agregado <strong>${body.documentCount || 'nuevos'}</strong> documento(s) al proceso de licitación.</p>
            <p style="color: #666;">Revisa los nuevos antecedentes disponibles accediendo a la plataforma.</p>
            ${portalUrl ? `
            <div style="text-align: center; margin: 24px 0;">
              <a href="${portalUrl}" style="background: #1a1a2e; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                Ver Documentos
              </a>
            </div>` : ''}
            <p style="color: #999; font-size: 12px; text-align: center;">
              Este enlace es exclusivo para su participación en el proceso de licitación.
            </p>
          </div>
        </div>
      `;

      const rawEmail = [
        `From: ${fromEmail}`,
        `To: ${body.email}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        '',
        htmlBody,
      ].join('\r\n');

      const encodedEmail = btoa(unescape(encodeURIComponent(rawEmail)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: encodedEmail }),
      });

      const sendData = await sendRes.json();
      return new Response(
        JSON.stringify({ success: sendRes.ok, messageId: sendData.id }),
        { headers: { ...corsHead, 'Content-Type': 'application/json' } }
      );
    }

    // === Batch invitation call ===
    const { licitacionId, type } = body;

    const { data: licitacion, error } = await supabase
      .from('Licitaciones')
      .select(`
        *,
        LicitacionOferentes(email),
        Mandantes!Licitaciones_mandante_id_fkey(CompanyName, ContactName, ContactEmail)
      `)
      .eq('id', licitacionId)
      .single();

    if (error || !licitacion) {
      return new Response(JSON.stringify({ error: 'Licitación no encontrada' }), {
        status: 404, headers: { ...corsHead, 'Content-Type': 'application/json' }
      });
    }

    const mandante = (licitacion as any).Mandantes;
    const oferentes = (licitacion as any).LicitacionOferentes || [];
    const accessUrl = licitacion.url_acceso || '';

    const results: any[] = [];

    for (const oferente of oferentes) {
      const subject = type === 'invitacion'
        ? `Invitacion a Licitacion: ${licitacion.nombre}`
        : `Recordatorio de Evento - ${licitacion.nombre}`;

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #1a1a2e; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 20px;">${type === 'invitacion' ? 'Invitacion a Licitacion' : 'Recordatorio de Evento'}</h1>
            <p style="margin: 4px 0 0; opacity: 0.8;">${mandante?.CompanyName || 'Mandante'}</p>
          </div>
          <div style="border: 1px solid #e0e0e0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
            <h2 style="color: #333; margin-top: 0;">${licitacion.nombre}</h2>
            <p style="color: #666;">${licitacion.descripcion}</p>
            ${licitacion.mensaje_oferentes ? `<p style="color: #444; background: #f5f5f5; padding: 12px; border-radius: 6px; border-left: 3px solid #1a1a2e;">${licitacion.mensaje_oferentes}</p>` : ''}
            <div style="text-align: center; margin: 24px 0;">
              <a href="${accessUrl}" style="background: #1a1a2e; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                Acceder a la Licitacion
              </a>
            </div>
            <p style="color: #999; font-size: 12px; text-align: center;">
              Este enlace es exclusivo para su participacion en el proceso de licitacion.
            </p>
          </div>
        </div>
      `;

      const rawEmail = [
        `From: ${fromEmail}`,
        `To: ${oferente.email}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=UTF-8',
        '',
        htmlBody,
      ].join('\r\n');

      const encodedEmail = btoa(unescape(encodeURIComponent(rawEmail)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

      const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ raw: encodedEmail }),
      });

      const sendData = await sendRes.json();
      results.push({ email: oferente.email, success: sendRes.ok, messageId: sendData.id });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHead, 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Error in send-licitacion-invitation:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHead, 'Content-Type': 'application/json' }
    });
  }
});
