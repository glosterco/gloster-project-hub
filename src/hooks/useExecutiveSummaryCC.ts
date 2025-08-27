import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ExecutiveSummaryData, ProjectSummary, PaymentSummary } from './useExecutiveSummary';

export const useExecutiveSummaryCC = () => {
  const [summaryData, setSummaryData] = useState<ExecutiveSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchExecutiveSummaryCC = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar acceso CC desde sessionStorage
      const mandanteAccess = sessionStorage.getItem('mandanteAccess');
      if (!mandanteAccess) {
        throw new Error('Acceso no autorizado');
      }

      const accessData = JSON.parse(mandanteAccess);
      if (accessData.userType !== 'cc') {
        throw new Error('Acceso no autorizado para CC');
      }

      // Obtener el paymentId para identificar el contratista
      const paymentId = accessData.paymentId;
      if (!paymentId) {
        throw new Error('No se pudo identificar el pago');
      }

      // Obtener datos del pago para identificar el contratista
      const { data: payment, error: paymentError } = await supabase
        .from('Estados de pago')
        .select('Project')
        .eq('id', paymentId)
        .single();

      if (paymentError) {
        throw new Error('Error al obtener información del pago');
      }

      // Obtener datos del proyecto para identificar el contratista
      const { data: project, error: projectError } = await supabase
        .from('Proyectos')
        .select('Contratista')
        .eq('id', payment.Project)
        .single();

      if (projectError) {
        throw new Error('Error al obtener información del proyecto');
      }

      const contratistaId = project.Contratista;

      // Fetch projects SOLO del contratista específico
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
        .eq('Status', true); // Solo proyectos activos

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
          projectSummaries: []
        });
        return;
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
      }).filter(project => project.recentPayments.length > 0);

      setSummaryData({
        totalProjects,
        totalValue,
        pendingPayments,
        pendingPaymentsAmount,
        approvedPayments,
        approvedPaymentsAmount,
        rejectedPayments,
        rejectedPaymentsAmount,
        projectSummaries
      });

    } catch (error: any) {
      console.error('Error fetching CC executive summary:', error);
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

  useEffect(() => {
    fetchExecutiveSummaryCC();
  }, []);

  return {
    summaryData,
    loading,
    error,
    refetch: fetchExecutiveSummaryCC
  };
};