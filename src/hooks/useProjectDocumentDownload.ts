import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useProjectDocumentDownload = () => {
  const [loadingDocuments, setLoadingDocuments] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const downloadDocument = async (driveId: string, fileName: string) => {
    setLoadingDocuments(prev => ({ ...prev, [fileName]: true }));
    
    try {
      console.log(`📥 Starting download for: ${fileName} (Drive ID: ${driveId})`);
      
      const { data, error } = await supabase.functions.invoke('download-project-document', {
        body: {
          driveId: driveId,
          fileName: fileName
        }
      });

      if (error) {
        throw new Error(`Error fetching file: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Error desconocido al descargar archivo');
      }

      if (!data.content) {
        throw new Error('El archivo no tiene contenido disponible');
      }

      // Convert base64 to blob
      const byteCharacters = atob(data.content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.mimeType });
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`✅ Downloaded: ${fileName}`);
      
      toast({
        title: "Descarga completada",
        description: `Se ha descargado ${fileName}`,
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Error downloading document:', error);
      toast({
        title: "Error en la descarga",
        description: error.message || "No se pudo descargar el archivo",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setLoadingDocuments(prev => ({ ...prev, [fileName]: false }));
    }
  };

  const isDocumentLoading = (fileName: string) => {
    return loadingDocuments[fileName] || false;
  };

  return {
    downloadDocument,
    isDocumentLoading,
    loading: Object.values(loadingDocuments).some(Boolean)
  };
};
