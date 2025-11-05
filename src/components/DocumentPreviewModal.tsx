import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, FileWarning } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string | null;
  previewUrl: string | null;
  mimeType?: string | null;
  isLoading?: boolean;
}

export const DocumentPreviewModal = ({
  isOpen,
  onClose,
  documentName,
  previewUrl,
  mimeType,
  isLoading = false
}: DocumentPreviewModalProps) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIframeLoaded(false);
    }
  }, [isOpen]);

  const embedUrl = previewUrl || null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="truncate">
            {documentName || 'Vista previa'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 relative bg-muted rounded-md overflow-hidden">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Cargando vista previa...</span>
            </div>
          ) : embedUrl ? (
            <div className="w-full h-full flex items-center justify-center bg-background">
              {mimeType && mimeType.includes('pdf') ? (
                <div className="w-full h-full overflow-auto">
                  <Document file={embedUrl} loading={
                    <div className="flex h-full items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  }>
                    <Page pageNumber={1} width={1100} renderTextLayer={false} renderAnnotationLayer={false} />
                  </Document>
                </div>
              ) : mimeType && mimeType.startsWith('image/') ? (
                <img src={embedUrl} alt={documentName || 'Vista previa'} className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="flex flex-col items-center text-center p-6 text-muted-foreground">
                  <FileWarning className="h-8 w-8 mb-2" />
                  <p>No hay vista previa disponible para este tipo de archivo.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">No se puede mostrar la vista previa</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
