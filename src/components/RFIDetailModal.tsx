import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, HelpCircle, Calendar, MessageSquare } from 'lucide-react';
import { RFI } from '@/hooks/useRFI';

interface RFIDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rfi: RFI | null;
}

const getStatusVariant = (status: string | null) => {
  switch (status?.toLowerCase()) {
    case 'pendiente':
      return 'secondary';
    case 'respondido':
      return 'default';
    case 'cerrado':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getStatusColor = (status: string | null) => {
  switch (status?.toLowerCase()) {
    case 'pendiente':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'respondido':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'cerrado':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    default:
      return 'bg-amber-100 text-amber-700 border-amber-200';
  }
};

export const RFIDetailModal: React.FC<RFIDetailModalProps> = ({
  open,
  onOpenChange,
  rfi
}) => {
  if (!rfi) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-500" />
            RFI #{rfi.id}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status and Date */}
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(rfi.Status)}>
              {rfi.Status || 'Pendiente'}
            </Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Creado: {new Date(rfi.created_at).toLocaleDateString('es-CL')}</span>
            </div>
          </div>

          <Separator />

          {/* Title */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Título</h3>
            <p className="text-base font-semibold">{rfi.Titulo || 'Sin título'}</p>
          </div>

          {/* Description */}
          {rfi.Descripcion && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Descripción / Pregunta</h3>
              <p className="text-sm whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
                {rfi.Descripcion}
              </p>
            </div>
          )}

          <Separator />

          {/* Response */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-green-500" />
              <h3 className="text-sm font-medium text-muted-foreground">Respuesta</h3>
            </div>
            {rfi.Respuesta ? (
              <div className="bg-green-50 border border-green-200 p-3 rounded-md">
                <p className="text-sm whitespace-pre-wrap">{rfi.Respuesta}</p>
                {rfi.Fecha_Respuesta && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Respondido el: {new Date(rfi.Fecha_Respuesta).toLocaleDateString('es-CL')}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Aún no hay respuesta para este RFI
              </p>
            )}
          </div>

          {/* Attachment */}
          {rfi.URL && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Documento adjunto</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(rfi.URL!, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver documento
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
