
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDirectDriveDownload = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const downloadDocument = async (paymentId: string, documentName: string) => {
    setLoading(true);
    try {
      console.log(`🔽 Starting direct download for: ${documentName}`);

      const { data, error } = await supabase.functions.invoke('get-drive-files', {
        body: {
          paymentId: paymentId,
          documentName: documentName,
          downloadContent: true
        }
      });

      if (error) {
        console.error('❌ Error calling get-drive-files:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Error al obtener archivos del Drive');
      }

      if (!data.files || data.files.length === 0) {
        toast({
          title: "Archivo no encontrado",
          description: `No se encontró el documento: ${documentName}`,
          variant: "destructive"
        });
        return;
      }

      // Tomar el primer archivo encontrado
      const file = data.files[0];
      
      if (!file.content) {
        throw new Error('El archivo no tiene contenido disponible');
      }

      // Convertir base64 a blob y descargar
      const byteCharacters = atob(file.content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: file.mimeType });
      
      // Crear enlace de descarga
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`✅ Downloaded: ${file.name}`);
      
      toast({
        title: "Descarga completada",
        description: `Se descargó: ${file.name}`,
      });

    } catch (error) {
      console.error('❌ Error in direct download:', error);
      toast({
        title: "Error en la descarga",
        description: error.message || "No se pudo descargar el archivo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    downloadDocument,
    loading
  };
};
