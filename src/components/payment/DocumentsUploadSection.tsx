
import React from 'react';
import DocumentUploadCard from '@/components/DocumentUploadCard';

interface PaymentDocument {
  id: string;
  name: string;
  description: string;
  downloadUrl?: string | null;
  uploaded: boolean;
  required: boolean;
  isUploadOnly?: boolean;
  helpText?: string;
  hasDropdown?: boolean;
  allowMultiple?: boolean;
}

interface DocumentsUploadSectionProps {
  documents: PaymentDocument[];
  documentStatus: Record<string, boolean>;
  uploadedFiles: Record<string, any>;
  dragStates: Record<string, boolean>;
  achsSelection: string;
  setAchsSelection: (value: string) => void;
  onDragOver: (e: React.DragEvent, docId: string) => void;
  onDragLeave: (e: React.DragEvent, docId: string) => void;
  onDrop: (e: React.DragEvent, docId: string, allowMultiple?: boolean) => void;
  onDocumentUpload: (docId: string) => void;
  onFileRemove: (docId: string, fileIndex: number) => void;
  getExamenesUrl: () => string;
}

const DocumentsUploadSection: React.FC<DocumentsUploadSectionProps> = ({
  documents,
  documentStatus,
  uploadedFiles,
  dragStates,
  achsSelection,
  setAchsSelection,
  onDragOver,
  onDragLeave,
  onDrop,
  onDocumentUpload,
  onFileRemove,
  getExamenesUrl,
}) => {
  return (
    <div className="space-y-4 mb-8">
      <h3 className="text-lg md:text-xl font-bold text-slate-800 font-rubik">Documentación Requerida</h3>
      
      <div className="space-y-4">
        {documents.map((doc) => doc.required ? (
          <DocumentUploadCard
            key={doc.id}
            doc={{
              ...doc,
              downloadUrl: doc.downloadUrl || null,
              uploaded: false,
              helpText: doc.helpText || ''
            }}
            documentStatus={documentStatus[doc.id]}
            uploadedFiles={uploadedFiles[doc.id]}
            dragState={dragStates[doc.id]}
            achsSelection={achsSelection}
            setAchsSelection={setAchsSelection}
            onDragOver={(e) => onDragOver(e, doc.id)}
            onDragLeave={(e) => onDragLeave(e, doc.id)}
            onDrop={(e) => onDrop(e, doc.id, doc.allowMultiple)}
            onDocumentUpload={() => onDocumentUpload(doc.id)}
            onFileRemove={(fileIndex) => onFileRemove(doc.id, fileIndex)}
            getExamenesUrl={getExamenesUrl}
          />) : null
        )}
      </div>
    </div>
  );
};

export default DocumentsUploadSection;
