import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText } from 'lucide-react';
import { Documento } from '@/hooks/useDocumentos';

interface DocumentosTableProps {
  documentos: Documento[];
  loading: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const DocumentosTable: React.FC<DocumentosTableProps> = ({ documentos, loading }) => {
  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (documentos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground font-rubik">No hay documentos registrados</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="font-rubik">Nombre</TableHead>
          <TableHead className="font-rubik">Tipo de Archivo</TableHead>
          <TableHead className="font-rubik">Tamaño</TableHead>
          <TableHead className="font-rubik">Última Modificación</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documentos.map((doc) => (
          <TableRow key={doc.id} className="hover:bg-muted/50 cursor-pointer">
            <TableCell className="font-medium font-rubik">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {doc.Nombre || `Documento ${doc.id}`}
              </div>
            </TableCell>
            <TableCell className="font-rubik">{doc.Tipo || 'N/A'}</TableCell>
            <TableCell className="font-rubik">-</TableCell>
            <TableCell className="font-rubik">
              {new Date(doc.created_at).toLocaleDateString('es-CL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
