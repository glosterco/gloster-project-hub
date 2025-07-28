import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MandanteFolder {
  id: string;
  folder_name: string;
  project_ids: number[];
  created_at: string;
  updated_at: string;
}

export const useMandanteFolders = (mandanteId: number | null) => {
  const [folders, setFolders] = useState<MandanteFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (mandanteId) {
      fetchFolders();
    }
  }, [mandanteId]);

  const fetchFolders = async () => {
    if (!mandanteId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('mandante_project_folders')
        .select('*')
        .eq('mandante_id', mandanteId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setFolders(data || []);
    } catch (error) {
      console.error('Error fetching folders:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las carpetas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createFolder = async (folderName: string, projectIds: number[] = []) => {
    if (!mandanteId) return;

    try {
      const { data, error } = await supabase
        .from('mandante_project_folders')
        .insert({
          mandante_id: mandanteId,
          folder_name: folderName,
          project_ids: projectIds
        })
        .select()
        .single();

      if (error) throw error;

      setFolders(prev => [data, ...prev]);
      toast({
        title: "Carpeta creada",
        description: `Se creó la carpeta "${folderName}" exitosamente`,
      });

      return data;
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la carpeta",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateFolder = async (folderId: string, updates: { folder_name?: string; project_ids?: number[] }) => {
    try {
      const { data, error } = await supabase
        .from('mandante_project_folders')
        .update(updates)
        .eq('id', folderId)
        .select()
        .single();

      if (error) throw error;

      setFolders(prev => prev.map(folder => 
        folder.id === folderId ? data : folder
      ));

      toast({
        title: "Carpeta actualizada",
        description: "Los cambios se guardaron exitosamente",
      });

      return data;
    } catch (error) {
      console.error('Error updating folder:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la carpeta",
        variant: "destructive"
      });
      throw error;
    }
  };

  const deleteFolder = async (folderId: string) => {
    try {
      const { error } = await supabase
        .from('mandante_project_folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;

      setFolders(prev => prev.filter(folder => folder.id !== folderId));
      toast({
        title: "Carpeta eliminada",
        description: "La carpeta se eliminó exitosamente",
      });
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la carpeta",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    folders,
    loading,
    createFolder,
    updateFolder,
    deleteFolder,
    refetch: fetchFolders
  };
};