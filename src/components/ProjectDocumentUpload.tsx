import { Upload, X, FileText } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useProjectDocumentUpload } from '@/hooks/useProjectDocumentUpload';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { useState } from 'react';
import { ScrollArea } from './ui/scroll-area';

interface ProjectDocumentUploadProps {
  projectId: number;
  onUploadComplete?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DOCUMENT_TYPES = [
  'Contrato',
  'Plano',
  'Especificación Técnica',
  'Certificado',
  'Informe',
  'Acta',
  'Otro'
];

export const ProjectDocumentUpload = ({ 
  projectId, 
  onUploadComplete, 
  open, 
  onOpenChange 
}: ProjectDocumentUploadProps) => {
  const [selectedType, setSelectedType] = useState('Otro');
  const {
    uploading,
    dragActive,
    pendingFiles,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    triggerFileInput,
    removeFile,
    confirmUpload,
    clearPendingFiles
  } = useProjectDocumentUpload(projectId);

  const handleDropWithType = (e: React.DragEvent) => {
    handleDrop(e, selectedType);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files, selectedType);
  };

  const handleConfirmUpload = async () => {
    const success = await confirmUpload();
    if (success) {
      onOpenChange(false);
      if (onUploadComplete) onUploadComplete();
    }
  };

  const handleClose = () => {
    if (!uploading) {
      clearPendingFiles();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cargar Documentos al Proyecto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="document-type">Tipo de Documento</Label>
            <Select value={selectedType} onValueChange={setSelectedType} disabled={uploading}>
              <SelectTrigger id="document-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/10' 
                : 'border-border hover:border-primary/50'
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDropWithType}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Arrastra archivos aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              PDF, Word, Excel, Imágenes (máx. 12MB)
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={triggerFileInput}
              disabled={uploading}
            >
              Seleccionar Archivos
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>

          {pendingFiles.length > 0 && (
            <div>
              <Label className="mb-2 block">
                Archivos seleccionados ({pendingFiles.length})
              </Label>
              <ScrollArea className="h-48 rounded-md border">
                <div className="p-4 space-y-2">
                  {pendingFiles.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-md bg-muted"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.tipo} • {(item.file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={uploading}
                        className="flex-shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={uploading}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirmUpload}
            disabled={uploading || pendingFiles.length === 0}
          >
            {uploading ? 'Cargando...' : `Confirmar Carga (${pendingFiles.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
