import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RFI {
  id: number;
  Proyecto: number | null;
  Titulo: string | null;
  Descripcion: string | null;
  Status: string | null;
  Respuesta: string | null;
  Fecha_Respuesta: string | null;
  URL: string | null;
  Urgencia: string | null;
  Fecha_Vencimiento: string | null;
  created_at: string;
  Correlativo: number | null;
}

export const useRFI = (projectId: string) => {
  const [rfis, setRfis] = useState<RFI[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchRFIs = async () => {
    if (!projectId) return;
    
    const pid = parseInt(projectId);
    if (Number.isNaN(pid)) {
      console.warn('⚠️ useRFI: projectId inválido:', projectId);
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔎 Fetching RFIs for projectId:', pid);
      const { data: rfiData, error } = await supabase
        .from('RFI' as any)
        .select('*')
        .eq('Proyecto', pid)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('❌ Error fetching RFIs:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los RFI",
          variant: "destructive",
        });
        return;
      }
      
      console.log('✅ Fetched RFIs:', Array.isArray(rfiData) ? rfiData.length : 0);
      setRfis((rfiData as any) || []);
    } catch (error) {
      console.error('❌ CRITICAL ERROR in fetchRFIs:', error);
      toast({
        title: "Error inesperado",
        description: "Hubo un error al cargar los RFI",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRFIs();
  }, [projectId]);

  return {
    rfis,
    loading,
    refetch: fetchRFIs
  };
};
