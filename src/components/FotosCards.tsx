import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Camera, ExternalLink } from 'lucide-react';
import { Foto } from '@/hooks/useFotos';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';

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
  const [selectedPhoto, setSelectedPhoto] = useState<Foto | null>(null);

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (fotos.length === 0) {
    return (
      <div className="text-center py-12">
        <Camera className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-lg text-muted-foreground">No hay fotos registradas</p>
      </div>
    );
  }

  const getPhotoUrl = (foto: Foto) => {
    if (!foto.DriveId) return null;
    return `https://drive.google.com/thumbnail?id=${foto.DriveId}&sz=w800`;
  };

  const handleCardClick = (foto: Foto) => {
    setSelectedPhoto(foto);
    if (onCardClick) onCardClick(foto);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {fotos.map((foto) => {
          const photoUrl = getPhotoUrl(foto);
          return (
            <Card 
              key={foto.id} 
              className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
              onClick={() => handleCardClick(foto)}
            >
              <CardContent className="p-0">
                <div className="aspect-square bg-muted flex items-center justify-center">
                  {photoUrl ? (
                    <img
                      src={photoUrl}
                      alt={foto.Nombre || 'Foto del proyecto'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.parentElement!.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg class="h-12 w-12 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></div>';
                      }}
                    />
                  ) : (
                    <Camera className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          {selectedPhoto && (
            <div className="space-y-4">
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                {getPhotoUrl(selectedPhoto) ? (
                  <img
                    src={getPhotoUrl(selectedPhoto)!}
                    alt={selectedPhoto.Nombre || 'Foto del proyecto'}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <Camera className="h-24 w-24 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedPhoto.Nombre || 'Sin nombre'}</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedPhoto.created_at).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                {selectedPhoto.WebViewLink && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedPhoto.WebViewLink, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Ver en Drive
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
