import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DownloadRequest {
  driveId: string;
  fileName: string;
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
  console.log(`File metadata:`, metadata);

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
  const uint8Array = new Uint8Array(arrayBuffer);
  const base64Content = btoa(String.fromCharCode(...uint8Array));

  console.log(`✅ File downloaded successfully, size: ${arrayBuffer.byteLength} bytes`);

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
    const { driveId, fileName }: DownloadRequest = await req.json();

    console.log(`🔍 Downloading document: ${fileName} with Drive ID: ${driveId}`);

    if (!driveId || !fileName) {
      throw new Error('Missing driveId or fileName');
    }

    const accessToken = await getAccessToken();
    const { content, mimeType } = await downloadFileContent(accessToken, driveId);

    return new Response(
      JSON.stringify({
        success: true,
        content,
        mimeType,
        fileName,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error in download-project-document:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
