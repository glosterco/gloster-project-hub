import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Users } from 'lucide-react';
import { Reunion } from '@/hooks/useReuniones';

interface ReunionesTableProps {
  reuniones: Reunion[];
  loading: boolean;
}

export const ReunionesTable: React.FC<ReunionesTableProps> = ({ reuniones, loading }) => {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (reuniones.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-rubik">Reuniones del Proyecto</CardTitle>
          <CardDescription className="font-rubik">
            Gestiona las minutas de reunión del proyecto
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-rubik">No hay reuniones registradas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-rubik">Reuniones del Proyecto</CardTitle>
        <CardDescription className="font-rubik">
          Gestiona las minutas de reunión del proyecto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-rubik">ID</TableHead>
              <TableHead className="font-rubik">Fecha de Creación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reuniones.map((reunion) => (
              <TableRow key={reunion.id} className="hover:bg-muted/50 cursor-pointer">
                <TableCell className="font-medium font-rubik">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    Reunión #{reunion.id}
                  </div>
                </TableCell>
                <TableCell className="font-rubik">
                  {new Date(reunion.created_at).toLocaleDateString('es-CL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
