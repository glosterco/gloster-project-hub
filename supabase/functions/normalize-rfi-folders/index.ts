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

// Extract folder ID from URL or return if already an ID
function extractFolderId(url: string | null): string | null {
  if (!url) return null;
  
  // If it's already a folder ID (no slashes)
  if (/^[a-zA-Z0-9_-]+$/.test(url)) {
    return url;
  }
  
  // Extract from full URL
  const match = url.match(/folders\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// Extract file ID from URL
function extractFileId(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
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

// Find subfolder by name
async function findSubfolder(
  accessToken: string,
  parentFolderId: string,
  folderName: string
): Promise<string | null> {
  const query = encodeURIComponent(`'${parentFolderId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`);
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,webViewLink)`,
    { headers: { 'Authorization': `Bearer ${accessToken}` } }
  );

  if (!response.ok) return null;
  const data = await response.json();
  return data.files?.[0]?.id || null;
}

// List files in a folder
async function listFolderFiles(
  accessToken: string,
  folderId: string
): Promise<Array<{ id: string; name: string; mimeType: string; webViewLink: string; parents?: string[] }>> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,webViewLink,parents)&orderBy=name`,
    {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to list files: ${errorText}`);
  }

  const data = await response.json();
  return data.files || [];
}

// Move a file to a new folder
async function moveFile(
  accessToken: string,
  fileId: string,
  newParentFolderId: string,
  currentParentFolderId: string
): Promise<{ webViewLink: string } | null> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${newParentFolderId}&removeParents=${currentParentFolderId}&fields=webViewLink`,
    {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`⚠️ Failed to move file ${fileId}:`, errorText);
    return null;
  }
  
  return await response.json();
}

// Check if folder exists
async function folderExists(accessToken: string, folderId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,mimeType`,
      {
        headers: { 'Authorization': `Bearer ${accessToken}` },
      }
    );
    if (!response.ok) return false;
    const data = await response.json();
    return data.mimeType === 'application/vnd.google-apps.folder';
  } catch {
    return false;
  }
}

// Get or create RFI subfolder
async function ensureRFISubfolder(
  accessToken: string,
  rfiFolderId: string,
  rfiCorrelativo: number
): Promise<{ id: string; webViewLink: string }> {
  const folderName = `RFI_${String(rfiCorrelativo).padStart(2, '0')}`;
  
  const existingId = await findSubfolder(accessToken, rfiFolderId, folderName);
  if (existingId) {
    return { id: existingId, webViewLink: `https://drive.google.com/drive/folders/${existingId}` };
  }
  
  return await createDriveFolder(accessToken, rfiFolderId, folderName);
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🚀 Starting RFI folder normalization with FULL MIGRATION...");
    
    const accessToken = await getAccessToken();
    console.log("✅ Got Google Drive access token");

    const stats = {
      projectsProcessed: 0,
      projectsWithoutURL: 0,
      rfiFoldersCreated: 0,
      rfiFoldersExisting: 0,
      rfiSubfoldersCreated: 0,
      filesMovedToRFIFolder: 0,
      messagesUpdated: 0,
      urlsUpdated: 0,
      errors: [] as string[],
    };

    // 1️⃣ Get all projects
    const { data: projects, error: projectsError } = await supabase
      .from('Proyectos')
      .select('id, Name, URL, URL_RFI')
      .order('id', { ascending: true });

    if (projectsError) {
      throw new Error(`Failed to fetch projects: ${projectsError.message}`);
    }

    console.log(`📁 Found ${projects?.length || 0} projects to process`);

    for (const project of projects || []) {
      try {
        stats.projectsProcessed++;
        console.log(`\n========================================`);
        console.log(`📁 Processing project ${project.id}: ${project.Name}`);

        // Get parent folder ID
        const parentFolderId = extractFolderId(project.URL);
        if (!parentFolderId) {
          console.log(`⚠️ Project ${project.id} has no parent folder URL, skipping`);
          stats.projectsWithoutURL++;
          continue;
        }

        // Check/create URL_RFI
        let rfiFolderId: string | null = extractFolderId(project.URL_RFI);
        
        if (rfiFolderId) {
          const exists = await folderExists(accessToken, rfiFolderId);
          if (exists) {
            console.log(`✅ Project ${project.id} has valid URL_RFI: ${rfiFolderId}`);
            stats.rfiFoldersExisting++;
          } else {
            console.log(`⚠️ URL_RFI folder doesn't exist, will recreate`);
            rfiFolderId = null;
          }
        }

        // Create RFI folder if missing
        if (!rfiFolderId) {
          console.log(`📁 Creating RFI folder for project ${project.id}...`);
          
          // Check if RFI folder already exists with that name
          const existingRfiFolderId = await findSubfolder(accessToken, parentFolderId, 'RFI');
          
          if (existingRfiFolderId) {
            rfiFolderId = existingRfiFolderId;
            console.log(`✅ Found existing RFI folder: ${rfiFolderId}`);
          } else {
            const rfiFolder = await createDriveFolder(accessToken, parentFolderId, 'RFI');
            rfiFolderId = rfiFolder.id;
            console.log(`✅ Created RFI folder: ${rfiFolder.webViewLink}`);
          }
          
          // Update project with new URL_RFI
          const { error: updateError } = await supabase
            .from('Proyectos')
            .update({ URL_RFI: `https://drive.google.com/drive/folders/${rfiFolderId}` })
            .eq('id', project.id);

          if (updateError) {
            console.error(`⚠️ Failed to update project URL_RFI:`, updateError.message);
            stats.errors.push(`Project ${project.id}: Failed to update URL_RFI`);
          } else {
            stats.rfiFoldersCreated++;
            stats.urlsUpdated++;
          }
        }

        // 2️⃣ Get all RFIs for this project
        const { data: rfis, error: rfisError } = await supabase
          .from('RFI')
          .select('id, Correlativo, URL')
          .eq('Proyecto', project.id)
          .order('Correlativo', { ascending: true });

        if (rfisError) {
          console.error(`⚠️ Failed to fetch RFIs:`, rfisError.message);
          continue;
        }

        console.log(`  📋 Found ${rfis?.length || 0} RFIs for project ${project.id}`);

        // 3️⃣ Get list of files currently in RFI folder (to migrate)
        let looseFiles: Array<{ id: string; name: string; mimeType: string; webViewLink: string }> = [];
        try {
          looseFiles = await listFolderFiles(accessToken, rfiFolderId!);
          // Filter out folders (subfolders we create)
          looseFiles = looseFiles.filter(f => f.mimeType !== 'application/vnd.google-apps.folder');
          console.log(`  📄 Found ${looseFiles.length} loose files in RFI folder to potentially migrate`);
        } catch (err) {
          console.log(`  ⚠️ Could not list files in RFI folder`);
        }

        // 4️⃣ Process each RFI
        for (const rfi of rfis || []) {
          const rfiCorrelativo = rfi.Correlativo || rfi.id;
          const folderName = `RFI_${String(rfiCorrelativo).padStart(2, '0')}`;
          
          // Get messages for this RFI
          const { data: messages } = await supabase
            .from('rfi_messages')
            .select('id, attachments_url, created_at')
            .eq('rfi_id', rfi.id)
            .order('created_at', { ascending: true });
          
          // Check if this RFI has attachments
          const hasRfiUrl = !!rfi.URL;
          const hasMessageAttachments = messages?.some(m => m.attachments_url);
          
          if (!hasRfiUrl && !hasMessageAttachments) {
            console.log(`  📁 RFI ${rfi.id} (${folderName}): No attachments, skipping subfolder creation`);
            continue;
          }

          // Create RFI subfolder
          console.log(`  📁 Creating/verifying subfolder ${folderName}...`);
          try {
            const rfiSubfolder = await ensureRFISubfolder(accessToken, rfiFolderId!, rfiCorrelativo);
            stats.rfiSubfoldersCreated++;
            
            // Try to identify and move original RFI attachment
            if (rfi.URL) {
              const fileId = extractFileId(rfi.URL);
              if (fileId) {
                // Check if file is in the loose files list
                const looseFile = looseFiles.find(f => f.id === fileId);
                if (looseFile) {
                  console.log(`    📄 Moving original RFI file ${looseFile.name} to ${folderName}...`);
                  const moveResult = await moveFile(accessToken, fileId, rfiSubfolder.id, rfiFolderId!);
                  if (moveResult) {
                    stats.filesMovedToRFIFolder++;
                    // Update RFI URL
                    await supabase
                      .from('RFI')
                      .update({ URL: moveResult.webViewLink })
                      .eq('id', rfi.id);
                    stats.urlsUpdated++;
                  }
                }
              }
            }
            
            // Process message attachments
            for (const msg of messages || []) {
              if (!msg.attachments_url) continue;
              
              const isFolder = msg.attachments_url.includes('/folders/');
              const fileId = extractFileId(msg.attachments_url);
              
              if (!isFolder && fileId) {
                // Single file - check if it's loose and needs moving
                const looseFile = looseFiles.find(f => f.id === fileId);
                if (looseFile) {
                  console.log(`    📄 Moving message file ${looseFile.name} to ${folderName}...`);
                  const moveResult = await moveFile(accessToken, fileId, rfiSubfolder.id, rfiFolderId!);
                  if (moveResult) {
                    stats.filesMovedToRFIFolder++;
                    // Update message attachments_url
                    await supabase
                      .from('rfi_messages')
                      .update({ attachments_url: moveResult.webViewLink })
                      .eq('id', msg.id);
                    stats.messagesUpdated++;
                    stats.urlsUpdated++;
                  }
                }
              }
            }
            
          } catch (subfolderError: any) {
            console.error(`  ⚠️ Failed to process RFI ${rfi.id}:`, subfolderError.message);
            stats.errors.push(`RFI ${rfi.id}: ${subfolderError.message}`);
          }
        }

        // 5️⃣ Try to identify orphan files and match them to RFIs by name
        // Pattern: RFI_<titulo>_<filename> or similar
        for (const looseFile of looseFiles) {
          // Check if file name contains RFI identifier
          const rfiMatch = looseFile.name.match(/RFI[_-]?(\d+)/i);
          if (rfiMatch) {
            const rfiNum = parseInt(rfiMatch[1]);
            const targetRfi = rfis?.find(r => (r.Correlativo || r.id) === rfiNum);
            if (targetRfi) {
              const folderName = `RFI_${String(rfiNum).padStart(2, '0')}`;
              console.log(`  📄 Moving orphan file "${looseFile.name}" to ${folderName}...`);
              
              try {
                const rfiSubfolder = await ensureRFISubfolder(accessToken, rfiFolderId!, rfiNum);
                const moveResult = await moveFile(accessToken, looseFile.id, rfiSubfolder.id, rfiFolderId!);
                if (moveResult) {
                  stats.filesMovedToRFIFolder++;
                  console.log(`    ✅ Moved ${looseFile.name}`);
                }
              } catch (err) {
                console.log(`    ⚠️ Could not move file`);
              }
            }
          }
        }

      } catch (projectError: any) {
        console.error(`❌ Error processing project ${project.id}:`, projectError.message);
        stats.errors.push(`Project ${project.id}: ${projectError.message}`);
      }
    }

    console.log("\n========================================");
    console.log("🎉 Normalization complete!");
    console.log("📊 Stats:", JSON.stringify(stats, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        message: "RFI folder normalization complete with full migration",
        stats,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
};

serve(handler);
