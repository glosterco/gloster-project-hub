
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Download, Upload, ExternalLink, HelpCircle, X, CheckCircle } from 'lucide-react';

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
  externalLink?: string;
  showButtonWhen?: string[];
}

interface DocumentUploadCardProps {
  doc: Document;
  documentStatus: boolean;
  uploadedFiles: string[] | undefined;
  dragState: boolean;
  achsSelection: string;
  setAchsSelection: (value: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDocumentUpload: () => void;
  onFileRemove: (fileIndex: number) => void;
  getExamenesUrl: () => string;
  paymentStatus?: string;
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
  getExamenesUrl,
  paymentStatus
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
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-semibold text-slate-800 font-rubik text-sm md:text-base">{doc.name}</h3>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-gloster-gray cursor-help shrink-0" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="font-rubik text-sm">{doc.helpText}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-gloster-gray text-sm font-rubik mb-3">{doc.description}</p>
              
              {/* Mostrar archivos cargados - Solo para estados Rechazado, no para Enviado */}
              {uploadedFiles && uploadedFiles.length > 0 && paymentStatus === 'Rechazado' && (
                <div className="space-y-2 mb-3">
                  {uploadedFiles.map((file, index) => {
                    // Remove file extension from display name
                    const fileNameWithoutExtension = file.replace(/\.[^/.]+$/, "");
                    return (
                      <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-200">
                        <span className="text-sm text-green-800 font-rubik truncate flex-1 pr-2">{fileNameWithoutExtension}</span>
                        <Button
                          onClick={() => onFileRemove(index)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-800 hover:bg-red-100 shrink-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Dropdown para exámenes preocupacionales */}
              {doc.hasDropdown && (
                <div className="mb-3">
                  <Select value={achsSelection} onValueChange={setAchsSelection}>
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue placeholder="Selecciona tu organismo administrador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="achs">ACHS</SelectItem>
                      <SelectItem value="ist">IST</SelectItem>
                      <SelectItem value="mutual">Mutual de Seguridad</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:min-w-max">
            {/* Botón de descarga/visitar sitio - Solo mostrar para estados específicos si se define showButtonWhen */}
            {(doc.downloadUrl || doc.hasDropdown || doc.externalLink) && !(doc as any).isOtherDocument && 
             (!doc.showButtonWhen || (paymentStatus && doc.showButtonWhen.includes(paymentStatus))) && (
              <Button
                onClick={() => {
                  const url = doc.hasDropdown ? getExamenesUrl() : (doc.externalLink || doc.downloadUrl);
                  if (url) {
                    window.open(url, '_blank');
                  }
                }}
                variant="outline"
                size="sm"
                className="border-gloster-gray/30 hover:bg-gloster-gray/10 font-rubik whitespace-nowrap"
                disabled={doc.hasDropdown && !achsSelection}
              >
                <Download className="h-4 w-4 mr-2" />
                {doc.isUploadOnly ? 'Información' : 'Visitar Sitio'}
                <ExternalLink className="h-3 w-3 ml-1" />
              </Button>
            )}
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={onDocumentUpload}
                size="sm"
                className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik whitespace-nowrap"
              >
                <Upload className="h-4 w-4 mr-2" />
                {doc.allowMultiple ? 'Cargar Más' : 'Cargar'} 
              </Button>
              {documentStatus && (
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-rubik">Cargado</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DocumentUploadCard;
