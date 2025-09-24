import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/utils/currencyUtils';
import { Adicional } from '@/hooks/useAdicionales';

interface AdicionalesTableProps {
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

export const AdicionalesTable: React.FC<AdicionalesTableProps> = ({
  adicionales,
  loading,
  currency = 'CLP'
}) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Adicionales</CardTitle>
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
      <CardHeader>
        <CardTitle>Adicionales del Proyecto</CardTitle>
      </CardHeader>
      <CardContent>
        {adicionales.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay adicionales registrados para este proyecto
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estado</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Fecha Creación</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {adicionales.map((adicional) => (
                <TableRow key={adicional.id}>
                  <TableCell>
                    <Badge variant={getStatusVariant(adicional.Status)}>
                      {adicional.Status || 'Pendiente'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {adicional.Monto_presentado ? 
                      formatCurrency(adicional.Monto_presentado, currency) : 
                      'No especificado'
                    }
                  </TableCell>
                  <TableCell>
                    {adicional.Vencimiento ? 
                      new Date(adicional.Vencimiento).toLocaleDateString('es-CL') : 
                      'No especificado'
                    }
                  </TableCell>
                  <TableCell>
                    {new Date(adicional.created_at).toLocaleDateString('es-CL')}
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