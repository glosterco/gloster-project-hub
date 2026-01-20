import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UploadedPhoto {
  file: File;
}

export const useProjectPhotoUpload = (projectId: number) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<UploadedPhoto[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ALLOWED_TYPES = [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp'
  ];

  const MAX_FILE_SIZE = 12 * 1024 * 1024; // 12MB

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error(`Tipo de archivo no permitido: ${file.name}. Solo se permiten imágenes.`);
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

  const uploadPhotos = async (files: UploadedPhoto[]) => {
    if (files.length === 0) {
      toast.error('No hay fotos para cargar');
      return;
    }

    setUploading(true);
    try {
      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || 'unknown';
      const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';

      const photosToUpload = await Promise.all(
        files.map(async ({ file }) => ({
          fileName: file.name,
          fileContent: await convertFileToBase64(file),
          mimeType: file.type
        }))
      );

      const { data, error } = await supabase.functions.invoke('upload-project-photos', {
        body: {
          projectId,
          photos: photosToUpload,
          uploadedByEmail: userEmail,
          uploadedByName: userName
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`${data.uploadedFiles.length} foto(s) cargada(s) exitosamente`);
        return true;
      } else {
        throw new Error(data?.error || 'Error desconocido');
      }
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error('Error al cargar fotos: ' + (error as Error).message);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(validateFile);

    if (validFiles.length > 0) {
      const newFiles = validFiles.map(file => ({ file }));
      setPendingFiles(prev => [...prev, ...newFiles]);
      toast.success(`${validFiles.length} foto(s) añadida(s)`);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(validateFile);

    if (validFiles.length > 0) {
      const newFiles = validFiles.map(file => ({ file }));
      setPendingFiles(prev => [...prev, ...newFiles]);
      toast.success(`${validFiles.length} foto(s) añadida(s)`);
    }
  };

  const removeFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const confirmUpload = async () => {
    if (pendingFiles.length === 0) {
      toast.error('No hay fotos para cargar');
      return false;
    }

    const success = await uploadPhotos(pendingFiles);
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
