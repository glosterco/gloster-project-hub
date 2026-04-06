import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LicitacionItem } from '@/hooks/useLicitaciones';
import { ListOrdered } from 'lucide-react';

interface Props {
  items: LicitacionItem[];
  gastosGenerales?: number | null;
  utilidades?: number | null;
  ivaPorcentaje?: number | null;
}

const LicitacionItemizadoTab: React.FC<Props> = ({ items, gastosGenerales, utilidades, ivaPorcentaje }) => {
  const sortedItems = [...items].sort((a, b) => a.orden - b.orden);
  const subtotal = sortedItems.reduce((sum, i) => sum + (i.precio_total || 0), 0);
  const gg = gastosGenerales ? subtotal * (gastosGenerales / 100) : 0;
  const utilidad = utilidades ? (subtotal + gg) * (utilidades / 100) : 0;
  const neto = subtotal + gg + utilidad;
  const iva = ivaPorcentaje ? neto * (ivaPorcentaje / 100) : 0;
  const total = neto + iva;

  const fmt = (n: number) => n.toLocaleString('es-CL', { minimumFractionDigits: 0 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-rubik">
          <ListOrdered className="h-5 w-5" />
          Itemizado Oficial ({items.length} partidas)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">
            No se definió un itemizado para esta licitación
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-center w-20">Unidad</TableHead>
                  <TableHead className="text-right w-24">Cantidad</TableHead>
                  <TableHead className="text-right w-32">P. Unitario</TableHead>
                  <TableHead className="text-right w-32">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedItems.map((item, idx) => (
                  <TableRow key={item.id || idx}>
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell className="font-medium">{item.descripcion}</TableCell>
                    <TableCell className="text-center">{item.unidad || '-'}</TableCell>
                    <TableCell className="text-right">{item.cantidad || '-'}</TableCell>
                    <TableCell className="text-right">{item.precio_unitario ? `$${fmt(item.precio_unitario)}` : '-'}</TableCell>
                    <TableCell className="text-right font-medium">{item.precio_total ? `$${fmt(item.precio_total)}` : '-'}</TableCell>
                  </TableRow>
                ))}
                {/* Totals */}
                <TableRow className="border-t-2">
                  <TableCell colSpan={5} className="text-right font-medium">Subtotal</TableCell>
                  <TableCell className="text-right font-bold">${fmt(subtotal)}</TableCell>
                </TableRow>
                {gastosGenerales && gastosGenerales > 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-medium">GG ({gastosGenerales}%)</TableCell>
                    <TableCell className="text-right">${fmt(gg)}</TableCell>
                  </TableRow>
                )}
                {utilidades && utilidades > 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-medium">Utilidades ({utilidades}%)</TableCell>
                    <TableCell className="text-right">${fmt(utilidad)}</TableCell>
                  </TableRow>
                )}
                {ivaPorcentaje && ivaPorcentaje > 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-medium">IVA ({ivaPorcentaje}%)</TableCell>
                    <TableCell className="text-right">${fmt(iva)}</TableCell>
                  </TableRow>
                )}
                <TableRow className="bg-primary/5">
                  <TableCell colSpan={5} className="text-right font-bold text-base">Total</TableCell>
                  <TableCell className="text-right font-bold text-base">${fmt(total)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LicitacionItemizadoTab;
