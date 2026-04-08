import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { LicitacionItem } from '@/hooks/useLicitaciones';
import { ListOrdered, Plus, Loader2, Share2, Pencil, Check, X, Trash2 } from 'lucide-react';
import ItemizadoFileParser from '@/components/ItemizadoFileParser';
import ItemizadoChatbot from '@/components/licitacion/ItemizadoChatbot';
import { ParsedItem } from '@/hooks/useParseItemizado';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { buildHierarchicalItems, prefixItemDescription } from '@/utils/licitacionItemHierarchy';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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
  const [sharing, setSharing] = useState(false);
  const [showShareConfirm, setShowShareConfirm] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newPU, setNewPU] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ descripcion: string; unidad: string; cantidad: string; precio_unitario: string }>({
    descripcion: '', unidad: '', cantidad: '', precio_unitario: ''
  });

  const sortedItems = [...items].sort((a, b) => a.orden - b.orden);
  const hierarchicalItems = useMemo(() => buildHierarchicalItems(sortedItems), [sortedItems]);
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

  const normalizeCode = (raw: string): string => {
    return raw.replace(/[,;-]/g, '.').replace(/\.{2,}/g, '.').replace(/^\.+|\.+$/g, '');
  };

  const handleCreateItem = async () => {
    if (!licitacionId || !newDesc.trim()) return;
    setSaving(true);
    try {
      const cantidad = Number.parseFloat(newQty) || null;
      const precioUnitario = Number.parseFloat(newPU) || null;
      const precioTotal = cantidad != null && precioUnitario != null ? cantidad * precioUnitario : null;
      const maxOrden = sortedItems.length > 0 ? Math.max(...sortedItems.map((item) => item.orden || 0)) : 0;

      const code = normalizeCode(newCode.trim());
      const descripcion = code
        ? prefixItemDescription(code, newDesc.trim())
        : newDesc.trim();

      const { error } = await supabase.from('LicitacionItems').insert({
        licitacion_id: licitacionId,
        descripcion,
        unidad: newUnit.trim() || null,
        cantidad,
        precio_unitario: precioUnitario,
        precio_total: precioTotal,
        orden: maxOrden + 1,
        agregado_por_oferente: false,
      });

      if (error) throw error;

      setNewCode('');
      setNewDesc('');
      setNewUnit('');
      setNewQty('');
      setNewPU('');
      toast({ title: 'Partida agregada' });
      onRefresh?.();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (item: LicitacionItem, cleanDescription: string) => {
    setEditingId(item.id ?? null);
    setEditValues({
      descripcion: cleanDescription,
      unidad: item.unidad || '',
      cantidad: String(item.cantidad || ''),
      precio_unitario: String(item.precio_unitario || ''),
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEditing = async (item: LicitacionItem, displayCode: string) => {
    if (!editingId) return;
    setSaving(true);
    try {
      const cantidad = Number.parseFloat(editValues.cantidad) || null;
      const precioUnitario = Number.parseFloat(editValues.precio_unitario) || null;
      const precioTotal = cantidad != null && precioUnitario != null ? cantidad * precioUnitario : null;

      const descripcion = displayCode && displayCode !== '-'
        ? prefixItemDescription(displayCode, editValues.descripcion.trim())
        : editValues.descripcion.trim();

      const { error } = await supabase.from('LicitacionItems')
        .update({
          descripcion,
          unidad: editValues.unidad.trim() || null,
          cantidad,
          precio_unitario: precioUnitario,
          precio_total: precioTotal,
        })
        .eq('id', editingId);

      if (error) throw error;
      setEditingId(null);
      onRefresh?.();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (itemId: number) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('LicitacionItems').delete().eq('id', itemId);
      if (error) throw error;
      toast({ title: 'Partida eliminada' });
      onRefresh?.();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleShareWithOferentes = async () => {
    if (!licitacionId) return;
    setSharing(true);
    try {
      const { error } = await supabase.from('Licitaciones')
        .update({ itemizado_compartido: true } as any)
        .eq('id', licitacionId);
      if (error) throw error;

      // Send notification to all oferentes
      await supabase.functions.invoke('send-licitacion-invitation', {
        body: {
          licitacionId,
          isItemizadoUpdate: true,
        },
      });

      toast({ title: 'Itemizado compartido', description: 'Se notificó a todos los oferentes sobre la actualización del itemizado.' });
      setShowShareConfirm(false);
      onRefresh?.();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Itemizado Oficial */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2 font-rubik">
            <ListOrdered className="h-5 w-5" />
            Itemizado Oficial ({items.length} partidas)
            <Badge variant="secondary" className="text-[10px] ml-1">Mandante</Badge>
          </CardTitle>
          {licitacionId && items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareConfirm(true)}
              disabled={sharing}
            >
              {sharing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Share2 className="h-3.5 w-3.5 mr-1" />}
              Compartir con oferentes
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No se definió un itemizado para esta licitación. Usa las herramientas de abajo para agregar uno.
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
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hierarchicalItems.map(({ item, displayCode, cleanDescription, level }) => {
                    const isEditing = editingId === item.id;
                    return (
                      <TableRow key={item.id ?? displayCode}>
                        <TableCell className="text-muted-foreground">{displayCode}</TableCell>
                        {isEditing ? (
                          <>
                            <TableCell style={{ paddingLeft: `${level * 20 + 16}px` }}>
                              <Input value={editValues.descripcion} onChange={e => setEditValues(v => ({ ...v, descripcion: e.target.value }))} className="h-7 text-sm" />
                            </TableCell>
                            <TableCell className="text-center">
                              <Input value={editValues.unidad} onChange={e => setEditValues(v => ({ ...v, unidad: e.target.value }))} className="h-7 text-sm w-16" />
                            </TableCell>
                            <TableCell className="text-right">
                              <Input inputMode="decimal" value={editValues.cantidad} onChange={e => setEditValues(v => ({ ...v, cantidad: e.target.value }))} className="h-7 text-sm w-20 text-right [&::-webkit-inner-spin-button]:appearance-none" />
                            </TableCell>
                            <TableCell className="text-right">
                              <Input inputMode="decimal" value={editValues.precio_unitario} onChange={e => setEditValues(v => ({ ...v, precio_unitario: e.target.value }))} className="h-7 text-sm w-24 text-right [&::-webkit-inner-spin-button]:appearance-none" />
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {(() => {
                                const c = Number.parseFloat(editValues.cantidad) || 0;
                                const p = Number.parseFloat(editValues.precio_unitario) || 0;
                                return c * p > 0 ? `$${fmt(c * p)}` : '-';
                              })()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => saveEditing(item, displayCode)} disabled={saving}>
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={cancelEditing}>
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        ) : (
                          <>
                            <TableCell className="font-medium" style={{ paddingLeft: `${level * 20 + 16}px` }}>{cleanDescription}</TableCell>
                            <TableCell className="text-center">{item.unidad || '-'}</TableCell>
                            <TableCell className="text-right">{item.cantidad || '-'}</TableCell>
                            <TableCell className="text-right">{item.precio_unitario ? `$${fmt(item.precio_unitario)}` : '-'}</TableCell>
                            <TableCell className="text-right font-medium">{item.precio_total ? `$${fmt(item.precio_total)}` : '-'}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => startEditing(item, cleanDescription)}>
                                  <Pencil className="h-3 w-3 text-muted-foreground" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => item.id && deleteItem(item.id)}>
                                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })}
                  <TableRow className="border-t-2">
                    <TableCell colSpan={5} className="text-right font-medium">Subtotal</TableCell>
                    <TableCell className="text-right font-bold">${fmt(subtotal)}</TableCell>
                    <TableCell />
                  </TableRow>
                  {ivaPorcentaje && ivaPorcentaje > 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-right font-medium">IVA ({ivaPorcentaje}%)</TableCell>
                      <TableCell className="text-right">${fmt(iva)}</TableCell>
                      <TableCell />
                    </TableRow>
                  )}
                  <TableRow className="bg-primary/5">
                    <TableCell colSpan={5} className="text-right font-bold text-base">Total</TableCell>
                    <TableCell className="text-right font-bold text-base">${fmt(total)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 2. Tools section */}
      {licitacionId && (
        <div className="grid gap-4 md:grid-cols-2">
          <ItemizadoFileParser
            onItemsAccepted={handleItemsAccepted}
            title="Importar desde Archivo"
            description="Sube un Excel, PDF o Word con el presupuesto."
          />
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
        </div>
      )}

      {/* 3. Manual add */}
      {licitacionId && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-rubik text-base flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Agregar partida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1 w-20">
                <label className="text-xs text-muted-foreground">Ítem</label>
                <Input value={newCode} onChange={(e) => setNewCode(e.target.value)} placeholder="2.1" className="h-8 text-sm" />
              </div>
              <div className="space-y-1 flex-1 min-w-[180px]">
                <label className="text-xs text-muted-foreground">Descripción</label>
                <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Estructura secundaria" className="h-8 text-sm" />
              </div>
              <div className="space-y-1 w-16">
                <label className="text-xs text-muted-foreground">Unidad</label>
                <Input value={newUnit} onChange={(e) => setNewUnit(e.target.value)} placeholder="m2" className="h-8 text-sm" />
              </div>
              <div className="space-y-1 w-20">
                <label className="text-xs text-muted-foreground">Cantidad</label>
                <Input inputMode="decimal" value={newQty} onChange={(e) => setNewQty(e.target.value)} placeholder="0" className="h-8 text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]" />
              </div>
              <div className="space-y-1 w-24">
                <label className="text-xs text-muted-foreground">P. Unitario</label>
                <Input inputMode="decimal" value={newPU} onChange={(e) => setNewPU(e.target.value)} placeholder="0" className="h-8 text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]" />
              </div>
              <Button onClick={handleCreateItem} disabled={saving || !newDesc.trim()} size="sm" className="h-8">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                Agregar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Escribe el código del ítem (ej: 1.1, 2.3.1) para agrupar automáticamente. Acepta formatos como 1,1 / 1;1 / 1-1.
            </p>
          </CardContent>
        </Card>
      )}

      {saving && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Guardando partidas...
        </div>
      )}

      {/* Share Confirmation Dialog */}
      <AlertDialog open={showShareConfirm} onOpenChange={setShowShareConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" />
              Compartir Itemizado con Oferentes
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se compartirá esta versión del itemizado oficial con <strong>todos los oferentes</strong> de esta licitación.
              <br /><br />
              Los oferentes recibirán una notificación por correo informando que se ha actualizado el itemizado. <strong>El progreso existente de los oferentes no se verá afectado.</strong>
              <br /><br />
              ¿Deseas continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sharing}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleShareWithOferentes} disabled={sharing}>
              {sharing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Share2 className="h-4 w-4 mr-1" />}
              Confirmar y Compartir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LicitacionItemizadoTab;
