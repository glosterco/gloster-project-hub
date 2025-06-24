
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

    // Fetch payment details with existing URL
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

    // Extract folder ID from existing URL if available
    let targetFolderId = null;
    if (paymentData.URL) {
      const urlMatch = paymentData.URL.match(/\/folders\/([a-zA-Z0-9-_]+)/);
      if (urlMatch) {
        targetFolderId = urlMatch[1];
        console.log(`📁 Using existing folder ID: ${targetFolderId}`);
      }
    }

    // If no existing folder, create the structure
    if (!targetFolderId) {
      const projectName = paymentData.Proyectos.Name;
      const folderName = `EP_${paymentData.Mes}_${paymentData.Año}`;
      
      console.log(`📁 Creating new folder structure for ${projectName}/${folderName}`);

      // Find or create project folder
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

      // Create payment state folder
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
      targetFolderId = stateFolder.id;
      console.log(`✅ Created state folder: ${targetFolderId}`);

      // Update payment state with new Drive URL
      const driveUrl = `https://drive.google.com/drive/folders/${targetFolderId}`;
      const { error: updateError } = await supabaseAdmin
        .from('Estados de pago')
        .update({ URL: driveUrl })
        .eq('id', paymentId);

      if (updateError) {
        console.error('❌ Error updating payment state URL:', updateError);
      } else {
        console.log('✅ Updated payment state with new Drive URL');
      }
    }

    // Check for existing files and warn if needed
    const existingFilesResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q='${targetFolderId}' in parents and trashed=false&fields=files(id,name)`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        },
      }
    );

    const existingFilesData = await existingFilesResponse.json();
    const hasExistingFiles = existingFilesData.files && existingFilesData.files.length > 0;

    if (hasExistingFiles) {
      console.log(`⚠️ Found ${existingFilesData.files.length} existing files in folder. They will be replaced.`);
    }

    // Upload documents
    const uploadResults = [];
    
    for (const [docType, docData] of Object.entries(documents)) {
      console.log(`📤 Processing ${docType} with ${docData.files.length} files`);
      
      // Handle multiple files for examenes and finiquitos
      if ((docType === 'examenes' || docType === 'finiquito') && docData.files.length > 1) {
        // Create subfolder
        const subfolderName = docType === 'examenes' ? 'Exámenes Preocupacionales' : 'Finiquitos';
        const createSubfolderResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: subfolderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [targetFolderId],
          }),
        });

        let subFolderId = targetFolderId;
        if (createSubfolderResponse.ok) {
          const subFolder = await createSubfolderResponse.json();
          subFolderId = subFolder.id;
          console.log(`✅ Created subfolder: ${subfolderName}`);
        }

        // Upload files to subfolder
        for (let i = 0; i < docData.files.length; i++) {
          const file = docData.files[i];
          const fileName = `${docData.documentName}_${i + 1}.${file.name.split('.').pop()}`;
          
          const uploadResult = await uploadFileToFolder(file, fileName, subFolderId, access_token);
          uploadResults.push({
            documentType: docType,
            fileName: fileName,
            ...uploadResult
          });
        }
      } else {
        // Single file or first file
        const file = docData.files[0];
        const fileName = `${docData.documentName}.${file.name.split('.').pop()}`;
        
        const uploadResult = await uploadFileToFolder(file, fileName, targetFolderId, access_token);
        uploadResults.push({
          documentType: docType,
          fileName: fileName,
          ...uploadResult
        });
      }
    }

    console.log('🎉 Upload process completed successfully');

    return Response.json(
      {
        success: true,
        uploadResults,
        driveUrl: `https://drive.google.com/drive/folders/${targetFolderId}`,
        folderId: targetFolderId,
        existingFilesReplaced: hasExistingFiles
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

// Helper function to upload a file to a specific folder
async function uploadFileToFolder(file: any, fileName: string, folderId: string, accessToken: string) {
  try {
    // Delete existing file with same name if it exists
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(fileName)}' and '${folderId}' in parents and trashed=false&fields=files(id,name)`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    const searchData = await searchResponse.json();
    if (searchData.files && searchData.files.length > 0) {
      // Delete existing file
      const deleteResponse = await fetch(`https://www.googleapis.com/drive/v3/files/${searchData.files[0].id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      console.log(`🗑️ Deleted existing file: ${fileName}`);
    }

    // Convert base64 to binary
    const binaryString = atob(file.content);
    const bytes = new Uint8Array(binaryString.length);
    for (let j = 0; j < binaryString.length; j++) {
      bytes[j] = binaryString.charCodeAt(j);
    }

    // Create metadata
    const metadata = {
      name: fileName,
      parents: [folderId],
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
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body: body,
    });

    if (uploadResponse.ok) {
      const uploadedFile = await uploadResponse.json();
      console.log(`✅ Uploaded ${fileName} successfully`);
      return {
        success: true,
        fileId: uploadedFile.id
      };
    } else {
      const errorText = await uploadResponse.text();
      console.error(`❌ Failed to upload ${fileName}:`, errorText);
      return {
        success: false,
        error: errorText
      };
    }
  } catch (fileError) {
    console.error(`❌ Error processing file ${fileName}:`, fileError);
    return {
      success: false,
      error: fileError.message
    };
  }
}
