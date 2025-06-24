
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🚀 Upload documents function started');
    
    const { paymentId, documents } = await req.json();
    
    if (!paymentId || !documents) {
      console.error('❌ Missing required parameters');
      return Response.json(
        { success: false, error: 'Missing paymentId or documents' },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log(`📋 Processing documents for payment ${paymentId}:`, Object.keys(documents));

    // Get payment and project information
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.50.0');
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch payment details
    const { data: paymentData, error: paymentError } = await supabaseAdmin
      .from('Estados de pago')
      .select(`
        *,
        Proyectos!inner (
          *,
          Contratistas!inner (*)
        )
      `)
      .eq('id', paymentId)
      .single();

    if (paymentError || !paymentData) {
      console.error('❌ Error fetching payment data:', paymentError);
      return Response.json(
        { success: false, error: 'Payment not found' },
        { status: 404, headers: corsHeaders }
      );
    }

    console.log('✅ Payment data fetched successfully');

    // Get Google Drive credentials
    const clientId = Deno.env.get('GOOGLE_DRIVE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET');
    const refreshToken = Deno.env.get('GOOGLE_DRIVE_REFRESH_TOKEN');

    if (!clientId || !clientSecret || !refreshToken) {
      console.error('❌ Missing Google Drive credentials');
      return Response.json(
        { success: false, error: 'Missing Google Drive credentials' },
        { status: 500, headers: corsHeaders }
      );
    }

    // Get access token
    console.log('🔑 Getting Google Drive access token...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
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

    const { access_token } = await tokenResponse.json();
    console.log('✅ Access token obtained');

    // Create project folder structure
    const projectName = paymentData.Proyectos.Name;
    const folderName = `EP_${paymentData.Mes}_${paymentData.Año}`;
    
    console.log(`📁 Creating folder structure for ${projectName}/${folderName}`);

    // First, find or create the main project folder
    const projectSearchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(projectName)}' and mimeType='application/vnd.google-apps.folder'&fields=files(id,name)`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );

    let projectFolderId;
    const projectSearchData = await projectSearchResponse.json();
    
    if (projectSearchData.files && projectSearchData.files.length > 0) {
      projectFolderId = projectSearchData.files[0].id;
      console.log(`✅ Found existing project folder: ${projectFolderId}`);
    } else {
      // Create project folder
      const createProjectResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          mimeType: 'application/vnd.google-apps.folder',
        }),
      });

      if (!createProjectResponse.ok) {
        console.error('❌ Failed to create project folder');
        return Response.json(
          { success: false, error: 'Failed to create project folder' },
          { status: 500, headers: corsHeaders }
        );
      }

      const projectFolder = await createProjectResponse.json();
      projectFolderId = projectFolder.id;
      console.log(`✅ Created project folder: ${projectFolderId}`);
    }

    // Now find or create the payment state folder
    const stateSearchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(folderName)}' and '${projectFolderId}' in parents and mimeType='application/vnd.google-apps.folder'&fields=files(id,name)`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );

    let stateFolderId;
    const stateSearchData = await stateSearchResponse.json();
    
    if (stateSearchData.files && stateSearchData.files.length > 0) {
      stateFolderId = stateSearchData.files[0].id;
      console.log(`✅ Found existing state folder: ${stateFolderId}`);
    } else {
      // Create state folder
      const createStateResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [projectFolderId],
        }),
      });

      if (!createStateResponse.ok) {
        console.error('❌ Failed to create state folder');
        return Response.json(
          { success: false, error: 'Failed to create state folder' },
          { status: 500, headers: corsHeaders }
        );
      }

      const stateFolder = await createStateResponse.json();
      stateFolderId = stateFolder.id;
      console.log(`✅ Created state folder: ${stateFolderId}`);
    }

    // Upload documents
    const uploadResults = [];
    
    for (const [docType, docData] of Object.entries(documents)) {
      console.log(`📤 Uploading ${docType} with ${docData.files.length} files`);
      
      for (let i = 0; i < docData.files.length; i++) {
        const file = docData.files[i];
        
        try {
          // Validate base64 content
          if (!file.content || typeof file.content !== 'string') {
            console.error(`❌ Invalid file content for ${file.name}`);
            continue;
          }

          // Convert base64 to binary
          const binaryString = atob(file.content);
          const bytes = new Uint8Array(binaryString.length);
          for (let j = 0; j < binaryString.length; j++) {
            bytes[j] = binaryString.charCodeAt(j);
          }

          // Create metadata
          const metadata = {
            name: file.name,
            parents: [stateFolderId],
          };

          // Upload file using multipart upload
          const boundary = '-------314159265358979323846';
          const delimiter = `\r\n--${boundary}\r\n`;
          const close_delim = `\r\n--${boundary}--`;

          let body = delimiter +
            'Content-Type: application/json\r\n\r\n' +
            JSON.stringify(metadata) + delimiter +
            `Content-Type: ${file.mimeType || 'application/octet-stream'}\r\n` +
            'Content-Transfer-Encoding: base64\r\n\r\n' +
            file.content +
            close_delim;

          const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': `multipart/related; boundary="${boundary}"`,
            },
            body: body,
          });

          if (uploadResponse.ok) {
            const uploadedFile = await uploadResponse.json();
            uploadResults.push({
              documentType: docType,
              fileName: file.name,
              fileId: uploadedFile.id,
              success: true
            });
            console.log(`✅ Uploaded ${file.name} successfully`);
          } else {
            const errorText = await uploadResponse.text();
            console.error(`❌ Failed to upload ${file.name}:`, errorText);
            uploadResults.push({
              documentType: docType,
              fileName: file.name,
              success: false,
              error: errorText
            });
          }
        } catch (fileError) {
          console.error(`❌ Error processing file ${file.name}:`, fileError);
          uploadResults.push({
            documentType: docType,
            fileName: file.name,
            success: false,
            error: fileError.message
          });
        }
      }
    }

    // Update payment state with Google Drive URL
    const driveUrl = `https://drive.google.com/drive/folders/${stateFolderId}`;
    
    const { error: updateError } = await supabaseAdmin
      .from('Estados de pago')
      .update({ URL: driveUrl })
      .eq('id', paymentId);

    if (updateError) {
      console.error('❌ Error updating payment state URL:', updateError);
    } else {
      console.log('✅ Updated payment state with Drive URL');
    }

    console.log('🎉 Upload process completed successfully');

    return Response.json(
      {
        success: true,
        uploadResults,
        driveUrl,
        projectFolderId,
        stateFolderId
      },
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('❌ Unexpected error in upload function:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      },
      { status: 500, headers: corsHeaders }
    );
  }
});
