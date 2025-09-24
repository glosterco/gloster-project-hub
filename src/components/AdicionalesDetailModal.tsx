import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, DollarSign, Clock, FileText, TrendingUp, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';
import { Adicional } from '@/hooks/useAdicionales';

interface AdicionalesDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adicional: Adicional | null;
  currency?: string;
}

const getStatusVariant = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pendiente':
      return 'secondary';
    case 'aprobado':
      return 'default';
    case 'rechazado':
      return 'destructive';
    case 'enviado':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pendiente':
      return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'aprobado':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'rechazado':
      return 'bg-red-100 text-red-700 border-red-200';
    case 'enviado':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export const AdicionalesDetailModal: React.FC<AdicionalesDetailModalProps> = ({
  open,
  onOpenChange,
  adicional,
  currency = 'CLP'
}) => {
  if (!adicional) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="font-rubik text-xl">
              Adicional #{adicional.id}
            </DialogTitle>
            <Badge 
              variant={getStatusVariant(adicional.Status)}
              className={`${getStatusColor(adicional.Status)} font-rubik`}
            >
              {adicional.Status || 'Pendiente'}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 font-rubik">
                <FileText className="h-5 w-5" />
                <span>Información General</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground font-rubik">Categoría</p>
                  <p className="font-semibold font-rubik">{adicional.Categoria || 'No especificada'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground font-rubik">Título</p>
                  <p className="font-semibold font-rubik">{adicional.Titulo || 'Sin título'}</p>
                </div>
              </div>
              
              {adicional.Descripcion && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground font-rubik">Descripción</p>
                  <p className="text-sm font-rubik mt-1">{adicional.Descripcion}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-muted-foreground font-rubik">Fecha de Creación</p>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-rubik">{new Date(adicional.created_at).toLocaleDateString('es-CL')}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información Financiera */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 font-rubik">
                <DollarSign className="h-5 w-5" />
                <span>Información Financiera</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-700 font-rubik">Monto Presentado</p>
                    <p className="text-xl font-bold text-blue-800 font-rubik">
                      {adicional.Monto_presentado ? 
                        formatCurrency(adicional.Monto_presentado, currency) : 
                        'No especificado'
                      }
                    </p>
                  </div>
                  
                  {adicional.GG && (
                    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm font-medium text-purple-700 font-rubik">GG (%)</p>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        <span className="text-xl font-bold text-purple-800 font-rubik">{adicional.GG}%</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-700 font-rubik">Monto Aprobado</p>
                    <p className="text-xl font-bold text-green-800 font-rubik">
                      {adicional.Monto_aprobado ? 
                        formatCurrency(adicional.Monto_aprobado, currency) : 
                        'Pendiente de aprobación'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fechas y Plazos */}
          {adicional.Vencimiento && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 font-rubik">
                  <Clock className="h-5 w-5" />
                  <span>Fechas y Plazos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <p className="text-sm font-medium text-orange-700 font-rubik">Fecha de Vencimiento</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Calendar className="h-4 w-4 text-orange-600" />
                    <span className="text-lg font-semibold text-orange-800 font-rubik">
                      {new Date(adicional.Vencimiento).toLocaleDateString('es-CL')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Acciones */}
          {adicional.URL && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 font-rubik">
                  <ExternalLink className="h-5 w-5" />
                  <span>Acciones</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full font-rubik"
                  onClick={() => window.open(adicional.URL!, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Ver documentos adicionales
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};