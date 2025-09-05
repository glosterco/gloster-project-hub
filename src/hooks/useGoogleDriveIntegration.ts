
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useGoogleDriveIntegration = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createProjectFolder = async (projectId: number, projectName: string) => {
    setLoading(true);
    try {
      console.log('Creating folder for project:', { projectId, projectName });

      const { data, error } = await supabase.functions.invoke('google-drive-integration', {
        body: {
          type: 'project',
          projectId,
          projectName,
        },
      });

      if (error) {
        console.error('Error calling function:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create folder');
      }

      console.log('✅ Project folder created:', data);
      return { success: true, folderId: data.folderId, folderName: data.folderName, fullUrl: data.fullUrl };
    } catch (error) {
      console.error('Error creating project folder:', error);
      
      let errorMessage = "Error al crear carpeta de respaldo";
      let errorDetails = "No se pudo crear la carpeta del proyecto";
      
      if (error.message?.includes('Google Drive authentication failed')) {
        errorMessage = "Error de autenticación";
        errorDetails = "No se pudo autenticar. Contacte al administrador.";
      }
      
      toast({
        title: errorMessage,
        description: errorDetails,
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
      console.log('Creating folder for payment state:', { 
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
        console.error('Error calling function:', error);
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to create folder');
      }

      console.log('✅ Payment state folder created:', data);
      return { success: true, folderId: data.folderId, folderName: data.folderName, fullUrl: data.fullUrl };
    } catch (error) {
      console.error('Error creating payment state folder:', error);
      
      let errorMessage = "Error al crear carpeta de respaldo";
      let errorDetails = "No se pudo crear la carpeta del estado de pago";
      
      if (error.message?.includes('authentication failed')) {
        errorMessage = "Error de autenticación con";
        errorDetails = "No se pudo autenticar. Contacte al administrador.";
      }
      
      toast({
        title: errorMessage,
        description: errorDetails,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const uploadDocumentsToDrive = async (paymentId: number, uploadedFiles: any, documentStatus: any, fileObjects: {[key: string]: File[]}, projectRequirements: string[] = []) => {
    setLoading(true);
    try {
      console.log('🚀 Starting document upload:', { paymentId });

      // Document name mapping for predefined documents
      const documentNames = {
        eepp: 'Carátula EEPP',
        planilla: 'Avance del período',
        comprobante_cotizaciones: 'Comprobante de pago de cotizaciones',
        cotizaciones: 'Certificado de pago de cotizaciones',
        f30: 'Certificado F30',
        f30_1: 'Certificado F30-1',
        f29: 'Certificado F29',
        libro_remuneraciones: 'Libro de remuneraciones',
        examenes: 'Exámenes Preocupacionales',
        finiquito: 'Finiquito/Anexo Traslado',
        factura: 'Factura'
      };

      // Create dynamic mapping for "other" documents based on project requirements
      const predefinedNames = Object.values(documentNames);
      const otherRequirements = projectRequirements.filter(req => 
        !predefinedNames.includes(req) && req.trim() && req !== 'Avance del período'
      );
      
      console.log('📋 Predefined document names:', predefinedNames);
      console.log('📋 Other requirements found:', otherRequirements);
      
      // Add dynamic mappings for other documents - ensure exact matching with component IDs
      // IMPORTANT: Sort otherRequirements to ensure consistent mapping with PaymentDetail.tsx
      const sortedOtherRequirements = otherRequirements.sort();
      sortedOtherRequirements.forEach((req, index) => {
        const otherId = `other_${index}`;
        documentNames[otherId] = req;
        console.log(`📋 Mapped ${otherId} -> "${req}"`);
      });

      console.log('📋 Final document name mappings:', documentNames);

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
                // Check file size before converting (limit to 5MB)
                const fileSizeMB = file.size / (1024 * 1024);
                if (fileSizeMB > 5) {
                  throw new Error(`Archivo ${file.name} es demasiado grande (${fileSizeMB.toFixed(2)}MB). Tamaño máximo permitido: 5MB`);
                }
                
                console.log(`🔄 Converting file ${file.name} (${fileSizeMB.toFixed(2)}MB) to base64...`);
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
        throw new Error(data.error || 'Falló la subida de documentos');
      }

      console.log('✅ Documents uploaded successfully:', data);
      
      // CORRIGIENDO: Asegurar que las URLs de Google Drive tengan el formato correcto
      if (data.driveUrl && !data.driveUrl.startsWith('https://drive.google.com/drive/u/2/folders/')) {
        const correctedUrl = `https://drive.google.com/drive/u/2/folders/${data.driveUrl.replace(/^.*\//, '')}`;
        console.log('🔧 Correcting URL format:', correctedUrl);
        
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
        console.error('❌ Error uploading documents:', error);
        
        // Provide more specific error messages based on the error type
        let errorMessage = "No se pudo subir los documentos";
        let errorDetails = error.message;
        
        if (error.message?.includes('authentication failed')) {
          errorMessage = "Error de autenticación con";
          errorDetails = "Los tokens de acceso han expirado. Por favor, contacte al administrador para renovar la conexión con Google Drive.";
        } else if (error.message?.includes('TOKEN_REFRESH_FAILED')) {
          errorMessage = "Error de conexión con Google Drive";
          errorDetails = "Es necesario renovar la autenticación con Google Drive. Contacte al administrador del sistema.";
        } else if (error.message?.includes('REFRESH_TOKEN_EXPIRED')) {
          errorMessage = "Autenticación con Google Drive expirada";
          errorDetails = "La autorización para acceder a Google Drive ha expirado. Es necesario re-autorizar la aplicación.";
        }
        
        toast({
          title: errorMessage,
          description: errorDetails,
          variant: "destructive",
        });
        
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

    // Check file size (limit to 5MB for frontend processing)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 5) {
      reject(new Error(`Archivo demasiado grande (${fileSizeMB.toFixed(2)}MB). Máximo permitido: 5MB`));
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
