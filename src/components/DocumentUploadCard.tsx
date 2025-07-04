
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Download, Upload, ExternalLink, HelpCircle, X, CheckCircle } from 'lucide-react';

interface DocumentUploadCardProps {
  documentName: string;
  isRequired: boolean;
  isUploaded: boolean;
  uploadedFiles: string[];
  onFileUpload: (files: FileList | File[] | null) => void;
  onFileRemove: (index: number) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isDragOver: boolean;
  fileInputRef: HTMLInputElement | null;
  showDriveFiles: boolean;
  paymentId: number;
}

const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  documentName,
  isRequired,
  isUploaded,
  uploadedFiles,
  onFileUpload,
  onFileRemove,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragOver,
  fileInputRef,
  showDriveFiles,
  paymentId
}) => {
  return (
    <Card 
      className={`border-l-4 border-l-gloster-gray/30 transition-all duration-200 ${
        isDragOver ? 'border-gloster-yellow border-2 bg-gloster-yellow/5' : ''
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex items-start space-x-4 flex-1 min-w-0">
            <Checkbox 
              checked={isUploaded}
              disabled
              className="mt-1 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-semibold text-slate-800 font-rubik text-sm md:text-base">{documentName}</h3>
                {isRequired && (
                  <Badge variant="destructive" className="text-xs">
                    Requerido
                  </Badge>
                )}
              </div>
              
              {uploadedFiles && uploadedFiles.length > 0 && (
                <div className="space-y-2 mb-3">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-200">
                      <span className="text-sm text-green-800 font-rubik truncate flex-1 pr-2">{file}</span>
                      <Button
                        onClick={() => onFileRemove(index)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-100 shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:min-w-max">
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => fileInputRef?.click()}
                size="sm"
                className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik whitespace-nowrap"
              >
                <Upload className="h-4 w-4 mr-2" />
                Cargar
              </Button>
              {isUploaded && (
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-rubik">Cargado</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <input
          ref={(el) => {
            if (fileInputRef && el) {
              (fileInputRef as any) = el;
            }
          }}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => onFileUpload(e.target.files)}
          accept=".pdf,.csv,.xlsx,.xlsm,.docx"
        />
      </CardContent>
    </Card>
  );
};

export default DocumentUploadCard;
