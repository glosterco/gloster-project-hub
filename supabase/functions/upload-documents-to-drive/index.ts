
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
  console.log('🔑 Getting access token...');
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
    console.error('❌ Failed to get access token:', data);
    throw new Error(`Failed to get access token: ${data.error_description || data.error}`);
  }

  console.log('✅ Access token obtained successfully');
  return data.access_token;
}

async function createGoogleDriveFolder(
  accessToken: string,
  folderName: string,
  parentFolderId: string
): Promise<string> {
  console.log(`📁 Creating folder "${folderName}" in parent ${parentFolderId}`);
  
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
    console.error('❌ Failed to create folder:', data);
    throw new Error(`Failed to create folder: ${data.error?.message || 'Unknown error'}`);
  }

  console.log(`✅ Folder created with ID: ${data.id}`);
  return data.id;
}

async function uploadFileToDrive(
  accessToken: string,
  fileName: string,
  fileContent: string,
  mimeType: string,
  parentFolderId: string
): Promise<string> {
  console.log(`📤 Uploading file "${fileName}" to folder ${parentFolderId}`);
  
  if (!fileContent || fileContent.trim() === '') {
    throw new Error(`File content is empty for ${fileName}`);
  }
  
  try {
    // Convert base64 to binary
    const binaryContent = Uint8Array.from(atob(fileContent), c => c.charCodeAt(0));
    console.log(`📊 File "${fileName}" size: ${binaryContent.length} bytes`);
    
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
      console.error('❌ Failed to upload file:', data);
      throw new Error(`Failed to upload file ${fileName}: ${data.error?.message || 'Unknown error'}`);
    }

    console.log(`✅ File "${fileName}" uploaded with ID: ${data.id}`);
    return data.id;
  } catch (error) {
    console.error(`❌ Error uploading file "${fileName}":`, error);
    throw error;
  }
}

function extractFolderIdFromUrl(url: string): string {
  console.log(`🔍 Extracting folder ID from URL: ${url}`);
  
  // Extract folder ID from Google Drive URL
  const match = url.match(/\/folders\/([a-zA-Z0-9-_]+)/);
  if (!match) {
    console.error('❌ Invalid Google Drive URL format:', url);
    throw new Error(`Invalid Google Drive URL format: ${url}`);
  }
  
  const folderId = match[1];
  console.log(`✅ Extracted folder ID: ${folderId}`);
  return folderId;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Starting document upload process...');
    const body: UploadDocumentsRequest = await req.json();
    console.log('📋 Request data:', {
      paymentId: body.paymentId,
      documentTypes: Object.keys(body.documents),
      totalFiles: Object.values(body.documents).reduce((acc, doc) => acc + doc.files.length, 0)
    });
    
    // Get Google Drive credentials from Supabase secrets
    const googleClientId = Deno.env.get('GOOGLE_DRIVE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET');
    const googleRefreshToken = Deno.env.get('GOOGLE_DRIVE_REFRESH_TOKEN');

    if (!googleClientId || !googleClientSecret || !googleRefreshToken) {
      console.error('❌ Google Drive credentials not configured');
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

    console.log(`🔍 Looking for payment state with ID: ${body.paymentId}`);

    // Get payment state URL from database
    const { data: paymentState, error: paymentError } = await supabase
      .from('Estados de pago')
      .select('URL')
      .eq('id', body.paymentId)
      .single();

    if (paymentError) {
      console.error('❌ Error fetching payment state:', paymentError);
      throw new Error(`Payment state not found: ${paymentError.message}`);
    }

    if (!paymentState?.URL) {
      console.error('❌ No URL found for payment state');
      throw new Error('Payment state URL not configured');
    }

    console.log(`✅ Found payment state URL: ${paymentState.URL}`);

    // Extract folder ID from URL
    const parentFolderId = extractFolderIdFromUrl(paymentState.URL);

    const uploadResults = [];

    // Process each document type
    for (const [docType, docData] of Object.entries(body.documents)) {
      console.log(`📂 Processing document type: ${docType} (${docData.files.length} files)`);
      
      if (docData.files.length === 0) {
        console.log(`⏭️ Skipping ${docType} - no files`);
        continue;
      }

      // Validate that files have content
      const validFiles = docData.files.filter(file => file.content && file.content.trim() !== '');
      if (validFiles.length === 0) {
        console.error(`❌ No valid files with content for ${docType}`);
        throw new Error(`No valid files with content found for ${docType}`);
      }

      if (validFiles.length !== docData.files.length) {
        console.warn(`⚠️ Some files for ${docType} have empty content`);
      }

      let targetFolderId = parentFolderId;

      // For multiple files (examenes, finiquitos), create a subfolder
      if (validFiles.length > 1 && (docType === 'examenes' || docType === 'finiquito')) {
        console.log(`📁 Creating subfolder for ${docType}`);
        targetFolderId = await createGoogleDriveFolder(
          accessToken,
          docData.documentName,
          parentFolderId
        );
      }

      // Upload each valid file
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        let fileName = file.name;

        // For single files, rename to document name (except examenes and finiquitos)
        if (validFiles.length === 1 && docType !== 'examenes' && docType !== 'finiquito') {
          const extension = fileName.split('.').pop();
          fileName = `${docData.documentName}.${extension}`;
          console.log(`📝 Renaming file to: ${fileName}`);
        }

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
      }
    }

    console.log(`🎉 Upload complete! ${uploadResults.length} files uploaded successfully.`);

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
    console.error('💥 Error uploading documents to Google Drive:', error);
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
