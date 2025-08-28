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

      console.log('🔍 Fetching CC executive summary with accessData:', accessData);

      // Usar edge function para obtener datos con permisos de servicio
      const { data, error } = await supabase.functions.invoke('get-executive-summary-cc', {
        body: {
          contractorId: accessData.contractorId,
          paymentId: accessData.paymentId
        }
      });

      if (error) {
        console.error('Error calling edge function:', error);
        throw new Error(error.message || 'Error al obtener resumen ejecutivo');
      }

      console.log('✅ CC executive summary data received:', data);
      setSummaryData(data);

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