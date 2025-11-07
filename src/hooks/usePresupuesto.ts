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

export interface ControlData {
  total: number;
  acumulado: number;
  actual: number;
}

export const usePresupuesto = (projectId: string) => {
  const [presupuesto, setPresupuesto] = useState<Presupuesto[]>([]);
  const [anticipos, setAnticipos] = useState<ControlData>({ total: 0, acumulado: 0, actual: 0 });
  const [retenciones, setRetenciones] = useState<ControlData>({ total: 0, acumulado: 0, actual: 0 });
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
      
      // Separar datos regulares de controles
      const regularItems: any[] = [];
      let anticiposData: ControlData = { total: 0, acumulado: 0, actual: 0 };
      let retencionesData: ControlData = { total: 0, acumulado: 0, actual: 0 };
      
      presupuestoData?.forEach((item: any) => {
        if (item.Item === 'Control de Anticipos') {
          anticiposData = {
            total: item.Total || 0,
            acumulado: item['Avance Acumulado'] || 0,
            actual: item['Avance Parcial'] || 0
          };
        } else if (item.Item === 'Control de Retenciones') {
          retencionesData = {
            total: item.Total || 0,
            acumulado: item['Avance Acumulado'] || 0,
            actual: item['Avance Parcial'] || 0
          };
        } else {
          regularItems.push(item);
        }
      });
      
      setPresupuesto(regularItems);
      setAnticipos(anticiposData);
      setRetenciones(retencionesData);
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
    anticipos,
    retenciones,
    loading,
    refetch: fetchPresupuesto
  };
};
