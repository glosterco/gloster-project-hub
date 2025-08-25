import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyEmailRequest {
  email: string;
  mandanteId: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, mandanteId }: VerifyEmailRequest = await req.json();

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get all users associated with the mandante
    const { data: mandanteUsers, error: mandanteUsersError } = await supabaseAdmin
      .from('mandante_users')
      .select('auth_user_id')
      .eq('mandante_id', mandanteId);

    if (mandanteUsersError) {
      console.error('Error fetching mandante users:', mandanteUsersError);
      return new Response(
        JSON.stringify({ error: 'Error verificando usuarios del mandante' }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if email matches any of the mandante users
    if (mandanteUsers && mandanteUsers.length > 0) {
      for (const mandanteUser of mandanteUsers) {
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
          mandanteUser.auth_user_id
        );

        if (!userError && userData.user?.email?.toLowerCase() === email.toLowerCase()) {
          return new Response(
            JSON.stringify({ 
              hasAccess: true, 
              authUserId: mandanteUser.auth_user_id,
              isAssociatedUser: true 
            }),
            { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
          );
        }
      }
    }

    // If no match found
    return new Response(
      JSON.stringify({ hasAccess: false }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error in verify-mandante-user-email function:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);