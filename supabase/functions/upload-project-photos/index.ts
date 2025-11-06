import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getAccessToken(): Promise<string> {
  console.log('🔑 Getting Google Drive access token via token manager...');
  
  const tokenManagerResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/google-drive-token-manager`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
    },
    body: JSON.stringify({ action: 'validate' }),
  });

  if (!tokenManagerResponse.ok) {
    throw new Error(`Token manager responded with status: ${tokenManagerResponse.status}`);
  }

  const tokenResult = await tokenManagerResponse.json();
  console.log('🔑 Token manager response:', { valid: tokenResult.valid });

  if (!tokenResult.valid || !tokenResult.access_token) {
    throw new Error('Failed to get valid Google Drive access token');
  }

  return tokenResult.access_token;
}

async function uploadFileToDrive(
  accessToken: string,
  folderId: string,
  fileName: string,
  fileContent: string,
  mimeType: string
): Promise<{ id: string; webViewLink: string }> {
  const base64Data = fileContent.split(',')[1];
  const boundary = '-------314159265358979323846';
  
  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: mimeType
  };

  const multipartBody = 
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: ${mimeType}\r\n` +
    `Content-Transfer-Encoding: base64\r\n\r\n` +
    `${base64Data}\r\n` +
    `--${boundary}--`;

  const uploadResponse = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Failed to upload file: ${errorText}`);
  }

  return await uploadResponse.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, photos } = await req.json();

    if (!projectId || !photos || !Array.isArray(photos)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = await getAccessToken();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get project to check URL_Fotos folder
    const { data: project, error: projectError } = await supabase
      .from('Proyectos')
      .select('URL_Fotos')
      .eq('id', projectId)
      .single();

    if (projectError) {
      throw new Error(`Project not found: ${projectError.message}`);
    }

    let folderId: string;

    if (!project.URL_Fotos) {
      // Create photos folder using google-drive-integration function
      const { data: folderData, error: folderError } = await supabase.functions.invoke(
        'google-drive-integration',
        {
          body: {
            type: 'project-photos',
            projectId: projectId
          }
        }
      );

      if (folderError) throw folderError;
      
      // Extract folder ID from the created URL
      const folderUrl = folderData.folderUrl;
      const match = folderUrl.match(/folders\/([a-zA-Z0-9_-]+)/);
      if (!match) throw new Error('Could not extract folder ID from URL');
      folderId = match[1];
    } else {
      // Extract folder ID from existing URL
      const match = project.URL_Fotos.match(/folders\/([a-zA-Z0-9_-]+)/);
      if (!match) throw new Error('Invalid URL_Fotos format');
      folderId = match[1];
    }

    const uploadedFiles = [];

    for (const photo of photos) {
      try {
        const driveFile = await uploadFileToDrive(
          accessToken,
          folderId,
          photo.fileName,
          photo.fileContent,
          photo.mimeType
        );

        // Insert into Fotos table
        const { data: fotoRecord, error: insertError } = await supabase
          .from('Fotos')
          .insert({
            Proyecto: projectId,
            DriveId: driveFile.id,
            WebViewLink: driveFile.webViewLink,
            Nombre: photo.fileName,
            MimeType: photo.mimeType
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting foto record:', insertError);
          throw insertError;
        }

        uploadedFiles.push({
          fileName: photo.fileName,
          driveId: driveFile.id,
          webViewLink: driveFile.webViewLink
        });
      } catch (error) {
        console.error(`Error uploading photo ${photo.fileName}:`, error);
        throw error;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        uploadedFiles: uploadedFiles
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in upload-project-photos:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
