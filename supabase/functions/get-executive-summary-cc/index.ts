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

    // Fetch contratista features configuration
    const { data: contratistaConfig, error: configError } = await supabase
      .from('Contratistas')
      .select('Adicionales, Documentos, Fotos, Presupuesto, Reuniones, Licitaciones')
      .eq('id', contratistaId)
      .maybeSingle();

    if (configError) {
      console.error('Error fetching contratista config:', configError);
    }

    const features = {
      Adicionales: contratistaConfig?.Adicionales || false,
      Documentos: contratistaConfig?.Documentos || false,
      Fotos: contratistaConfig?.Fotos || false,
      Presupuesto: contratistaConfig?.Presupuesto || false,
      Reuniones: contratistaConfig?.Reuniones || false,
      Licitaciones: contratistaConfig?.Licitaciones || false,
    };

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
        projectSummaries: [],
        totalAdicionales: 0,
        montoPresentadoAdicionales: 0,
        montoAprobadoAdicionales: 0,
        adicionalesPendientes: 0,
        adicionalesAprobados: 0,
        adicionalesRechazados: 0,
        totalDocumentos: 0,
        totalSizeDocumentos: 0,
        documentosPorTipo: [],
        totalFotos: 0,
        fotosPorProyecto: [],
        totalPresupuestoItems: 0,
        avancePromedioPresupuesto: 0,
        montoTotalPresupuesto: 0,
        totalReuniones: 0,
        projects: [],
        features
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

    // Fetch adicionales data
    const { data: adicionales } = await supabase
      .from('Adicionales')
      .select('id, Monto_presentado, Monto_aprobado, Status, Proyecto')
      .in('Proyecto', projectIds);

    // Fetch documentos data
    const { data: documentos } = await supabase
      .from('Documentos')
      .select('id, Tipo, Size, Proyecto')
      .in('Proyecto', projectIds);

    // Fetch fotos data
    const { data: fotos } = await supabase
      .from('Fotos')
      .select('id, Proyecto')
      .in('Proyecto', projectIds);

    // Fetch presupuesto data
    const { data: presupuesto } = await supabase
      .from('Presupuesto')
      .select('id, Total, "Avance Acumulado", Project_ID')
      .in('Project_ID', projectIds);

    // Fetch reuniones data
    const { data: reuniones } = await supabase
      .from('Reuniones')
      .select('id');

    // Calculate metrics
    const totalProjects = projects.length;
    const totalValue = projects.reduce((sum, project) => sum + (project.Budget || 0), 0);
    
    const pendingPayments = payments?.filter(p => p.Status === 'Pendiente' || p.Status === 'Enviado').length || 0;
    const pendingPaymentsAmount = payments?.filter(p => p.Status === 'Pendiente' || p.Status === 'Enviado').reduce((sum, p) => sum + (p.Total || 0), 0) || 0;
    
    const approvedPayments = payments?.filter(p => p.Status === 'Aprobado').length || 0;
    const approvedPaymentsAmount = payments?.filter(p => p.Status === 'Aprobado').reduce((sum, p) => sum + (p.Total || 0), 0) || 0;
    
    const rejectedPayments = payments?.filter(p => p.Status === 'Rechazado').length || 0;
    const rejectedPaymentsAmount = payments?.filter(p => p.Status === 'Rechazado').reduce((sum, p) => sum + (p.Total || 0), 0) || 0;

    // Calculate adicionales metrics
    const totalAdicionales = adicionales?.length || 0;
    const montoPresentadoAdicionales = adicionales?.reduce((sum, a) => sum + (a.Monto_presentado || 0), 0) || 0;
    const montoAprobadoAdicionales = adicionales?.reduce((sum, a) => sum + (a.Monto_aprobado || 0), 0) || 0;
    const adicionalesPendientes = adicionales?.filter(a => a.Status === 'Pendiente').length || 0;
    const adicionalesAprobados = adicionales?.filter(a => a.Status === 'Aprobado').length || 0;
    const adicionalesRechazados = adicionales?.filter(a => a.Status === 'Rechazado').length || 0;

    // Calculate documentos metrics
    const totalDocumentos = documentos?.length || 0;
    const totalSizeDocumentos = documentos?.reduce((sum, d) => sum + (d.Size || 0), 0) || 0;
    const documentosPorTipo = Object.entries(
      documentos?.reduce((acc, d) => {
        const tipo = d.Tipo || 'Sin tipo';
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {}
    ).map(([tipo, count]) => ({ tipo, count }));

    // Calculate fotos metrics
    const totalFotos = fotos?.length || 0;
    const fotosPorProyecto = Object.entries(
      fotos?.reduce((acc, f) => {
        acc[f.Proyecto] = (acc[f.Proyecto] || 0) + 1;
        return acc;
      }, {} as Record<number, number>) || {}
    ).map(([projectId, count]) => ({ projectId: Number(projectId), count }));

    // Calculate presupuesto metrics
    const totalPresupuestoItems = presupuesto?.length || 0;
    const avancePromedioPresupuesto = presupuesto?.length 
      ? presupuesto.reduce((sum, p) => sum + (p['Avance Acumulado'] || 0), 0) / presupuesto.length 
      : 0;
    const montoTotalPresupuesto = presupuesto?.reduce((sum, p) => sum + (p.Total || 0), 0) || 0;

    // Calculate reuniones metrics
    const totalReuniones = reuniones?.length || 0;

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
      projectSummaries,
      totalAdicionales,
      montoPresentadoAdicionales,
      montoAprobadoAdicionales,
      adicionalesPendientes,
      adicionalesAprobados,
      adicionalesRechazados,
      totalDocumentos,
      totalSizeDocumentos,
      documentosPorTipo,
      totalFotos,
      fotosPorProyecto,
      totalPresupuestoItems,
      avancePromedioPresupuesto,
      montoTotalPresupuesto,
      totalReuniones,
      projects: projects.map(p => ({ id: p.id, name: p.Name || 'Sin nombre' })),
      features
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