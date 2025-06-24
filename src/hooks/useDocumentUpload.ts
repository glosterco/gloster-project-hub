
import { useState, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface DocumentStatus {
  eepp: boolean;
  planilla: boolean;
  cotizaciones: boolean;
  f30: boolean;
  f30_1: boolean;
  examenes: boolean;
  finiquito: boolean;
  factura: boolean;
}

export interface UploadedFiles {
  eepp: string[];
  planilla: string[];
  cotizaciones: string[];
  f30: string[];
  f30_1: string[];
  examenes: string[];
  finiquito: string[];
  factura: string[];
}

export interface FileObjects {
  [key: string]: File[];
}

export interface DragStates {
  eepp: boolean;
  planilla: boolean;
  cotizaciones: boolean;
  f30: boolean;
  f30_1: boolean;
  examenes: boolean;
  finiquito: boolean;
  factura: boolean;
}

export const useDocumentUpload = () => {
  const { toast } = useToast();
  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  const [documentStatus, setDocumentStatus] = useState<DocumentStatus>({
    eepp: false,
    planilla: false,
    cotizaciones: false,
    f30: false,
    f30_1: false,
    examenes: false,
    finiquito: false,
    factura: false
  });

  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({
    eepp: [],
    planilla: [],
    cotizaciones: [],
    f30: [],
    f30_1: [],
    examenes: [],
    finiquito: [],
    factura: []
  });

  const [fileObjects, setFileObjects] = useState<FileObjects>({
    eepp: [],
    planilla: [],
    cotizaciones: [],
    f30: [],
    f30_1: [],
    examines: [],
    finiquito: [],
    factura: []
  });

  const [dragStates, setDragStates] = useState<DragStates>({
    eepp: false,
    planilla: false,
    cotizaciones: false,
    f30: false,
    f30_1: false,
    examenes: false,
    finiquito: false,
    factura: false
  });

  const validateFiles = (files: FileList | File[]) => {
    const allowedTypes = ['application/pdf', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel.sheet.macroEnabled.12', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Formato no válido",
          description: `El archivo ${file.name} no es un formato válido. Solo se aceptan PDF, CSV, XLSX, XLSM y DOCX.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    return validFiles;
  };

  const handleFileUpload = (documentId: string, files: FileList | File[] | null, allowMultiple: boolean = false) => {
    if (!files || files.length === 0) return;

    const validFiles = validateFiles(files);
    if (validFiles.length === 0) return;

    console.log(`📁 Uploading ${validFiles.length} files for ${documentId}:`, validFiles.map(f => f.name));

    setDocumentStatus(prev => ({
      ...prev,
      [documentId]: true
    }));

    const fileNames = validFiles.map(file => file.name);
    setUploadedFiles(prev => ({
      ...prev,
      [documentId]: allowMultiple 
        ? [...prev[documentId as keyof UploadedFiles], ...fileNames]
        : fileNames
    }));

    setFileObjects(prev => ({
      ...prev,
      [documentId]: allowMultiple 
        ? [...prev[documentId], ...validFiles]
        : validFiles
    }));

    // Clear the file input to allow re-upload of same file
    const input = fileInputRefs.current[documentId];
    if (input) {
      input.value = '';
    }

    toast({
      title: "Documento(s) cargado(s)",
      description: `${validFiles.length} archivo(s) se han cargado exitosamente`,
    });
  };

  const handleFileRemove = (documentId: string, fileIndex: number) => {
    console.log(`🗑️ Removing file at index ${fileIndex} from ${documentId}`);

    // Update uploaded files
    setUploadedFiles(prev => {
      const newFiles = [...prev[documentId as keyof UploadedFiles]];
      newFiles.splice(fileIndex, 1);
      return {
        ...prev,
        [documentId]: newFiles
      };
    });

    // Update file objects
    setFileObjects(prev => {
      const newFiles = [...prev[documentId]];
      newFiles.splice(fileIndex, 1);
      return {
        ...prev,
        [documentId]: newFiles
      };
    });

    // Update document status - set to false only if no files left
    setDocumentStatus(prev => {
      const currentFiles = uploadedFiles[documentId as keyof UploadedFiles];
      const willHaveFiles = currentFiles.length > 1; // Will have files after removal
      return {
        ...prev,
        [documentId]: willHaveFiles
      };
    });

    toast({
      title: "Archivo eliminado",
      description: "El archivo ha sido eliminado exitosamente",
    });
  };

  const handleDragOver = (e: React.DragEvent, documentId: string) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [documentId]: true }));
  };

  const handleDragLeave = (e: React.DragEvent, documentId: string) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [documentId]: false }));
  };

  const handleDrop = (e: React.DragEvent, documentId: string, allowMultiple: boolean = false) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [documentId]: false }));
    
    const files = e.dataTransfer.files;
    handleFileUpload(documentId, files, allowMultiple);
  };

  const handleDocumentUpload = (documentId: string) => {
    const input = fileInputRefs.current[documentId];
    if (input) {
      input.click();
    }
  };

  return {
    documentStatus,
    uploadedFiles,
    fileObjects,
    dragStates,
    fileInputRefs,
    handleFileUpload,
    handleFileRemove,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDocumentUpload,
    setDragStates
  };
};
