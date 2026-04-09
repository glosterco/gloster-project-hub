import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getAccessToken(): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_DRIVE_CLIENT_ID')?.replace(/[\r\n\t\s]+/g, '').trim();
  const clientSecret = Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET')?.replace(/[\r\n\t\s]+/g, '').trim();
  const refreshToken = Deno.env.get('GOOGLE_DRIVE_REFRESH_TOKEN')?.replace(/[\r\n\t\s]+/g, '').trim();

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Missing Google Drive credentials');
  }

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

  const tokenResult = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenResult.access_token) {
    throw new Error(`Google Drive authentication failed: ${tokenResult.error_description || tokenResult.error || tokenResponse.status}`);
  }

  return tokenResult.access_token as string;
}

async function createGoogleDriveFolder(
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<{ id: string; url: string }> {
  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentFolderId) metadata.parents = [parentFolderId];

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

  return { id: data.id, url: `https://drive.google.com/drive/u/2/folders/${data.id}` };
}

async function uploadFileToDrive(
  accessToken: string,
  fileName: string,
  fileContent: string,
  mimeType: string,
  parentFolderId: string
): Promise<{ id: string; webViewLink: string }> {
  // Decode base64
  const binaryString = atob(fileContent);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const boundary = '-------boundary' + Date.now();
  const metadata = JSON.stringify({
    name: fileName,
    parents: [parentFolderId],
  });

  const body = [
    `--${boundary}\r\n`,
    'Content-Type: application/json; charset=UTF-8\r\n\r\n',
    metadata + '\r\n',
    `--${boundary}\r\n`,
    `Content-Type: ${mimeType}\r\n`,
    'Content-Transfer-Encoding: base64\r\n\r\n',
    fileContent + '\r\n',
    `--${boundary}--`,
  ].join('');

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to upload file: ${data.error?.message || 'Unknown error'}`);
  }

  return { id: data.id, webViewLink: data.webViewLink || `https://drive.google.com/file/d/${data.id}/view` };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { licitacionId, licitacionName, documents, notifyOferentes, targetSubfolder, documentTipo } = await req.json();

    if (!licitacionId || !documents || !Array.isArray(documents) || documents.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing licitacionId or documents' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const accessToken = await getAccessToken();

    // Get licitacion data
    const { data: licitacion, error: licitacionError } = await supabase
      .from('Licitaciones')
      .select('id, nombre, drive_folder_id, drive_docs_folder_id')
      .eq('id', licitacionId)
      .single();

    if (licitacionError || !licitacion) {
      throw new Error('Licitación no encontrada');
    }

    let docsFolderId = licitacion.drive_docs_folder_id;

    // Create folder structure if it doesn't exist
    if (!licitacion.drive_folder_id) {
      const folderName = `L${licitacionId} - ${licitacionName || licitacion.nombre}`;
      console.log('📁 Creating licitación folder:', folderName);
      const mainFolder = await createGoogleDriveFolder(accessToken, folderName);

      const docsFolder = await createGoogleDriveFolder(accessToken, 'Documentos', mainFolder.id);
      docsFolderId = docsFolder.id;

      await supabase
        .from('Licitaciones')
        .update({
          drive_folder_id: mainFolder.id,
          drive_folder_url: mainFolder.url,
          drive_docs_folder_id: docsFolder.id,
          drive_docs_folder_url: docsFolder.url,
        })
        .eq('id', licitacionId);

      console.log('✅ Folder structure created');
    } else if (!docsFolderId) {
      const docsFolder = await createGoogleDriveFolder(accessToken, 'Documentos', licitacion.drive_folder_id);
      docsFolderId = docsFolder.id;

      await supabase
        .from('Licitaciones')
        .update({
          drive_docs_folder_id: docsFolder.id,
          drive_docs_folder_url: docsFolder.url,
        })
        .eq('id', licitacionId);
    }

    // If a target subfolder is specified, create/find it inside the main licitacion folder
    let uploadFolderId = docsFolderId!;
    if (targetSubfolder && licitacion.drive_folder_id) {
      // Search for existing subfolder
      const searchQuery = `name='${targetSubfolder}' and '${licitacion.drive_folder_id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const searchResp = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(searchQuery)}&fields=files(id)`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );
      const searchData = await searchResp.json();
      if (searchData.files && searchData.files.length > 0) {
        uploadFolderId = searchData.files[0].id;
        console.log(`📁 Found existing subfolder '${targetSubfolder}': ${uploadFolderId}`);
      } else {
        const subFolder = await createGoogleDriveFolder(accessToken, targetSubfolder, licitacion.drive_folder_id);
        uploadFolderId = subFolder.id;
        console.log(`📁 Created subfolder '${targetSubfolder}': ${uploadFolderId}`);
      }
    }

    // Upload each document
    const uploadResults = [];
    for (const doc of documents) {
      try {
        console.log(`📤 Uploading: ${doc.name}`);
        const result = await uploadFileToDrive(
          accessToken,
          doc.name,
          doc.content,
          doc.mimeType || 'application/octet-stream',
          uploadFolderId
        );

        // Insert into LicitacionDocumentos
        const { error: insertError } = await supabase
          .from('LicitacionDocumentos')
          .insert({
            licitacion_id: licitacionId,
            nombre: doc.name,
            size: doc.size || null,
            tipo: documentTipo || doc.mimeType || 'application/octet-stream',
            url: result.webViewLink,
          });

        if (insertError) {
          console.error(`❌ Error inserting doc record:`, insertError);
        }

        uploadResults.push({ name: doc.name, success: true, url: result.webViewLink });
        console.log(`✅ Uploaded: ${doc.name}`);
      } catch (err) {
        console.error(`❌ Error uploading ${doc.name}:`, err);
        uploadResults.push({ name: doc.name, success: false, error: err.message });
      }
    }

    // Notify oferentes if requested
    if (notifyOferentes) {
      console.log('📧 Notifying oferentes about new documents...');
      
      const { data: oferentes } = await supabase
        .from('LicitacionOferentes')
        .select('email')
        .eq('licitacion_id', licitacionId);

      if (oferentes && oferentes.length > 0) {
        // Get licitacion access URL
        const { data: licitacionFull } = await supabase
          .from('Licitaciones')
          .select('url_acceso, nombre')
          .eq('id', licitacionId)
          .single();

        for (const oferente of oferentes) {
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-licitacion-invitation`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
              },
              body: JSON.stringify({
                email: oferente.email,
                licitacionNombre: licitacionFull?.nombre || licitacion.nombre,
                urlAcceso: licitacionFull?.url_acceso || '',
                licitacionId: licitacionId,
                isDocumentNotification: true,
                documentCount: documents.length,
              }),
            });
            console.log(`✅ Notified: ${oferente.email}`);
          } catch (err) {
            console.error(`❌ Failed to notify ${oferente.email}:`, err);
          }
        }
      }
    }

    const allSucceeded = uploadResults.length > 0 && uploadResults.every((result) => result.success);
    const failedCount = uploadResults.filter((result) => !result.success).length;

    return new Response(
      JSON.stringify({ success: allSucceeded, failedCount, uploadResults }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
