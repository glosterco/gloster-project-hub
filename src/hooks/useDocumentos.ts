import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Documento {
  id: number;
  Proyecto: number;
  Tipo: string | null;
  Nombre: string | null;
  Size: number | null;
  Extension: string | null;
  MimeType: string | null;
  DriveId: string | null;
  WebViewLink: string | null;
  created_at: string;
}

export const useDocumentos = (projectId: string) => {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDocumentos = async () => {
    if (!projectId) return;
    
    const pid = parseInt(projectId);
    if (Number.isNaN(pid)) {
      console.warn('⚠️ useDocumentos: projectId inválido:', projectId);
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔎 Fetching documentos for projectId:', pid);
      const { data: documentosData, error } = await supabase
        .from('Documentos' as any)
        .select('*')
        .eq('Proyecto', pid)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('❌ Error fetching documentos:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los documentos",
          variant: "destructive",
        });
        return;
      }
      
      console.log('✅ Fetched documentos:', Array.isArray(documentosData) ? documentosData.length : 0);
      setDocumentos((documentosData as any) || []);
    } catch (error) {
      console.error('❌ CRITICAL ERROR in fetchDocumentos:', error);
      toast({
        title: "Error inesperado",
        description: "Hubo un error al cargar los documentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentos();
  }, [projectId]);

  return {
    documentos,
    loading,
    refetch: fetchDocumentos
  };
};
