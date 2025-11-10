import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PresupuestoHistoricoItem {
  id: number;
  Project_ID: number;
  TotalAcumulado: number;
  TotalParcial: number;
  created_at: string;
}

export const usePresupuestoHistorico = (projectIds?: number[]) => {
  const [historico, setHistorico] = useState<PresupuestoHistoricoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchHistorico = async () => {
    if (!projectIds || projectIds.length === 0) return;
    
    setLoading(true);
    
    try {
      console.log('🔎 Fetching presupuesto historico for projects:', projectIds);
      
      const { data, error } = await supabase
        .from('PresupuestoHistorico' as any)
        .select('*')
        .in('Project_ID', projectIds)
        .order('created_at', { ascending: true });
        
      if (error) {
        console.error('❌ Error fetching historico:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar el histórico del presupuesto",
          variant: "destructive",
        });
        return;
      }
      
      console.log('✅ Fetched historico:', data?.length || 0);
      setHistorico((data || []) as unknown as PresupuestoHistoricoItem[]);
    } catch (error) {
      console.error('❌ CRITICAL ERROR in fetchHistorico:', error);
      toast({
        title: "Error inesperado",
        description: "Hubo un error al cargar el histórico",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistorico();
  }, [projectIds?.join(',')]);

  return {
    historico,
    loading,
    refetch: fetchHistorico
  };
};
