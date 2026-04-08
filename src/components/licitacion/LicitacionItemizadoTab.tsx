import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LicitacionItem } from '@/hooks/useLicitaciones';
import { ListOrdered } from 'lucide-react';
import ItemizadoFileParser from '@/components/ItemizadoFileParser';
import ItemizadoChatbot from '@/components/licitacion/ItemizadoChatbot';
import { ParsedItem } from '@/hooks/useParseItemizado';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { buildHierarchicalItems, getNextSubitemCode, prefixItemDescription } from '@/utils/licitacionItemHierarchy';

interface Props {
  items: LicitacionItem[];
  gastosGenerales?: number | null;
  utilidades?: number | null;
  ivaPorcentaje?: number | null;
  licitacionId?: number;
  licitacionNombre?: string;
  licitacionDescripcion?: string;
  licitacionEspecificaciones?: string;
  onRefresh?: () => void;
}

const LicitacionItemizadoTab: React.FC<Props> = ({
  items, ivaPorcentaje, licitacionId,
  licitacionNombre, licitacionDescripcion, licitacionEspecificaciones, onRefresh
}) => {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemUnidad, setNewItemUnidad] = useState('');
  const [newItemCantidad, setNewItemCantidad] = useState('');
  const [newItemPU, setNewItemPU] = useState('');
  const [parentItemId, setParentItemId] = useState('');
  const sortedItems = [...items].sort((a, b) => a.orden - b.orden);
  const hierarchicalItems = useMemo(() => buildHierarchicalItems(sortedItems), [sortedItems]);
  const topLevelItems = hierarchicalItems.filter(({ level }) => level === 0);
  const subtotal = sortedItems.reduce((sum, i) => sum + (i.precio_total || 0), 0);
  const iva = ivaPorcentaje ? subtotal * (ivaPorcentaje / 100) : 0;
  const total = subtotal + iva;

  const fmt = (n: number) => n.toLocaleString('es-CL', { minimumFractionDigits: 0 });

  const handleItemsAccepted = async (parsedItems: ParsedItem[]) => {
    if (!licitacionId) return;
    setSaving(true);
    try {
      const rows = parsedItems.map((item, idx) => ({
        licitacion_id: licitacionId,
        descripcion: item.descripcion,
        unidad: item.unidad,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        precio_total: item.precio_total,
        orden: idx + 1,
        agregado_por_oferente: false,
      }));

      const { error } = await supabase.from('LicitacionItems').insert(rows);
      if (error) throw error;

      toast({ title: 'Itemizado importado', description: `${rows.length} partidas agregadas` });
      onRefresh?.();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateItem = async () => {
    if (!licitacionId || !newItemDesc.trim()) return;

    setSaving(true);
    try {
      const cantidad = Number.parseFloat(newItemCantidad) || null;
      const precioUnitario = Number.parseFloat(newItemPU) || null;
      const precioTotal = cantidad != null && precioUnitario != null ? cantidad * precioUnitario : null;
      const maxOrden = sortedItems.length > 0 ? Math.max(...sortedItems.map((item) => item.orden || 0)) : 0;
      const parentCode = parentItemId
        ? topLevelItems.find(({ item }) => String(item.id) === parentItemId)?.displayCode || null
        : null;
      const descripcion = parentCode
        ? prefixItemDescription(getNextSubitemCode(sortedItems, parentCode), newItemDesc.trim())
        : newItemDesc.trim();

      const { error } = await supabase.from('LicitacionItems').insert({
        licitacion_id: licitacionId,
        descripcion,
        unidad: newItemUnidad.trim() || null,
        cantidad,
        precio_unitario: precioUnitario,
        precio_total: precioTotal,
        orden: maxOrden + 1,
        agregado_por_oferente: false,
      });

      if (error) throw error;

      setNewItemDesc('');
      setNewItemUnidad('');
      setNewItemCantidad('');
      setNewItemPU('');
      setParentItemId('');
      toast({ title: 'Partida agregada', description: parentCode ? 'Se creó como subitem del item seleccionado.' : 'Se agregó una nueva partida al itemizado.' });
      onRefresh?.();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Import section */}
      {licitacionId && (
        <ItemizadoFileParser
          onItemsAccepted={handleItemsAccepted}
          title="Importar Itemizado desde Archivo"
          description="Sube un Excel, PDF o Word con el presupuesto y se extraerán las partidas automáticamente."
        />
      )}

      {/* AI Chatbot */}
      {licitacionId && (
        <ItemizadoChatbot
          licitacionNombre={licitacionNombre}
          licitacionDescripcion={licitacionDescripcion}
          licitacionEspecificaciones={licitacionEspecificaciones}
          existingItems={items.map(i => ({
            descripcion: i.descripcion,
            unidad: i.unidad || '',
            cantidad: i.cantidad,
            precio_unitario: i.precio_unitario,
          }))}
          onItemsGenerated={handleItemsAccepted}
        />
      )}

      {licitacionId && (
        <Card>
          <CardHeader>
            <CardTitle className="font-rubik text-base">Agregar partida o subitem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="manual-item-desc">Descripción</Label>
                <Input id="manual-item-desc" value={newItemDesc} onChange={(e) => setNewItemDesc(e.target.value)} placeholder="Ej. Estructura secundaria de tribunas" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-item-parent">Agrupar dentro de</Label>
                <select
                  id="manual-item-parent"
                  value={parentItemId}
                  onChange={(e) => setParentItemId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="">Nuevo item principal</option>
                  {topLevelItems.map(({ item, displayCode, cleanDescription }) => (
                    <option key={item.id || displayCode} value={String(item.id)}>
                      {displayCode} · {cleanDescription}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-item-unit">Unidad</Label>
                <Input id="manual-item-unit" value={newItemUnidad} onChange={(e) => setNewItemUnidad(e.target.value)} placeholder="m2, gl, un" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-item-qty">Cantidad</Label>
                <Input id="manual-item-qty" type="number" value={newItemCantidad} onChange={(e) => setNewItemCantidad(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manual-item-pu">Precio unitario</Label>
                <Input id="manual-item-pu" type="number" value={newItemPU} onChange={(e) => setNewItemPU(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {parentItemId ? 'Se asignará automáticamente como subitem correlativo del item seleccionado.' : 'Si no seleccionas un item padre, se agregará como un nuevo item principal.'}
              </p>
              <Button onClick={handleCreateItem} disabled={saving || !newItemDesc.trim()}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Agregar al itemizado
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {saving && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Guardando partidas...
        </div>
      )}

      {/* Existing items table */}
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
              No se definió un itemizado para esta licitación. Usa el importador de arriba para agregar uno.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Ítem</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center w-20">Unidad</TableHead>
                    <TableHead className="text-right w-24">Cantidad</TableHead>
                    <TableHead className="text-right w-32">P. Unitario</TableHead>
                    <TableHead className="text-right w-32">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hierarchicalItems.map(({ item, displayCode, cleanDescription, level }) => (
                    <TableRow key={item.id || idx}>
                      <TableCell className="text-muted-foreground">{displayCode}</TableCell>
                      <TableCell className="font-medium" style={{ paddingLeft: `${level * 20 + 16}px` }}>{cleanDescription}</TableCell>
                      <TableCell className="text-center">{item.unidad || '-'}</TableCell>
                      <TableCell className="text-right">{item.cantidad || '-'}</TableCell>
                      <TableCell className="text-right">{item.precio_unitario ? `$${fmt(item.precio_unitario)}` : '-'}</TableCell>
                      <TableCell className="text-right font-medium">{item.precio_total ? `$${fmt(item.precio_total)}` : '-'}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2">
                    <TableCell colSpan={5} className="text-right font-medium">Subtotal</TableCell>
                    <TableCell className="text-right font-bold">${fmt(subtotal)}</TableCell>
                  </TableRow>
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
    </div>
  );
};

export default LicitacionItemizadoTab;
