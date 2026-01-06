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
  action: 'add_message' | 'close_rfi' | 'get_messages' | 'upload_attachments';
  rfiId: number;
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
function extractFolderId(url: string): string | null {
  const match = url.match(/folders\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// Create RFI subfolder if it doesn't exist
async function ensureRFIFolder(
  accessToken: string,
  projectId: number,
  projectName: string,
  projectUrl: string | null
): Promise<string | null> {
  try {
    let parentFolderId: string | null = null;
    
    // Try to get parent folder from project URL
    if (projectUrl) {
      // Check if projectUrl is already a folder ID (no slashes, just alphanumeric with hyphens/underscores)
      if (/^[a-zA-Z0-9_-]+$/.test(projectUrl)) {
        parentFolderId = projectUrl;
        console.log('📁 Project URL is a direct folder ID:', parentFolderId);
      } else {
        // It's a full URL, extract the folder ID
        parentFolderId = extractFolderId(projectUrl);
        console.log('📁 Extracted folder ID from URL:', parentFolderId);
      }
    }
    
    if (!parentFolderId) {
      console.log('⚠️ No parent folder found for project, cannot create RFI subfolder');
      return null;
    }
    
    console.log('📁 Creating RFI subfolder for project:', projectId);
    
    // Create RFI subfolder
    const folder = await createDriveFolder(accessToken, parentFolderId, 'RFI');
    
    console.log('✅ RFI folder created:', folder.webViewLink);
    
    // Update project with RFI folder URL
    const { error: updateError } = await supabase
      .from('Proyectos')
      .update({ URL_RFI: folder.webViewLink })
      .eq('id', projectId);
    
    if (updateError) {
      console.error('⚠️ Error updating project URL_RFI:', updateError.message);
    } else {
      console.log('✅ Project URL_RFI updated');
    }
    
    return folder.id;
  } catch (error: any) {
    console.error('❌ Error creating RFI folder:', error.message);
    return null;
  }
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
    // Fire and forget - don't wait for notification
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
        .select('*, Proyecto')
        .eq('id', data.rfiId)
        .single();

      if (rfiError || !rfi) {
        throw new Error(`RFI not found: ${rfiError?.message}`);
      }

      const projectId = data.projectId || rfi.Proyecto;

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
        
        let rfiFolderId: string | null = null;
        
        // Try to get existing RFI folder
        if (project.URL_RFI) {
          rfiFolderId = extractFolderId(project.URL_RFI);
        }
        
        // If no RFI folder exists, try to create it
        if (!rfiFolderId) {
          console.log('⚠️ Project URL_RFI not configured, attempting to create...');
          try {
            const accessToken = await getAccessToken();
            rfiFolderId = await ensureRFIFolder(
              accessToken, 
              projectId, 
              project.Name || `Proyecto_${projectId}`,
              project.URL
            );
          } catch (tokenError: any) {
            console.error('⚠️ Could not get token to create RFI folder:', tokenError.message);
          }
        }
        
        if (!rfiFolderId) {
          console.log('⚠️ Could not get or create RFI folder, skipping attachments');
          // Continue without attachments - don't block the message
        } else {
          try {
            const accessToken = await getAccessToken();
            console.log('✅ Got access token for Drive');

            if (data.attachments.length === 1) {
              // Single file: upload directly to RFI folder
              const file = data.attachments[0];
              console.log('📁 Uploading single file:', file.fileName);
              const result = await uploadFileToDrive(
                accessToken,
                rfiFolderId,
                file.fileName,
                file.fileContent,
                file.mimeType
              );
              attachmentsUrl = result.webViewLink;
              console.log('✅ Single file uploaded:', result.webViewLink);
            } else {
              // Multiple files: create subfolder
              const folderName = `RFI-${data.rfiId}_${new Date().toISOString().slice(0, 10)}_${Date.now()}`;
              console.log('📂 Creating subfolder:', folderName);
              const folder = await createDriveFolder(accessToken, rfiFolderId, folderName);
              
              // Upload all files to subfolder
              for (const file of data.attachments) {
                console.log('📁 Uploading file to subfolder:', file.fileName);
                await uploadFileToDrive(
                  accessToken,
                  folder.id,
                  file.fileName,
                  file.fileContent,
                  file.mimeType
                );
              }
              
              attachmentsUrl = folder.webViewLink;
              console.log('✅ Multiple files uploaded to folder:', folder.webViewLink);
            }
          } catch (uploadError: any) {
            console.error('⚠️ Error uploading attachments:', uploadError.message);
            // Continue without attachments - don't fail the whole message
          }
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

      // Update RFI status to Cerrado
      const { error: updateError } = await supabase
        .from('RFI')
        .update({ Status: 'Cerrado' })
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
