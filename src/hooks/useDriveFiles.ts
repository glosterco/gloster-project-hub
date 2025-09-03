import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  downloadUrl?: string;
  viewUrl?: string;
}

export const useDriveFiles = (paymentId: string | null, enabled: boolean = true) => {
  const [driveFiles, setDriveFiles] = useState<{ [key: string]: string[] }>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDriveFiles = async () => {
    if (!paymentId || !enabled) return;

    setLoading(true);
    try {
      console.log('🔍 Fetching drive files for payment:', paymentId);

      // Para obtener todos los archivos, buscaremos archivos con nombres conocidos
      const documentTypes = [
        'Avance del período',
        'Certificado de pago de cotizaciones', 
        'Certificado F30',
        'Certificado F30-1',
        'Certificado F29',
        'Exámenes preocupacionales',
        'Finiquito/Anexo Traslado',
        'Factura',
        'Carátula EEPP'
      ];

      const allFiles: { [key: string]: string[] } = {};

      // Crear todas las promesas en paralelo para mayor eficiencia
      const documentPromises = documentTypes.map(async (docType) => {
        try {
          const { data } = await supabase.functions.invoke('get-drive-files', {
            body: {
              paymentId: paymentId,
              documentName: docType,
              downloadContent: false
            }
          });

          if (data && data.success && data.files && data.files.length > 0) {
            return data.files.map((file: DriveFile) => ({
              fileName: file.name,
              docType
            }));
          }
        } catch (docError) {
          console.warn(`No files found for ${docType}:`, docError);
        }
        return [];
      });

      // Buscar archivos del mandante en paralelo
      const mandantePromise = supabase.functions.invoke('get-drive-files', {
        body: {
          paymentId: paymentId,
          documentName: '- mandante',
          downloadContent: false
        }
      }).then(({ data }) => {
        if (data && data.success && data.files && data.files.length > 0) {
          return data.files
            .filter((file: DriveFile) => file.name.includes('- mandante'))
            .map((file: DriveFile) => file.name);
        }
        return [];
      }).catch(() => []);

      // Ejecutar todas las promesas en paralelo
      const [documentResults, mandanteFiles] = await Promise.all([
        Promise.all(documentPromises),
        mandantePromise
      ]);

      // Procesar resultados de documentos
      documentResults.flat().forEach(({ fileName, docType }) => {
        let documentType = 'otros';
        
        if (fileName.includes('Avance del período') || fileName.includes('planilla')) {
          documentType = 'planilla';
        } else if (fileName.includes('Certificado de pago de cotizaciones') || fileName.includes('cotizaciones')) {
          documentType = 'cotizaciones';
        } else if (fileName.includes('Certificado F30') && !fileName.includes('F30-1')) {
          documentType = 'f30';
        } else if (fileName.includes('F30-1') || fileName.includes('F301')) {
          documentType = 'f30_1';
        } else if (fileName.includes('Exámenes preocupacionales') || fileName.includes('examenes')) {
          documentType = 'examenes';
        } else if (fileName.includes('Finiquito/Anexo Traslado') || fileName.includes('finiquito') || fileName.includes('anexo traslado')) {
          documentType = 'finiquito';
        } else if (fileName.includes('Factura') || fileName.includes('factura')) {
          documentType = 'factura';
        } else if (fileName.includes('Carátula EEPP') || fileName.includes('eepp')) {
          documentType = 'eepp';
        }

        if (!allFiles[documentType]) {
          allFiles[documentType] = [];
        }
        allFiles[documentType].push(fileName);
      });

      // Agregar archivos del mandante si existen
      if (mandanteFiles.length > 0) {
        allFiles['mandante_docs'] = mandanteFiles;
      }

      console.log('📁 All drive files found:', allFiles);
      setDriveFiles(allFiles);

    } catch (error) {
      console.error('❌ Error fetching drive files:', error);
      // No mostrar toast error aquí ya que puede ser normal que no haya archivos
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriveFiles();
  }, [paymentId, enabled]);

  return {
    driveFiles,
    loading,
    refetch: fetchDriveFiles
  };
};