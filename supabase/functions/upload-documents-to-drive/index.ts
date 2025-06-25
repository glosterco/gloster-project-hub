
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🚀 Upload documents to drive function started');
    
    const { paymentId, documents } = await req.json();
    
    if (!paymentId || !documents || !Array.isArray(documents)) {
      console.error('❌ Missing required data:', { paymentId, documents });
      return Response.json(
        { success: false, error: 'Missing paymentId or documents' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log('📋 Processing upload for payment ID:', paymentId);
    console.log('📁 Number of documents to upload:', documents.length);

    // Initialize Supabase client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch payment details to get the existing Google Drive folder URL
    const { data: paymentData, error: paymentError } = await supabaseAdmin
      .from('Estados de pago')
      .select('URL, Name, Mes, Año')
      .eq('id', paymentId)
      .single();

    if (paymentError) {
      console.error('❌ Error fetching payment data:', paymentError);
      return Response.json(
        { success: false, error: 'Payment not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    console.log('✅ Payment data fetched successfully');
    console.log('📁 Drive URL from database:', paymentData.URL);

    // Extract folder ID from the URL field in the database
    let targetFolderId = null;
    if (paymentData.URL) {
      // Try different URL patterns for Google Drive folders
      const patterns = [
        /\/folders\/([a-zA-Z0-9-_]+)/,
        /\/drive\/folders\/([a-zA-Z0-9-_]+)/,
        /id=([a-zA-Z0-9-_]+)/,
        /^([a-zA-Z0-9-_]+)$/  // Direct folder ID
      ];
      
      for (const pattern of patterns) {
        const match = paymentData.URL.match(pattern);
        if (match) {
          targetFolderId = match[1];
          console.log(`📁 Extracted folder ID: ${targetFolderId} using pattern: ${pattern}`);
          break;
        }
      }
    }

    if (!targetFolderId) {
      console.error('❌ No valid Google Drive folder ID found in database URL:', paymentData.URL);
      return Response.json(
        { success: false, error: 'No valid Google Drive folder configured for this payment state. URL: ' + paymentData.URL },
        { status: 400, headers: corsHeaders }
      );
    }

    // Get Google Drive credentials
    const clientId = Deno.env.get('GOOGLE_DRIVE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET');
    const refreshToken = Deno.env.get('GOOGLE_DRIVE_REFRESH_TOKEN');

    if (!clientId || !clientSecret || !refreshToken) {
      console.error('❌ Missing Google Drive credentials');
      return Response.json(
        { success: false, error: 'Google Drive credentials not configured' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Get access token
    console.log('🔑 Getting access token...');
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
      console.error('❌ Failed to get access token:', await tokenResponse.text());
      return Response.json(
        { success: false, error: 'Failed to authenticate with Google Drive' },
        { status: 500, headers: corsHeaders }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    console.log('✅ Access token obtained');

    // Check if target folder exists and get existing files
    console.log('📂 Checking target folder and existing files...');
    const folderCheckResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${targetFolderId}'+in+parents&fields=files(id,name)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (!folderCheckResponse.ok) {
      console.error('❌ Failed to check target folder:', await folderCheckResponse.text());
      return Response.json(
        { success: false, error: 'Target folder not accessible' },
        { status: 400, headers: corsHeaders }
      );
    }

    const existingFiles = await folderCheckResponse.json();
    console.log('📋 Existing files in target folder:', existingFiles.files?.length || 0);

    // Upload each document
    const uploadResults = [];

    for (const doc of documents) {
      if (!doc.file || !doc.name) {
        console.warn('⚠️ Skipping invalid document:', doc);
        continue;
      }

      console.log(`📤 Uploading document: ${doc.name}`);

      try {
        // Check if file already exists and delete it
        const existingFile = existingFiles.files?.find(f => f.name === doc.name);
        if (existingFile) {
          console.log(`🗑️ Deleting existing file: ${doc.name} (${existingFile.id})`);
          await fetch(`https://www.googleapis.com/drive/v3/files/${existingFile.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${accessToken}` }
          });
        }

        // Handle multiple files for certain document types
        let finalFolderId = targetFolderId;
        if ((doc.name === 'Exámenes Preocupacionales' || doc.name === 'Finiquitos') && doc.files && doc.files.length > 1) {
          // Create subfolder for multiple files
          const subfolderName = doc.name;
          const createFolderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: subfolderName,
              mimeType: 'application/vnd.google-apps.folder',
              parents: [targetFolderId]
            }),
          });

          if (createFolderResponse.ok) {
            const folderData = await createFolderResponse.json();
            finalFolderId = folderData.id;
            console.log(`📁 Created subfolder: ${subfolderName} (${finalFolderId})`);
          }
        }

        // Upload file using multipart upload
        const boundary = `----formdata-${Date.now()}`;
        const metadata = {
          name: doc.name,
          parents: [finalFolderId]
        };

        const multipartBody = [
          `--${boundary}`,
          'Content-Type: application/json; charset=UTF-8',
          '',
          JSON.stringify(metadata),
          `--${boundary}`,
          `Content-Type: ${doc.file.type || 'application/octet-stream'}`,
          '',
          doc.file.content,
          `--${boundary}--`
        ].join('\r\n');

        const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
        });

        if (uploadResponse.ok) {
          const uploadedFile = await uploadResponse.json();
          console.log(`✅ Uploaded ${doc.name} successfully to folder ${finalFolderId}`);
          uploadResults.push({
            success: true,
            fileId: uploadedFile.id,
            fileName: doc.name
          });
        } else {
          console.error(`❌ Failed to upload ${doc.name}:`, await uploadResponse.text());
          uploadResults.push({
            success: false,
            error: `Failed to upload ${doc.name}`,
            fileName: doc.name
          });
        }
      } catch (error) {
        console.error(`❌ Error uploading ${doc.name}:`, error);
        uploadResults.push({
          success: false,
          error: error.message,
          fileName: doc.name
        });
      }
    }

    const successfulUploads = uploadResults.filter(r => r.success);
    const failedUploads = uploadResults.filter(r => !r.success);

    console.log(`✅ Upload completed. Success: ${successfulUploads.length}, Failed: ${failedUploads.length}`);

    return Response.json({
      success: failedUploads.length === 0,
      uploadResults,
      successCount: successfulUploads.length,
      failureCount: failedUploads.length,
      targetFolderId
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500, headers: corsHeaders }
    );
  }
})
