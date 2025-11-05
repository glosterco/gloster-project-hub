import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentName: string | null;
  webViewLink: string | null;
  isLoading?: boolean;
}

export const DocumentPreviewModal = ({
  isOpen,
  onClose,
  documentName,
  webViewLink,
  isLoading = false
}: DocumentPreviewModalProps) => {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIframeLoaded(false);
    }
  }, [isOpen]);

  const embedUrl = webViewLink 
    ? webViewLink.replace('/view', '/preview')
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="truncate mr-4">{documentName || 'Vista previa'}</span>
            {webViewLink && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(webViewLink, '_blank')}
                className="flex-shrink-0"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir en Drive
              </Button>
            )}
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
