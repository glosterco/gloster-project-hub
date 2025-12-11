import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { RFI } from '@/hooks/useRFI';

interface RFITableProps {
  rfis: RFI[];
  loading: boolean;
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

export const RFITable: React.FC<RFITableProps> = ({
  rfis,
  loading
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>RFI</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        {rfis.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay RFI registrados para este proyecto
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estado</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead>Fecha Respuesta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rfis.map((rfi) => (
                <TableRow key={rfi.id}>
                  <TableCell>
                    <Badge variant={getStatusVariant(rfi.Status)}>
                      {rfi.Status || 'Pendiente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {rfi.Titulo || 'Sin título'}
                  </TableCell>
                  <TableCell>
                    {new Date(rfi.created_at).toLocaleDateString('es-CL')}
                  </TableCell>
                  <TableCell>
                    {rfi.Fecha_Respuesta ? 
                      new Date(rfi.Fecha_Respuesta).toLocaleDateString('es-CL') : 
                      'Sin respuesta'
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};
