import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type UserType = 'contratista' | 'mandante';

interface GetPaymentDetailRequest {
  paymentId: string | number;
  token: string;
}

interface OwnerInfo {
  id: number;
  CompanyName: string;
  ContactName: string;
  ContactEmail: string;
  ContactPhone?: number | null;
}

interface ContractorInfo {
  id: number;
  CompanyName: string;
  ContactName: string;
  ContactEmail: string;
  RUT?: string | null;
  ContactPhone?: number | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId, token }: GetPaymentDetailRequest = await req.json();
    if (!paymentId || !token) {
      return new Response(JSON.stringify({ error: 'paymentId y token son requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Validate token against stored URLs
    const { data: paymentForValidation, error: paymentValidationError } = await supabaseAdmin
      .from('Estados de pago')
      .select('URLContratista, URLMandante')
      .eq('id', paymentId)
      .single();

    if (paymentValidationError || !paymentForValidation) {
      return new Response(JSON.stringify({ error: 'Pago no encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    let userType: UserType | null = null;
    if (paymentForValidation.URLContratista && paymentForValidation.URLContratista.includes(`token=${token}`)) {
      userType = 'contratista';
    } else if (paymentForValidation.URLMandante && paymentForValidation.URLMandante.includes(`token=${token}`)) {
      userType = 'mandante';
    }

    if (!userType) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Fetch full payment
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('Estados de pago')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      return new Response(JSON.stringify({ error: 'No se pudo obtener el estado de pago' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Fetch project
    const { data: project, error: projectError } = await supabaseAdmin
      .from('Proyectos')
      .select('*')
      .eq('id', payment.Project)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: 'No se pudo obtener el proyecto' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Fetch Owner
    let owner: OwnerInfo | undefined = undefined;
    if (project.Owner) {
      const { data: ownerData } = await supabaseAdmin
        .from('Mandantes')
        .select('*')
        .eq('id', project.Owner)
        .maybeSingle();

      if (ownerData) {
        owner = {
          id: ownerData.id,
          CompanyName: ownerData.CompanyName || '',
          ContactName: ownerData.ContactName || '',
          ContactEmail: ownerData.ContactEmail || '',
          ContactPhone: ownerData.ContactPhone ?? null,
        };
      }
    }

    // Fetch Contractor
    let contractor: ContractorInfo | undefined = undefined;
    if (project.Contratista) {
      const { data: contractorData } = await supabaseAdmin
        .from('Contratistas')
        .select('*')
        .eq('id', project.Contratista)
        .maybeSingle();

      if (contractorData) {
        contractor = {
          id: contractorData.id,
          CompanyName: contractorData.CompanyName || '',
          ContactName: contractorData.ContactName || '',
          ContactEmail: contractorData.ContactEmail || '',
          RUT: contractorData.RUT || null,
          ContactPhone: contractorData.ContactPhone ?? null,
        };
      }
    }

    const response = {
      ...payment,
      projectData: {
        id: project.id,
        Name: project.Name || '',
        Location: project.Location || '',
        Budget: project.Budget ?? null,
        Currency: project.Currency || null,
        Requierment: Array.isArray(project.Requierment) ? project.Requierment : [],
        Owner: owner,
        Contratista: contractor,
      },
      userType,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error('Error in get-payment-detail-public:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);
