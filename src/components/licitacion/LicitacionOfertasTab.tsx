import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Oferta, OfertaItem } from '@/hooks/useLicitacionDetail';
import { LicitacionItem } from '@/hooks/useLicitaciones';
import { BarChart3, AlertTriangle, GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
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
}

const SortableOfertaHeader: React.FC<{ id: string; oferta: Oferta }> = ({ id, oferta }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <TableHead 
      ref={setNodeRef} 
      style={style}
      className="min-w-[160px] text-center cursor-grab"
      {...attributes} 
      {...listeners}
    >
      <div className="flex items-center justify-center gap-1">
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        <div>
          <p className="text-xs font-bold truncate max-w-[120px]">
            {oferta.oferente_empresa || oferta.oferente_nombre || oferta.oferente_email}
          </p>
          <Badge variant="outline" className="text-[9px] mt-0.5">
            {oferta.estado}
          </Badge>
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
}> = ({ id, item, ofertaOrder, ofertasMap, mediaValues, collapsed }) => {
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

        return (
          <React.Fragment key={ofertaId}>
            {!collapsed && (
              <>
                <TableCell className={`text-right text-xs ${getDeviationClass(ofertaItem?.cantidad, media?.cantidad || 0)}`}>
                  {fmt(ofertaItem?.cantidad)}
                </TableCell>
                <TableCell className={`text-right text-xs ${getDeviationClass(ofertaItem?.precio_unitario, media?.precio || 0)}`}>
                  {ofertaItem?.precio_unitario != null ? `$${fmt(ofertaItem.precio_unitario)}` : '-'}
                </TableCell>
              </>
            )}
            <TableCell className={`text-right text-xs font-medium ${getDeviationClass(ofertaItem?.precio_total, media?.total || 0)}`}>
              {ofertaItem?.precio_total != null ? `$${fmt(ofertaItem.precio_total)}` : '-'}
            </TableCell>
          </React.Fragment>
        );
      })}
    </TableRow>
  );
};

const LicitacionOfertasTab: React.FC<Props> = ({ ofertas, itemsReferencia }) => {
  const [ofertaOrder, setOfertaOrder] = useState<string[]>(
    ofertas.map(o => String(o.id))
  );
  const [itemOrder, setItemOrder] = useState<string[]>(
    [...itemsReferencia].sort((a, b) => a.orden - b.orden).map(i => String(i.id || 0))
  );
  const [collapsed, setCollapsed] = useState(false);

  const ofertasMap = useMemo(() => {
    const map = new Map<string, Oferta>();
    ofertas.forEach(o => map.set(String(o.id), o));
    return map;
  }, [ofertas]);

  const sortedItems = useMemo(() => {
    const itemMap = new Map(itemsReferencia.map(i => [String(i.id || 0), i]));
    return itemOrder.map(id => itemMap.get(id)).filter(Boolean) as LicitacionItem[];
  }, [itemOrder, itemsReferencia]);

  // Calculate averages per item
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
                        return (
                          <React.Fragment key={id}>
                            {!collapsed && (
                              <>
                                <SortableOfertaHeader id={`${id}-cant`} oferta={oferta} />
                                <TableHead className="text-center text-xs min-w-[100px]">P.U.</TableHead>
                              </>
                            )}
                            <SortableOfertaHeader id={id} oferta={oferta} />
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
                    return (
                      <React.Fragment key={id}>
                        {!collapsed && (
                          <>
                            <TableCell />
                            <TableCell />
                          </>
                        )}
                        <TableCell className="text-right font-bold text-sm">
                          {fmt(oferta?.total)}
                        </TableCell>
                      </React.Fragment>
                    );
                  })}
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LicitacionOfertasTab;
