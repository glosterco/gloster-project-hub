
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

  const uploadDocumentsToDrive = async (paymentId: number, uploadedFiles: any, documentStatus: any, fileObjects: {[key: string]: File[]}) => {
    setLoading(true);
    try {
      console.log('Uploading documents to Google Drive:', { paymentId, uploadedFiles, documentStatus, fileObjects });

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

      // Prepare documents data with real file content
      const documents = {};
      
      // Process each document type
      for (const [docType, files] of Object.entries(uploadedFiles)) {
        if (documentStatus[docType] && files && Array.isArray(files) && files.length > 0) {
          console.log(`Processing ${docType} with ${files.length} files`);
          
          // Get the actual file objects for this document type
          const realFiles = fileObjects[docType] || [];
          
          if (realFiles.length === 0) {
            console.warn(`No file objects found for ${docType}, skipping`);
            continue;
          }

          const fileData = [];
          
          // Convert each file to base64
          for (let i = 0; i < realFiles.length; i++) {
            const file = realFiles[i];
            try {
              const base64Content = await convertFileToBase64(file);
              fileData.push({
                name: file.name,
                content: base64Content,
                mimeType: file.type
              });
              console.log(`✅ File ${file.name} converted to base64 successfully`);
            } catch (error) {
              console.error(`❌ Error converting file ${file.name} to base64:`, error);
              throw new Error(`Error procesando archivo ${file.name}`);
            }
          }

          documents[docType] = {
            files: fileData,
            documentName: documentNames[docType] || docType
          };
        }
      }

      if (Object.keys(documents).length === 0) {
        throw new Error('No documents to upload - no valid files found');
      }

      console.log('📤 Sending documents to upload function:', Object.keys(documents));

      const { data, error } = await supabase.functions.invoke('upload-documents-to-drive', {
        body: {
          paymentId,
          documents,
        },
      });

      if (error) {
        console.error('❌ Error calling upload documents function:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to upload documents to Google Drive');
      }

      console.log('✅ Documents uploaded to Google Drive successfully:', data);
      
      toast({
        title: "Documentos subidos exitosamente",
        description: `Se subieron ${data.uploadResults.length} archivos a Google Drive`,
      });

      return { success: true, uploadResults: data.uploadResults };
    } catch (error) {
      console.error('❌ Error uploading documents to Google Drive:', error);
      toast({
        title: "Error al subir documentos",
        description: `No se pudieron subir los documentos: ${error.message}`,
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

// Helper function to convert File to base64
const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      try {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64Content = result.split(',')[1];
        resolve(base64Content);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
  });
};
