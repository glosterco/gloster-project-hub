import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Image } from 'lucide-react';
import { Foto } from '@/hooks/useFotos';

interface FotosCardsProps {
  fotos: Foto[];
  loading: boolean;
  onCardClick?: (foto: Foto) => void;
}

export const FotosCards: React.FC<FotosCardsProps> = ({
  fotos,
  loading,
  onCardClick
}) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-2xl font-bold text-slate-800 mb-6 font-rubik">Fotos del Proyecto</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-20 mb-4" />
              <Skeleton className="h-6 w-32 mb-2" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {fotos.length === 0 ? (
        <Card className="p-8 text-center border-dashed border-2 border-muted">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Image className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-800 font-rubik">No hay fotos registradas</h3>
                <p className="text-muted-foreground text-sm font-rubik">
                  Las fotos aparecerán aquí cuando sean subidas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fotos.map((foto) => (
            <Card 
              key={foto.id} 
              className="hover:shadow-xl transition-all duration-300 border-muted hover:border-primary/50 group cursor-pointer"
              onClick={() => onCardClick?.(foto)}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Image className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-rubik text-slate-800">
                      Foto #{foto.id}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground font-rubik">
                      {new Date(foto.created_at).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
