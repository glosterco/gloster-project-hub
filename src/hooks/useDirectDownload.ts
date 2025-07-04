
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FileDownloadData {
  id: string;
  name: string;
  mimeType: string;
  content: string; // base64 content
  size?: string;
}

export const useDirectDownload = () => {
  const [loading, setLoading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const { toast } = useToast();

  const downloadFilesDirect = async (paymentId: string, documentNames: string[] = []) => {
    setLoading(true);
    setDownloadProgress(0);
    
    try {
      console.log('🚀 Starting direct download for payment:', paymentId);
      
      // Si no se especifican documentos, descargar todos los documentos comunes
      const defaultDocuments = documentNames.length > 0 ? documentNames : [
        'Carátula EEPP',
        'Avance Periódico', 
        'Certificado de Pago de Cotizaciones Previsionales',
        'Certificado F30',
        'Certificado F30-1',
        'Factura'
      ];

      const downloadResults: FileDownloadData[] = [];
      
      // Descargar cada tipo de documento
      for (let i = 0; i < defaultDocuments.length; i++) {
        const documentName = defaultDocuments[i];
        console.log(`📋 Downloading document: ${documentName}`);
        
        try {
          const { data, error } = await supabase.functions.invoke('get-drive-files', {
            body: {
              paymentId: paymentId,
              documentName: documentName,
              downloadContent: true // Nuevo parámetro para obtener contenido
            }
          });

          if (error) {
            console.error(`❌ Error downloading ${documentName}:`, error);
            continue;
          }

          if (data.success && data.files && data.files.length > 0) {
            // Agregar archivos descargados
            downloadResults.push(...data.files.map((file: any) => ({
              id: file.id,
              name: file.name,
              mimeType: file.mimeType,
              content: file.content,
              size: file.size
            })));
          }
        } catch (docError) {
          console.error(`❌ Error processing ${documentName}:`, docError);
        }
        
        // Actualizar progreso
        setDownloadProgress(Math.round(((i + 1) / defaultDocuments.length) * 100));
      }

      if (downloadResults.length === 0) {
        throw new Error('No se encontraron archivos para descargar');
      }

      console.log(`✅ Successfully downloaded ${downloadResults.length} files`);
      
      // Si hay múltiples archivos, crear ZIP
      if (downloadResults.length > 1) {
        await downloadAsZip(downloadResults, `Documentos_Estado_Pago_${paymentId}`);
      } else {
        // Si hay solo un archivo, descargarlo directamente
        await downloadSingleFile(downloadResults[0]);
      }

      toast({
        title: "Descarga completada",
        description: `Se descargaron ${downloadResults.length} archivo(s) exitosamente`,
      });

      return { success: true, filesCount: downloadResults.length };
    } catch (error) {
      console.error('❌ Error in direct download:', error);
      toast({
        title: "Error en la descarga",
        description: error.message || "No se pudieron descargar los archivos",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
      setDownloadProgress(0);
    }
  };

  const downloadSingleFile = async (file: FileDownloadData) => {
    try {
      // Convertir base64 a blob
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
      
      console.log(`✅ Downloaded single file: ${file.name}`);
    } catch (error) {
      console.error('❌ Error downloading single file:', error);
      throw error;
    }
  };

  const downloadAsZip = async (files: FileDownloadData[], zipName: string) => {
    try {
      // Importar JSZip dinámicamente
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      
      // Agregar archivos al ZIP
      files.forEach(file => {
        const byteCharacters = atob(file.content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        zip.file(file.name, byteArray);
      });
      
      // Generar ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Descargar ZIP
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${zipName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`✅ Downloaded ZIP file: ${zipName}.zip`);
    } catch (error) {
      console.error('❌ Error creating ZIP:', error);
      throw error;
    }
  };

  return {
    downloadFilesDirect,
    loading,
    downloadProgress
  };
};
