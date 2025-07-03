
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
      console.log('🚀 Starting document upload to Google Drive:', { paymentId });

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
          console.log(`📋 Processing ${docType} with ${files.length} files`);
          
          // Get the actual file objects for this document type
          const realFiles = fileObjects[docType] || [];
          
          if (realFiles.length === 0) {
            console.warn(`⚠️ No file objects found for ${docType}, skipping`);
            continue;
          }

          const fileData = [];
          
          // Convert each file to base64 with error handling
          for (let i = 0; i < Math.min(realFiles.length, files.length); i++) {
            const file = realFiles[i];
            if (file && file instanceof File) {
              try {
                console.log(`🔄 Converting file ${file.name} to base64...`);
                const base64Content = await convertFileToBase64(file);
                
                if (base64Content && base64Content.trim() !== '') {
                  fileData.push({
                    name: file.name,
                    content: base64Content,
                    mimeType: file.type
                  });
                  console.log(`✅ File ${file.name} converted successfully`);
                } else {
                  console.error(`❌ Empty base64 content for file ${file.name}`);
                  throw new Error(`Error procesando archivo ${file.name}: contenido vacío`);
                }
              } catch (error) {
                console.error(`❌ Error converting file ${file.name}:`, error);
                throw new Error(`Error procesando archivo ${file.name}: ${error.message}`);
              }
            } else {
              console.error(`❌ Invalid file object at index ${i} for ${docType}`);
            }
          }

          if (fileData.length > 0) {
            documents[docType] = {
              files: fileData,
              documentName: documentNames[docType] || docType
            };
          }
        }
      }

      if (Object.keys(documents).length === 0) {
        throw new Error('No se encontraron documentos válidos para subir');
      }

      console.log(`📤 Sending ${Object.keys(documents).length} document types to upload function`);

      const { data, error } = await supabase.functions.invoke('upload-documents-to-drive', {
        body: {
          paymentId,
          documents,
        },
      });

      if (error) {
        console.error('❌ Error calling upload documents function:', error);
        throw new Error(`Error en la función de subida: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Falló la subida de documentos a Google Drive');
      }

      console.log('✅ Documents uploaded to Google Drive successfully:', data);
      
      // CORRIGIENDO: Asegurar que las URLs de Google Drive tengan el formato correcto
      if (data.driveUrl && !data.driveUrl.startsWith('https://drive.google.com/drive/u/2/folders/')) {
        const correctedUrl = `https://drive.google.com/drive/u/2/folders/${data.driveUrl.replace(/^.*\//, '')}`;
        console.log('🔧 Correcting Drive URL format:', correctedUrl);
        
        // Actualizar la URL en la base de datos con el formato correcto
        const { error: updateError } = await supabase
          .from('Estados de pago')
          .update({ URL: correctedUrl })
          .eq('id', paymentId);

        if (updateError) {
          console.error('❌ Error updating corrected URL:', updateError);
        } else {
          console.log('✅ URL format corrected in database');
        }
      }
      
      return { success: true, uploadResults: data.uploadResults };
    } catch (error) {
      console.error('❌ Error uploading documents to Google Drive:', error);
      throw error; // Re-throw para que sea manejado por el componente padre
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

// Helper function to convert File to base64 with better error handling
const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file || !(file instanceof File)) {
      reject(new Error('Archivo inválido'));
      return;
    }

    if (file.size === 0) {
      reject(new Error('El archivo está vacío'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = () => {
      try {
        const result = reader.result as string;
        if (!result) {
          reject(new Error('No se pudo leer el archivo'));
          return;
        }
        
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64Content = result.split(',')[1];
        
        if (!base64Content || base64Content.trim() === '') {
          reject(new Error('Contenido base64 vacío'));
          return;
        }
        
        resolve(base64Content);
      } catch (error) {
        reject(new Error(`Error procesando el archivo: ${error.message}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error leyendo el archivo'));
    };
    
    reader.readAsDataURL(file);
  });
};
