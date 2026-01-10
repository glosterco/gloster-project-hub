import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, Clock, Pause, Download } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';
import { Adicional, calculateDaysElapsed, calculatePausedDays } from '@/hooks/useAdicionales';
import { useExportPDF } from '@/hooks/useExportPDF';

const getStatusVariant = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'enviado':
      return 'secondary';
    case 'pausado':
      return 'outline';
    case 'aprobado':
      return 'default';
    case 'rechazado':
      return 'destructive';
    default:
      return 'secondary';
  }
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'enviado':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'pausado':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'aprobado':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'rechazado':
      return 'bg-red-100 text-red-700 border-red-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

interface AdicionalesCardsProps {
  adicionales: Adicional[];
  loading: boolean;
  currency?: string;
  onCardClick?: (adicional: Adicional) => void;
}

export const AdicionalesCards: React.FC<AdicionalesCardsProps> = ({
  adicionales,
  loading,
  currency = 'CLP',
  onCardClick
}) => {
  const { exportAdicionalToPDF } = useExportPDF();

  const handleDownload = async (e: React.MouseEvent, adicional: Adicional) => {
    e.stopPropagation();
    await exportAdicionalToPDF(adicional, currency);
  };
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 mb-6 font-rubik">Adicionales del Proyecto</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-20 mb-4" />
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-24 mb-4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {adicionales.length === 0 ? (
        <Card className="p-8 text-center border-dashed border-2 border-muted">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-800 font-rubik">No hay adicionales registrados</h3>
                <p className="text-muted-foreground text-sm font-rubik">
                  Los trabajos adicionales aparecerán aquí cuando sean creados
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adicionales.map((adicional) => {
            const daysElapsed = calculateDaysElapsed(adicional);
            const pausedDays = calculatePausedDays(adicional);
            
            return (
              <Card 
                key={adicional.id} 
                className="hover:shadow-xl transition-all duration-300 border-muted hover:border-primary/50 group cursor-pointer"
                onClick={() => onCardClick?.(adicional)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <DollarSign className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg font-rubik text-slate-800">
                            Adicional #{adicional.Correlativo || adicional.id}
                          </CardTitle>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 shrink-0"
                            onClick={(e) => handleDownload(e, adicional)}
                            title="Descargar PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground font-rubik">
                          {new Date(adicional.created_at).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={getStatusVariant(adicional.Status)}
                      className={`${getStatusColor(adicional.Status)} font-rubik`}
                    >
                      {adicional.Status || 'Enviado'}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Título */}
                  {adicional.Titulo && (
                    <p className="text-sm font-medium text-slate-700 font-rubik line-clamp-2">
                      {adicional.Titulo}
                    </p>
                  )}

                  {/* Categoría y Especialidad */}
                  <div className="flex flex-wrap gap-2">
                    {adicional.Categoria && (
                      <Badge variant="outline" className="text-xs font-rubik">
                        {adicional.Categoria}
                      </Badge>
                    )}
                    {adicional.Especialidad && (
                      <Badge variant="secondary" className="text-xs font-rubik">
                        {adicional.Especialidad}
                      </Badge>
                    )}
                  </div>

                  {/* Monto */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground font-rubik">Monto</span>
                    </div>
                    <span className="font-bold text-slate-800 font-rubik">
                      {adicional.Monto_presentado ? 
                        formatCurrency(adicional.Monto_presentado, currency) : 
                        'No especificado'
                      }
                    </span>
                  </div>

                  {/* Fecha de vencimiento */}
                  {adicional.Vencimiento && adicional.Status !== 'Aprobado' && adicional.Status !== 'Rechazado' && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground font-rubik">
                          {adicional.Status === 'Pausado' ? 'Venc. (Pausado)' : 'Vencimiento'}
                        </span>
                      </div>
                      <span className="font-medium text-slate-800 font-rubik">
                        {new Date(adicional.Vencimiento).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                  )}

                  {/* Fecha de cierre para aprobados/rechazados */}
                  {(adicional.Status === 'Aprobado' || adicional.Status === 'Rechazado') && adicional.approved_at && (
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground font-rubik">Fecha Cierre</span>
                      </div>
                      <span className="font-medium text-slate-800 font-rubik">
                        {new Date(adicional.approved_at).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                  )}

                  {/* Plazo transcurrido */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground font-rubik">Plazo</span>
                    </div>
                    <span className="font-medium text-slate-800 font-rubik">
                      {daysElapsed} días
                    </span>
                  </div>

                  {/* Días en pausa */}
                  {(pausedDays > 0 || adicional.Status === 'Pausado') && (
                    <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="flex items-center space-x-2">
                        <Pause className="h-4 w-4 text-amber-600" />
                        <span className="text-sm font-medium text-amber-700 font-rubik">En pausa</span>
                      </div>
                      <span className="font-medium text-amber-800 font-rubik">
                        {pausedDays} días
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
