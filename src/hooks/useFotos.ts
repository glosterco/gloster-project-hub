import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Foto {
  id: number;
  Proyecto: number;
  created_at: string;
  DriveId?: string;
  WebViewLink?: string;
  Nombre?: string;
  MimeType?: string;
  uploaded_by_email?: string;
  uploaded_by_name?: string;
}

export const useFotos = (projectId: string) => {
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchFotos = async () => {
    if (!projectId) return;
    
    const pid = parseInt(projectId);
    if (Number.isNaN(pid)) {
      console.warn('⚠️ useFotos: projectId inválido:', projectId);
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔎 Fetching fotos for projectId:', pid);
      const { data: fotosData, error } = await supabase
        .from('Fotos' as any)
        .select('*')
        .eq('Proyecto', pid)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('❌ Error fetching fotos:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las fotos",
          variant: "destructive",
        });
        return;
      }
      
      console.log('✅ Fetched fotos:', Array.isArray(fotosData) ? fotosData.length : 0);
      setFotos((fotosData as any) || []);
    } catch (error) {
      console.error('❌ CRITICAL ERROR in fetchFotos:', error);
      toast({
        title: "Error inesperado",
        description: "Hubo un error al cargar las fotos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFotos();
  }, [projectId]);

  return {
    fotos,
    loading,
    refetch: fetchFotos
  };
};
