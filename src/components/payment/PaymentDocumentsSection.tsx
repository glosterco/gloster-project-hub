
import React from 'react';
import DocumentUploadCard from '@/components/DocumentUploadCard';

interface Document {
  id: string;
  name: string;
  required: boolean;
}

interface PaymentDocumentsSectionProps {
  documents: Document[];
  documentStatus: { [key: string]: boolean };
  uploadedFiles: { [key: string]: string[] };
  onFileUpload: (documentId: string, files: FileList | File[] | null) => void;
  onFileRemove: (documentId: string, index: number) => void;
  onDragOver: (e: React.DragEvent, documentId: string) => void;
  onDragLeave: (e: React.DragEvent, documentId: string) => void;
  onDrop: (e: React.DragEvent, documentId: string) => void;
  dragStates: { [key: string]: boolean };
  fileInputRefs: React.MutableRefObject<{ [key: string]: HTMLInputElement | null }>;
  shouldShowDriveFiles: boolean;
  paymentId: number;
}

export const PaymentDocumentsSection: React.FC<PaymentDocumentsSectionProps> = ({
  documents,
  documentStatus,
  uploadedFiles,
  onFileUpload,
  onFileRemove,
  onDragOver,
  onDragLeave,
  onDrop,
  dragStates,
  fileInputRefs,
  shouldShowDriveFiles,
  paymentId
}) => {
  return (
    <div className="space-y-6">
      <h4 className="text-lg font-semibold text-slate-800 font-rubik">Documentación Requerida</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {documents.map((doc) => (
          <DocumentUploadCard
            key={doc.id}
            documentName={doc.name}
            isRequired={doc.required}
            isUploaded={documentStatus[doc.id] || false}
            uploadedFiles={uploadedFiles[doc.id] || []}
            onFileUpload={(files) => onFileUpload(doc.id, files)}
            onFileRemove={(index) => onFileRemove(doc.id, index)}
            onDragOver={(e) => onDragOver(e, doc.id)}
            onDragLeave={(e) => onDragLeave(e, doc.id)}
            onDrop={(e) => onDrop(e, doc.id)}
            isDragOver={dragStates[doc.id] || false}
            fileInputRef={fileInputRefs.current[doc.id]}
            showDriveFiles={shouldShowDriveFiles}
            paymentId={paymentId}
          />
        ))}
      </div>
    </div>
  );
};
