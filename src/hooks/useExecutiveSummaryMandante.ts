import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PaymentSummary {
  id: number;
  paymentName: string;
  projectName: string;
  contractorName: string;
  amount: number;
  currency: string;
  status: string;
  month: string;
  year: string;
}

export interface ProjectSummary {
  id: number;
  name: string;
  contractorName: string;
  currency: string;
  recentPayments: PaymentSummary[];
}

export interface ExecutiveSummaryData {
  totalProjects: number;
  totalValue: number;
  pendingPayments: number;
  pendingPaymentsAmount: number;
  approvedPayments: number;
  approvedPaymentsAmount: number;
  rejectedPayments: number;
  rejectedPaymentsAmount: number;
  projectSummaries: ProjectSummary[];
  // Adicionales metrics
  totalAdicionales: number;
  montoPresentadoAdicionales: number;
  montoAprobadoAdicionales: number;
  adicionalesPendientes: number;
  adicionalesAprobados: number;
  adicionalesRechazados: number;
  // Documentos metrics
  totalDocumentos: number;
  totalSizeDocumentos: number;
  documentosPorTipo: { tipo: string; count: number }[];
  // Fotos metrics
  totalFotos: number;
  fotosPorProyecto: { projectId: number; count: number }[];
  // Presupuesto metrics
  totalPresupuestoItems: number;
  avancePromedioPresupuesto: number;
  montoTotalPresupuesto: number;
  presupuestoHistorico: Array<{
    id: number;
    TotalAcumulado: number;
    TotalParcial: number;
    created_at: string;
  }>;
  // Reuniones metrics
  totalReuniones: number;
  projects: { id: number; name: string }[];
  // Mandante features configuration
  features: {
    Adicionales: boolean;
    Documentos: boolean;
    Fotos: boolean;
    Presupuesto: boolean;
    Reuniones: boolean;
    Licitaciones: boolean;
  };
}

export const useExecutiveSummaryMandante = (selectedProjectIds?: number[]) => {
  const [summaryData, setSummaryData] = useState<ExecutiveSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchExecutiveSummary = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuario no autenticado');
      }

      // Get user's mandante IDs only
      const mandanteIds = await getUserMandanteIds(user.id);

      // Fetch mandante features configuration - get all mandantes
      const { data: mandanteConfigs } = await supabase
        .from('Mandantes')
        .select('Adicionales, Documentos, Fotos, Presupuesto, Reuniones, Licitaciones')
        .in('id', mandanteIds.split(',').map(Number));

      // OR logic: if ANY mandante has a feature enabled, show it
      const features = {
        Adicionales: mandanteConfigs?.some(m => m.Adicionales) || false,
        Documentos: mandanteConfigs?.some(m => m.Documentos) || false,
        Fotos: mandanteConfigs?.some(m => m.Fotos) || false,
        Presupuesto: mandanteConfigs?.some(m => m.Presupuesto) || false,
        Reuniones: mandanteConfigs?.some(m => m.Reuniones) || false,
        Licitaciones: mandanteConfigs?.some(m => m.Licitaciones) || false,
      };

      if (!mandanteIds || mandanteIds === '0') {
        setSummaryData({
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
          presupuestoHistorico: [],
          totalReuniones: 0,
          projects: [],
          features
        });
        return;
      }

      // Fetch projects owned by mandante with related data
      const { data: projects, error: projectsError } = await supabase
        .from('Proyectos')
        .select(`
          id,
          Name,
          Budget,
          Currency,
          Owner,
          Contratista,
          Contratistas:Contratista (
            id,
            CompanyName,
            ContactName
          )
        `)
        .in('Owner', mandanteIds.split(',').map(Number));

      if (projectsError) {
        throw projectsError;
      }

      if (!projects || projects.length === 0) {
        setSummaryData({
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
          presupuestoHistorico: [],
          totalReuniones: 0,
          projects: [],
          features
        });
        return;
      }

      // Apply project filter if selectedProjectIds is provided
      let projectIds = projects.map(p => p.id);
      if (selectedProjectIds && selectedProjectIds.length > 0) {
        projectIds = projectIds.filter(id => selectedProjectIds.includes(id));
      }

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
          ExpiryDate,
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
        .order('ExpiryDate', { ascending: false });

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
      
      // Fetch presupuesto historico
      const { data: historicoData } = await supabase
        .from('PresupuestoHistorico' as any)
        .select('*')
        .in('Project_ID', projectIds)
        .order('created_at', { ascending: true });

      // Fetch reuniones data
      const { data: reuniones } = await supabase
        .from('Reuniones')
        .select('id');

      if (paymentsError) {
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
      const projectSummaries: ProjectSummary[] = projects.map(project => {
        const projectPayments = payments?.filter(p => p.Project === project.id) || [];
        const last2Payments = projectPayments.slice(0, 2);

        const recentPayments: PaymentSummary[] = last2Payments.map(payment => ({
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
      }).filter(project => project.recentPayments.length > 0); // Only include projects with payments

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
      const presupuestoHistorico = ((historicoData || []) as unknown) as Array<{
        id: number;
        TotalAcumulado: number;
        TotalParcial: number;
        created_at: string;
      }>;

      // Calculate reuniones metrics
      const totalReuniones = reuniones?.length || 0;

      setSummaryData({
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
        presupuestoHistorico,
        totalReuniones,
        projects: projects.map(p => ({ id: p.id, name: p.Name || 'Sin nombre' })),
        features
      });

    } catch (error: any) {
      console.error('Error fetching executive summary:', error);
      setError(error.message || 'Error desconocido');
      toast({
        title: "Error",
        description: "No se pudo cargar el resumen ejecutivo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get user's mandante IDs
  const getUserMandanteIds = async (userId: string): Promise<string> => {
    try {
      const { data: directMandantes } = await supabase
        .from('Mandantes')
        .select('id')
        .eq('auth_user_id', userId);
      
      const { data: userRoles } = await supabase
        .from('mandante_users')
        .select('mandante_id')
        .eq('auth_user_id', userId);

      const mandanteIds = [
        ...(directMandantes?.map(m => m.id) || []),
        ...(userRoles?.map(ur => ur.mandante_id) || [])
      ];

      return mandanteIds.length > 0 ? mandanteIds.join(',') : '0';
    } catch (error) {
      console.error('Error getting mandante IDs:', error);
      return '0';
    }
  };

  useEffect(() => {
    fetchExecutiveSummary();
  }, [selectedProjectIds]);

  return {
    summaryData,
    loading,
    error,
    refetch: fetchExecutiveSummary
  };
};
