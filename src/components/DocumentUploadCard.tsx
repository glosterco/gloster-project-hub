
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Download, Upload, ExternalLink, HelpCircle, X } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  description: string;
  downloadUrl: string | null;
  uploaded: boolean;
  required: boolean;
  isUploadOnly?: boolean;
  helpText: string;
  hasDropdown?: boolean;
  allowMultiple?: boolean;
}

interface DocumentUploadCardProps {
  doc: Document;
  documentStatus: boolean;
  uploadedFiles: string[];
  dragState: boolean;
  achsSelection: string;
  setAchsSelection: (value: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDocumentUpload: () => void;
  onFileRemove: (fileIndex: number) => void;
  getExamenesUrl: () => string;
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
  return (
    <Card 
      className={`border-l-4 border-l-gloster-gray/30 transition-all duration-200 ${
        dragState ? 'border-gloster-yellow border-2 bg-gloster-yellow/5' : ''
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex items-start space-x-4 flex-1 min-w-0">
            <Checkbox 
              checked={documentStatus} 
              disabled
              className="mt-1 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-semibold text-slate-800 font-rubik text-sm md:text-base">{doc.name}</h4>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-gloster-gray hover:text-slate-800 shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-rubik text-sm">{doc.helpText}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-gloster-gray text-sm mb-3 font-rubik">{doc.description}</p>
              
              {/* Drag and drop zone */}
              {dragState && (
                <div className="mb-3 p-4 border-2 border-dashed border-gloster-yellow bg-gloster-yellow/10 rounded-lg text-center">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-gloster-gray" />
                  <p className="text-sm font-rubik text-gloster-gray">
                    Suelta los archivos aquí para cargar
                  </p>
                </div>
              )}
              
              {doc.hasDropdown && (
                <div className="mb-3">
                  <Select onValueChange={setAchsSelection}>
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue placeholder="Selecciona el organismo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="achs">ACHS</SelectItem>
                      <SelectItem value="ist">IST</SelectItem>
                      <SelectItem value="mutual">Mutual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                {!doc.isUploadOnly && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = doc.hasDropdown ? getExamenesUrl() : doc.downloadUrl;
                      if (url) window.open(url, '_blank');
                    }}
                    disabled={doc.hasDropdown && !achsSelection}
                    className="text-gloster-gray hover:text-slate-800 border-gloster-gray/30 font-rubik w-full sm:w-auto"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Obtener Documentos
                    <ExternalLink className="h-3 w-3 ml-2" />
                  </Button>
                )}
                
                {documentStatus ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    ✓ Cargado{doc.allowMultiple ? ` (${uploadedFiles.length})` : ''}
                  </Badge>
                ) : null}

                {/* Always show upload button for multiple files, or if no files uploaded */}
                {(!documentStatus || doc.allowMultiple) && (
                  <Button
                    size="sm"
                    onClick={onDocumentUpload}
                    className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik w-full sm:w-auto"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {doc.allowMultiple && uploadedFiles.length > 0 ? 'Agregar Más' : `Cargar Documento${doc.allowMultiple ? 's' : ''}`}
                  </Button>
                )}
              </div>
              
              {!dragState && !documentStatus && (
                <p className="text-xs text-gloster-gray mt-2 font-rubik italic">
                  💡 Tip: También puedes arrastrar los archivos directamente sobre esta tarjeta
                </p>
              )}
            </div>
          </div>
          
          {/* File Preview Section */}
          {uploadedFiles.length > 0 && (
            <div className="w-full lg:w-auto lg:ml-4 min-w-0 lg:max-w-xs">
              <p className="text-gloster-gray text-xs font-rubik mb-2">Archivos cargados:</p>
              <div className="space-y-1">
                {uploadedFiles.map((fileName, index) => (
                  <div key={index} className="bg-green-50 border border-green-200 rounded px-2 py-1 flex items-center justify-between">
                    <p className="text-green-700 text-xs font-rubik truncate flex-1 mr-2" title={fileName}>
                      {fileName}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onFileRemove(index)}
                      className="h-6 w-6 p-0 hover:bg-red-100"
                    >
                      <X className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUploadCard;
