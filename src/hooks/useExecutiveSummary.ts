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
  expiryDate: string;
}

export interface StatusSummary {
  status: string;
  count: number;
  totalAmount: number;
}

export interface ExecutiveSummaryData {
  totalProjects: number;
  totalValue: number;
  pendingPayments: number;
  approvedPayments: number;
  recentPayments: PaymentSummary[];
  statusSummary: StatusSummary[];
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

      // Fetch projects with related data
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
        .or(`
          Owner.in.(${await getUserMandanteIds(user.id)}),
          Contratista.in.(${await getUserContratistaIds(user.id)})
        `);

      if (projectsError) {
        throw projectsError;
      }

      if (!projects || projects.length === 0) {
        setSummaryData({
          totalProjects: 0,
          totalValue: 0,
          pendingPayments: 0,
          approvedPayments: 0,
          recentPayments: [],
          statusSummary: []
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
          ExpiryDate,
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
      
      const pendingPayments = payments?.filter(p => p.Status === 'Pendiente').length || 0;
      const approvedPayments = payments?.filter(p => p.Status === 'Aprobado').length || 0;

      // Get last 3 payments per project (excluding Programado)
      const recentPaymentsByProject = projectIds.map(projectId => {
        const projectPayments = payments?.filter(p => p.Project === projectId) || [];
        return projectPayments.slice(0, 3); // Get last 3 for each project
      }).flat().slice(0, 15); // Limit total to 15 most recent

      const recentPayments: PaymentSummary[] = recentPaymentsByProject.map(payment => ({
        id: payment.id,
        paymentName: payment.Name,
        projectName: payment.Proyectos?.Name || 'Proyecto sin nombre',
        contractorName: payment.Proyectos?.Contratistas?.ContactName || 
                      payment.Proyectos?.Contratistas?.CompanyName || 'Contratista no identificado',
        amount: payment.Total || 0,
        currency: payment.Proyectos?.Currency || 'CLP',
        status: payment.Status || 'Sin estado',
        expiryDate: payment.ExpiryDate || ''
      }));

      // Calculate status summary
      const statusGroups = payments?.reduce((acc, payment) => {
        const status = payment.Status || 'Sin estado';
        if (!acc[status]) {
          acc[status] = { count: 0, totalAmount: 0 };
        }
        acc[status].count++;
        acc[status].totalAmount += payment.Total || 0;
        return acc;
      }, {} as Record<string, { count: number; totalAmount: number }>) || {};

      const statusSummary: StatusSummary[] = Object.entries(statusGroups).map(([status, data]) => ({
        status,
        count: data.count,
        totalAmount: data.totalAmount
      }));

      setSummaryData({
        totalProjects,
        totalValue,
        pendingPayments,
        approvedPayments,
        recentPayments,
        statusSummary
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
    const { data } = await supabase
      .from('Mandantes')
      .select('id')
      .eq('auth_user_id', userId);
    
    const { data: userRoles } = await supabase
      .from('mandante_users')
      .select('mandante_id')
      .eq('auth_user_id', userId);

    const mandanteIds = [
      ...(data?.map(m => m.id) || []),
      ...(userRoles?.map(ur => ur.mandante_id) || [])
    ];

    return mandanteIds.length > 0 ? mandanteIds.join(',') : '0';
  };

  const getUserContratistaIds = async (userId: string): Promise<string> => {
    const { data } = await supabase
      .from('Contratistas')
      .select('id')
      .eq('auth_user_id', userId);
    
    const { data: userRoles } = await supabase
      .from('contratista_users')
      .select('contratista_id')
      .eq('auth_user_id', userId);

    const contratistaIds = [
      ...(data?.map(c => c.id) || []),
      ...(userRoles?.map(ur => ur.contratista_id) || [])
    ];

    return contratistaIds.length > 0 ? contratistaIds.join(',') : '0';
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