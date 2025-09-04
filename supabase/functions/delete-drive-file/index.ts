import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeleteFileRequest {
  paymentId: string;
  fileName: string;
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

const getFolderIdFromUrl = (driveUrl: string): string | null => {
  const match = driveUrl.match(/\/folders\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};

const searchFileInFolder = async (accessToken: string, folderId: string, fileName: string) => {
  console.log(`🔍 Searching for file "${fileName}" in folder ${folderId}`);
  
  // Primero buscar por nombre exacto
  let query = `name='${fileName}' and parents in '${folderId}' and trashed=false`;
  
  let response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
    {
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Drive API search error: ${response.status}`);
  }

  let data = await response.json();
  
  // Si no encuentra archivos con nombre exacto, buscar por coincidencia parcial
  if (!data.files || data.files.length === 0) {
    console.log(`🔍 No exact match found, trying partial search for "${fileName}"`);
    
    // Remover extensión para buscar archivos similares
    const baseFileName = fileName.replace(/\.[^/.]+$/, "");
    query = `parents in '${folderId}' and trashed=false`;
    
    response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`,
      {
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      }
    );

    if (response.ok) {
      data = await response.json();
      // Filtrar archivos que coincidan parcialmente
      const matchingFiles = data.files?.filter(file => {
        const fileBaseName = file.name.replace(/\.[^/.]+$/, "").toLowerCase();
        const searchBaseName = baseFileName.toLowerCase();
        return fileBaseName.includes(searchBaseName) || searchBaseName.includes(fileBaseName);
      }) || [];
      
      data.files = matchingFiles;
      console.log(`📁 Found ${matchingFiles.length} files with partial match for "${fileName}"`);
    }
  }

  console.log(`📁 Found ${data.files?.length || 0} files matching "${fileName}"`);
  return data.files || [];
};

const deleteFile = async (accessToken: string, fileId: string): Promise<void> => {
  console.log(`🗑️ Deleting file with ID: ${fileId}`);
  
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    {
      method: 'DELETE',
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Drive API delete error: ${response.status} - ${response.statusText}`);
  }

  console.log(`✅ File deleted successfully`);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId, fileName }: DeleteFileRequest = await req.json();
    console.log("🗑️ Delete file request:", { paymentId, fileName });

    if (!paymentId || !fileName) {
      throw new Error("Missing paymentId or fileName");
    }

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
    
    // Search for the file
    const files = await searchFileInFolder(accessToken, folderId, fileName);
    
    if (files.length === 0) {
      console.warn(`⚠️ File "${fileName}" not found in Drive folder`);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `File "${fileName}" not found`,
          warning: true
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // Delete all matching files (in case there are duplicates)
    let deletedCount = 0;
    for (const file of files) {
      try {
        await deleteFile(accessToken, file.id);
        deletedCount++;
      } catch (error) {
        console.error(`❌ Failed to delete file ${file.name} (${file.id}):`, error);
        // Continue with other files
      }
    }

    if (deletedCount === 0) {
      throw new Error("Failed to delete any files");
    }

    console.log(`✅ Successfully deleted ${deletedCount} file(s) named "${fileName}"`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deletedCount,
        message: `Successfully deleted ${deletedCount} file(s) named "${fileName}"`
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("❌ Error deleting file:", error);
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