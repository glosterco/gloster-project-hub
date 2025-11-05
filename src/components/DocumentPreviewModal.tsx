import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string | null;
  previewUrl: string | null;
  isLoading?: boolean;
}

export const DocumentPreviewModal = ({
  isOpen,
  onClose,
  documentName,
  previewUrl,
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
            <>
              {!iframeLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              )}
              <iframe
                src={embedUrl}
                className="w-full h-full border-0"
                title={documentName || 'Document preview'}
                onLoad={() => setIframeLoaded(true)}
              />
            </>
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
