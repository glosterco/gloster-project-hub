import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UploadRequest {
  projectId: number;
  documents: {
    fileName: string;
    fileContent: string; // base64
    tipo: string;
    mimeType: string;
  }[];
}

async function getAccessToken(): Promise<string> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.functions.invoke('google-drive-token-manager');
  
  if (error || !data?.isValid) {
    throw new Error('Failed to get valid Google Drive access token');
  }
  
  return data.accessToken;
}

async function uploadFileToDrive(
  accessToken: string,
  folderId: string,
  fileName: string,
  fileContent: string,
  mimeType: string
): Promise<{ id: string; webViewLink: string }> {
  console.log(`Uploading file: ${fileName} to folder: ${folderId}`);
  
  // Convert base64 to binary
  const base64Data = fileContent.includes(',') ? fileContent.split(',')[1] : fileContent;
  const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
  
  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: mimeType
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n` +
    'Content-Transfer-Encoding: base64\r\n\r\n' +
    base64Data +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Upload failed:', errorText);
    throw new Error(`Failed to upload file: ${errorText}`);
  }

  const result = await response.json();
  console.log('File uploaded successfully:', result);
  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { projectId, documents }: UploadRequest = await req.json();
    console.log(`Processing upload for project ${projectId}, ${documents.length} documents`);

    // Get project's Google Drive URL
    const { data: project, error: projectError } = await supabase
      .from('Proyectos')
      .select('URL_docs, Name')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      throw new Error('Project not found');
    }

    let folderId: string;

    // If no Google Drive folder exists, create one
    if (!project.URL_docs) {
      console.log('Creating Google Drive folder for project...');
      
      const { data: folderData, error: folderError } = await supabase.functions.invoke(
        'google-drive-integration',
        {
          body: {
            type: 'project_docs',
            projectId,
            projectName: project.Name
          }
        }
      );

      if (folderError || !folderData?.success) {
        throw new Error('Failed to create Google Drive folder: ' + (folderError?.message || folderData?.error));
      }

      // The folder creation function should return the folder URL
      // Extract folder ID from the newly created URL
      const urlMatch = folderData.fullUrl?.match(/folders\/([a-zA-Z0-9-_]+)/);
      if (!urlMatch) {
        throw new Error('Invalid Google Drive URL format returned from folder creation');
      }
      folderId = urlMatch[1];
    } else {
      // Extract folder ID from existing URL
      const urlMatch = project.URL_docs.match(/folders\/([a-zA-Z0-9-_]+)/);
      if (!urlMatch) {
        throw new Error('Invalid Google Drive URL format in database');
      }
      folderId = urlMatch[1];
    }

    // Get access token
    const accessToken = await getAccessToken();

    const uploadedFiles: any[] = [];

    // Upload each document
    for (const doc of documents) {
      try {
        const driveFile = await uploadFileToDrive(
          accessToken,
          folderId,
          doc.fileName,
          doc.fileContent,
          doc.mimeType
        );

        // Insert into Documentos table
        const { data: insertedDoc, error: insertError } = await supabase
          .from('Documentos')
          .insert({
            Proyecto: projectId,
            Nombre: doc.fileName,
            Tipo: doc.tipo,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting document:', insertError);
          throw insertError;
        }

        uploadedFiles.push({
          fileName: doc.fileName,
          driveId: driveFile.id,
          webViewLink: driveFile.webViewLink,
          documentId: insertedDoc.id
        });

        console.log(`Successfully uploaded and recorded: ${doc.fileName}`);
      } catch (error) {
        console.error(`Error uploading ${doc.fileName}:`, error);
        throw error;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        uploadedFiles,
        message: `Successfully uploaded ${uploadedFiles.length} documents`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in upload-project-documents:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
