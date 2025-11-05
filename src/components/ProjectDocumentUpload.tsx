import { Upload } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useProjectDocumentUpload } from '@/hooks/useProjectDocumentUpload';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useState } from 'react';

interface ProjectDocumentUploadProps {
  projectId: number;
  onUploadComplete?: () => void;
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

export const ProjectDocumentUpload = ({ projectId, onUploadComplete }: ProjectDocumentUploadProps) => {
  const [selectedType, setSelectedType] = useState('Otro');
  const {
    uploading,
    dragActive,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileSelect,
    triggerFileInput
  } = useProjectDocumentUpload(projectId);

  const handleDropWithType = (e: React.DragEvent) => {
    handleDrop(e, selectedType).then(() => {
      if (onUploadComplete) onUploadComplete();
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files, selectedType).then(() => {
      if (onUploadComplete) onUploadComplete();
    });
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="document-type">Tipo de Documento</Label>
          <Select value={selectedType} onValueChange={setSelectedType}>
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
          }`}
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
            {uploading ? 'Cargando...' : 'Seleccionar Archivos'}
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
      </div>
    </Card>
  );
};
