import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UploadedFile {
  file: File;
  tipo: string;
}

export const useProjectDocumentUpload = (projectId: number) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ];

  const MAX_FILE_SIZE = 12 * 1024 * 1024; // 12MB

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(`Tipo de archivo no permitido: ${file.name}`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error(`Archivo demasiado grande: ${file.name} (máximo 12MB)`);
      return false;
    }
    return true;
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const uploadDocuments = async (files: UploadedFile[]) => {
    if (files.length === 0) {
      toast.error('No hay archivos para cargar');
      return;
    }

    setUploading(true);
    try {
      const documentsToUpload = await Promise.all(
        files.map(async ({ file, tipo }) => ({
          fileName: file.name,
          fileContent: await convertFileToBase64(file),
          tipo: tipo || 'Otro',
          mimeType: file.type
        }))
      );

      const { data, error } = await supabase.functions.invoke('upload-project-documents', {
        body: {
          projectId,
          documents: documentsToUpload
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`${data.uploadedFiles.length} documentos cargados exitosamente`);
        return true;
      } else {
        throw new Error(data?.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error('Error al cargar documentos: ' + (error as Error).message);
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent, tipo: string = 'Otro') => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(validateFile);

    if (validFiles.length > 0) {
      const newFiles = validFiles.map(file => ({ file, tipo }));
      setPendingFiles(prev => [...prev, ...newFiles]);
      toast.success(`${validFiles.length} archivo(s) añadido(s)`);
    }
  };

  const handleFileSelect = (files: FileList | null, tipo: string = 'Otro') => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(validateFile);

    if (validFiles.length > 0) {
      const newFiles = validFiles.map(file => ({ file, tipo }));
      setPendingFiles(prev => [...prev, ...newFiles]);
      toast.success(`${validFiles.length} archivo(s) añadido(s)`);
    }
  };

  const removeFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const confirmUpload = async () => {
    if (pendingFiles.length === 0) {
      toast.error('No hay archivos para cargar');
      return false;
    }

    const success = await uploadDocuments(pendingFiles);
    if (success) {
      setPendingFiles([]);
    }
    return success;
  };

  const clearPendingFiles = () => {
    setPendingFiles([]);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return {
    uploading,
    dragActive,
    pendingFiles,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    triggerFileInput,
    removeFile,
    confirmUpload,
    clearPendingFiles
  };
};
