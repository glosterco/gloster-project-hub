
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GetFilesRequest {
  paymentId: string;
  documentName: string;
  downloadContent?: boolean; // Nuevo parámetro para obtener contenido
}

const getAccessToken = async (): Promise<string> => {
  console.log('🔑 Getting Google Drive access token via token manager...');
  
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
    console.error('❌ Google Drive token validation failed:', tokenResult.error);
    throw new Error(`Google Drive authentication failed: ${tokenResult.error}`);
  }

  console.log('✅ Google Drive access token obtained and validated successfully');
  return tokenResult.access_token;
};

const searchFileInFolder = async (accessToken: string, folderId: string, fileName: string) => {
  // Búsqueda más específica para evitar coincidencias parciales
  let query = `name contains '${fileName}' and parents in '${folderId}'`;
  
  // Para certificados F30 vs F30-1, hacer búsqueda más específica
  if (fileName === 'Certificado F30' || fileName === 'certificado F30') {
    query = `(name contains 'F30' and not name contains 'F30-1' and not name contains 'F301') and parents in '${folderId}'`;
  } else if (fileName === 'Certificado F30-1' || fileName === 'certificado F30-1') {
    query = `(name contains 'F30-1' or name contains 'F301') and parents in '${folderId}'`;
  }
  
  console.log(`🔍 Searching for "${fileName}" with query: ${query}`);
  
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,webViewLink,webContentLink)`,
    {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Drive API error: ${response.status}`);
  }

  const data = await response.json();
  console.log(`📁 Found ${data.files?.length || 0} files for "${fileName}":`, data.files?.map(f => f.name));
  return data.files || [];
};

const downloadFileContent = async (accessToken: string, fileId: string, fileName: string): Promise<string> => {
  console.log(`📥 Starting download for: ${fileName}`);
  
  // Get file metadata first to check size
  const metadataResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=size,mimeType`,
    {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    }
  );

  if (metadataResponse.ok) {
    const metadata = await metadataResponse.json();
    const fileSizeBytes = parseInt(metadata.size || '0');
    const fileSizeMB = fileSizeBytes / (1024 * 1024);
    
    // Reduced limit for downloads to prevent memory issues
    if (fileSizeMB > 25) {
      throw new Error(`File ${fileName} is too large (${fileSizeMB.toFixed(2)}MB). Maximum download size is 25MB due to memory limitations.`);
    }
    
    console.log(`📊 File ${fileName} size: ${fileSizeMB.toFixed(2)}MB`);
    
    // Log memory usage before download
    if (typeof Deno !== 'undefined' && Deno.memoryUsage) {
      const memBefore = Deno.memoryUsage();
      console.log(`🧠 Memory before download: ${(memBefore.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    }
  }

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status}`);
  }

  console.log(`📦 Downloading ${fileName} content...`);
  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  // Log memory usage after download
  console.log(`💾 Downloaded ${fileName}: ${(bytes.length / 1024 / 1024).toFixed(2)}MB in memory`);
  
  if (typeof Deno !== 'undefined' && Deno.memoryUsage) {
    const memAfter = Deno.memoryUsage();
    console.log(`🧠 Memory after download: ${(memAfter.heapUsed / 1024 / 1024).toFixed(2)}MB`);
  }
  
  // Convertir a base64 de manera más eficiente
  console.log(`🔄 Converting ${fileName} to base64...`);
  
  // Use chunks to avoid memory spikes
  const chunkSize = 8192;
  let binary = '';
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, i + chunkSize);
    let chunkBinary = '';
    for (let j = 0; j < chunk.length; j++) {
      chunkBinary += String.fromCharCode(chunk[j]);
    }
    binary += chunkBinary;
  }
  
  const base64 = btoa(binary);
  
  // Clear references immediately
  bytes.fill(0);
  
  // Force cleanup
  if (globalThis.gc) {
    globalThis.gc();
    console.log(`🗑️ Forced garbage collection after ${fileName}`);
  }
  
  console.log(`✅ Base64 conversion completed for ${fileName}`);
  return base64;
};

const downloadFolderAsZip = async (accessToken: string, folderId: string, folderName: string): Promise<string> => {
  // Obtener todos los archivos de la carpeta
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed=false&fields=files(id,name,mimeType)`,
    {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch folder files: ${response.status}`);
  }

  const data = await response.json();
  const files = data.files || [];

  if (files.length === 0) {
    throw new Error('No files found in folder');
  }

  // Crear un ZIP con todos los archivos
  const JSZip = (await import('https://esm.sh/jszip@3.10.1')).default;
  const zip = new JSZip();

  for (const file of files) {
    if (file.mimeType !== 'application/vnd.google-apps.folder') {
      try {
        const fileContent = await downloadFileContent(accessToken, file.id, file.name);
        const binaryString = atob(fileContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        zip.file(file.name, bytes);
      } catch (error) {
        console.warn(`Failed to download file ${file.name}:`, error);
      }
    }
  }

  const zipContent = await zip.generateAsync({ type: 'base64' });
  return zipContent;
};

const getFolderIdFromUrl = (driveUrl: string): string | null => {
  const match = driveUrl.match(/\/folders\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId, documentName, downloadContent = false }: GetFilesRequest = await req.json();
    console.log("Getting files for:", { paymentId, documentName, downloadContent });

    // Get payment data from Supabase to find the drive URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const paymentResponse = await fetch(
      `${supabaseUrl}/rest/v1/Estados%20de%20pago?id=eq.${paymentId}&select=URL`,
      {
        headers: {
          "Authorization": `Bearer ${supabaseKey}`,
          "apikey": supabaseKey!,
          "Content-Type": "application/json",
        },
      }
    );

    if (!paymentResponse.ok) {
      throw new Error("Failed to fetch payment data");
    }

    const paymentData = await paymentResponse.json();
    if (!paymentData.length || !paymentData[0].URL) {
      throw new Error("No URL found for this payment");
    }

    const driveUrl = paymentData[0].URL;
    const folderId = getFolderIdFromUrl(driveUrl);

    if (!folderId) {
      throw new Error("Invalid URL format");
    }

    const accessToken = await getAccessToken();
    const files = await searchFileInFolder(accessToken, folderId, documentName);

    console.log("Found files:", files.length);

    // Si hay múltiples archivos en una carpeta, buscar si es una subcarpeta
    if (files.length === 1 && files[0].mimeType === 'application/vnd.google-apps.folder') {
      console.log(`📁 Found folder: ${files[0].name}, downloading as ZIP`);
      if (downloadContent) {
        try {
          const zipContent = await downloadFolderAsZip(accessToken, files[0].id, files[0].name);
          return new Response(
            JSON.stringify({ 
              success: true, 
              files: [{
                id: files[0].id,
                name: `${files[0].name}.zip`,
                mimeType: 'application/zip',
                content: zipContent,
                isFolder: true
              }],
              totalFiles: 1
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            }
          );
        } catch (error) {
          console.error(`❌ Error creating ZIP for folder ${files[0].name}:`, error);
          throw error;
        }
      }
    }

    // Si se solicita contenido, descargarlo SECUENCIALMENTE para evitar problemas de memoria
    const filesWithContent = [];
    
    if (downloadContent && files.length > 1) {
      console.log(`⚠️ Multiple files detected (${files.length}). Processing sequentially to prevent memory issues.`);
    }
    
    for (const file of files) {
      // Log memory before processing each file
      if (typeof Deno !== 'undefined' && Deno.memoryUsage) {
        const memBefore = Deno.memoryUsage();
        console.log(`🧠 Memory before processing ${file.name}: ${(memBefore.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      }
      
      const fileData = {
        id: file.id,
        name: file.name,
        mimeType: file.mimeType,
        size: file.size,
        downloadUrl: file.webContentLink,
        viewUrl: file.webViewLink
      };

      if (downloadContent) {
        try {
          console.log(`📥 Processing file ${files.indexOf(file) + 1}/${files.length}: ${file.name}`);
          const content = await downloadFileContent(accessToken, file.id, file.name);
          fileData.content = content;
          console.log(`✅ Content downloaded for: ${file.name}`);
          
          // Force garbage collection between files
          if (globalThis.gc && files.length > 1) {
            globalThis.gc();
            console.log(`🗑️ Forced cleanup between files`);
          }
          
        } catch (contentError) {
          console.error(`❌ Error downloading content for ${file.name}:`, contentError);
          // Continuar sin el contenido si hay error
        }
      }

      filesWithContent.push(fileData);
      
      // Log memory after processing each file
      if (typeof Deno !== 'undefined' && Deno.memoryUsage) {
        const memAfter = Deno.memoryUsage();
        console.log(`🧠 Memory after processing ${file.name}: ${(memAfter.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        files: filesWithContent,
        totalFiles: filesWithContent.length
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error getting files:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

serve(handler);
