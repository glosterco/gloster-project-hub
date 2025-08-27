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
}

export const useExecutiveSummary = () => {
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

      // Get user's mandante and contratista IDs
      const mandanteIds = await getUserMandanteIds(user.id);
      const contratistaIds = await getUserContratistaIds(user.id);

      // Fetch projects with related data - using proper filter syntax
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
            CompanyName,
            auth_user_id
          ),
          Contratistas:Contratista (
            id,
            CompanyName,
            ContactName,
            auth_user_id
          )
        `)
        .or(`Owner.in.(${mandanteIds}),Contratista.in.(${contratistaIds})`);

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

      // Fetch payment states excluding "Programado" status and get last 3 per project
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
        .limit(50); // Get more to filter properly later

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

  // Helper functions to get user's mandante and contratista IDs
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

  const getUserContratistaIds = async (userId: string): Promise<string> => {
    try {
      const { data: directContratistas } = await supabase
        .from('Contratistas')
        .select('id')
        .eq('auth_user_id', userId);
      
      const { data: userRoles } = await supabase
        .from('contratista_users')
        .select('contratista_id')
        .eq('auth_user_id', userId);

      const contratistaIds = [
        ...(directContratistas?.map(c => c.id) || []),
        ...(userRoles?.map(ur => ur.contratista_id) || [])
      ];

      return contratistaIds.length > 0 ? contratistaIds.join(',') : '0';
    } catch (error) {
      console.error('Error getting contratista IDs:', error);
      return '0';
    }
  };

  useEffect(() => {
    fetchExecutiveSummary();
  }, []);

  return {
    summaryData,
    loading,
    error,
    refetch: fetchExecutiveSummary
  };
};