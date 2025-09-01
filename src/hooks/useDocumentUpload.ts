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
  [key: string]: boolean; // Add index signature for compatibility
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
  [key: string]: string[]; // Add index signature for compatibility
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
    const allowedTypes = [
      'application/pdf', // PDF
      'text/csv', // CSV
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
      'application/vnd.ms-excel.sheet.macroEnabled.12', // XLSM
      'application/vnd.ms-excel', // XLS
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/msword', // DOC
      'image/jpeg', // JPG
      'image/png' // PNG
    ];
    
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      console.log(`🔍 Validating file: ${file.name}, type: ${file.type}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      
      // Check file size (increased limit to 12MB with optimized backend)
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 12) {
        console.error(`❌ File too large: ${file.name} (${fileSizeMB.toFixed(2)}MB)`);
        toast({
          title: "Archivo demasiado grande",
          description: `El archivo ${file.name} (${fileSizeMB.toFixed(2)}MB) excede el límite de 12MB. Intenta comprimir el archivo o contactar soporte.`,
          variant: "destructive",
        });
        return false;
      }
      
      if (!allowedTypes.includes(file.type)) {
        console.error(`❌ Invalid file format: ${file.name} (${file.type})`);
        toast({
          title: "Formato no válido",
          description: `El archivo ${file.name} no tiene un formato aceptado. Intenta con otro formato o contactar soporte.`,
          variant: "destructive",
        });
        return false;
      }
      
      console.log(`✅ File valid: ${file.name}`);
      return true;
    });

    return validFiles;
  };

  const handleFileUpload = (documentId: string, files: FileList | File[] | null, allowMultiple: boolean = false) => {
    if (!files || files.length === 0) return;

    const validFiles = validateFiles(files);
    if (validFiles.length === 0) return;

    // Documentos que requieren UN solo archivo
    const singleFileDocuments = ['eepp', 'cotizaciones', 'f30', 'f30_1', 'factura'];
    const requiresSingleFile = singleFileDocuments.includes(documentId);
    
    console.log(`📁 Uploading ${validFiles.length} files for ${documentId} (single file required: ${requiresSingleFile}):`, validFiles.map(f => f.name));

    setDocumentStatus(prev => ({
      ...prev,
      [documentId]: true
    }));

    const fileNames = validFiles.map(file => file.name);
    setUploadedFiles(prev => {
      const currentFiles = prev[documentId as keyof UploadedFiles] || [];
      
      // Si requiere un solo archivo, reemplazar siempre
      // Si permite múltiples y allowMultiple es true, agregar
      // Si permite múltiples pero allowMultiple es false, reemplazar
      const shouldReplace = requiresSingleFile || !allowMultiple;
      
      if (shouldReplace && currentFiles.length > 0) {
        console.log(`🔄 Replacing existing files for ${documentId}: ${currentFiles.join(', ')} -> ${fileNames.join(', ')}`);
      }
      
      return {
        ...prev,
        [documentId]: shouldReplace ? fileNames : [...currentFiles, ...fileNames]
      };
    });

    setFileObjects(prev => {
      const currentFiles = prev[documentId] || [];
      const shouldReplace = requiresSingleFile || !allowMultiple;
      
      return {
        ...prev,
        [documentId]: shouldReplace ? validFiles : [...currentFiles, ...validFiles]
      };
    });

    // Clear the file input to allow re-upload of same file
    const input = fileInputRefs.current[documentId];
    if (input) {
      input.value = '';
    }

    const action = requiresSingleFile && uploadedFiles[documentId as keyof UploadedFiles]?.length > 0 ? "reemplazado" : "cargado";
    
    toast({
      title: `Documento(s) ${action}(s)`,
      description: `${validFiles.length} archivo(s) se han ${action} exitosamente${requiresSingleFile ? ' (documento de archivo único)' : ''}`,
    });
  };

  const handleFileRemove = (documentId: string, fileIndex: number) => {
    console.log(`🗑️ Removing file at index ${fileIndex} from ${documentId}`);

    // Update uploaded files
    setUploadedFiles(prev => {
      const currentFiles = prev[documentId as keyof UploadedFiles] || [];
      const newFiles = [...currentFiles];
      newFiles.splice(fileIndex, 1);
      return {
        ...prev,
        [documentId]: newFiles
      };
    });

    // Update file objects
    setFileObjects(prev => {
      const currentFiles = prev[documentId] || [];
      const newFiles = [...currentFiles];
      newFiles.splice(fileIndex, 1);
      return {
        ...prev,
        [documentId]: newFiles
      };
    });

    // Update document status - set to false only if no files left
    setDocumentStatus(prev => {
      const currentFiles = uploadedFiles[documentId as keyof UploadedFiles] || [];
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
