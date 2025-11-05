import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type DownloadArgs = {
  fileName: string;
  driveId?: string | null;
  projectId?: number | string;
};

type PreviewArgs = DownloadArgs;

export const useProjectDocumentDownload = () => {
  const [loadingDocuments, setLoadingDocuments] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const downloadDocument = async ({ fileName, driveId, projectId }: DownloadArgs) => {
    setLoadingDocuments(prev => ({ ...prev, [fileName]: true }));
    try {
      const body: any = { fileName, mode: 'content' as const };
      if (driveId) body.driveId = driveId;
      else if (projectId) body.projectId = typeof projectId === 'string' ? Number(projectId) : projectId;

      const { data, error } = await supabase.functions.invoke('download-project-document', { body });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'No se pudo descargar el archivo');
      if (!data.content) throw new Error('El archivo no tiene contenido disponible');

      const byteCharacters = atob(data.content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.mimeType });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({ title: 'Descarga completada', description: `Se ha descargado ${fileName}` });
      return { success: true };
    } catch (error: any) {
      console.error('❌ Error downloading document:', error);
      toast({ title: 'Error en la descarga', description: error.message || 'No se pudo descargar el archivo', variant: 'destructive' });
      return { success: false, error: error.message };
    } finally {
      setLoadingDocuments(prev => ({ ...prev, [fileName]: false }));
    }
  };

  const previewDocument = async ({ fileName, driveId, projectId }: PreviewArgs) => {
    try {
      // Fetch file bytes to render preview without Google Drive UI
      const body: any = { fileName, mode: 'content' as const };
      if (driveId) body.driveId = driveId;
      else if (projectId) body.projectId = typeof projectId === 'string' ? Number(projectId) : projectId;

      const { data, error } = await supabase.functions.invoke('download-project-document', { body });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || 'No se pudo obtener el contenido para la vista previa');
      if (!data.content) throw new Error('Contenido no disponible para vista previa');

      const byteCharacters = atob(data.content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: data.mimeType });
      const url = URL.createObjectURL(blob);

      return { success: true, previewUrl: url, mimeType: data.mimeType as string };
    } catch (error: any) {
      console.error('❌ Error opening preview:', error);
      toast({ title: 'Error en vista previa', description: error.message || 'No se pudo abrir la vista previa', variant: 'destructive' });
      return { success: false, error: error.message };
    }
  };

  const isDocumentLoading = (fileName: string) => loadingDocuments[fileName] || false;

  return { downloadDocument, previewDocument, isDocumentLoading, loading: Object.values(loadingDocuments).some(Boolean) };
};
