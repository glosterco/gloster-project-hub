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

// Extract folder ID from URL
function extractFolderId(url: string): string | null {
  if (!url) return null;
  
  // Handle direct folder ID
  if (!url.includes('/') && !url.includes('?')) {
    return url;
  }
  
  // Handle Google Drive URLs
  const patterns = [
    /folders\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
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

// Find subfolder by name in parent
async function findSubfolder(
  accessToken: string,
  parentFolderId: string,
  folderName: string
): Promise<{ id: string; webViewLink: string } | null> {
  const query = `name='${folderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,webViewLink)`;
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  if (!response.ok) return null;
  
  const data = await response.json();
  return data.files?.[0] || null;
}

// Check if folder exists
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Starting Adicionales folder normalization...');
    
    const accessToken = await getAccessToken();
    
    // Get all adicionales without URL
    const { data: adicionales, error: adError } = await supabase
      .from('Adicionales')
      .select('id, Correlativo, Proyecto, URL')
      .is('URL', null);
    
    if (adError) throw adError;
    
    console.log(`📁 Found ${adicionales?.length || 0} adicionales without folders`);
    
    const results: { adicionalId: number; success: boolean; url?: string; error?: string }[] = [];
    
    for (const adicional of adicionales || []) {
      try {
        // Get project data
        const { data: project, error: projError } = await supabase
          .from('Proyectos')
          .select('URL, URL_Ad')
          .eq('id', adicional.Proyecto)
          .single();
        
        if (projError || !project) {
          results.push({
            adicionalId: adicional.id,
            success: false,
            error: 'Project not found'
          });
          continue;
        }
        
        let adicionalesFolderId = project.URL_Ad ? extractFolderId(project.URL_Ad) : null;
        
        // If URL_Ad doesn't exist, create it from project base URL
        if (!adicionalesFolderId && project.URL) {
          const projectFolderId = extractFolderId(project.URL);
          if (projectFolderId) {
            console.log(`📁 Creating Adicionales folder for project ${adicional.Proyecto}...`);
            
            // Check if Adicionales folder already exists
            let adicionalesFolder = await findSubfolder(accessToken, projectFolderId, 'Adicionales');
            
            if (!adicionalesFolder) {
              adicionalesFolder = await createDriveFolder(accessToken, projectFolderId, 'Adicionales');
            }
            
            // Update project with new URL_Ad
            await supabase
              .from('Proyectos')
              .update({ URL_Ad: adicionalesFolder.webViewLink })
              .eq('id', adicional.Proyecto);
            
            adicionalesFolderId = adicionalesFolder.id;
            console.log(`✅ Created Adicionales folder: ${adicionalesFolder.webViewLink}`);
          }
        }
        
        if (!adicionalesFolderId) {
          results.push({
            adicionalId: adicional.id,
            success: false,
            error: 'Could not find or create Adicionales folder'
          });
          continue;
        }
        
        // Create subfolder for this adicional
        const folderName = `AD_${adicional.Correlativo || adicional.id}`;
        
        // Check if already exists
        let folder = await findSubfolder(accessToken, adicionalesFolderId, folderName);
        
        if (!folder) {
          folder = await createDriveFolder(accessToken, adicionalesFolderId, folderName);
        }
        
        // Update adicional with URL
        const { error: updateError } = await supabase
          .from('Adicionales')
          .update({ URL: folder.webViewLink })
          .eq('id', adicional.id);
        
        if (updateError) throw updateError;
        
        results.push({
          adicionalId: adicional.id,
          success: true,
          url: folder.webViewLink
        });
        
        console.log(`✅ Created folder for Adicional #${adicional.id}: ${folderName}`);
        
      } catch (err) {
        console.error(`❌ Error processing adicional ${adicional.id}:`, err);
        results.push({
          adicionalId: adicional.id,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    console.log(`📊 Normalization complete: ${successCount} success, ${failCount} failed`);
    
    return new Response(JSON.stringify({
      success: true,
      message: `Normalized ${successCount} adicionales, ${failCount} failed`,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('❌ Normalization error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
