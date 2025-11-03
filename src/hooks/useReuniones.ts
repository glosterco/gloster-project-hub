import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Reunion {
  id: number;
  created_at: string;
}

export const useReuniones = (projectId: string) => {
  const [reuniones, setReuniones] = useState<Reunion[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchReuniones = async () => {
    if (!projectId) return;
    
    const pid = parseInt(projectId);
    if (Number.isNaN(pid)) {
      console.warn('⚠️ useReuniones: projectId inválido:', projectId);
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔎 Fetching reuniones for projectId:', pid);
      const { data: reunionesData, error } = await supabase
        .from('Reuniones' as any)
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('❌ Error fetching reuniones:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las reuniones",
          variant: "destructive",
        });
        return;
      }
      
      console.log('✅ Fetched reuniones:', Array.isArray(reunionesData) ? reunionesData.length : 0);
      setReuniones((reunionesData as any) || []);
    } catch (error) {
      console.error('❌ CRITICAL ERROR in fetchReuniones:', error);
      toast({
        title: "Error inesperado",
        description: "Hubo un error al cargar las reuniones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReuniones();
  }, [projectId]);

  return {
    reuniones,
    loading,
    refetch: fetchReuniones
  };
};
