
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useGoogleDriveIntegration = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createProjectWithPaymentFolders = async (
    projectId: number, 
    projectName: string, 
    paymentStates: Array<{
      id: number;
      Name: string;
      Mes: string;
      Año: number;
    }>
  ) => {
    setLoading(true);
    try {
      console.log('🚀 Creando carpetas completas para proyecto:', { projectId, projectName, paymentStates });

      const { data, error } = await supabase.functions.invoke('google-drive-integration', {
        body: {
          type: 'create_project_with_payment_folders',
          projectId,
          projectName,
          paymentStates,
        },
      });

      if (error) {
        console.error('❌ Error llamando función de Google Drive:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create Google Drive folders');
      }

      console.log('✅ Carpetas de Google Drive creadas exitosamente:', data);
      return { 
        success: true, 
        projectFolderId: data.projectFolderId,
        projectFolderName: data.projectFolderName,
        paymentFolders: data.paymentFolders
      };
    } catch (error) {
      console.error('💥 Error creando carpetas de Google Drive:', error);
      toast({
        title: "Error al crear carpetas en Google Drive",
        description: "No se pudieron crear las carpetas del proyecto en Google Drive",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const createProjectFolder = async (projectId: number, projectName: string) => {
    setLoading(true);
    try {
      console.log('Creating Google Drive folder for project:', { projectId, projectName });

      const { data, error } = await supabase.functions.invoke('google-drive-integration', {
        body: {
          type: 'project',
          projectId,
          projectName,
        },
      });

      if (error) {
        console.error('Error calling Google Drive function:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create Google Drive folder');
      }

      console.log('✅ Google Drive project folder created:', data);
      return { success: true, folderId: data.folderId, folderName: data.folderName };
    } catch (error) {
      console.error('Error creating Google Drive project folder:', error);
      toast({
        title: "Error al crear carpeta en Google Drive",
        description: "No se pudo crear la carpeta del proyecto en Google Drive",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const createPaymentStateFolder = async (
    paymentStateName: string,
    month: string,
    year: number,
    parentFolderId: string
  ) => {
    setLoading(true);
    try {
      console.log('Creating Google Drive folder for payment state:', { 
        paymentStateName, 
        month, 
        year, 
        parentFolderId 
      });

      const { data, error } = await supabase.functions.invoke('google-drive-integration', {
        body: {
          type: 'payment_state',
          paymentStateName,
          month,
          year,
          parentFolderId,
        },
      });

      if (error) {
        console.error('Error calling Google Drive function:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create Google Drive folder');
      }

      console.log('✅ Google Drive payment state folder created:', data);
      return { success: true, folderId: data.folderId, folderName: data.folderName };
    } catch (error) {
      console.error('Error creating Google Drive payment state folder:', error);
      toast({
        title: "Error al crear carpeta en Google Drive",
        description: "No se pudo crear la carpeta del estado de pago en Google Drive",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    createProjectWithPaymentFolders,
    createProjectFolder,
    createPaymentStateFolder,
    loading,
  };
};
