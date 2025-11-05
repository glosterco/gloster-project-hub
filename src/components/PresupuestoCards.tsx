import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';
import { Presupuesto } from '@/hooks/usePresupuesto';

interface PresupuestoCardsProps {
  presupuesto: Presupuesto[];
  loading: boolean;
  currency?: string;
  onCardClick?: (item: Presupuesto) => void;
}

export const PresupuestoCards: React.FC<PresupuestoCardsProps> = ({
  presupuesto,
  loading,
  currency = 'CLP',
  onCardClick
}) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 mb-6 font-rubik">Presupuesto del Proyecto</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-20 mb-4" />
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-24 mb-4" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {presupuesto.length === 0 ? (
        <Card className="p-8 text-center border-dashed border-2 border-muted">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-800 font-rubik">No hay partidas registradas</h3>
                <p className="text-muted-foreground text-sm font-rubik">
                  Las partidas del presupuesto aparecerán aquí cuando sean creadas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presupuesto.map((item) => (
            <Card 
              key={item.id} 
              className="hover:shadow-xl transition-all duration-300 border-muted hover:border-primary/50 group cursor-pointer"
              onClick={() => onCardClick?.(item)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-rubik text-slate-800">
                        {item.Item || `Partida #${item.id}`}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground font-rubik">
                        {item.Cantidad} {item.Unidad}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground font-rubik">Total</span>
                  </div>
                  <span className="font-bold text-slate-800 font-rubik">
                    {item.Total ? formatCurrency(item.Total, currency) : 'No especificado'}
                  </span>
                </div>

                {item['Avance Acumulado'] !== null && (
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium text-muted-foreground font-rubik">Avance</span>
                    <span className="font-medium text-slate-800 font-rubik">
                      {item['Avance Acumulado']}%
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
