import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Presupuesto {
  id: number;
  Project_ID: number;
  Item: string | null;
  Cantidad: number | null;
  Unidad: string | null;
  PU: number | null;
  Total: number | null;
  'Avance Parcial': number | null;
  'Avance Acumulado': number | null;
  'Ult. Actualizacion': string | null;
  created_at: string;
}

export const usePresupuesto = (projectId: string) => {
  const [presupuesto, setPresupuesto] = useState<Presupuesto[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchPresupuesto = async () => {
    if (!projectId) return;
    
    const pid = parseInt(projectId);
    if (Number.isNaN(pid)) {
      console.warn('⚠️ usePresupuesto: projectId inválido:', projectId);
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔎 Fetching presupuesto for projectId:', pid);
      const { data: presupuestoData, error } = await supabase
        .from('Presupuesto' as any)
        .select('*')
        .eq('Project_ID', pid)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('❌ Error fetching presupuesto:', error);
        toast({
          title: "Error",
          description: "No se pudo cargar el presupuesto",
          variant: "destructive",
        });
        return;
      }
      
      console.log('✅ Fetched presupuesto:', Array.isArray(presupuestoData) ? presupuestoData.length : 0);
      setPresupuesto((presupuestoData as any) || []);
    } catch (error) {
      console.error('❌ CRITICAL ERROR in fetchPresupuesto:', error);
      toast({
        title: "Error inesperado",
        description: "Hubo un error al cargar el presupuesto",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresupuesto();
  }, [projectId]);

  return {
    presupuesto,
    loading,
    refetch: fetchPresupuesto
  };
};
