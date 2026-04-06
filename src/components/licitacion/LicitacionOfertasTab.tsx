import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { BarChart3, AlertTriangle, GripVertical, ChevronDown, ChevronRight, Trophy, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  ofertas: Oferta[];
  itemsReferencia: LicitacionItem[];
  licitacionId?: number;
  onRefresh?: () => void;
}

const SortableOfertaHeader: React.FC<{ id: string; oferta: Oferta; isAdjudicada?: boolean }> = ({ id, oferta, isAdjudicada }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <TableHead 
      ref={setNodeRef} 
      style={style}
      className={`min-w-[160px] text-center cursor-grab ${isAdjudicada ? 'bg-emerald-50 dark:bg-emerald-950/20' : ''}`}
      {...attributes} 
      {...listeners}
    >
      <div className="flex items-center justify-center gap-1">
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        <div>
          <p className="text-xs font-bold truncate max-w-[120px]">
            {oferta.oferente_empresa || oferta.oferente_nombre || oferta.oferente_email}
          </p>
          <div className="flex items-center gap-1 justify-center mt-0.5">
            {isAdjudicada && <Trophy className="h-3 w-3 text-emerald-600" />}
            <Badge variant={isAdjudicada ? 'default' : 'outline'} className={`text-[9px] ${isAdjudicada ? 'bg-emerald-600' : ''}`}>
              {isAdjudicada ? 'Adjudicada' : oferta.estado}
            </Badge>
          </div>
        </div>
      </div>
    </TableHead>
  );
};

const SortableItemRow: React.FC<{
  id: string;
  item: LicitacionItem;
  ofertaOrder: string[];
  ofertasMap: Map<string, Oferta>;
  mediaValues: Map<number, { cantidad: number; precio: number; total: number }>;
  collapsed: boolean;
  adjudicadaId?: string;
}> = ({ id, item, ofertaOrder, ofertasMap, mediaValues, collapsed, adjudicadaId }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const media = mediaValues.get(item.id || 0);
  const fmt = (n: number | null | undefined) => n != null ? n.toLocaleString('es-CL') : '-';

  const getDeviationClass = (value: number | null | undefined, avg: number) => {
    if (value == null || avg === 0) return '';
    const pct = Math.abs((value - avg) / avg);
    if (pct > 0.3) return 'bg-destructive/10 text-destructive font-bold';
    if (pct > 0.15) return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
    return '';
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell className="sticky left-0 bg-background z-10 cursor-grab" {...attributes} {...listeners}>
        <div className="flex items-center gap-1">
          <GripVertical className="h-3 w-3 text-muted-foreground" />
          <span className="text-xs font-medium truncate max-w-[180px]">{item.descripcion}</span>
        </div>
      </TableCell>
      {!collapsed && (
        <>
          <TableCell className="text-center text-xs">{item.unidad || '-'}</TableCell>
          <TableCell className="text-right text-xs">{fmt(item.cantidad)}</TableCell>
        </>
      )}

      {ofertaOrder.map(ofertaId => {
        const oferta = ofertasMap.get(ofertaId);
        const ofertaItem = oferta?.items.find(oi => 
          oi.item_referencia_id === item.id || 
          oi.descripcion.toLowerCase().trim() === item.descripcion.toLowerCase().trim()
        );
        const isAdj = ofertaId === adjudicadaId;

        return (
          <React.Fragment key={ofertaId}>
            {!collapsed && (
              <>
                <TableCell className={`text-right text-xs ${isAdj ? 'bg-emerald-50/50 dark:bg-emerald-950/10' : ''} ${getDeviationClass(ofertaItem?.cantidad, media?.cantidad || 0)}`}>
                  {fmt(ofertaItem?.cantidad)}
                </TableCell>
                <TableCell className={`text-right text-xs ${isAdj ? 'bg-emerald-50/50 dark:bg-emerald-950/10' : ''} ${getDeviationClass(ofertaItem?.precio_unitario, media?.precio || 0)}`}>
                  {ofertaItem?.precio_unitario != null ? `$${fmt(ofertaItem.precio_unitario)}` : '-'}
                </TableCell>
              </>
            )}
            <TableCell className={`text-right text-xs font-medium ${isAdj ? 'bg-emerald-50/50 dark:bg-emerald-950/10' : ''} ${getDeviationClass(ofertaItem?.precio_total, media?.total || 0)}`}>
              {ofertaItem?.precio_total != null ? `$${fmt(ofertaItem.precio_total)}` : '-'}
            </TableCell>
          </React.Fragment>
        );
      })}
    </TableRow>
  );
};

const LicitacionOfertasTab: React.FC<Props> = ({ ofertas, itemsReferencia, licitacionId, onRefresh }) => {
  const { toast } = useToast();
  const [ofertaOrder, setOfertaOrder] = useState<string[]>(
    ofertas.map(o => String(o.id))
  );
  const [itemOrder, setItemOrder] = useState<string[]>(
    [...itemsReferencia].sort((a, b) => a.orden - b.orden).map(i => String(i.id || 0))
  );
  const [collapsed, setCollapsed] = useState(false);
  const [adjudicando, setAdjudicando] = useState(false);
  const [confirmAdjudicar, setConfirmAdjudicar] = useState<Oferta | null>(null);

  // Find if any offer is already adjudicada
  const adjudicadaOferta = ofertas.find(o => o.estado === 'adjudicada');

  const ofertasMap = useMemo(() => {
    const map = new Map<string, Oferta>();
    ofertas.forEach(o => map.set(String(o.id), o));
    return map;
  }, [ofertas]);

  const sortedItems = useMemo(() => {
    const itemMap = new Map(itemsReferencia.map(i => [String(i.id || 0), i]));
    return itemOrder.map(id => itemMap.get(id)).filter(Boolean) as LicitacionItem[];
  }, [itemOrder, itemsReferencia]);

  const mediaValues = useMemo(() => {
    const map = new Map<number, { cantidad: number; precio: number; total: number }>();
    itemsReferencia.forEach(item => {
      const values = ofertas.map(o => 
        o.items.find(oi => oi.item_referencia_id === item.id || 
          oi.descripcion.toLowerCase().trim() === item.descripcion.toLowerCase().trim())
      ).filter(Boolean) as OfertaItem[];

      if (values.length > 0) {
        map.set(item.id || 0, {
          cantidad: values.reduce((s, v) => s + (v.cantidad || 0), 0) / values.length,
          precio: values.reduce((s, v) => s + (v.precio_unitario || 0), 0) / values.length,
          total: values.reduce((s, v) => s + (v.precio_total || 0), 0) / values.length,
        });
      }
    });
    return map;
  }, [ofertas, itemsReferencia]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleOfertaDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setOfertaOrder(prev => arrayMove(prev, prev.indexOf(String(active.id)), prev.indexOf(String(over.id))));
    }
  };

  const handleItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItemOrder(prev => arrayMove(prev, prev.indexOf(String(active.id)), prev.indexOf(String(over.id))));
    }
  };

  const handleAdjudicar = async (oferta: Oferta) => {
    if (!licitacionId) return;
    setAdjudicando(true);
    try {
      // Update winning offer to 'adjudicada'
      const { error: err1 } = await supabase
        .from('LicitacionOfertas')
        .update({ estado: 'adjudicada' })
        .eq('id', oferta.id);
      if (err1) throw err1;

      // Update other offers to 'no_adjudicada'
      const otherIds = ofertas.filter(o => o.id !== oferta.id).map(o => o.id);
      if (otherIds.length > 0) {
        const { error: err2 } = await supabase
          .from('LicitacionOfertas')
          .update({ estado: 'no_adjudicada' })
          .in('id', otherIds);
        if (err2) throw err2;
      }

      // Update licitacion estado
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

  const fmt = (n: number | null | undefined) => n != null ? `$${n.toLocaleString('es-CL')}` : '-';

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold font-rubik flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Comparación de Ofertas ({ofertas.length})
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="collapse" checked={collapsed} onCheckedChange={setCollapsed} />
            <Label htmlFor="collapse" className="text-sm">Vista compacta</Label>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="w-3 h-3 bg-destructive/20 rounded" /> &gt;30% desv.
            <div className="w-3 h-3 bg-amber-200 dark:bg-amber-900/50 rounded" /> &gt;15% desv.
          </div>
        </div>
      </div>

      {/* Adjudication banner */}
      {adjudicadaOferta && (
        <Card className="border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/20">
          <CardContent className="py-4 flex items-center gap-3">
            <Trophy className="h-6 w-6 text-emerald-600" />
            <div>
              <p className="font-medium text-emerald-800 dark:text-emerald-300">
                Licitación adjudicada a: {adjudicadaOferta.oferente_empresa || adjudicadaOferta.oferente_nombre || adjudicadaOferta.oferente_email}
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
                  <TableHead className="sticky left-0 bg-background z-20 min-w-[200px]">
                    Partida
                  </TableHead>
                  {!collapsed && (
                    <>
                      <TableHead className="text-center w-16">Ud.</TableHead>
                      <TableHead className="text-right w-20">Cant. Ref</TableHead>
                    </>
                  )}
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleOfertaDragEnd}>
                    <SortableContext items={ofertaOrder} strategy={horizontalListSortingStrategy}>
                      {ofertaOrder.map(id => {
                        const oferta = ofertasMap.get(id);
                        if (!oferta) return null;
                        const isAdj = oferta.estado === 'adjudicada';
                        return (
                          <React.Fragment key={id}>
                            {!collapsed && (
                              <>
                                <SortableOfertaHeader id={`${id}-cant`} oferta={oferta} isAdjudicada={isAdj} />
                                <TableHead className="text-center text-xs min-w-[100px]">P.U.</TableHead>
                              </>
                            )}
                            <SortableOfertaHeader id={id} oferta={oferta} isAdjudicada={isAdj} />
                          </React.Fragment>
                        );
                      })}
                    </SortableContext>
                  </DndContext>
                </TableRow>
              </TableHeader>
              <TableBody>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
                  <SortableContext items={itemOrder} strategy={verticalListSortingStrategy}>
                    {sortedItems.map(item => (
                      <SortableItemRow
                        key={String(item.id || 0)}
                        id={String(item.id || 0)}
                        item={item}
                        ofertaOrder={ofertaOrder}
                        ofertasMap={ofertasMap}
                        mediaValues={mediaValues}
                        collapsed={collapsed}
                        adjudicadaId={adjudicadaOferta ? String(adjudicadaOferta.id) : undefined}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                {/* Totals row */}
                <TableRow className="border-t-2 bg-muted/30">
                  <TableCell className="sticky left-0 bg-muted/30 z-10 font-bold">TOTAL</TableCell>
                  {!collapsed && (
                    <>
                      <TableCell />
                      <TableCell />
                    </>
                  )}
                  {ofertaOrder.map(id => {
                    const oferta = ofertasMap.get(id);
                    const isAdj = oferta?.estado === 'adjudicada';
                    return (
                      <React.Fragment key={id}>
                        {!collapsed && (
                          <>
                            <TableCell />
                            <TableCell />
                          </>
                        )}
                        <TableCell className={`text-right font-bold text-sm ${isAdj ? 'bg-emerald-50 dark:bg-emerald-950/20' : ''}`}>
                          {fmt(oferta?.total)}
                        </TableCell>
                      </React.Fragment>
                    );
                  })}
                </TableRow>

                {/* Adjudication row */}
                {!adjudicadaOferta && licitacionId && (
                  <TableRow className="border-t bg-muted/10">
                    <TableCell className="sticky left-0 bg-muted/10 z-10 font-medium text-sm">
                      Adjudicar
                    </TableCell>
                    {!collapsed && (
                      <>
                        <TableCell />
                        <TableCell />
                      </>
                    )}
                    {ofertaOrder.map(id => {
                      const oferta = ofertasMap.get(id);
                      return (
                        <React.Fragment key={id}>
                          {!collapsed && (
                            <>
                              <TableCell />
                              <TableCell />
                            </>
                          )}
                          <TableCell className="text-center">
                            {oferta && oferta.estado === 'enviada' && (
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
                      );
                    })}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Adjudication confirmation dialog */}
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
                  Las demás ofertas serán marcadas como no adjudicadas y el estado de la licitación cambiará a "Adjudicada".
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
              Confirmar Adjudicación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LicitacionOfertasTab;
