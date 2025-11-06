import { Upload, X, Image } from 'lucide-react';
import { Button } from './ui/button';
import { useProjectPhotoUpload } from '@/hooks/useProjectPhotoUpload';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { useState } from 'react';

interface ProjectPhotoUploadProps {
  projectId: number;
  onUploadComplete?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProjectPhotoUpload = ({ 
  projectId, 
  onUploadComplete, 
  open, 
  onOpenChange 
}: ProjectPhotoUploadProps) => {
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
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
  } = useProjectPhotoUpload(projectId);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // Create preview URLs for images
      const newUrls = Array.from(files).map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newUrls]);
    }
    handleFileSelect(files);
  };

  const handleRemoveFile = (index: number) => {
    // Revoke the preview URL to free memory
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    removeFile(index);
  };

  const handleConfirmUpload = async () => {
    const success = await confirmUpload();
    if (success) {
      // Clean up preview URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setPreviewUrls([]);
      onOpenChange(false);
      if (onUploadComplete) onUploadComplete();
    }
  };

  const handleClose = () => {
    if (!uploading) {
      // Clean up preview URLs
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setPreviewUrls([]);
      clearPendingFiles();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Cargar Fotos al Proyecto</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary bg-primary/10' 
                : 'border-border hover:border-primary/50'
            } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Arrastra fotos aquí o haz clic para seleccionar
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              JPG, PNG, WEBP (máx. 12MB por foto)
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={triggerFileInput}
              disabled={uploading}
            >
              Seleccionar Fotos
            </Button>
            <Input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>

          {pendingFiles.length > 0 && (
            <div>
              <Label className="mb-2 block">
                Fotos seleccionadas ({pendingFiles.length})
              </Label>
              <ScrollArea className="h-96 rounded-md border">
                <div className="p-4 grid grid-cols-2 gap-4">
                  {pendingFiles.map((item, index) => (
                    <div
                      key={index}
                      className="relative group rounded-md overflow-hidden border border-border"
                    >
                      <img
                        src={previewUrls[index]}
                        alt={item.file.name}
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                          disabled={uploading}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                      <div className="p-2 bg-background">
                        <p className="text-xs font-medium truncate">{item.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(item.file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
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
