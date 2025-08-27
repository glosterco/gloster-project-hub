import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SetEmailAccessRequest {
  email: string;
  paymentId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, paymentId }: SetEmailAccessRequest = await req.json();

    if (!email || !paymentId) {
      return new Response(
        JSON.stringify({ error: 'Email and paymentId are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('🔍 Setting email access for:', { email, paymentId });

    // Verificar que el email corresponde a un mandante del proyecto relacionado al pago
    const { data: paymentData, error: paymentError } = await supabase
      .from('Estados de pago')
      .select(`
        id,
        Project,
        Proyectos!inner (
          id,
          Owner,
          Mandantes!inner (
            id,
            ContactEmail,
            auth_user_id
          )
        )
      `)
      .eq('id', paymentId)
      .single();

    if (paymentError || !paymentData) {
      console.log('❌ Payment not found:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const mandante = paymentData.Proyectos.Mandantes;
    
    // Verificar que el email coincide con el mandante del proyecto
    if (mandante.ContactEmail?.toLowerCase() !== email.toLowerCase()) {
      console.log('❌ Email does not match project mandante');
      return new Response(
        JSON.stringify({ error: 'Email not authorized for this payment' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // CRÍTICO: Verificar que el mandante NO tiene user_auth_id
    if (mandante.auth_user_id) {
      console.log('❌ Mandante has user_auth_id, should use authenticated access');
      return new Response(
        JSON.stringify({ 
          error: 'This mandante has an account and should use authenticated access',
          requiresAuth: true 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Establecer el custom.email_access usando set_config
    const { error: configError } = await supabase.rpc('set_config', {
      setting_name: 'custom.email_access',
      setting_value: email.toLowerCase(),
      is_local: false
    });

    if (configError) {
      console.error('❌ Error setting email access:', configError);
      return new Response(
        JSON.stringify({ error: 'Failed to set email access' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('✅ Email access set successfully for:', email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email access configured',
        hasAuth: false // Mandante sin user_auth_id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});