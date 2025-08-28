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
        'Exámenes preocupacionales',
        'Finiquitos',
        'Factura',
        'Carátula EEPP'
      ];

      const allFiles: { [key: string]: string[] } = {};

      // Obtener archivos por cada tipo de documento
      for (const docType of documentTypes) {
        try {
          const { data, error } = await supabase.functions.invoke('get-drive-files', {
            body: {
              paymentId: paymentId,
              documentName: docType,
              downloadContent: false
            }
          });

          if (data && data.success && data.files && data.files.length > 0) {
            data.files.forEach((file: DriveFile) => {
              const fileName = file.name;
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
              } else if (fileName.includes('Finiquitos') || fileName.includes('finiquito')) {
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
          }
        } catch (docError) {
          console.warn(`No files found for ${docType}:`, docError);
          // Continuar con el siguiente tipo de documento
        }
      }

      // Buscar específicamente archivos del mandante (que terminan en "- mandante")
      try {
        const { data, error } = await supabase.functions.invoke('get-drive-files', {
          body: {
            paymentId: paymentId,
            documentName: '- mandante', // Buscar archivos que contengan "- mandante"
            downloadContent: false
          }
        });

        if (data && data.success && data.files && data.files.length > 0) {
          const mandanteFiles = data.files
            .filter((file: DriveFile) => file.name.includes('- mandante'))
            .map((file: DriveFile) => file.name);
          
          if (mandanteFiles.length > 0) {
            allFiles['mandante_docs'] = mandanteFiles;
          }
        }
      } catch (mandanteError) {
        console.warn('No mandante files found:', mandanteError);
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