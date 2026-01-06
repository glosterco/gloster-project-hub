import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Eye, 
  Folder, 
  Loader2,
  Image as ImageIcon,
  File,
  Archive
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';

interface AttachmentFile {
  id: string;
  name: string;
  mimeType: string;
  size: number | null;
  typeDisplay: string;
  canPreview: boolean;
}

interface RFIAttachmentViewerProps {
  attachmentsUrl: string;
}

const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return ImageIcon;
  if (mimeType === 'application/pdf') return FileText;
  if (mimeType.includes('zip') || mimeType.includes('rar')) return Archive;
  return File;
};

export const RFIAttachmentViewer: React.FC<RFIAttachmentViewerProps> = ({ attachmentsUrl }) => {
  const [files, setFiles] = useState<AttachmentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFolder, setIsFolder] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ name: string; content: string; mimeType: string } | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);

  useEffect(() => {
    loadFiles();
  }, [attachmentsUrl]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('rfi-file-access', {
        body: { action: 'list', url: attachmentsUrl }
      });

      if (error) throw error;

      if (data?.success) {
        setFiles(data.files || []);
        setIsFolder(data.isFolder);
      }
    } catch (err) {
      console.error('Error loading attachments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (file: AttachmentFile) => {
    setDownloadingId(file.id);
    try {
      const { data, error } = await supabase.functions.invoke('rfi-file-access', {
        body: { action: 'preview', url: attachmentsUrl, fileId: file.id }
      });

      if (error) throw error;

      if (data?.success && data.file) {
        const content = `data:${data.file.mimeType};base64,${data.file.content}`;
        setPreviewFile({ name: data.file.name, content, mimeType: data.file.mimeType });
      }
    } catch (err) {
      console.error('Error previewing file:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownload = async (file: AttachmentFile) => {
    setDownloadingId(file.id);
    try {
      const { data, error } = await supabase.functions.invoke('rfi-file-access', {
        body: { action: 'download', url: attachmentsUrl, fileId: file.id }
      });

      if (error) throw error;

      if (data?.success && data.file) {
        // Create blob and download
        const byteCharacters = atob(data.file.content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: data.file.mimeType });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error downloading file:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadAll = async () => {
    if (!isFolder || files.length === 0) return;
    
    setDownloadingAll(true);
    try {
      const { data, error } = await supabase.functions.invoke('rfi-file-access', {
        body: { action: 'download_folder', url: attachmentsUrl }
      });

      if (error) throw error;

      if (data?.success && data.files?.length > 0) {
        const zip = new JSZip();
        
        for (const file of data.files) {
          const byteCharacters = atob(file.content);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          zip.file(file.name, byteArray);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'adjuntos.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error downloading folder:', err);
    } finally {
      setDownloadingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Cargando adjuntos...
      </div>
    );
  }

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          {isFolder ? <Folder className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
          {isFolder ? `${files.length} archivo${files.length !== 1 ? 's' : ''} adjunto${files.length !== 1 ? 's' : ''}` : 'Archivo adjunto'}
        </div>
        
        {isFolder && files.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={handleDownloadAll}
            disabled={downloadingAll}
          >
            {downloadingAll ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : (
              <Archive className="h-3 w-3 mr-1" />
            )}
            Descargar todo (.zip)
          </Button>
        )}
      </div>
      
      <div className="space-y-1.5">
        {files.map((file) => {
          const FileIcon = getFileIcon(file.mimeType);
          const isDownloading = downloadingId === file.id;
          
          return (
            <div 
              key={file.id}
              className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-md text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{file.name}</span>
                {file.size && (
                  <span className="text-muted-foreground shrink-0">
                    ({formatFileSize(file.size)})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {file.canPreview && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => handlePreview(file)}
                    disabled={isDownloading}
                    title="Vista previa"
                  >
                    {isDownloading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => handleDownload(file)}
                  disabled={isDownloading}
                  title="Descargar"
                >
                  {isDownloading && !file.canPreview ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview modal */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="truncate">{previewFile?.name}</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh]">
            {previewFile?.mimeType.startsWith('image/') ? (
              <img 
                src={previewFile.content} 
                alt={previewFile.name}
                className="max-w-full h-auto mx-auto"
              />
            ) : previewFile?.mimeType === 'application/pdf' ? (
              <iframe 
                src={previewFile.content}
                className="w-full h-[70vh]"
                title={previewFile.name}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
