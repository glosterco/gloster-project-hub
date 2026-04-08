import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Oferta, OfertaItem } from '@/hooks/useLicitacionDetail';
import { LicitacionItem } from '@/hooks/useLicitaciones';
import { BarChart3, Trophy, Loader2, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy, horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  ofertas: Oferta[];
  itemsReferencia: LicitacionItem[];
  licitacionId?: number;
  licitacionIVA?: number | null;
  onRefresh?: () => void;
}

const fmt = (n: number | null | undefined) => n != null ? `$${n.toLocaleString('es-CL')}` : '-';
const fmtNum = (n: number | null | undefined) => n != null ? n.toLocaleString('es-CL') : '-';

const getDeviationClass = (value: number | null | undefined, avg: number) => {
  if (value == null || avg === 0) return '';
  const pct = Math.abs((value - avg) / avg);
  if (pct > 0.3) return 'bg-destructive/10 text-destructive font-bold';
  if (pct > 0.15) return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
  return '';
};

const normalizeDesc = (s: string | null | undefined) => (s || '').toLowerCase().trim();

const findOfertaItem = (oferta: Oferta, item: LicitacionItem): OfertaItem | undefined => {
  if (item.id) {
    const byRef = oferta.items.find(oi => oi.item_referencia_id === item.id);
    if (byRef) return byRef;
  }
  const norm = normalizeDesc(item.descripcion);
  if (!norm) return undefined;
  return oferta.items.find(oi => normalizeDesc(oi.descripcion) === norm);
};

// Sortable header cell for ofertas column reordering
const SortableOfertaHeader: React.FC<{
  oferta: Oferta;
  colsPerOferta: number;
  isAdj: boolean;
}> = ({ oferta, colsPerOferta, isAdj }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: `oferta-${oferta.id}`,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      colSpan={colsPerOferta}
      className={`text-center border-l border-r ${isAdj ? 'bg-emerald-50 dark:bg-emerald-950/20' : ''}`}
    >
      <div className="flex flex-col items-center gap-0.5">
        <div className="flex items-center gap-1">
          <span {...attributes} {...listeners} className="cursor-grab">
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </span>
          <p className="text-xs font-bold truncate max-w-[140px]">
            {oferta.oferente_empresa || oferta.oferente_nombre || oferta.oferente_email}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {isAdj && <Trophy className="h-3 w-3 text-emerald-600" />}
          <Badge variant={isAdj ? 'default' : 'outline'} className={`text-[9px] ${isAdj ? 'bg-emerald-600' : ''}`}>
            {isAdj ? 'Adjudicada' : oferta.estado}
          </Badge>
        </div>
      </div>
    </TableHead>
  );
};

const LicitacionOfertasTab: React.FC<Props> = ({
  ofertas: ofertasOriginal, itemsReferencia, licitacionId, licitacionIVA, onRefresh
}) => {
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [adjudicando, setAdjudicando] = useState(false);
  const [confirmAdjudicar, setConfirmAdjudicar] = useState<Oferta | null>(null);
  const [ofertaOrder, setOfertaOrder] = useState<number[]>([]);
  const [itemOrder, setItemOrder] = useState<number[]>([]);

  // Stable ordered ofertas
  const ofertas = useMemo(() => {
    if (ofertaOrder.length > 0) {
      const map = new Map(ofertasOriginal.map(o => [o.id, o]));
      return ofertaOrder.map(id => map.get(id)).filter(Boolean) as Oferta[];
    }
    return ofertasOriginal;
  }, [ofertasOriginal, ofertaOrder]);

  // Initialize order when ofertas change
  React.useEffect(() => {
    if (ofertaOrder.length === 0 && ofertasOriginal.length > 0) {
      setOfertaOrder(ofertasOriginal.map(o => o.id));
    }
  }, [ofertasOriginal, ofertaOrder.length]);

  const adjudicadaOferta = ofertas.find(o => o.estado === 'adjudicada');

  const sortedItems = useMemo(() => {
    const refItems = [...itemsReferencia]
      .filter(i => !i.agregado_por_oferente)
      .sort((a, b) => a.orden - b.orden);

    const seenDescs = new Set<string>(refItems.map(i => normalizeDesc(i.descripcion)));
    const combined: LicitacionItem[] = [...refItems];

    let extraOrder = refItems.length > 0 ? Math.max(...refItems.map(r => r.orden)) + 1 : 1;
    ofertas.forEach(o => {
      o.items.forEach(oi => {
        const norm = normalizeDesc(oi.descripcion);
        if (norm && !seenDescs.has(norm)) {
          seenDescs.add(norm);
          combined.push({
            id: oi.id,
            descripcion: oi.descripcion,
            unidad: oi.unidad || '',
            cantidad: oi.cantidad || 0,
            precio_unitario: oi.precio_unitario || 0,
            precio_total: oi.precio_total || 0,
            orden: extraOrder++,
          });
        }
      });
    });

    // Apply custom item order
    if (itemOrder.length > 0) {
      const map = new Map(combined.map(i => [i.id, i]));
      const ordered = itemOrder.map(id => map.get(id)).filter(Boolean) as LicitacionItem[];
      const remaining = combined.filter(i => !itemOrder.includes(i.id));
      return [...ordered, ...remaining];
    }

    return combined;
  }, [itemsReferencia, ofertas, itemOrder]);

  // Initialize item order
  React.useEffect(() => {
    if (itemOrder.length === 0 && sortedItems.length > 0) {
      setItemOrder(sortedItems.map(i => i.id));
    }
  }, [sortedItems, itemOrder.length]);

  const mediaValues = useMemo(() => {
    const map = new Map<number, { cantidad: number; precio: number; total: number }>();
    sortedItems.forEach(item => {
      const values = ofertas.map(o => findOfertaItem(o, item)).filter(Boolean) as OfertaItem[];
      if (values.length > 0) {
        map.set(item.id || 0, {
          cantidad: values.reduce((s, v) => s + (v.cantidad || 0), 0) / values.length,
          precio: values.reduce((s, v) => s + (v.precio_unitario || 0), 0) / values.length,
          total: values.reduce((s, v) => s + (v.precio_total || 0), 0) / values.length,
        });
      }
    });
    return map;
  }, [ofertas, sortedItems]);

  const ofertaSubtotals = useMemo(() => {
    const map = new Map<number, number>();
    ofertas.forEach(o => {
      const subtotal = o.items.reduce((s, i) => s + (i.precio_total || 0), 0);
      map.set(o.id, subtotal);
    });
    return map;
  }, [ofertas]);

  const ofertaFinancials = useMemo(() => {
    const map = new Map<number, { ggPct: number | null; ggAmount: number; utilPct: number | null; utilAmount: number; ivaAmount: number; total: number }>();

    ofertas.forEach((oferta) => {
      const subtotal = ofertaSubtotals.get(oferta.id) || 0;
      const ggPct = oferta.gastos_generales ?? null;
      const ggAmount = ggPct != null ? subtotal * (ggPct / 100) : 0;
      const utilPct = oferta.utilidades ?? null;
      const utilAmount = utilPct != null ? (subtotal + ggAmount) * (utilPct / 100) : 0;
      const neto = subtotal + ggAmount + utilAmount;
      const ivaAmount = licitacionIVA != null && licitacionIVA > 0 ? neto * (licitacionIVA / 100) : 0;
      const total = oferta.total ?? neto + ivaAmount;

      map.set(oferta.id, { ggPct, ggAmount, utilPct, utilAmount, ivaAmount, total });
    });

    return map;
  }, [licitacionIVA, ofertaSubtotals, ofertas]);

  const colsPerOferta = collapsed ? 1 : 3;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleOfertaDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = Number(String(active.id).replace('oferta-', ''));
    const overId = Number(String(over.id).replace('oferta-', ''));
    const oldIndex = ofertaOrder.indexOf(activeId);
    const newIndex = ofertaOrder.indexOf(overId);
    if (oldIndex !== -1 && newIndex !== -1) {
      setOfertaOrder(arrayMove(ofertaOrder, oldIndex, newIndex));
    }
  };

  const handleItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeId = Number(String(active.id).replace('item-', ''));
    const overId = Number(String(over.id).replace('item-', ''));
    const currentOrder = itemOrder.length > 0 ? itemOrder : sortedItems.map(i => i.id);
    const oldIndex = currentOrder.indexOf(activeId);
    const newIndex = currentOrder.indexOf(overId);
    if (oldIndex !== -1 && newIndex !== -1) {
      setItemOrder(arrayMove(currentOrder, oldIndex, newIndex));
    }
  };

  const handleAdjudicar = async (oferta: Oferta) => {
    if (!licitacionId) return;
    setAdjudicando(true);
    try {
      const { error: err1 } = await supabase
        .from('LicitacionOfertas')
        .update({ estado: 'adjudicada' })
        .eq('id', oferta.id);
      if (err1) throw err1;

      const otherIds = ofertas.filter(o => o.id !== oferta.id).map(o => o.id);
      if (otherIds.length > 0) {
        const { error: err2 } = await supabase
          .from('LicitacionOfertas')
          .update({ estado: 'no_adjudicada' })
          .in('id', otherIds);
        if (err2) throw err2;
      }

      const { error: err3 } = await supabase
        .from('Licitaciones')
        .update({ estado: 'adjudicada' })
        .eq('id', licitacionId);
      if (err3) throw err3;

      toast({ title: 'Licitación adjudicada', description: `Adjudicada a ${oferta.oferente_empresa || oferta.oferente_email}` });
      setConfirmAdjudicar(null);
      onRefresh?.();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setAdjudicando(false);
    }
  };

  if (ofertas.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Aún no se han recibido ofertas</p>
        </CardContent>
      </Card>
    );
  }

  const hasGG = ofertas.some(oferta => (oferta.gastos_generales ?? 0) > 0);
  const hasUtil = ofertas.some(oferta => (oferta.utilidades ?? 0) > 0);
  const hasIVA = licitacionIVA != null && licitacionIVA > 0;

  // Sortable item row
  const SortableItemRow: React.FC<{ item: LicitacionItem }> = ({ item }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
      id: `item-${item.id}`,
    });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };
    const media = mediaValues.get(item.id || 0);

    return (
      <TableRow ref={setNodeRef} style={style}>
        <TableCell className="sticky left-0 bg-background z-10 border-r">
          <div className="flex items-center gap-1">
            <span {...attributes} {...listeners} className="cursor-grab shrink-0">
              <GripVertical className="h-3 w-3 text-muted-foreground" />
            </span>
            <span className="text-xs font-medium truncate max-w-[170px] block">{item.descripcion}</span>
          </div>
        </TableCell>
        {!collapsed && (
          <>
            <TableCell className="text-center text-xs border-r">{item.unidad || '-'}</TableCell>
            <TableCell className="text-right text-xs border-r">{fmtNum(item.cantidad)}</TableCell>
          </>
        )}
        {ofertas.map(oferta => {
          const oi = findOfertaItem(oferta, item);
          const isAdj = oferta.estado === 'adjudicada';
          const adjBg = isAdj ? 'bg-emerald-50/50 dark:bg-emerald-950/10' : '';
          return (
            <React.Fragment key={oferta.id}>
              {!collapsed && (
                <>
                  <TableCell className={`text-right text-xs border-l ${adjBg} ${getDeviationClass(oi?.cantidad, media?.cantidad || 0)}`}>
                    {fmtNum(oi?.cantidad)}
                  </TableCell>
                  <TableCell className={`text-right text-xs ${adjBg} ${getDeviationClass(oi?.precio_unitario, media?.precio || 0)}`}>
                    {oi?.precio_unitario != null ? fmt(oi.precio_unitario) : '-'}
                  </TableCell>
                </>
              )}
              <TableCell className={`text-right text-xs font-medium ${collapsed ? 'border-l' : ''} border-r ${adjBg} ${getDeviationClass(oi?.precio_total, media?.total || 0)}`}>
                {oi?.precio_total != null ? fmt(oi.precio_total) : '-'}
              </TableCell>
            </React.Fragment>
          );
        })}
      </TableRow>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold font-rubik flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Comparación de Ofertas ({ofertas.length})
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="collapse" checked={collapsed} onCheckedChange={setCollapsed} />
            <Label htmlFor="collapse" className="text-sm">Compacta</Label>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-3 h-3 bg-destructive/20 rounded" /> &gt;30%
            <div className="w-3 h-3 bg-amber-200 dark:bg-amber-900/50 rounded" /> &gt;15%
          </div>
        </div>
      </div>

      {adjudicadaOferta && (
        <Card className="border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="py-4 flex items-center gap-3">
            <Trophy className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="font-medium text-emerald-800 dark:text-emerald-300">
                Adjudicada a: {adjudicadaOferta.oferente_empresa || adjudicadaOferta.oferente_nombre || adjudicadaOferta.oferente_email}
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                Monto total: {fmt(adjudicadaOferta.total)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead rowSpan={2} className="sticky left-0 bg-background z-20 min-w-[200px] border-r">
                    Partida
                  </TableHead>
                  {!collapsed && (
                    <>
                      <TableHead rowSpan={2} className="text-center w-16 border-r">Ud.</TableHead>
                      <TableHead rowSpan={2} className="text-right w-20 border-r">Cant. Ref</TableHead>
                    </>
                  )}
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleOfertaDragEnd}>
                    <SortableContext items={ofertas.map(o => `oferta-${o.id}`)} strategy={horizontalListSortingStrategy}>
                      {ofertas.map(oferta => (
                        <SortableOfertaHeader
                          key={oferta.id}
                          oferta={oferta}
                          colsPerOferta={colsPerOferta}
                          isAdj={oferta.estado === 'adjudicada'}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                </TableRow>

                {!collapsed && (
                  <TableRow>
                    {ofertas.map(oferta => (
                      <React.Fragment key={oferta.id}>
                        <TableHead className="text-right text-[10px] min-w-[80px] border-l">Cant.</TableHead>
                        <TableHead className="text-right text-[10px] min-w-[100px]">P.U.</TableHead>
                        <TableHead className="text-right text-[10px] min-w-[110px] border-r font-semibold">Total</TableHead>
                      </React.Fragment>
                    ))}
                  </TableRow>
                )}
              </TableHeader>

              <TableBody>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
                  <SortableContext items={sortedItems.map(i => `item-${i.id}`)} strategy={verticalListSortingStrategy}>
                    {sortedItems.map(item => (
                      <SortableItemRow key={item.id} item={item} />
                    ))}
                  </SortableContext>
                </DndContext>

                {/* SUBTOTAL */}
                <TableRow className="border-t-2 bg-muted/20">
                  <TableCell className="sticky left-0 bg-muted/20 z-10 font-bold text-xs border-r">SUBTOTAL</TableCell>
                  {!collapsed && (<><TableCell className="border-r" /><TableCell className="border-r" /></>)}
                  {ofertas.map(oferta => {
                    const sub = ofertaSubtotals.get(oferta.id) || 0;
                    const isAdj = oferta.estado === 'adjudicada';
                    return (
                      <React.Fragment key={oferta.id}>
                        {!collapsed && (<><TableCell className="border-l" /><TableCell /></>)}
                        <TableCell className={`text-right font-bold text-xs border-r ${isAdj ? 'bg-emerald-50 dark:bg-emerald-950/20' : ''}`}>
                          {fmt(sub)}
                        </TableCell>
                      </React.Fragment>
                    );
                  })}
                </TableRow>

                {hasGG && (
                  <TableRow className="bg-muted/10">
                    <TableCell className="sticky left-0 bg-muted/10 z-10 text-xs border-r">
                      Gastos Generales
                    </TableCell>
                    {!collapsed && (<><TableCell className="border-r" /><TableCell className="border-r" /></>)}
                    {ofertas.map(oferta => {
                      const financial = ofertaFinancials.get(oferta.id);
                      const isAdj = oferta.estado === 'adjudicada';
                      return (
                        <React.Fragment key={oferta.id}>
                          {!collapsed && (<><TableCell className="border-l" /><TableCell /></>)}
                          <TableCell className={`text-right text-xs border-r ${isAdj ? 'bg-emerald-50 dark:bg-emerald-950/20' : ''}`}>
                            <div className="flex flex-col items-end leading-tight">
                              <span>{fmt(financial?.ggAmount)}</span>
                              <span className="text-[10px] text-muted-foreground">{financial?.ggPct != null ? `${financial.ggPct}%` : '-'}</span>
                            </div>
                          </TableCell>
                        </React.Fragment>
                      );
                    })}
                  </TableRow>
                )}

                {hasUtil && (
                  <TableRow className="bg-muted/10">
                    <TableCell className="sticky left-0 bg-muted/10 z-10 text-xs border-r">
                      Utilidades
                    </TableCell>
                    {!collapsed && (<><TableCell className="border-r" /><TableCell className="border-r" /></>)}
                    {ofertas.map(oferta => {
                      const financial = ofertaFinancials.get(oferta.id);
                      const isAdj = oferta.estado === 'adjudicada';
                      return (
                        <React.Fragment key={oferta.id}>
                          {!collapsed && (<><TableCell className="border-l" /><TableCell /></>)}
                          <TableCell className={`text-right text-xs border-r ${isAdj ? 'bg-emerald-50 dark:bg-emerald-950/20' : ''}`}>
                            <div className="flex flex-col items-end leading-tight">
                              <span>{fmt(financial?.utilAmount)}</span>
                              <span className="text-[10px] text-muted-foreground">{financial?.utilPct != null ? `${financial.utilPct}%` : '-'}</span>
                            </div>
                          </TableCell>
                        </React.Fragment>
                      );
                    })}
                  </TableRow>
                )}

                {hasIVA && (
                  <TableRow className="bg-muted/10">
                    <TableCell className="sticky left-0 bg-muted/10 z-10 text-xs border-r">
                      IVA ({licitacionIVA}%)
                    </TableCell>
                    {!collapsed && (<><TableCell className="border-r" /><TableCell className="border-r" /></>)}
                    {ofertas.map(oferta => {
                      const financial = ofertaFinancials.get(oferta.id);
                      return (
                        <React.Fragment key={oferta.id}>
                          {!collapsed && (<><TableCell className="border-l" /><TableCell /></>)}
                          <TableCell className="text-right text-xs border-r">{fmt(financial?.ivaAmount)}</TableCell>
                        </React.Fragment>
                      );
                    })}
                  </TableRow>
                )}

                {/* TOTAL */}
                <TableRow className="border-t-2 bg-muted/30">
                  <TableCell className="sticky left-0 bg-muted/30 z-10 font-bold border-r">TOTAL</TableCell>
                  {!collapsed && (<><TableCell className="border-r" /><TableCell className="border-r" /></>)}
                  {ofertas.map(oferta => {
                    const isAdj = oferta.estado === 'adjudicada';
                    const financial = ofertaFinancials.get(oferta.id);
                    return (
                      <React.Fragment key={oferta.id}>
                        {!collapsed && (<><TableCell className="border-l" /><TableCell /></>)}
                        <TableCell className={`text-right font-bold text-sm border-r ${isAdj ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300' : ''}`}>
                          {fmt(financial?.total ?? oferta.total)}
                        </TableCell>
                      </React.Fragment>
                    );
                  })}
                </TableRow>

                {ofertas.some(o => o.duracion_dias != null) && (
                  <TableRow className="bg-muted/10">
                    <TableCell className="sticky left-0 bg-muted/10 z-10 text-xs font-medium border-r">Plazo (días)</TableCell>
                    {!collapsed && (<><TableCell className="border-r" /><TableCell className="border-r" /></>)}
                    {ofertas.map(oferta => (
                      <React.Fragment key={oferta.id}>
                        {!collapsed && (<><TableCell className="border-l" /><TableCell /></>)}
                        <TableCell className="text-right text-xs border-r">
                          {oferta.duracion_dias != null ? `${oferta.duracion_dias} días` : '-'}
                        </TableCell>
                      </React.Fragment>
                    ))}
                  </TableRow>
                )}

                {!adjudicadaOferta && licitacionId && (
                  <TableRow className="border-t bg-muted/10">
                    <TableCell className="sticky left-0 bg-muted/10 z-10 font-medium text-sm border-r">
                      Adjudicar
                    </TableCell>
                    {!collapsed && (<><TableCell className="border-r" /><TableCell className="border-r" /></>)}
                    {ofertas.map(oferta => (
                      <React.Fragment key={oferta.id}>
                        {!collapsed && (<><TableCell className="border-l" /><TableCell /></>)}
                        <TableCell className="text-center border-r">
                          {oferta.estado === 'enviada' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs border-emerald-400 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20"
                              onClick={() => setConfirmAdjudicar(oferta)}
                            >
                              <Trophy className="h-3.5 w-3.5 mr-1" />
                              Adjudicar
                            </Button>
                          )}
                        </TableCell>
                      </React.Fragment>
                    ))}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {ofertas.some(o => o.notas) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {ofertas.filter(o => o.notas).map(oferta => (
            <Card key={oferta.id} className="text-sm">
              <CardContent className="py-3">
                <p className="font-semibold text-xs mb-1">
                  {oferta.oferente_empresa || oferta.oferente_email} — Notas:
                </p>
                <p className="text-xs text-muted-foreground">{oferta.notas}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!confirmAdjudicar} onOpenChange={(open) => !open && setConfirmAdjudicar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-emerald-600" />
              Adjudicar Licitación
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAdjudicar && (
                <>
                  ¿Confirmas la adjudicación a <strong>{confirmAdjudicar.oferente_empresa || confirmAdjudicar.oferente_nombre || confirmAdjudicar.oferente_email}</strong> por un monto de <strong>{fmt(confirmAdjudicar.total)}</strong>?
                  <br /><br />
                  Las demás ofertas serán marcadas como no adjudicadas.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={adjudicando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmAdjudicar && handleAdjudicar(confirmAdjudicar)}
              disabled={adjudicando}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {adjudicando ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trophy className="h-4 w-4 mr-1" />}
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LicitacionOfertasTab;
