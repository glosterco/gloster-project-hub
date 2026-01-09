import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface RFIMessageRequest {
  action: 'add_message' | 'close_rfi' | 'get_messages' | 'upload_attachments' | 'upload_adicional_attachments';
  rfiId?: number;
  adicionalId?: number;
  projectId?: number;
  authorEmail: string;
  authorName?: string;
  authorRole: 'contratista' | 'mandante' | 'aprobador' | 'especialista';
  messageText?: string;
  attachments?: {
    fileName: string;
    fileContent: string; // base64
    mimeType: string;
  }[];
}

// Get access token for Google Drive
async function getAccessToken(): Promise<string> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const tempClient = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await tempClient.functions.invoke('google-drive-token-manager', { body: {} });
  
  if (error) {
    throw new Error(`Failed to call token manager: ${error.message}`);
  }
  
  const accessToken = data?.access_token || data?.accessToken;
  const isValid = data?.valid ?? data?.isValid;
  if (!isValid || !accessToken) {
    throw new Error('Failed to get valid Google Drive access token');
  }
  
  return accessToken;
}

// Create a subfolder in Google Drive
async function createDriveFolder(
  accessToken: string,
  parentFolderId: string,
  folderName: string
): Promise<{ id: string; webViewLink: string }> {
  const metadata = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentFolderId],
  };

  const response = await fetch(
    'https://www.googleapis.com/drive/v3/files?fields=id,webViewLink',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create folder: ${errorText}`);
  }

  return await response.json();
}

// Check if folder exists in Drive
async function folderExists(accessToken: string, folderId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,mimeType`,
      { headers: { 'Authorization': `Bearer ${accessToken}` } }
    );
    if (!response.ok) return false;
    const data = await response.json();
    return data.mimeType === 'application/vnd.google-apps.folder';
  } catch {
    return false;
  }
}

// Find subfolder by name in parent
async function findSubfolder(
  accessToken: string,
  parentFolderId: string,
  folderName: string
): Promise<string | null> {
  const query = encodeURIComponent(`'${parentFolderId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  );

  if (!response.ok) return null;
  const data = await response.json();
  return data.files?.[0]?.id || null;
}

// Upload a file to Google Drive
async function uploadFileToDrive(
  accessToken: string,
  folderId: string,
  fileName: string,
  fileContent: string,
  mimeType: string
): Promise<{ id: string; webViewLink: string }> {
  const base64Data = fileContent.includes(',') ? fileContent.split(',')[1] : fileContent;
  
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
    throw new Error(`Failed to upload file: ${errorText}`);
  }

  return await response.json();
}

// Extract folder ID from Google Drive URL
function extractFolderId(url: string | null): string | null {
  if (!url) return null;
  
  // If it's already a folder ID (no slashes, just alphanumeric with hyphens/underscores)
  if (/^[a-zA-Z0-9_-]+$/.test(url)) {
    return url;
  }
  
  const match = url.match(/folders\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// Create or get RFI base folder
async function ensureRFIFolder(
  accessToken: string,
  projectId: number,
  projectName: string,
  projectUrl: string | null
): Promise<string | null> {
  try {
    let parentFolderId: string | null = null;
    
    if (projectUrl) {
      parentFolderId = extractFolderId(projectUrl);
      console.log('📁 Parent folder ID:', parentFolderId);
    }
    
    if (!parentFolderId) {
      console.log('⚠️ No parent folder found for project');
      return null;
    }
    
    // Check if RFI folder already exists
    const existingRfiFolderId = await findSubfolder(accessToken, parentFolderId, 'RFI');
    if (existingRfiFolderId) {
      console.log('✅ Found existing RFI folder:', existingRfiFolderId);
      
      // Update project if URL_RFI not set
      const { error: updateError } = await supabase
        .from('Proyectos')
        .update({ URL_RFI: `https://drive.google.com/drive/folders/${existingRfiFolderId}` })
        .eq('id', projectId)
        .is('URL_RFI', null);
      
      if (!updateError) {
        console.log('✅ Updated project URL_RFI');
      }
      
      return existingRfiFolderId;
    }
    
    console.log('📁 Creating RFI folder...');
    const folder = await createDriveFolder(accessToken, parentFolderId, 'RFI');
    
    // Update project with RFI folder URL
    const { error: updateError } = await supabase
      .from('Proyectos')
      .update({ URL_RFI: folder.webViewLink })
      .eq('id', projectId);
    
    if (updateError) {
      console.error('⚠️ Error updating project URL_RFI:', updateError.message);
    } else {
      console.log('✅ Project URL_RFI updated:', folder.webViewLink);
    }
    
    return folder.id;
  } catch (error: any) {
    console.error('❌ Error ensuring RFI folder:', error.message);
    return null;
  }
}

// Create or get RFI-specific subfolder (RFI_XX)
async function ensureRFISubfolder(
  accessToken: string,
  rfiFolderId: string,
  rfiCorrelativo: number
): Promise<{ id: string; webViewLink: string }> {
  const folderName = `RFI_${String(rfiCorrelativo).padStart(2, '0')}`;
  
  // Check if subfolder exists
  const existingFolderId = await findSubfolder(accessToken, rfiFolderId, folderName);
  if (existingFolderId) {
    console.log(`✅ Found existing RFI subfolder: ${folderName}`);
    return { id: existingFolderId, webViewLink: `https://drive.google.com/drive/folders/${existingFolderId}` };
  }
  
  // Create new subfolder
  console.log(`📁 Creating RFI subfolder: ${folderName}`);
  return await createDriveFolder(accessToken, rfiFolderId, folderName);
}

// Send notification emails for new message
async function sendMessageNotification(
  rfiId: number,
  projectId: number,
  authorEmail: string,
  authorName: string,
  messageText: string
): Promise<void> {
  try {
    await supabase.functions.invoke('send-rfi-message-notification', {
      body: {
        rfiId,
        projectId,
        authorEmail,
        authorName,
        messageText,
      }
    });
    console.log('✅ Message notification triggered');
  } catch (error) {
    console.error('⚠️ Failed to send message notification:', error);
  }
}

// Send close notification
async function sendCloseNotification(
  rfiId: number,
  projectId: number,
  closedByEmail: string,
  closedByName: string
): Promise<void> {
  try {
    await supabase.functions.invoke('send-rfi-close-notification', {
      body: {
        rfiId,
        projectId,
        closedByEmail,
        closedByName,
      }
    });
    console.log('✅ Close notification triggered');
  } catch (error) {
    console.error('⚠️ Failed to send close notification:', error);
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: RFIMessageRequest = await req.json();
    console.log("📧 RFI Message request:", data.action, "RFI ID:", data.rfiId);

    // ========================================
    // ACTION: GET MESSAGES
    // ========================================
    if (data.action === 'get_messages') {
      const { data: messages, error } = await supabase
        .from('rfi_messages')
        .select('*')
        .eq('rfi_id', data.rfiId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch messages: ${error.message}`);
      }

      return new Response(
        JSON.stringify({ success: true, messages }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ========================================
    // ACTION: ADD MESSAGE
    // ========================================
    if (data.action === 'add_message') {
      if (!data.messageText?.trim()) {
        throw new Error('Message text is required');
      }

      // Fetch RFI and project info
      const { data: rfi, error: rfiError } = await supabase
        .from('RFI')
        .select('*, Proyecto, Correlativo')
        .eq('id', data.rfiId)
        .single();

      if (rfiError || !rfi) {
        throw new Error(`RFI not found: ${rfiError?.message}`);
      }

      const projectId = data.projectId || rfi.Proyecto;
      const rfiCorrelativo = rfi.Correlativo || rfi.id;

      // Fetch project for RFI folder URL
      const { data: project, error: projectError } = await supabase
        .from('Proyectos')
        .select('URL_RFI, Name, URL')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        throw new Error(`Project not found: ${projectError?.message}`);
      }

      let attachmentsUrl: string | null = null;

      // Handle attachments if any
      if (data.attachments && data.attachments.length > 0) {
        console.log('📎 Processing attachments:', data.attachments.length);
        
        try {
          const accessToken = await getAccessToken();
          console.log('✅ Got access token');
          
          // 1️⃣ Ensure base RFI folder exists
          let rfiFolderId: string | null = extractFolderId(project.URL_RFI);
          
          if (!rfiFolderId || !(await folderExists(accessToken, rfiFolderId))) {
            console.log('⚠️ RFI folder not found, creating...');
            rfiFolderId = await ensureRFIFolder(
              accessToken,
              projectId,
              project.Name || `Proyecto_${projectId}`,
              project.URL
            );
          }

          if (!rfiFolderId) {
            console.log('⚠️ Could not create RFI folder, proceeding without attachments');
          } else {
            // 2️⃣ Get or create RFI-specific subfolder (RFI_XX)
            const rfiSubfolder = await ensureRFISubfolder(accessToken, rfiFolderId, rfiCorrelativo);
            console.log(`✅ RFI subfolder ready: RFI_${String(rfiCorrelativo).padStart(2, '0')}`);

            // 3️⃣ Upload files based on count
            if (data.attachments.length === 1) {
              // Single file: upload directly to RFI_XX folder
              const file = data.attachments[0];
              console.log('📁 Uploading single file:', file.fileName);
              const result = await uploadFileToDrive(
                accessToken,
                rfiSubfolder.id,
                file.fileName,
                file.fileContent,
                file.mimeType
              );
              attachmentsUrl = result.webViewLink;
              console.log('✅ Single file uploaded:', result.webViewLink);
            } else {
              // Multiple files: create response subfolder with timestamp
              const now = new Date();
              const timestamp = now.toISOString().replace(/[-:T]/g, '').slice(0, 12); // YYYYMMDDHHMI
              const responseFolderName = `RESPUESTA_${timestamp}`;
              
              console.log('📂 Creating response subfolder:', responseFolderName);
              const responseFolder = await createDriveFolder(accessToken, rfiSubfolder.id, responseFolderName);
              
              // Upload all files to response folder
              for (const file of data.attachments) {
                console.log('📁 Uploading file:', file.fileName);
                await uploadFileToDrive(
                  accessToken,
                  responseFolder.id,
                  file.fileName,
                  file.fileContent,
                  file.mimeType
                );
              }
              
              attachmentsUrl = responseFolder.webViewLink;
              console.log('✅ Multiple files uploaded to folder:', responseFolder.webViewLink);
            }
          }
        } catch (uploadError: any) {
          console.error('⚠️ Error uploading attachments:', uploadError.message);
          // Continue without attachments - don't fail the whole message
        }
      }

      // Insert message
      const { data: insertedMessage, error: insertError } = await supabase
        .from('rfi_messages')
        .insert({
          rfi_id: data.rfiId,
          project_id: projectId,
          author_email: data.authorEmail,
          author_name: data.authorName || data.authorEmail,
          author_role: data.authorRole,
          message_text: data.messageText,
          attachments_url: attachmentsUrl,
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(`Failed to insert message: ${insertError.message}`);
      }

      // Update RFI status to 'Respondido' if currently 'Pendiente'
      if (rfi.Status === 'Pendiente') {
        await supabase
          .from('RFI')
          .update({ Status: 'Respondido' })
          .eq('id', data.rfiId);
        console.log('✅ RFI status updated to Respondido');
      }

      // Send notification (fire and forget)
      sendMessageNotification(
        data.rfiId,
        projectId,
        data.authorEmail,
        data.authorName || data.authorEmail,
        data.messageText
      );

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: insertedMessage,
          attachmentsUrl 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ========================================
    // ACTION: UPLOAD ATTACHMENTS (for RFI creation - no message, no status change)
    // ========================================
    if (data.action === 'upload_attachments') {
      // Fetch RFI and project info
      const { data: rfi, error: rfiError } = await supabase
        .from('RFI')
        .select('*, Proyecto, Correlativo')
        .eq('id', data.rfiId)
        .single();

      if (rfiError || !rfi) {
        throw new Error(`RFI not found: ${rfiError?.message}`);
      }

      const projectId = data.projectId || rfi.Proyecto;
      const rfiCorrelativo = rfi.Correlativo || rfi.id;

      // Fetch project for RFI folder URL
      const { data: project, error: projectError } = await supabase
        .from('Proyectos')
        .select('URL_RFI, Name, URL')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        throw new Error(`Project not found: ${projectError?.message}`);
      }

      if (!data.attachments || data.attachments.length === 0) {
        throw new Error('No attachments provided');
      }

      let attachmentsUrl: string | null = null;

      console.log('📎 Uploading attachments for new RFI:', data.attachments.length);
      
      try {
        const accessToken = await getAccessToken();
        console.log('✅ Got access token');
        
        // 1️⃣ Ensure base RFI folder exists
        let rfiFolderId: string | null = extractFolderId(project.URL_RFI);
        
        if (!rfiFolderId || !(await folderExists(accessToken, rfiFolderId))) {
          console.log('⚠️ RFI folder not found, creating...');
          rfiFolderId = await ensureRFIFolder(
            accessToken,
            projectId,
            project.Name || `Proyecto_${projectId}`,
            project.URL
          );
        }

        if (!rfiFolderId) {
          throw new Error('Could not create RFI folder');
        }

        // 2️⃣ Get or create RFI-specific subfolder (RFI_XX)
        const rfiSubfolder = await ensureRFISubfolder(accessToken, rfiFolderId, rfiCorrelativo);
        console.log(`✅ RFI subfolder ready: RFI_${String(rfiCorrelativo).padStart(2, '0')}`);

        // 3️⃣ Upload files based on count
        if (data.attachments.length === 1) {
          // Single file: upload directly to RFI_XX folder
          const file = data.attachments[0];
          console.log('📁 Uploading single file:', file.fileName);
          const result = await uploadFileToDrive(
            accessToken,
            rfiSubfolder.id,
            file.fileName,
            file.fileContent,
            file.mimeType
          );
          attachmentsUrl = result.webViewLink;
          console.log('✅ Single file uploaded:', result.webViewLink);
        } else {
          // Multiple files: upload all to RFI_XX folder directly (no subfolder for creation)
          for (const file of data.attachments) {
            console.log('📁 Uploading file:', file.fileName);
            await uploadFileToDrive(
              accessToken,
              rfiSubfolder.id,
              file.fileName,
              file.fileContent,
              file.mimeType
            );
          }
          // Use folder URL when multiple files
          attachmentsUrl = rfiSubfolder.webViewLink;
          console.log('✅ Multiple files uploaded to folder:', rfiSubfolder.webViewLink);
        }

        // 4️⃣ Update RFI.URL with attachments URL (NOT create a message)
        const { error: updateError } = await supabase
          .from('RFI')
          .update({ URL: attachmentsUrl })
          .eq('id', data.rfiId);

        if (updateError) {
          console.error('⚠️ Error updating RFI.URL:', updateError.message);
        } else {
          console.log('✅ RFI.URL updated with attachments');
        }

      } catch (uploadError: any) {
        console.error('❌ Error uploading attachments:', uploadError.message);
        throw uploadError;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          attachmentsUrl 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ========================================
    // ACTION: UPLOAD ADICIONAL ATTACHMENTS
    // ========================================
    if (data.action === 'upload_adicional_attachments') {
      if (!data.adicionalId) {
        throw new Error('adicionalId is required for upload_adicional_attachments');
      }

      // Fetch Adicional and project info
      const { data: adicional, error: adicionalError } = await supabase
        .from('Adicionales')
        .select('*, Proyecto, Correlativo')
        .eq('id', data.adicionalId)
        .single();

      if (adicionalError || !adicional) {
        throw new Error(`Adicional not found: ${adicionalError?.message}`);
      }

      const projectId = data.projectId || adicional.Proyecto;
      const adicionalCorrelativo = adicional.Correlativo || adicional.id;

      // Fetch project for Adicionales folder URL
      const { data: project, error: projectError } = await supabase
        .from('Proyectos')
        .select('URL_Ad, Name, URL')
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        throw new Error(`Project not found: ${projectError?.message}`);
      }

      if (!data.attachments || data.attachments.length === 0) {
        throw new Error('No attachments provided');
      }

      let attachmentsUrl: string | null = null;

      console.log('📎 Uploading attachments for Adicional:', data.attachments.length);
      
      try {
        const accessToken = await getAccessToken();
        console.log('✅ Got access token');
        
        // 1️⃣ Get or ensure Adicionales base folder exists
        let adicionalFolderId: string | null = extractFolderId(project.URL_Ad);
        
        if (!adicionalFolderId || !(await folderExists(accessToken, adicionalFolderId))) {
          console.log('⚠️ Adicionales folder not found, creating...');
          // Get parent project folder
          const parentFolderId = extractFolderId(project.URL);
          if (parentFolderId) {
            // Check if Adicionales folder exists
            const existingFolderId = await findSubfolder(accessToken, parentFolderId, 'Adicionales');
            if (existingFolderId) {
              adicionalFolderId = existingFolderId;
            } else {
              // Create Adicionales folder
              const folder = await createDriveFolder(accessToken, parentFolderId, 'Adicionales');
              adicionalFolderId = folder.id;
              
              // Update project with Adicionales folder URL
              await supabase
                .from('Proyectos')
                .update({ URL_Ad: folder.webViewLink })
                .eq('id', projectId);
            }
          }
        }

        if (!adicionalFolderId) {
          throw new Error('Could not create Adicionales folder');
        }

        // 2️⃣ Create subfolder for this specific adicional (AD_XX)
        const folderName = `AD_${String(adicionalCorrelativo).padStart(2, '0')}`;
        let adicionalSubfolderId = await findSubfolder(accessToken, adicionalFolderId, folderName);
        let adicionalSubfolderUrl: string;
        
        if (!adicionalSubfolderId) {
          console.log(`📁 Creating Adicional subfolder: ${folderName}`);
          const subfolder = await createDriveFolder(accessToken, adicionalFolderId, folderName);
          adicionalSubfolderId = subfolder.id;
          adicionalSubfolderUrl = subfolder.webViewLink;
        } else {
          adicionalSubfolderUrl = `https://drive.google.com/drive/folders/${adicionalSubfolderId}`;
        }

        console.log(`✅ Adicional subfolder ready: ${folderName}`);

        // 3️⃣ Upload files
        if (data.attachments.length === 1) {
          const file = data.attachments[0];
          console.log('📁 Uploading single file:', file.fileName);
          const result = await uploadFileToDrive(
            accessToken,
            adicionalSubfolderId,
            file.fileName,
            file.fileContent,
            file.mimeType
          );
          attachmentsUrl = result.webViewLink;
          console.log('✅ Single file uploaded:', result.webViewLink);
        } else {
          // Multiple files: upload all to AD_XX folder
          for (const file of data.attachments) {
            console.log('📁 Uploading file:', file.fileName);
            await uploadFileToDrive(
              accessToken,
              adicionalSubfolderId,
              file.fileName,
              file.fileContent,
              file.mimeType
            );
          }
          attachmentsUrl = adicionalSubfolderUrl;
          console.log('✅ Multiple files uploaded to folder:', adicionalSubfolderUrl);
        }

        // 4️⃣ Update Adicional.URL with attachments URL
        const { error: updateError } = await supabase
          .from('Adicionales')
          .update({ URL: attachmentsUrl })
          .eq('id', data.adicionalId);

        if (updateError) {
          console.error('⚠️ Error updating Adicional.URL:', updateError.message);
        } else {
          console.log('✅ Adicional.URL updated with attachments');
        }

      } catch (uploadError: any) {
        console.error('❌ Error uploading attachments:', uploadError.message);
        throw uploadError;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          attachmentsUrl 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ========================================
    // ACTION: CLOSE RFI
    // ========================================
    if (data.action === 'close_rfi') {
      // Fetch RFI
      const { data: rfi, error: rfiError } = await supabase
        .from('RFI')
        .select('*')
        .eq('id', data.rfiId)
        .single();

      if (rfiError || !rfi) {
        throw new Error(`RFI not found: ${rfiError?.message}`);
      }

      // Verify RFI has at least one response
      const { data: messages, error: msgError } = await supabase
        .from('rfi_messages')
        .select('id')
        .eq('rfi_id', data.rfiId)
        .limit(1);

      if (msgError) {
        throw new Error(`Failed to check messages: ${msgError.message}`);
      }

      // Also check old Respuesta field for backwards compatibility
      const hasResponses = (messages && messages.length > 0) || rfi.Respuesta;
      
      if (!hasResponses) {
        throw new Error('Cannot close RFI without at least one response');
      }

      // Update RFI status to Cerrado and record close date
      const { error: updateError } = await supabase
        .from('RFI')
        .update({ 
          Status: 'Cerrado',
          Fecha_Respuesta: new Date().toISOString()
        })
        .eq('id', data.rfiId);

      if (updateError) {
        throw new Error(`Failed to close RFI: ${updateError.message}`);
      }

      // Send close notification
      sendCloseNotification(
        data.rfiId,
        rfi.Proyecto,
        data.authorEmail,
        data.authorName || data.authorEmail
      );

      console.log('✅ RFI closed successfully:', data.rfiId);

      return new Response(
        JSON.stringify({ success: true, message: 'RFI closed successfully' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    throw new Error(`Unknown action: ${data.action}`);

  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
};

serve(handler);
