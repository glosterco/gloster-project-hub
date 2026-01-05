import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GetFolderFilesRequest {
  folderUrl: string;
}

// Get access token for Google Drive
async function getAccessToken(): Promise<string> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.functions.invoke('google-drive-token-manager', { body: {} });
  
  if (error) {
    throw new Error(`Failed to call token manager: ${error.message}`);
  }
  
  const accessToken = data?.access_token || data?.accessToken;
  const isValid = data?.valid ?? data?.isValid;
  if (!isValid || !accessToken) {
    throw new Error('Failed to get valid Google Drive access token');
  }
  
  return accessToken;
}

// Check if URL is a folder or file
function isFolder(url: string): boolean {
  return url.includes('/folders/');
}

// Extract folder ID from URL
function extractFolderId(url: string): string | null {
  const match = url.match(/folders\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// Extract file ID from URL
function extractFileId(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { folderUrl }: GetFolderFilesRequest = await req.json();
    console.log("📁 Getting files for URL:", folderUrl);

    if (!folderUrl) {
      throw new Error('folderUrl is required');
    }

    const accessToken = await getAccessToken();

    // Check if this is a folder or single file
    if (!isFolder(folderUrl)) {
      // It's a single file - get file metadata
      const fileId = extractFileId(folderUrl);
      if (!fileId) {
        throw new Error('Invalid file URL format');
      }

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,webViewLink,webContentLink`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to get file info: ${response.status}`);
      }

      const file = await response.json();
      
      return new Response(
        JSON.stringify({
          success: true,
          isFolder: false,
          files: [{
            id: file.id,
            name: file.name,
            mimeType: file.mimeType,
            size: file.size ? parseInt(file.size) : null,
            webViewLink: file.webViewLink,
            webContentLink: file.webContentLink,
          }]
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // It's a folder - list all files
    const folderId = extractFolderId(folderUrl);
    if (!folderId) {
      throw new Error('Invalid folder URL format');
    }

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,size,webViewLink,webContentLink)&orderBy=name`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to list folder: ${errorText}`);
    }

    const data = await response.json();
    const files = (data.files || []).map((file: any) => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size ? parseInt(file.size) : null,
      webViewLink: file.webViewLink,
      webContentLink: file.webContentLink,
    }));

    console.log(`✅ Found ${files.length} files in folder`);

    return new Response(
      JSON.stringify({
        success: true,
        isFolder: true,
        folderId,
        files,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
};

serve(handler);
