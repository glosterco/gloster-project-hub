import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { HelpCircle, ExternalLink, Calendar } from 'lucide-react';
import { RFI } from '@/hooks/useRFI';

interface RFICardsProps {
  rfis: RFI[];
  loading: boolean;
  onCardClick?: (rfi: RFI) => void;
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
      {rfis.map((rfi) => (
        <Card 
          key={rfi.id} 
          className="hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onCardClick?.(rfi)}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-blue-500" />
                <span className="font-medium text-sm">RFI #{rfi.id}</span>
              </div>
              <Badge className={getStatusColor(rfi.Status)}>
                {rfi.Status || 'Pendiente'}
              </Badge>
            </div>
            
            <h3 className="font-semibold text-base mb-2 line-clamp-2">
              {rfi.Titulo || 'Sin título'}
            </h3>
            
            {rfi.Descripcion && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {rfi.Descripcion}
              </p>
            )}
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(rfi.created_at).toLocaleDateString('es-CL')}</span>
              </div>
              
              {rfi.URL && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 px-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(rfi.URL!, '_blank');
                  }}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Ver adjunto
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
