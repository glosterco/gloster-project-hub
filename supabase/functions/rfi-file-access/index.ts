import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FileAccessRequest {
  action: 'list' | 'download' | 'preview' | 'download_folder';
  url: string; // Can be file URL or folder URL
  fileId?: string; // For specific file download from folder
}

// Get access token for Google Drive
async function getAccessToken(): Promise<string> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.functions.invoke('google-drive-token-manager', { body: {} });
  
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
  const match = url.match(/folders\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// Extract file ID from URL
function extractFileId(url: string): string | null {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// Check if URL is a folder
function isFolder(url: string): boolean {
  return url.includes('/folders/');
}

// Get file content type display name
function getFileTypeDisplay(mimeType: string): string {
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF',
    'image/jpeg': 'Imagen JPEG',
    'image/png': 'Imagen PNG',
    'image/gif': 'Imagen GIF',
    'image/webp': 'Imagen WebP',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
    'application/vnd.ms-excel': 'Excel',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
    'application/msword': 'Word',
    'application/zip': 'ZIP',
    'application/x-rar-compressed': 'RAR',
    'text/plain': 'Texto',
  };
  return typeMap[mimeType] || 'Archivo';
}

// Check if file can be previewed in browser
function canPreview(mimeType: string): boolean {
  return mimeType.startsWith('image/') || mimeType === 'application/pdf';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, url, fileId }: FileAccessRequest = await req.json();
    console.log("📁 RFI File Access:", action, url);

    if (!url) {
      throw new Error('URL is required');
    }

    const accessToken = await getAccessToken();

    // ========================================
    // ACTION: LIST (list files in folder or get file info)
    // ========================================
    if (action === 'list') {
      if (isFolder(url)) {
        const folderId = extractFolderId(url);
        if (!folderId) {
          throw new Error('Invalid folder URL');
        }

        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,size,createdTime)&orderBy=name`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        if (!response.ok) {
          throw new Error(`Failed to list folder: ${response.status}`);
        }

        const data = await response.json();
        const files = (data.files || []).map((file: any) => ({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          size: file.size ? parseInt(file.size) : null,
          typeDisplay: getFileTypeDisplay(file.mimeType),
          canPreview: canPreview(file.mimeType),
          createdTime: file.createdTime,
        }));

        return new Response(
          JSON.stringify({
            success: true,
            isFolder: true,
            files,
            totalFiles: files.length,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      } else {
        // Single file
        const singleFileId = extractFileId(url);
        if (!singleFileId) {
          throw new Error('Invalid file URL');
        }

        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${singleFileId}?fields=id,name,mimeType,size,createdTime`,
          { headers: { 'Authorization': `Bearer ${accessToken}` } }
        );

        if (!response.ok) {
          throw new Error(`Failed to get file info: ${response.status}`);
        }

        const file = await response.json();

        return new Response(
          JSON.stringify({
            success: true,
            isFolder: false,
            files: [{
              id: file.id,
              name: file.name,
              mimeType: file.mimeType,
              size: file.size ? parseInt(file.size) : null,
              typeDisplay: getFileTypeDisplay(file.mimeType),
              canPreview: canPreview(file.mimeType),
              createdTime: file.createdTime,
            }],
            totalFiles: 1,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
        );
      }
    }

    // ========================================
    // ACTION: DOWNLOAD (get file content as base64)
    // ========================================
    if (action === 'download' || action === 'preview') {
      let targetFileId = fileId;
      
      if (!targetFileId) {
        targetFileId = extractFileId(url);
      }

      if (!targetFileId) {
        throw new Error('File ID is required for download');
      }

      // First get file metadata
      const metaResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${targetFileId}?fields=id,name,mimeType,size`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (!metaResponse.ok) {
        throw new Error(`Failed to get file metadata: ${metaResponse.status}`);
      }

      const fileMeta = await metaResponse.json();

      // Check file size limit for preview (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (fileMeta.size && parseInt(fileMeta.size) > maxSize) {
        throw new Error('File too large for preview (max 10MB)');
      }

      // Download file content
      const downloadResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files/${targetFileId}?alt=media`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (!downloadResponse.ok) {
        throw new Error(`Failed to download file: ${downloadResponse.status}`);
      }

      const fileBuffer = await downloadResponse.arrayBuffer();
      const base64Content = base64Encode(new Uint8Array(fileBuffer));

      return new Response(
        JSON.stringify({
          success: true,
          file: {
            id: fileMeta.id,
            name: fileMeta.name,
            mimeType: fileMeta.mimeType,
            size: fileMeta.size ? parseInt(fileMeta.size) : null,
            content: base64Content,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ========================================
    // ACTION: DOWNLOAD_FOLDER (create ZIP of folder contents)
    // ========================================
    if (action === 'download_folder') {
      const folderId = extractFolderId(url);
      if (!folderId) {
        throw new Error('Invalid folder URL for download');
      }

      // List all files
      const listResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,size)&orderBy=name`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (!listResponse.ok) {
        throw new Error(`Failed to list folder: ${listResponse.status}`);
      }

      const listData = await listResponse.json();
      const files = listData.files || [];

      if (files.length === 0) {
        throw new Error('Folder is empty');
      }

      // For simplicity, we'll return file list with download capability
      // Client-side can use JSZip to create the archive
      const filesWithContent: Array<{
        id: string;
        name: string;
        mimeType: string;
        content: string;
      }> = [];

      // Download each file (limit to 20 files and 50MB total)
      let totalSize = 0;
      const maxTotalSize = 50 * 1024 * 1024;
      const maxFiles = 20;

      for (const file of files.slice(0, maxFiles)) {
        if (file.mimeType === 'application/vnd.google-apps.folder') continue;
        
        const fileSize = file.size ? parseInt(file.size) : 0;
        if (totalSize + fileSize > maxTotalSize) {
          console.log(`⚠️ Skipping ${file.name} - would exceed size limit`);
          continue;
        }

        try {
          const downloadResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
          );

          if (downloadResponse.ok) {
            const fileBuffer = await downloadResponse.arrayBuffer();
            const base64Content = base64Encode(new Uint8Array(fileBuffer));
            filesWithContent.push({
              id: file.id,
              name: file.name,
              mimeType: file.mimeType,
              content: base64Content,
            });
            totalSize += fileSize;
          }
        } catch (err) {
          console.error(`⚠️ Error downloading ${file.name}:`, err);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          files: filesWithContent,
          totalFiles: filesWithContent.length,
          totalSize,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error("❌ Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
};

serve(handler);
