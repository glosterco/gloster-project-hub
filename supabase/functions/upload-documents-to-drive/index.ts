
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GoogleDriveCredentials {
  client_id: string;
  client_secret: string;
  refresh_token: string;
}

interface UploadDocumentsRequest {
  paymentId: number;
  documents: {
    [key: string]: {
      files: Array<{
        name: string;
        content: string; // base64 encoded
        mimeType: string;
      }>;
      documentName: string;
    };
  };
}

async function getAccessToken(credentials: GoogleDriveCredentials): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: credentials.client_id,
      client_secret: credentials.client_secret,
      refresh_token: credentials.refresh_token,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to get access token: ${data.error_description || data.error}`);
  }

  return data.access_token;
}

async function createGoogleDriveFolder(
  accessToken: string,
  folderName: string,
  parentFolderId: string
): Promise<string> {
  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentFolderId],
  };

  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to create folder: ${data.error?.message || 'Unknown error'}`);
  }

  return data.id;
}

async function uploadFileToDrive(
  accessToken: string,
  fileName: string,
  fileContent: string,
  mimeType: string,
  parentFolderId: string
): Promise<string> {
  // Convert base64 to binary
  const binaryContent = Uint8Array.from(atob(fileContent), c => c.charCodeAt(0));
  
  const metadata = {
    name: fileName,
    parents: [parentFolderId],
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([binaryContent], { type: mimeType }));

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: form,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to upload file: ${data.error?.message || 'Unknown error'}`);
  }

  return data.id;
}

function extractFolderIdFromUrl(url: string): string {
  // Extract folder ID from Google Drive URL
  const match = url.match(/\/folders\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    throw new Error('Invalid Google Drive URL format');
  }
  return match[1];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body: UploadDocumentsRequest = await req.json();
    
    // Get Google Drive credentials from Supabase secrets
    const googleClientId = Deno.env.get('GOOGLE_DRIVE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET');
    const googleRefreshToken = Deno.env.get('GOOGLE_DRIVE_REFRESH_TOKEN');

    if (!googleClientId || !googleClientSecret || !googleRefreshToken) {
      throw new Error('Google Drive credentials not configured');
    }

    const credentials: GoogleDriveCredentials = {
      client_id: googleClientId,
      client_secret: googleClientSecret,
      refresh_token: googleRefreshToken,
    };

    const accessToken = await getAccessToken(credentials);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get payment state URL from database
    const { data: paymentState, error: paymentError } = await supabase
      .from('Estados de pago')
      .select('URL')
      .eq('id', body.paymentId)
      .single();

    if (paymentError || !paymentState?.URL) {
      throw new Error('Payment state not found or no URL configured');
    }

    // Extract folder ID from URL
    const parentFolderId = extractFolderIdFromUrl(paymentState.URL);
    console.log(`Parent folder ID: ${parentFolderId}`);

    const uploadResults = [];

    // Process each document type
    for (const [docType, docData] of Object.entries(body.documents)) {
      console.log(`Processing document type: ${docType}`);
      
      if (docData.files.length === 0) {
        continue;
      }

      let targetFolderId = parentFolderId;

      // For multiple files (examenes, finiquitos), create a subfolder
      if (docData.files.length > 1 && (docType === 'examenes' || docType === 'finiquito')) {
        console.log(`Creating subfolder for ${docType}`);
        targetFolderId = await createGoogleDriveFolder(
          accessToken,
          docData.documentName,
          parentFolderId
        );
        console.log(`Created subfolder with ID: ${targetFolderId}`);
      }

      // Upload each file
      for (let i = 0; i < docData.files.length; i++) {
        const file = docData.files[i];
        let fileName = file.name;

        // For single files, rename to document name
        if (docData.files.length === 1 && docType !== 'examenes' && docType !== 'finiquito') {
          const extension = fileName.split('.').pop();
          fileName = `${docData.documentName}.${extension}`;
        }

        console.log(`Uploading file: ${fileName}`);
        
        const fileId = await uploadFileToDrive(
          accessToken,
          fileName,
          file.content,
          file.mimeType,
          targetFolderId
        );

        uploadResults.push({
          docType,
          fileName,
          fileId,
          success: true
        });

        console.log(`Successfully uploaded: ${fileName} with ID: ${fileId}`);
      }
    }

    console.log(`Upload complete. ${uploadResults.length} files uploaded.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        uploadResults,
        message: `Successfully uploaded ${uploadResults.length} files to Google Drive`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error uploading documents to Google Drive:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
