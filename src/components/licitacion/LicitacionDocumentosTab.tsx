import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Documento } from '@/hooks/useLicitaciones';
import { FileText, ExternalLink, File, Upload, Loader2, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  documentos: Documento[];
  licitacionId: number;
  onRefresh: () => void;
}

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Content = result.split(',')[1];
      if (!base64Content) {
        reject(new Error('Empty content'));
        return;
      }
      resolve(base64Content);
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsDataURL(file);
  });
};

const LicitacionDocumentosTab: React.FC<Props> = ({ documentos, licitacionId, onRefresh }) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const getFileIcon = (tipo?: string) => {
    if (tipo?.includes('pdf')) return '📄';
    if (tipo?.includes('image')) return '🖼️';
    if (tipo?.includes('spreadsheet') || tipo?.includes('excel')) return '📊';
    if (tipo?.includes('word') || tipo?.includes('document')) return '📝';
    return '📎';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleUploadClick = () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "Sin archivos",
        description: "Selecciona archivos para cargar",
        variant: "destructive",
      });
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmUpload = async () => {
    setShowConfirmDialog(false);
    setUploading(true);

    try {
      const fileData = [];
      for (const file of selectedFiles) {
        // 5MB limit
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Archivo muy grande",
            description: `${file.name} excede el límite de 5MB`,
            variant: "destructive",
          });
          setUploading(false);
          return;
        }

        const base64Content = await convertFileToBase64(file);
        fileData.push({
          name: file.name,
          content: base64Content,
          mimeType: file.type,
          size: file.size,
        });
      }

      const { data, error } = await supabase.functions.invoke('upload-licitacion-documents', {
        body: {
          licitacionId,
          documents: fileData,
          notifyOferentes: true,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Upload failed');

      toast({
        title: "Documentos cargados",
        description: `${selectedFiles.length} documento(s) cargados y oferentes notificados`,
      });

      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      onRefresh();
    } catch (error: any) {
      console.error('Error uploading:', error);
      toast({
        title: "Error al cargar documentos",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between font-rubik">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Documentos y Antecedentes ({documentos.length})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload section */}
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                multiple
                className="flex-1 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
              <Button 
                onClick={handleUploadClick} 
                disabled={uploading || selectedFiles.length === 0}
                size="sm"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-1.5" />
                )}
                {uploading ? 'Cargando...' : 'Cargar y Notificar'}
              </Button>
            </div>
            
            {selectedFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs">
                    {getFileIcon(file.type)} {file.name} ({formatSize(file.size)})
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Document list */}
          {documentos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <File className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay documentos cargados</p>
            </div>
          ) : (
            <div className="space-y-2">
              {documentos.map((doc, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <span className="text-xl">{getFileIcon(doc.tipo)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{doc.nombre}</p>
                    {doc.size && (
                      <p className="text-xs text-muted-foreground">{formatSize(doc.size)}</p>
                    )}
                  </div>
                  {doc.url && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar carga de documentos
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Estás a punto de cargar <strong>{selectedFiles.length} documento(s)</strong> a la licitación.
              </p>
              <p className="text-destructive font-medium">
                ⚠️ Esta acción notificará automáticamente a todos los oferentes sobre la disponibilidad de nuevos documentos.
              </p>
              <p>¿Deseas continuar?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUpload}>
              Confirmar y Notificar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default LicitacionDocumentosTab;
