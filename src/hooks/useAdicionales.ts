import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Adicional {
  id: number;
  Status: string;
  Proyecto: number;
  Categoria: string | null;
  Especialidad: string | null;
  Titulo: string | null;
  Descripcion: string | null;
  Monto_presentado: number | null;
  Monto_aprobado: number | null;
  Vencimiento: string | null;
  GG: number | null;
  URL: string | null;
  created_at: string;
  approved_by_email: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  rejection_notes: string | null;
  Correlativo: number | null;
}

export const useAdicionales = (projectId: string) => {
  const [adicionales, setAdicionales] = useState<Adicional[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAdicionales = async () => {
    if (!projectId) return;
    
    const pid = parseInt(projectId);
    if (Number.isNaN(pid)) {
      console.warn('⚠️ useAdicionales: projectId inválido:', projectId);
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔎 Fetching adicionales for projectId:', pid);
      const { data: adicionalesData, error } = await supabase
        .from('Adicionales' as any)
        .select('*')
        .eq('Proyecto', pid)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('❌ Error fetching adicionales:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los adicionales",
          variant: "destructive",
        });
        return;
      }
      
      console.log('✅ Fetched adicionales:', Array.isArray(adicionalesData) ? adicionalesData.length : 0);
      setAdicionales((adicionalesData as any) || []);
    } catch (error) {
      console.error('❌ CRITICAL ERROR in fetchAdicionales:', error);
      toast({
        title: "Error inesperado",
        description: "Hubo un error al cargar los adicionales",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdicionales();
  }, [projectId]);

  return {
    adicionales,
    loading,
    refetch: fetchAdicionales
  };
};