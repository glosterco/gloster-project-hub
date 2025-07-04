
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
  const clientId = Deno.env.get("GOOGLE_DRIVE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_DRIVE_CLIENT_SECRET");
  const refreshToken = Deno.env.get("GOOGLE_DRIVE_REFRESH_TOKEN");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken!,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();
  return data.access_token;
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
    console.log("Getting drive files for:", { paymentId, documentName, downloadContent });

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
      throw new Error("No drive URL found for this payment");
    }

    const driveUrl = paymentData[0].URL;
    const folderId = getFolderIdFromUrl(driveUrl);

    if (!folderId) {
      throw new Error("Invalid drive URL format");
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
    console.error("Error getting drive files:", error);
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
