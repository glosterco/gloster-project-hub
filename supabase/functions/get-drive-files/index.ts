
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
  const query = `name contains '${fileName}' and parents in '${folderId}'`;
  
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
  return data.files || [];
};

const downloadFileContent = async (accessToken: string, fileId: string): Promise<string> => {
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

  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  
  // Convertir a base64
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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

    // Si se solicita contenido, descargarlo
    const filesWithContent = [];
    for (const file of files) {
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
          console.log(`📥 Downloading content for: ${file.name}`);
          const content = await downloadFileContent(accessToken, file.id);
          fileData.content = content;
          console.log(`✅ Content downloaded for: ${file.name}`);
        } catch (contentError) {
          console.error(`❌ Error downloading content for ${file.name}:`, contentError);
          // Continuar sin el contenido si hay error
        }
      }

      filesWithContent.push(fileData);
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
