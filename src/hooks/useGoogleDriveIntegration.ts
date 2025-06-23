
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useGoogleDriveIntegration = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
      return { success: true, folderId: data.folderId, folderName: data.folderName, fullUrl: data.fullUrl };
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
      return { success: true, folderId: data.folderId, folderName: data.folderName, fullUrl: data.fullUrl };
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

  const uploadDocumentsToDrive = async (paymentId: number, uploadedFiles: any, documentStatus: any) => {
    setLoading(true);
    try {
      console.log('Uploading documents to Google Drive:', { paymentId, uploadedFiles, documentStatus });

      // Document name mapping
      const documentNames = {
        eepp: 'Carátula EEPP',
        planilla: 'Avance Periódico',
        cotizaciones: 'Certificado de Pago de Cotizaciones Previsionales',
        f30: 'Certificado F30',
        f30_1: 'Certificado F30-1',
        examenes: 'Exámenes Preocupacionales',
        finiquito: 'Finiquitos',
        factura: 'Factura'
      };

      // Prepare documents data
      const documents = {};
      
      // Convert file objects to the format expected by the edge function
      for (const [docType, files] of Object.entries(uploadedFiles)) {
        if (documentStatus[docType] && files && files.length > 0) {
          // For this implementation, we'll simulate the file content
          // In a real implementation, you would need to store the actual file content
          const fileData = files.map((fileName, index) => ({
            name: fileName,
            content: '', // This would need to be the actual base64 encoded file content
            mimeType: 'application/pdf' // This would need to be determined from the actual file
          }));

          documents[docType] = {
            files: fileData,
            documentName: documentNames[docType] || docType
          };
        }
      }

      if (Object.keys(documents).length === 0) {
        throw new Error('No documents to upload');
      }

      const { data, error } = await supabase.functions.invoke('upload-documents-to-drive', {
        body: {
          paymentId,
          documents,
        },
      });

      if (error) {
        console.error('Error calling upload documents function:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to upload documents to Google Drive');
      }

      console.log('✅ Documents uploaded to Google Drive:', data);
      
      toast({
        title: "Documentos subidos exitosamente",
        description: `Se subieron ${data.uploadResults.length} archivos a Google Drive`,
      });

      return { success: true, uploadResults: data.uploadResults };
    } catch (error) {
      console.error('Error uploading documents to Google Drive:', error);
      toast({
        title: "Error al subir documentos",
        description: "No se pudieron subir los documentos a Google Drive",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    createProjectFolder,
    createPaymentStateFolder,
    uploadDocumentsToDrive,
    loading,
  };
};
