import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { HelpCircle, Calendar, AlertTriangle, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { RFI } from '@/hooks/useRFI';

interface RFICardsProps {
  rfis: RFI[];
  loading: boolean;
  onCardClick?: (rfi: RFI) => void;
}

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

const getUrgenciaColor = (urgencia: string | null) => {
  switch (urgencia?.toLowerCase()) {
    case 'muy_urgente':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'urgente':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'no_urgente':
    default:
      return 'bg-blue-100 text-blue-700 border-blue-200';
  }
};

const getUrgenciaLabel = (urgencia: string | null) => {
  switch (urgencia?.toLowerCase()) {
    case 'muy_urgente':
      return 'Muy urgente';
    case 'urgente':
      return 'Urgente';
    case 'no_urgente':
    default:
      return 'No urgente';
  }
};

const getUrgenciaIcon = (urgencia: string | null) => {
  switch (urgencia?.toLowerCase()) {
    case 'muy_urgente':
      return <AlertCircle className="h-3 w-3" />;
    case 'urgente':
      return <AlertTriangle className="h-3 w-3" />;
    default:
      return <Clock className="h-3 w-3" />;
  }
};

// Calculate days between two dates
const getDaysBetween = (startDate: string, endDate?: string | null): number => {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const RFICards: React.FC<RFICardsProps> = ({
  rfis,
  loading,
  onCardClick
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-6 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (rfis.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hay RFI registrados para este proyecto</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {rfis.map((rfi) => {
        const isCerrado = rfi.Status?.toLowerCase() === 'cerrado';
        // For closed RFIs, use Fecha_Respuesta as close date; otherwise show due date
        const closeDate = isCerrado ? rfi.Fecha_Respuesta : null;
        const dueDate = (rfi as any).Fecha_Vencimiento;
        
        // Days elapsed: if closed, days from creation to close; otherwise days from creation to now
        const daysElapsed = getDaysBetween(rfi.created_at, closeDate);
        
        return (
          <Card 
            key={rfi.id} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onCardClick?.(rfi)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3 gap-2">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-blue-500 shrink-0" />
                  <span className="font-medium text-sm">RFI #{rfi.Correlativo || rfi.id}</span>
                </div>
                <div className="flex flex-wrap gap-1 justify-end">
                  <Badge className={getStatusColor(rfi.Status)}>
                    {rfi.Status || 'Pendiente'}
                  </Badge>
                  {(rfi as any).Urgencia && (
                    <Badge className={`${getUrgenciaColor((rfi as any).Urgencia)} flex items-center gap-1`}>
                      {getUrgenciaIcon((rfi as any).Urgencia)}
                      {getUrgenciaLabel((rfi as any).Urgencia)}
                    </Badge>
                  )}
                </div>
              </div>
              
              <h3 className="font-semibold text-base mb-2 line-clamp-2">
                {rfi.Titulo || 'Sin título'}
              </h3>
              
              {rfi.Descripcion && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {rfi.Descripcion}
                </p>
              )}
              
              {/* Dates and duration section */}
              <div className="space-y-1.5 text-xs text-muted-foreground border-t pt-3 mt-3">
                {/* Creation date */}
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                  <span>Creado: {new Date(rfi.created_at).toLocaleDateString('es-CL')}</span>
                </div>
                
                {/* Due date or Close date */}
                {isCerrado && closeDate ? (
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>Cerrado: {new Date(closeDate).toLocaleDateString('es-CL')}</span>
                  </div>
                ) : dueDate ? (
                  <div className="flex items-center gap-1.5 text-amber-600">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>Vence: {new Date(dueDate).toLocaleDateString('es-CL')}</span>
                  </div>
                ) : null}
                
                {/* Days elapsed */}
                <div className="flex items-center gap-1.5">
                  <span className={`font-medium ${isCerrado ? 'text-gray-600' : daysElapsed > 7 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    {daysElapsed} día{daysElapsed !== 1 ? 's' : ''} {isCerrado ? 'de duración' : 'transcurridos'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
