
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
    examenes: [],
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

    toast({
      title: "Documento(s) cargado(s)",
      description: `${validFiles.length} archivo(s) se han cargado exitosamente`,
    });
  };

  const handleFileRemove = (documentId: string, fileIndex: number) => {
    setUploadedFiles(prev => ({
      ...prev,
      [documentId]: prev[documentId as keyof UploadedFiles].filter((_, index) => index !== fileIndex)
    }));

    setFileObjects(prev => ({
      ...prev,
      [documentId]: prev[documentId].filter((_, index) => index !== fileIndex)
    }));

    // If no files left, mark document as not uploaded
    const remainingFiles = uploadedFiles[documentId as keyof UploadedFiles].filter((_, index) => index !== fileIndex);
    if (remainingFiles.length === 0) {
      setDocumentStatus(prev => ({
        ...prev,
        [documentId]: false
      }));
    }

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
