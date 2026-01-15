import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DownloadRequest {
  driveId?: string;
  fileName: string;
  projectId?: number;
  mode?: 'content' | 'meta';
}

const getAccessToken = async (): Promise<string> => {
  const clientId = Deno.env.get('GOOGLE_DRIVE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET');
  const refreshToken = Deno.env.get('GOOGLE_DRIVE_REFRESH_TOKEN');

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Google Drive credentials');
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to refresh access token');
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
};

const getSupabaseAdmin = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(supabaseUrl, supabaseServiceKey);
};

const getFolderIdFromUrl = (driveUrl: string): string | null => {
  const match = driveUrl.match(/folders\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
};

const searchFileInFolder = async (
  accessToken: string,
  folderId: string,
  fileName: string
): Promise<{ id: string; name: string; mimeType: string; webViewLink?: string } | null> => {
  const q = encodeURIComponent(`'${folderId}' in parents and trashed = false and name = '${fileName.replace(/'/g, "\\'")}'`);
  const fields = encodeURIComponent('files(id,name,mimeType,webViewLink)');
  const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Failed to search file: ${res.statusText}`);
  }
  const data = await res.json();
  return data.files?.[0] || null;
};

// Helper function to encode ArrayBuffer to base64 in chunks to avoid stack overflow
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const uint8Array = new Uint8Array(buffer);
  const chunkSize = 8192; // Process in 8KB chunks to avoid stack overflow
  let result = '';
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.slice(i, i + chunkSize);
    result += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(result);
};

const downloadFileContent = async (
  accessToken: string,
  fileId: string
): Promise<{ content: string; mimeType: string }> => {
  console.log(`📥 Downloading file content for ID: ${fileId}`);

  // Get file metadata first
  const metadataResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType,size`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!metadataResponse.ok) {
    throw new Error(`Failed to get file metadata: ${metadataResponse.statusText}`);
  }

  const metadata = await metadataResponse.json();

  // Download file content
  const downloadResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!downloadResponse.ok) {
    throw new Error(`Failed to download file: ${downloadResponse.statusText}`);
  }

  const arrayBuffer = await downloadResponse.arrayBuffer();
  // Use chunked encoding to avoid "Maximum call stack size exceeded" error
  const base64Content = arrayBufferToBase64(arrayBuffer);

  return {
    content: base64Content,
    mimeType: metadata.mimeType,
  };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { driveId, fileName, projectId, mode = 'content' }: DownloadRequest = await req.json();

    if (!fileName) {
      throw new Error('Missing fileName');
    }

    const accessToken = await getAccessToken();

    let resolvedDriveId = driveId;
    let resolvedWebViewLink: string | undefined;
    let resolvedMimeType: string | undefined;

    if (!resolvedDriveId) {
      if (!projectId) {
        throw new Error('Missing driveId or projectId');
      }
      // Resolve folder from project and search by name
      const supabase = getSupabaseAdmin();
      const { data: project, error: projectError } = await supabase
        .from('Proyectos')
        .select('URL_docs')
        .eq('id', projectId)
        .single();

      if (projectError || !project?.URL_docs) {
        throw new Error('No hay carpeta de documentos configurada para el proyecto');
      }
      const folderId = getFolderIdFromUrl(project.URL_docs);
      if (!folderId) throw new Error('URL de Google Drive inválida para el proyecto');

      const found = await searchFileInFolder(accessToken, folderId, fileName);
      if (!found) {
        throw new Error('Archivo no encontrado en la carpeta del proyecto');
      }
      resolvedDriveId = found.id;
      resolvedWebViewLink = found.webViewLink;
      resolvedMimeType = found.mimeType;
    }

    if (mode === 'meta') {
      // Only return metadata (for preview URL)
      if (!resolvedWebViewLink || !resolvedMimeType) {
        // fetch minimal metadata if missing
        const metaRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${resolvedDriveId}?fields=webViewLink,mimeType`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (!metaRes.ok) throw new Error('No se pudo obtener metadatos del archivo');
        const meta = await metaRes.json();
        resolvedWebViewLink = meta.webViewLink;
        resolvedMimeType = meta.mimeType;
      }

      return new Response(
        JSON.stringify({
          success: true,
          fileName,
          driveId: resolvedDriveId,
          webViewLink: resolvedWebViewLink,
          mimeType: resolvedMimeType,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mode content: download bytes
    const { content, mimeType } = await downloadFileContent(accessToken, resolvedDriveId!);

    return new Response(
      JSON.stringify({ success: true, content, mimeType, fileName }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error in download-project-document:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
