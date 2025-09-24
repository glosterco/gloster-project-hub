import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, DollarSign, Clock, ExternalLink } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';
import { Adicional } from '@/hooks/useAdicionales';

interface AdicionalesCardsProps {
  adicionales: Adicional[];
  loading: boolean;
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

export const AdicionalesCards: React.FC<AdicionalesCardsProps> = ({
  adicionales,
  loading,
  currency = 'CLP'
}) => {
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
      <div>
        <h3 className="text-2xl font-bold text-slate-800 mb-2 font-rubik">Adicionales del Proyecto</h3>
        <p className="text-muted-foreground font-rubik">
          Gestión de trabajos adicionales y modificaciones al proyecto original
        </p>
      </div>

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
          {adicionales.map((adicional) => (
            <Card 
              key={adicional.id} 
              className="hover:shadow-xl transition-all duration-300 border-muted hover:border-primary/50 group"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-rubik text-slate-800">
                        Adicional #{adicional.id}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground font-rubik">
                        Creado el {new Date(adicional.created_at).toLocaleDateString('es-CL')}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={getStatusVariant(adicional.Status)}
                    className={`${getStatusColor(adicional.Status)} font-rubik`}
                  >
                    {adicional.Status || 'Pendiente'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Monto */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground font-rubik">Monto</span>
                  </div>
                  <span className="font-bold text-slate-800 font-rubik">
                    {adicional.Monto ? 
                      formatCurrency(adicional.Monto, currency) : 
                      'No especificado'
                    }
                  </span>
                </div>

                {/* Fecha de vencimiento */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground font-rubik">Vencimiento</span>
                  </div>
                  <span className="font-medium text-slate-800 font-rubik">
                    {adicional.Vencimiento ? 
                      new Date(adicional.Vencimiento).toLocaleDateString('es-CL') : 
                      'No especificado'
                    }
                  </span>
                </div>

                {/* Botón de acción si tiene URL */}
                {adicional.URL && (
                  <Button 
                    variant="outline" 
                    className="w-full group-hover:border-primary group-hover:text-primary transition-colors font-rubik"
                    onClick={() => window.open(adicional.URL!, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver detalles
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};