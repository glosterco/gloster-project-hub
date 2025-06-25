
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, FileText, CheckCircle } from 'lucide-react';

interface DocumentUploadCardProps {
  doc: {
    id: string;
    name: string;
    description: string;
    downloadUrl: string | null;
    uploaded: boolean;
    required: boolean;
    isUploadOnly?: boolean;
    allowMultiple?: boolean;
    hasDropdown?: boolean;
    helpText?: string;
  };
  documentStatus: boolean;
  uploadedFiles: string[];
  dragState: boolean;
  achsSelection?: string;
  setAchsSelection?: (value: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDocumentUpload: () => void;
  onFileRemove: (fileIndex: number) => void;
  getExamenesUrl?: () => string;
}

const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  doc,
  documentStatus,
  uploadedFiles,
  dragState,
  achsSelection,
  setAchsSelection,
  onDragOver,
  onDragLeave,
  onDrop,
  onDocumentUpload,
  onFileRemove,
  getExamenesUrl
}) => {
  const isUploaded = uploadedFiles && uploadedFiles.length > 0;

  return (
    <Card className={`relative transition-all duration-200 ${dragState ? 'border-gloster-yellow bg-gloster-yellow/5' : 'border-gloster-gray/20'} ${isUploaded ? 'border-green-200 bg-green-50/30' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-rubik text-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-gloster-gray" />
            <span>{doc.name}</span>
          </div>
          <div className="flex items-center space-x-2">
            {isUploaded && (
              <span className="text-sm text-green-600 font-medium flex items-center space-x-1">
                <CheckCircle className="h-4 w-4" />
                <span>Cargado</span>
              </span>
            )}
            <Checkbox
              checked={isUploaded}
              disabled={true}
              className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
            />
          </div>
        </CardTitle>
        <p className="text-sm text-gloster-gray font-rubik">{doc.description}</p>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragState 
              ? 'border-gloster-yellow bg-gloster-yellow/10' 
              : isUploaded 
                ? 'border-green-300 bg-green-50' 
                : 'border-gloster-gray/30 hover:border-gloster-yellow hover:bg-gloster-yellow/5'
          }`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          {isUploaded ? (
            <div className="space-y-2">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
              <p className="text-sm font-medium text-green-700">
                {uploadedFiles.length} archivo{uploadedFiles.length > 1 ? 's' : ''} cargado{uploadedFiles.length > 1 ? 's' : ''}
              </p>
              <div className="space-y-1">
                {uploadedFiles.map((fileName, index) => (
                  <p key={index} className="text-xs text-green-600 truncate">
                    {fileName}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 text-gloster-gray mx-auto" />
              <p className="text-sm text-gloster-gray">
                Arrastra archivos aquí o haz clic para seleccionar
              </p>
              {doc.allowMultiple && (
                <p className="text-xs text-gloster-gray">
                  Puedes subir múltiples archivos
                </p>
              )}
            </div>
          )}
          
          <input
            type="file"
            multiple={doc.allowMultiple}
            onChange={() => {}}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onClick={onDocumentUpload}
          />
        </div>
        
        {isUploaded && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => (document.querySelector(`input[type="file"]`) as HTMLInputElement)?.click()}
              className="font-rubik text-gloster-gray border-gloster-gray/30 hover:border-gloster-yellow hover:text-gloster-yellow"
            >
              Cargar más archivos
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentUploadCard;
