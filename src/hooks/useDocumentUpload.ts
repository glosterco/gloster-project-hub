import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getDocumentsFromRequirements } from '@/constants/documentsCatalog';

export interface DocumentStatus {
  [key: string]: boolean;
}

export interface UploadedFiles {
  [key: string]: string[];
}

export interface FileObjects {
  [key: string]: File[];
}

export interface DragStates {
  [key: string]: boolean;
}

export const useDocumentUpload = (onUploadComplete?: () => void, projectRequirements?: string[]) => {
  const { toast } = useToast();
  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  const [documentStatus, setDocumentStatus] = useState<DocumentStatus>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({});
  const [fileObjects, setFileObjects] = useState<FileObjects>({});
  const [dragStates, setDragStates] = useState<DragStates>({});

  // Initialize states based on project requirements
  useEffect(() => {
    if (!projectRequirements || projectRequirements.length === 0) return;

    console.log('🔄 Initializing document states for requirements:', projectRequirements);
    
    const documents = getDocumentsFromRequirements(projectRequirements);
    const initialDocumentStatus: DocumentStatus = {};
    const initialUploadedFiles: UploadedFiles = {};
    const initialFileObjects: FileObjects = {};
    const initialDragStates: DragStates = {};

    documents.forEach(doc => {
      initialDocumentStatus[doc.id] = false;
      initialUploadedFiles[doc.id] = [];
      initialFileObjects[doc.id] = [];
      initialDragStates[doc.id] = false;
    });

    console.log('📋 Initialized document IDs:', Object.keys(initialDocumentStatus));

    setDocumentStatus(initialDocumentStatus);
    setUploadedFiles(initialUploadedFiles);
    setFileObjects(initialFileObjects);
    setDragStates(initialDragStates);
  }, [projectRequirements]);

  const validateFiles = (files: FileList | File[]) => {
    const allowedTypes = [
import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getDocumentsFromRequirements } from '@/constants/documentsCatalog';

export interface DocumentStatus {
  [key: string]: boolean;
}

export interface UploadedFiles {
  [key: string]: string[];
}

export interface FileObjects {
  [key: string]: File[];
}

export interface DragStates {
  [key: string]: boolean;
}

export const useDocumentUpload = (onUploadComplete?: () => void, projectRequirements?: string[]) => {
  const { toast } = useToast();
  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  const [documentStatus, setDocumentStatus] = useState<DocumentStatus>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles>({});
  const [fileObjects, setFileObjects] = useState<FileObjects>({});
  const [dragStates, setDragStates] = useState<DragStates>({});

  // Initialize states based on project requirements
  useEffect(() => {
    if (!projectRequirements || projectRequirements.length === 0) return;

    console.log('🔄 Initializing document states for requirements:', projectRequirements);
    
    const documents = getDocumentsFromRequirements(projectRequirements);
    const initialDocumentStatus: DocumentStatus = {};
    const initialUploadedFiles: UploadedFiles = {};
    const initialFileObjects: FileObjects = {};
    const initialDragStates: DragStates = {};

    documents.forEach(doc => {
      initialDocumentStatus[doc.id] = false;
      initialUploadedFiles[doc.id] = [];
      initialFileObjects[doc.id] = [];
      initialDragStates[doc.id] = false;
    });

    console.log('📋 Initialized document IDs:', Object.keys(initialDocumentStatus));

    setDocumentStatus(initialDocumentStatus);
    setUploadedFiles(initialUploadedFiles);
    setFileObjects(initialFileObjects);
    setDragStates(initialDragStates);
  }, [projectRequirements]);

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

  const handleFileUpload = (files: File[], docId: string) => {
    console.log(`📤 Starting file upload for ${docId}:`, files.map(f => f.name));
    
    if (!docId || !files.length) {
      console.error('❌ Invalid parameters for file upload:', { docId, filesCount: files.length });
      return;
    }

    const validFiles = validateFiles(files);
    
    if (validFiles.length === 0) {
      console.log('❌ No valid files to upload');
      return;
    }

    // Support multiple files - append to existing files instead of replacing
    setUploadedFiles(prev => ({
      ...prev,
      [docId]: [...(prev[docId] || []), ...validFiles.map(file => file.name)]
    }));

    setFileObjects(prev => ({
      ...prev,
      [docId]: [...(prev[docId] || []), ...validFiles]
    }));

    setDocumentStatus(prev => ({
      ...prev,
      [docId]: true
    }));

    console.log(`✅ Files uploaded for ${docId}:`, validFiles.map(f => f.name));

    if (onUploadComplete) {
      onUploadComplete();
    }
  };

  const handleFileRemove = (docId: string, fileName: string) => {
    console.log(`🗑️ Removing file ${fileName} from ${docId}`);

    setUploadedFiles(prev => {
      const newFiles = prev[docId]?.filter(name => name !== fileName) || [];
      return { ...prev, [docId]: newFiles };
    });

    setFileObjects(prev => {
      const newFiles = prev[docId]?.filter(file => file.name !== fileName) || [];
      return { ...prev, [docId]: newFiles };
    });

    setDocumentStatus(prev => {
      const hasFiles = (prev[docId] && fileObjects[docId]?.length > 1);
      return { ...prev, [docId]: hasFiles };
    });

    console.log(`✅ File ${fileName} removed from ${docId}`);
  };

  const handleDragOver = (e: React.DragEvent, docId: string) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [docId]: true }));
  };

  const handleDragLeave = (e: React.DragEvent, docId: string) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [docId]: false }));
  };

  const handleDrop = (e: React.DragEvent, docId: string) => {
    e.preventDefault();
    setDragStates(prev => ({ ...prev, [docId]: false }));
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files, docId);
    }
  };

  const handleDocumentUpload = (docId: string) => {
    const input = fileInputRefs.current[docId];
    if (input) {
      input.click();
    }
  };

  const resetUploadStates = () => {
    setDocumentStatus({});
    setUploadedFiles({});
    setFileObjects({});
    setDragStates({});
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
    resetUploadStates,
    validateFiles,
  };
};