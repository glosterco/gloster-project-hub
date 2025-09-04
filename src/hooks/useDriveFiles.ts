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

      const allFiles: { [key: string]: string[] } = {};

      // NUEVO: Buscar TODOS los archivos del contratista (sin filtro específico)
      const allContractorFilesPromise = supabase.functions.invoke('get-drive-files', {
        body: {
          paymentId: paymentId,
          documentName: '', // Búsqueda general
          downloadContent: false
        }
      }).then(({ data }) => {
        if (data && data.success && data.files && data.files.length > 0) {
          return data.files
            .filter((file: DriveFile) => !file.name.includes('- mandante'))
            .map((file: DriveFile) => file.name);
        }
        return [];
      }).catch(() => []);

      // Buscar archivos del mandante
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

      // Ejecutar promesas en paralelo
      const [allContractorFiles, mandanteFiles] = await Promise.all([
        allContractorFilesPromise,
        mandantePromise
      ]);

      console.log('📁 All contractor files found:', allContractorFiles);

    // NUEVO: Clasificar TODOS los archivos encontrados
    allContractorFiles.forEach((fileName) => {
      let documentType = 'otros';
      const fileBaseName = fileName.replace(/\.[^/.]+$/, "").toLowerCase();
      
      if (fileName.includes('Avance del período') || fileName.includes('planilla') || fileBaseName.includes('avance')) {
        documentType = 'planilla';
      } else if (fileName.includes('Certificado de pago de cotizaciones') || fileName.includes('cotizaciones') || fileBaseName.includes('cotizacion')) {
        documentType = 'cotizaciones';
      } else if ((fileName.includes('Certificado F30') && !fileName.includes('F30-1')) || (fileBaseName.includes('f30') && !fileBaseName.includes('f30-1'))) {
        documentType = 'f30';
      } else if (fileName.includes('F30-1') || fileName.includes('F301') || fileBaseName.includes('f30-1') || fileBaseName.includes('f301')) {
        documentType = 'f30_1';
      } else if (fileName.includes('Exámenes preocupacionales') || fileName.includes('examenes') || fileBaseName.includes('examen')) {
        documentType = 'examenes';
      } else if (fileName.includes('Finiquito/Anexo Traslado') || fileName.includes('finiquito') || fileName.includes('anexo traslado') || fileBaseName.includes('finiquito')) {
        documentType = 'finiquito';
      } else if (fileName.includes('Factura') || fileName.includes('factura') || fileBaseName.includes('factura')) {
        documentType = 'factura';
      } else if (fileName.includes('Carátula EEPP') || fileName.includes('eepp') || fileBaseName.includes('eepp') || fileBaseName.includes('caratula')) {
        documentType = 'eepp';
      } else if (fileName.includes('Certificado F29') || fileBaseName.includes('certificado f29')) {
        documentType = 'f29';
      } else if (fileName.includes('Libro de remuneraciones') || fileBaseName.includes('libro de remuneraciones')) {
        documentType = 'libro_remuneraciones';
      }

      if (!allFiles[documentType]) {
        allFiles[documentType] = [];
      }
      allFiles[documentType].push(fileName);
    });

      // Agregar archivos del mandante
      if (mandanteFiles.length > 0) {
        allFiles['mandante_docs'] = mandanteFiles;
      }

      console.log('📁 All files classified:', allFiles);
      setDriveFiles(allFiles);

    } catch (error) {
      console.error('❌ Error fetching files:', error);
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
