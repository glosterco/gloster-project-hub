import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera } from 'lucide-react';
import { Foto } from '@/hooks/useFotos';

interface FotosGridProps {
  fotos: Foto[];
  loading: boolean;
}

export const FotosGrid: React.FC<FotosGridProps> = ({ fotos, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-64 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (fotos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Camera className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground font-rubik">No hay fotos registradas</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {fotos.map((foto) => (
        <div key={foto.id} className="relative group">
          <div className="aspect-video bg-muted rounded-lg overflow-hidden border-2 border-border hover:border-primary transition-colors cursor-pointer">
            <div className="w-full h-full flex items-center justify-center">
              <Camera className="h-16 w-16 text-muted-foreground/50" />
            </div>
            {/* Fecha en esquina superior derecha */}
            <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-rubik">
              {new Date(foto.created_at).toLocaleDateString('es-CL', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </div>
          </div>
          {/* Nombre debajo de la foto */}
          <p className="mt-2 text-sm font-medium text-foreground font-rubik truncate">
            Foto #{foto.id}
          </p>
        </div>
      ))}
    </div>
  );
};
