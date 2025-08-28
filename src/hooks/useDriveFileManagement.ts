import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDriveFileManagement = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const deleteFileFromDrive = async (paymentId: string, fileName: string): Promise<boolean> => {
    setLoading(true);
    try {
      console.log(`🗑️ Deleting file "${fileName}" from Drive for payment ${paymentId}`);

      const { data, error } = await supabase.functions.invoke('delete-drive-file', {
        body: {
          paymentId,
          fileName,
        },
      });

      if (error) {
        console.error('❌ Error calling delete function:', error);
        throw error;
      }

      if (!data.success) {
        if (data.warning) {
          console.warn(`⚠️ File not found: ${data.error}`);
          toast({
            title: "Archivo no encontrado",
            description: "El archivo ya fue eliminado o no existe en Google Drive",
            variant: "default",
          });
          return true; // Tratamos como éxito si el archivo ya no existe
        }
        throw new Error(data.error || 'Failed to delete file');
      }

      console.log(`✅ File deleted successfully:`, data);
      
      toast({
        title: "Archivo eliminado",
        description: `El archivo "${fileName}" ha sido eliminado de Google Drive`,
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error deleting file from Drive:', error);
      
      let errorMessage = "Error al eliminar archivo";
      let errorDetails = error.message;
      
      if (error.message?.includes('Google Drive authentication failed')) {
        errorMessage = "Error de autenticación con Google Drive";
        errorDetails = "No se pudo autenticar con Google Drive. Contacte al administrador.";
      }
      
      toast({
        title: errorMessage,
        description: errorDetails,
        variant: "destructive",
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteFileFromDrive,
    loading,
  };
};