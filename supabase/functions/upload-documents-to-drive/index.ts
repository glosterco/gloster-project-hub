
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Document catalog constants (shared with frontend)
const DOCUMENT_CATALOG = [
  { id: 'examenes', name: 'Exámenes Preocupacionales', keywords: ['examen', 'preocupacional', 'medico', 'salud'] },
  { id: 'finiquito', name: 'Finiquito/Anexo Traslado', keywords: ['finiquito', 'anexo', 'traslado', 'liquidacion'] },
  { id: 'f29', name: 'Certificado F29', keywords: ['f29', 'formulario 29'] },
  { id: 'libro_remuneraciones', name: 'Libro de remuneraciones', keywords: ['libro', 'remuneracion', 'sueldo'] },
  { id: 'eepp', name: 'Carátula EEPP', keywords: ['eepp', 'caratula', 'estado', 'pago'] },
  { id: 'planilla', name: 'Avance del período', keywords: ['planilla', 'avance', 'periodo'] },
  { id: 'cotizaciones', name: 'Certificado de pago de cotizaciones', keywords: ['cotizacion', 'pago', 'certificado'] },
  { id: 'comprobante_cotizaciones', name: 'Comprobante de pago de cotizaciones', keywords: ['comprobante', 'cotizacion', 'pago'] },
  { id: 'f30', name: 'Certificado F30', keywords: ['f30', 'formulario 30'] },
  { id: 'f30_1', name: 'Certificado F30-1', keywords: ['f30-1', 'formulario 30-1'] },
  { id: 'factura', name: 'Factura', keywords: ['factura'] },
  { id: 'libro_asistencia', name: 'Libro de asistencia', keywords: ['libro', 'asistencia'] },
  { id: 'liquidaciones_sueldo', name: 'Liquidaciones de sueldo', keywords: ['liquidacion', 'liquidaciones', 'sueldo'] },
  { id: 'nomina_trabajadores', name: 'Nómina de trabajadores', keywords: ['nomina', 'nómina', 'trabajadores'] },
  { id: 'tgr', name: 'TGR', keywords: ['tgr', 'tesoreria'] },
];

// Helper functions
function normalizeText(text) {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(text) {
  return normalizeText(text).replace(/\s+/g, '-');
}

function extractNameFromOtherId(otherId) {
  if (!otherId.startsWith('other_')) {
    throw new Error('Not an other_ document');
  }
  
  const slug = otherId.replace('other_', '');
  // Convert slug back to readable name
  return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// Create document name map from catalog
const documentNameMap = {};
DOCUMENT_CATALOG.forEach(doc => {
  documentNameMap[doc.id] = doc.name;
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Upload documents function started');
    
    const { paymentId, documents } = await req.json();
    
    if (!paymentId || !documents) {
      console.error('❌ Missing required parameters');
      return Response.json(
        { success: false, error: 'Missing paymentId or documents' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`📋 Processing documents for payment ${paymentId}:`, Object.keys(documents));

    // Get payment and project information
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.50.0');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch payment details with existing URL
    const { data: paymentData, error: paymentError } = await supabaseAdmin
      .from('Estados de pago')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (paymentError || !paymentData) {
      console.error('❌ Error fetching payment data:', paymentError);
      return Response.json(
        { success: false, error: 'Payment not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    console.log('✅ Payment data fetched successfully');
    console.log('📁 URL from database:', paymentData.URL);

    // Extract folder ID from the URL field in the database
    let targetFolderId = null;
    if (paymentData.URL) {
      const urlMatch = paymentData.URL.match(/\/folders\/([a-zA-Z0-9-_]+)/);
      if (urlMatch) {
        targetFolderId = urlMatch[1];
        console.log(`📁 Using folder ID from database URL: ${targetFolderId}`);
      }
    }

    if (!targetFolderId) {
      console.error('❌ No valid folder ID found in database URL:', paymentData.URL);
      return Response.json(
        { success: false, error: 'No Google Drive folder configured for this payment state. URL field: ' + paymentData.URL },
        { status: 400, headers: corsHeaders }
      );
    }

    // Eliminar verificación directa de credentials aquí - dejar que token-manager se encargue
    console.log('🔍 Skipping direct credential check - delegating to token manager...');

    // Get access token using the token manager
    console.log('🔑 Getting access token via token manager...');
    const tokenManagerResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/google-drive-token-manager`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
      },
      body: JSON.stringify({ action: 'validate' }),
    });

    const tokenResult = await tokenManagerResponse.json();

    if (!tokenResult.valid) {
      console.error('❌ Token validation failed:', tokenResult.error);
      
      if (tokenResult.refresh_needed) {
        return Response.json(
          { 
            success: false, 
            error: 'Google Drive authentication failed. Please check your credentials and try again.',
            details: tokenResult.error,
            error_code: tokenResult.error_code || 'TOKEN_REFRESH_FAILED'
          },
          { status: 401, headers: corsHeaders }
        );
      }
      
      return Response.json(
        { success: false, error: 'Failed to authenticate with Google Drive' },
        { status: 500, headers: corsHeaders }
      );
    }

    const access_token = tokenResult.access_token;
    console.log('✅ Access token obtained and validated');

    // Check for existing files in the target folder
    const existingFilesResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${targetFolderId}' in parents and trashed=false&fields=files(id,name)`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );

    const existingFilesData = await existingFilesResponse.json();
    const hasExistingFiles = existingFilesData.files && existingFilesData.files.length > 0;

    if (hasExistingFiles) {
      console.log(`⚠️ Found ${existingFilesData.files.length} existing files in folder. They will be replaced if necessary.`);
    }

    // Upload documents - process one at a time to avoid memory issues
    const uploadResults = [];
    console.log(`🔄 Processing ${Object.keys(documents).length} document types sequentially to avoid memory overflow`);
    
    for (const [docType, docData] of Object.entries(documents)) {
      console.log(`📤 Processing ${docType} with ${docData.files.length} files (Memory optimization: sequential processing)`);
      console.log(`📋 Document data for ${docType}:`, { 
        documentName: docData.documentName, 
        files: docData.files.map(f => f.name),
        isOther: docType.startsWith('other_')
      });
      
      // Enhanced naming logic with better fallbacks and logging
      let subfolderName = docData.documentName;
      let namingReason = 'provided';
      
      // Priority 1: Use provided documentName if available and valid (this is the correct name from frontend)
      if (docData.documentName && docData.documentName !== docType && docData.documentName.trim() !== '') {
        subfolderName = docData.documentName;
        namingReason = 'provided-documentName';
      }
      // Priority 2: For predefined documents, use documentName from frontend (not the mapping here)
      else if (documentNameMap[docType] && docData.documentName) {
        subfolderName = docData.documentName; // Use frontend's documentName, not our mapping
        namingReason = 'frontend-documentName';
      }
      // Priority 3: For other_ documents, use filename fallback directly  
      else if (docType.startsWith('other_')) {
        // Use filename without extension as the name
        if (docData.files && docData.files.length > 0) {
          subfolderName = docData.files[0].name.replace(/\.[^/.]+$/, '');
          namingReason = 'filename-fallback';
          console.log(`📋 Using filename fallback for ${docType}: "${subfolderName}"`);
        } else {
          subfolderName = docType;
          namingReason = 'doctype-fallback';
          console.error(`❌ No files available for ${docType}, using docType as name`);
        }
      }
      // Priority 4: Last resort - use mapping or docType
      else {
        subfolderName = documentNameMap[docType] || docType;
        namingReason = documentNameMap[docType] ? 'predefined-mapping' : 'final-fallback';
      }

      console.log(`📋 Final naming for ${docType}: "${subfolderName}" (reason: ${namingReason})`);
      
      if (namingReason === 'doctype-fallback' || namingReason === 'filename-fallback') {
        console.warn(`⚠️ Document ${docType} using fallback naming strategy: ${namingReason}`);
      }
      
      // Additional validation: always prioritize documentName from frontend when available
      if (docData.documentName && docData.documentName !== docType && docData.documentName.trim() !== '') {
        subfolderName = docData.documentName;
        namingReason = 'override-from-documentName';
        console.log(`📋 Final override using documentName for ${docType}: "${subfolderName}"`);
      }
      
      // Final validation: ensure subfolder name is not empty or invalid
      if (!subfolderName || subfolderName.trim() === '' || subfolderName === docType) {
        console.error(`❌ Empty or invalid subfolder name for ${docType}, using ultimate fallback`);
        if (docData.files && docData.files.length > 0) {
          subfolderName = docData.files[0].name.replace(/\.[^/.]+$/, '');
          namingReason = 'ultimate-filename-fallback';
        } else {
          subfolderName = docType.replace('other_', '').replace(/-/g, ' ');
          namingReason = 'ultimate-doctype-fallback';
        }
      }
      
      // Handle multiple files (create subfolder)
      if (docData.files.length > 1) {
        // Check if subfolder already exists
        const subfolderSearchResponse = await fetch(
          `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(subfolderName)}' and '${targetFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id,name)`,
          {
            headers: {
              'Authorization': `Bearer ${access_token}`,
            },
          }
        );

        let subFolderId = targetFolderId;
        const subfolderSearchData = await subfolderSearchResponse.json();
        
        if (subfolderSearchData.files && subfolderSearchData.files.length > 0) {
          subFolderId = subfolderSearchData.files[0].id;
          console.log(`✅ Using existing subfolder: ${subfolderName} (${subFolderId})`);
        } else {
          // Create new subfolder
          const createSubfolderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: subfolderName,
              mimeType: 'application/vnd.google-apps.folder',
              parents: [targetFolderId],
            }),
          });

          if (createSubfolderResponse.ok) {
            const subFolder = await createSubfolderResponse.json();
            subFolderId = subFolder.id;
            console.log(`✅ Created subfolder: ${subfolderName} (${subFolderId})`);
          }
        }

        // Upload files to subfolder - one at a time to prevent memory overflow
        for (let i = 0; i < docData.files.length; i++) {
          const file = docData.files[i];
          const fileName = `${subfolderName}_${i + 1}.${file.name.split('.').pop()}`;
          
          console.log(`📋 Uploading file ${i + 1}/${docData.files.length}: ${fileName} (${Math.round(file.content.length * 0.75 / 1024 / 1024 * 100) / 100}MB estimated)`);
          
          const uploadResult = await uploadFileToFolder(file, fileName, subFolderId, access_token);
          uploadResults.push({
            documentType: docType,
            fileName: fileName,
            subfolder: subfolderName,
            ...uploadResult
          });
          
          // Force garbage collection attempt and small delay between files
          if (globalThis.gc) globalThis.gc();
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } else {
      // Single file (upload directly to main folder)
      const file = docData.files[0];
      
      // Special handling for mandante documents - use original name with suffix
      let fileName;
      if (docType.startsWith('mandante_doc_')) {
        // For mandante docs, the file name should already include "- mandante" from frontend
        fileName = file.name.includes('- mandante') ? file.name : `${file.name} - mandante`;
      } else if (docType.startsWith('other_') && subfolderName && subfolderName !== docType) {
        // For "other" documents, use the proper document name from requirements
        fileName = `${subfolderName}.${file.name.split('.').pop()}`;
      } else {
        fileName = `${subfolderName}.${file.name.split('.').pop()}`;
      }
      
      console.log(`📋 Uploading single file: ${fileName} (${Math.round(file.content.length * 0.75 / 1024 / 1024 * 100) / 100}MB estimated)`);
      
      const uploadResult = await uploadFileToFolder(file, fileName, targetFolderId, access_token);
      uploadResults.push({
        documentType: docType,
        fileName: fileName,
        ...uploadResult
      });
      
      // Force garbage collection attempt between documents
      if (globalThis.gc) globalThis.gc();
      }
    }

    console.log('🎉 Upload process completed successfully');

    return Response.json(
      {
        success: true,
        uploadResults,
        driveUrl: paymentData.URL,
        folderId: targetFolderId,
        existingFilesReplaced: hasExistingFiles
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('❌ Unexpected error in upload function:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500, headers: corsHeaders }
    );
  }
});

// Helper function to upload a file to a specific folder
async function uploadFileToFolder(file: any, fileName: string, folderId: string, accessToken: string) {
  try {
    // Delete existing file with same name if it exists
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(fileName)}' and '${folderId}' in parents and trashed=false&fields=files(id,name)`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const searchData = await searchResponse.json();
    if (searchData.files && searchData.files.length > 0) {
      // Delete existing file
      for (const existingFile of searchData.files) {
        await fetch(`https://www.googleapis.com/drive/v3/files/${existingFile.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        console.log(`🗑️ Deleted existing file: ${fileName}`);
      }
    }

    // Increase file size limit with optimized memory usage
    const estimatedFileSize = file.content.length * 0.75 / 1024 / 1024; // MB
    if (estimatedFileSize > 15) {
      console.warn(`⚠️ Large file detected: ${fileName} (~${Math.round(estimatedFileSize * 100) / 100}MB)`);
    }
    
    // Optimized base64 to binary conversion with streaming
    console.log(`🔄 Converting base64 to binary for ${fileName} (~${estimatedFileSize.toFixed(2)}MB)`);
    const binaryString = atob(file.content);
    
    // Process in chunks to avoid memory spikes
    const chunkSize = 8192;
    const totalLength = binaryString.length;
    const bytes = new Uint8Array(totalLength);
    
    for (let i = 0; i < totalLength; i += chunkSize) {
      const end = Math.min(i + chunkSize, totalLength);
      for (let j = i; j < end; j++) {
        bytes[j] = binaryString.charCodeAt(j);
      }
      // Allow event loop processing
      if (i % (chunkSize * 20) === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    // Create metadata
    const metadata = {
      name: fileName,
      parents: [folderId],
    };

    // Upload file using multipart upload
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const close_delim = `\r\n--${boundary}--`;

    let body = delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(metadata) + delimiter +
      `Content-Type: ${file.mimeType || 'application/octet-stream'}\r\n` +
      'Content-Transfer-Encoding: base64\r\n\r\n' +
      file.content +
      close_delim;

    const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body: body,
    });

    if (uploadResponse.ok) {
      const uploadedFile = await uploadResponse.json();
      console.log(`✅ Uploaded ${fileName} successfully to folder ${folderId}`);
      return {
        success: true,
        fileId: uploadedFile.id
      };
    } else {
      const errorText = await uploadResponse.text();
      console.error(`❌ Failed to upload ${fileName}:`, errorText);
      return {
        success: false,
        error: errorText
      };
    }
  } catch (fileError) {
    console.error(`❌ Error processing file ${fileName}:`, fileError);
    return {
      success: false,
      error: fileError.message
    };
  }
}
