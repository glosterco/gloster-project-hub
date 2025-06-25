
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Upload, FileText, CheckCircle } from 'lucide-react';

interface DocumentUploadCardProps {
  title: string;
  description: string;
  required: boolean;
  files: File[];
  onFilesSelected: (files: File[]) => void;
  allowMultiple?: boolean;
}

const DocumentUploadCard: React.FC<DocumentUploadCardProps> = ({
  title,
  description,
  required,
  files,
  onFilesSelected,
  allowMultiple = false
}) => {
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (selectedFiles.length > 0) {
      onFilesSelected(selectedFiles);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    
    const droppedFiles = Array.from(event.dataTransfer.files);
    if (droppedFiles.length > 0) {
      onFilesSelected(droppedFiles);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
  };

  const isUploaded = files.length > 0;

  return (
    <Card className={`relative transition-all duration-200 ${dragOver ? 'border-gloster-yellow bg-gloster-yellow/5' : 'border-gloster-gray/20'} ${isUploaded ? 'border-green-200 bg-green-50/30' : ''}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-rubik text-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-gloster-gray" />
            <span>{title}</span>
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
        <p className="text-sm text-gloster-gray font-rubik">{description}</p>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver 
              ? 'border-gloster-yellow bg-gloster-yellow/10' 
              : isUploaded 
                ? 'border-green-300 bg-green-50' 
                : 'border-gloster-gray/30 hover:border-gloster-yellow hover:bg-gloster-yellow/5'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {isUploaded ? (
            <div className="space-y-2">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
              <p className="text-sm font-medium text-green-700">
                {files.length} archivo{files.length > 1 ? 's' : ''} cargado{files.length > 1 ? 's' : ''}
              </p>
              <div className="space-y-1">
                {files.map((file, index) => (
                  <p key={index} className="text-xs text-green-600 truncate">
                    {file.name}
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
              {allowMultiple && (
                <p className="text-xs text-gloster-gray">
                  Puedes subir múltiples archivos
                </p>
              )}
            </div>
          )}
          
          <input
            type="file"
            multiple={allowMultiple}
            onChange={handleFileSelection}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
        </div>
        
        {isUploaded && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.querySelector(`input[type="file"]`)?.click()}
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
