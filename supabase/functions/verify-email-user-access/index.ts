import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper: find auth user by email (fallback when auth_user_id is not set)
const findAuthUserByEmail = async (client: ReturnType<typeof createClient>, email: string) => {
  try {
    const { data, error } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error) return null;
    const user = data.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
    return user || null;
  } catch (_err) {
    return null;
  }
};

interface VerifyUserAccessRequest {
  email: string;
  paymentId: string;
  userType: 'contratista' | 'mandante';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, paymentId, userType }: VerifyUserAccessRequest = await req.json();

    if (!email || !paymentId || !userType) {
      return new Response(
        JSON.stringify({ error: 'Email, paymentId y userType son requeridos' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get payment and project data
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('Estados de pago')
      .select('Project')
      .eq('id', paymentId)
      .single();

    if (paymentError) {
      return new Response(
        JSON.stringify({ error: 'Pago no encontrado' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { data: project, error: projectError } = await supabaseAdmin
      .from('Proyectos')
      .select('Contratista, Owner')
      .eq('id', payment.Project)
      .single();

    if (projectError) {
      return new Response(
        JSON.stringify({ error: 'Proyecto no encontrado' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let hasAccess = false;
    let needsPassword = false;
    let isRegistered = false;
    let authUserId = null;

    if (userType === 'contratista') {
      // Check main contractor
      const { data: contractor } = await supabaseAdmin
        .from('Contratistas')
        .select('ContactEmail, auth_user_id')
        .eq('id', project.Contratista)
        .single();

      if (contractor?.ContactEmail?.toLowerCase() === email.toLowerCase()) {
        hasAccess = true;
        if (contractor.auth_user_id) {
          needsPassword = true;
          isRegistered = true;
          authUserId = contractor.auth_user_id;
        }
      } else {
        // Check associated users
        const { data: associatedUsers } = await supabaseAdmin
          .from('contratista_users')
          .select('auth_user_id')
          .eq('contratista_id', project.Contratista);

        if (associatedUsers) {
          for (const user of associatedUsers) {
            const { data: userData } = await supabaseAdmin.auth.admin.getUserById(user.auth_user_id);
            if (userData.user?.email?.toLowerCase() === email.toLowerCase()) {
              hasAccess = true;
              needsPassword = true;
              isRegistered = true;
              authUserId = user.auth_user_id;
              break;
            }
          }
        }
      }
    } else if (userType === 'mandante') {
      // Check main mandante
      const { data: mandante } = await supabaseAdmin
        .from('Mandantes')
        .select('ContactEmail, auth_user_id')
        .eq('id', project.Owner)
        .single();

      if (mandante?.ContactEmail?.toLowerCase() === email.toLowerCase()) {
        hasAccess = true;
        if (mandante.auth_user_id) {
          needsPassword = true;
          isRegistered = true;
          authUserId = mandante.auth_user_id;
        }
      } else {
        // Check associated users
        const { data: associatedUsers } = await supabaseAdmin
          .from('mandante_users')
          .select('auth_user_id')
          .eq('mandante_id', project.Owner);

        if (associatedUsers) {
          for (const user of associatedUsers) {
            const { data: userData } = await supabaseAdmin.auth.admin.getUserById(user.auth_user_id);
            if (userData.user?.email?.toLowerCase() === email.toLowerCase()) {
              hasAccess = true;
              needsPassword = true;
              isRegistered = true;
              authUserId = user.auth_user_id;
              break;
            }
          }
        }
      }
    }

    // Fallback: if hasAccess but auth_user_id is not set, check if there is an auth user with this email
    if (hasAccess && !isRegistered) {
      const userByEmail = await findAuthUserByEmail(supabaseAdmin as any, email);
      if (userByEmail) {
        isRegistered = true;
        needsPassword = true;
        authUserId = userByEmail.id;
      }
    }

    return new Response(
      JSON.stringify({ 
        hasAccess, 
        needsPassword, 
        userType, 
        isRegistered, 
        authUserId 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error) {
    console.error('Error in verify-email-user-access function:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);