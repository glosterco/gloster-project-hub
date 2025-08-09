import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { email, contratistaId } = await req.json();

    if (!email || !contratistaId) {
      return new Response(
        JSON.stringify({ 
          hasAccess: false, 
          error: 'Email y contratistaId son requeridos' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('🔍 Verificando email de usuario de contratista:', { email, contratistaId });

    // Buscar usuarios asociados al contratista
    const { data: contratistaUsers, error: usersError } = await supabaseClient
      .from('contratista_users')
      .select('auth_user_id')
      .eq('contratista_id', contratistaId);

    if (usersError) {
      console.error('Error buscando usuarios de contratista:', usersError);
      return new Response(
        JSON.stringify({ 
          hasAccess: false, 
          error: 'Error al verificar usuarios del contratista' 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!contratistaUsers || contratistaUsers.length === 0) {
      console.log('❌ No se encontraron usuarios asociados al contratista');
      return new Response(
        JSON.stringify({ 
          hasAccess: false, 
          isAssociatedUser: false 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verificar cada usuario en auth.users para encontrar coincidencia de email
    for (const user of contratistaUsers) {
      const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserById(user.auth_user_id);
      
      if (!authError && authUser?.user?.email?.toLowerCase() === email.toLowerCase()) {
        console.log('✅ Usuario asociado del contratista encontrado:', authUser.user.email);
        return new Response(
          JSON.stringify({ 
            hasAccess: true, 
            isAssociatedUser: true,
            authUserId: user.auth_user_id
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    console.log('❌ Email no encontrado entre los usuarios del contratista');
    return new Response(
      JSON.stringify({ 
        hasAccess: false, 
        isAssociatedUser: false 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error en verify-contratista-user-email:', error);
    return new Response(
      JSON.stringify({ 
        hasAccess: false, 
        error: 'Error interno del servidor' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});