import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { contractorId, paymentId } = await req.json()

    console.log('🔍 CC Executive Summary request:', { contractorId, paymentId })

    let contratistaId = contractorId;

    // Si no hay contractorId directo, obtenerlo del paymentId
    if (!contratistaId && paymentId) {
      const { data: payment, error: paymentError } = await supabase
        .from('Estados de pago')
        .select('Project')
        .eq('id', paymentId)
        .single();

      if (paymentError) {
        console.error('Error fetching payment:', paymentError)
        throw new Error('Error al obtener información del pago');
      }

      const { data: project, error: projectError } = await supabase
        .from('Proyectos')
        .select('Contratista')
        .eq('id', payment.Project)
        .single();

      if (projectError) {
        console.error('Error fetching project:', projectError)
        throw new Error('Error al obtener información del proyecto');
      }

      contratistaId = project.Contratista;
    }

    if (!contratistaId) {
      throw new Error('No se pudo identificar el contratista');
    }

    // Fetch projects del contratista específico
    const { data: projects, error: projectsError } = await supabase
      .from('Proyectos')
      .select(`
        id,
        Name,
        Budget,
        Currency,
        Owner,
        Contratista,
        Mandantes:Owner (
          id,
          CompanyName
        ),
        Contratistas:Contratista (
          id,
          CompanyName,
          ContactName
        )
      `)
      .eq('Contratista', contratistaId)
      .eq('Status', true);

    if (projectsError) {
      console.error('Error fetching projects:', projectsError)
      throw projectsError;
    }

    if (!projects || projects.length === 0) {
      return new Response(JSON.stringify({
        totalProjects: 0,
        totalValue: 0,
        pendingPayments: 0,
        pendingPaymentsAmount: 0,
        approvedPayments: 0,
        approvedPaymentsAmount: 0,
        rejectedPayments: 0,
        rejectedPaymentsAmount: 0,
        projectSummaries: []
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const projectIds = projects.map(p => p.id);

    // Fetch payment states excluding "Programado" status
    const { data: payments, error: paymentsError } = await supabase
      .from('Estados de pago')
      .select(`
        id,
        Name,
        Total,
        Status,
        Mes,
        "Año",
        Project,
        Proyectos:Project (
          Name,
          Currency,
          Contratistas:Contratista (
            ContactName,
            CompanyName
          )
        )
      `)
      .in('Project', projectIds)
      .neq('Status', 'Programado')
      .order('ExpiryDate', { ascending: false })
      .limit(100);

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError)
      throw paymentsError;
    }

    // Calculate metrics
    const totalProjects = projects.length;
    const totalValue = projects.reduce((sum, project) => sum + (project.Budget || 0), 0);
    
    const pendingPayments = payments?.filter(p => p.Status === 'Pendiente' || p.Status === 'Enviado').length || 0;
    const pendingPaymentsAmount = payments?.filter(p => p.Status === 'Pendiente' || p.Status === 'Enviado').reduce((sum, p) => sum + (p.Total || 0), 0) || 0;
    
    const approvedPayments = payments?.filter(p => p.Status === 'Aprobado').length || 0;
    const approvedPaymentsAmount = payments?.filter(p => p.Status === 'Aprobado').reduce((sum, p) => sum + (p.Total || 0), 0) || 0;
    
    const rejectedPayments = payments?.filter(p => p.Status === 'Rechazado').length || 0;
    const rejectedPaymentsAmount = payments?.filter(p => p.Status === 'Rechazado').reduce((sum, p) => sum + (p.Total || 0), 0) || 0;

    // Create project summaries with last 2 payments each
    const projectSummaries = projects.map(project => {
      const projectPayments = payments?.filter(p => p.Project === project.id) || [];
      const last2Payments = projectPayments.slice(0, 2);

      const recentPayments = last2Payments.map(payment => ({
        id: payment.id,
        paymentName: payment.Name,
        projectName: project.Name || 'Proyecto sin nombre',
        contractorName: payment.Proyectos?.Contratistas?.ContactName || 
                      payment.Proyectos?.Contratistas?.CompanyName || 'Contratista no identificado',
        amount: payment.Total || 0,
        currency: project.Currency || 'CLP',
        status: payment.Status || 'Sin estado',
        month: payment.Mes || '',
        year: payment.Año?.toString() || ''
      }));

      return {
        id: project.id,
        name: project.Name || 'Proyecto sin nombre',
        contractorName: project.Contratistas?.ContactName || project.Contratistas?.CompanyName || 'Contratista no identificado',
        currency: project.Currency || 'CLP',
        recentPayments
      };
    }).filter(project => project.recentPayments.length > 0);

    const summaryData = {
      totalProjects,
      totalValue,
      pendingPayments,
      pendingPaymentsAmount,
      approvedPayments,
      approvedPaymentsAmount,
      rejectedPayments,
      rejectedPaymentsAmount,
      projectSummaries
    };

    console.log('✅ CC Executive Summary data prepared:', { 
      totalProjects, 
      projectSummariesCount: projectSummaries.length 
    })

    return new Response(JSON.stringify(summaryData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Error in CC executive summary:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Error interno del servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});