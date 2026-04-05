const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'
import { z } from 'https://esm.sh/zod@3.23.8'

const BodySchema = z.object({
  licitacionId: z.number(),
  email: z.string().email(),
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const parsed = BodySchema.safeParse(await req.json())
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten().fieldErrors }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { licitacionId, email } = parsed.data
    const emailLower = email.toLowerCase().trim()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // 1. Verify the email is an invited bidder
    const { data: oferente } = await supabase
      .from('LicitacionOferentes')
      .select('id')
      .eq('licitacion_id', licitacionId)
      .eq('email', emailLower)
      .maybeSingle()

    if (!oferente) {
      return new Response(JSON.stringify({ error: 'Email no invitado a esta licitación' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Invalidate previous unused codes for this email+licitacion
    await supabase
      .from('licitacion_otp_codes')
      .update({ used: true })
      .eq('licitacion_id', licitacionId)
      .eq('email', emailLower)
      .eq('used', false)

    // 3. Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // 4. Store the code
    const { error: insertError } = await supabase
      .from('licitacion_otp_codes')
      .insert({
        licitacion_id: licitacionId,
        email: emailLower,
        code,
      })

    if (insertError) throw insertError

    // 5. Get licitacion name for the email
    const { data: lic } = await supabase
      .from('Licitaciones')
      .select('nombre')
      .eq('id', licitacionId)
      .single()

    // 6. Send email via Gmail
    const gmailClientId = Deno.env.get('GMAIL_CLIENT_ID')!
    const gmailClientSecret = Deno.env.get('GMAIL_CLIENT_SECRET')!
    const gmailRefreshToken = Deno.env.get('GMAIL_REFRESH_TOKEN')!
    const fromEmail = Deno.env.get('GMAIL_FROM_EMAIL') || 'noreply@gloster.cl'

    // Get access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: gmailClientId,
        client_secret: gmailClientSecret,
        refresh_token: gmailRefreshToken,
        grant_type: 'refresh_token',
      }),
    })
    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    if (!accessToken) {
      console.error('Failed to get Gmail access token:', tokenData)
      throw new Error('Failed to get email access token')
    }

    const licitacionNombre = lic?.nombre || 'Licitación'
    const subject = `Código de acceso - ${licitacionNombre}`
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a1a2e; margin-bottom: 8px;">Código de verificación</h2>
        <p style="color: #555; font-size: 14px; margin-bottom: 24px;">
          Usa el siguiente código para acceder al portal de la licitación <strong>${licitacionNombre}</strong>:
        </p>
        <div style="background: #f0f4ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a2e;">${code}</span>
        </div>
        <p style="color: #888; font-size: 12px; text-align: center;">
          Este código expira en <strong>10 minutos</strong>. No compartas este código con nadie.
        </p>
      </div>
    `

    const rawEmail = [
      `From: Gloster <${fromEmail}>`,
      `To: ${emailLower}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      htmlBody,
    ].join('\r\n')

    const encodedMessage = btoa(unescape(encodeURIComponent(rawEmail)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedMessage }),
    })

    if (!sendRes.ok) {
      const errText = await sendRes.text()
      console.error('Gmail send error:', errText)
      throw new Error('Failed to send email')
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('OTP Error:', err)
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
