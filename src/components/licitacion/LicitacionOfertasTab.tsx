import React, { useState, useMemo, useEffect } from 'react';
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
import { BarChart3, Trophy, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  ofertas: Oferta[];
  itemsReferencia: LicitacionItem[];
  licitacionId?: number;
  licitacionGG?: number | null;
  licitacionUtil?: number | null;
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

const findOfertaItem = (oferta: Oferta, item: LicitacionItem): OfertaItem | undefined => {
  return oferta.items.find(oi =>
    oi.item_referencia_id === item.id ||
    oi.descripcion?.toLowerCase().trim() === item.descripcion?.toLowerCase().trim()
  );
};

const LicitacionOfertasTab: React.FC<Props> = ({
  ofertas, itemsReferencia, licitacionId, licitacionGG, licitacionUtil, licitacionIVA, onRefresh
}) => {
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [adjudicando, setAdjudicando] = useState(false);
  const [confirmAdjudicar, setConfirmAdjudicar] = useState<Oferta | null>(null);

  const adjudicadaOferta = ofertas.find(o => o.estado === 'adjudicada');

  // Build comparison items: use reference items if available, otherwise build from all oferta items
  const sortedItems = useMemo(() => {
    const refItems = [...itemsReferencia].filter(i => !i.agregado_por_oferente).sort((a, b) => a.orden - b.orden);
    if (refItems.length > 0) return refItems;
    
    // No reference items — build unique item list from all ofertas
    const seen = new Map<string, LicitacionItem>();
    ofertas.forEach(o => {
      o.items.forEach(oi => {
        const key = oi.descripcion?.toLowerCase().trim() || '';
        if (!seen.has(key)) {
          seen.set(key, {
            id: oi.id,
            descripcion: oi.descripcion,
            unidad: oi.unidad || '',
            cantidad: oi.cantidad || 0,
            precio_unitario: oi.precio_unitario || 0,
            precio_total: oi.precio_total || 0,
            orden: oi.orden,
          });
        }
      });
    });
    return Array.from(seen.values()).sort((a, b) => a.orden - b.orden);
  }, [itemsReferencia, ofertas]);

  // Compute averages for deviation highlighting
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

  // Compute subtotals per oferta (sum of item precio_total)
  const ofertaSubtotals = useMemo(() => {
    const map = new Map<number, number>();
    ofertas.forEach(o => {
      const subtotal = o.items.reduce((s, i) => s + (i.precio_total || 0), 0);
      map.set(o.id, subtotal);
    });
    return map;
  }, [ofertas]);

  const colsPerOferta = collapsed ? 1 : 3; // Cant, P.U., Total  or just Total
  const refCols = collapsed ? 0 : 2; // Ud, Cant.Ref

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

  const hasGG = licitacionGG != null && licitacionGG > 0;
  const hasUtil = licitacionUtil != null && licitacionUtil > 0;
  const hasIVA = licitacionIVA != null && licitacionIVA > 0;

  return (
    <div className="space-y-4">
      {/* Header */}
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

      {/* Adjudication banner */}
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

      {/* Comparison table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              {/* ===== HEADER ROW 1: Oferta company names spanning cols ===== */}
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
                  {ofertas.map(oferta => {
                    const isAdj = oferta.estado === 'adjudicada';
                    return (
                      <TableHead
                        key={oferta.id}
                        colSpan={colsPerOferta}
                        className={`text-center border-l border-r ${isAdj ? 'bg-emerald-50 dark:bg-emerald-950/20' : ''}`}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <p className="text-xs font-bold truncate max-w-[160px]">
                            {oferta.oferente_empresa || oferta.oferente_nombre || oferta.oferente_email}
                          </p>
                          <div className="flex items-center gap-1">
                            {isAdj && <Trophy className="h-3 w-3 text-emerald-600" />}
                            <Badge variant={isAdj ? 'default' : 'outline'} className={`text-[9px] ${isAdj ? 'bg-emerald-600' : ''}`}>
                              {isAdj ? 'Adjudicada' : oferta.estado}
                            </Badge>
                          </div>
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>

                {/* ===== HEADER ROW 2: Sub-columns per oferta ===== */}
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
                {/* ===== ITEM ROWS ===== */}
                {sortedItems.map(item => {
                  const media = mediaValues.get(item.id || 0);
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="sticky left-0 bg-background z-10 border-r">
                        <span className="text-xs font-medium truncate max-w-[180px] block">{item.descripcion}</span>
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
                })}

                {/* ===== SUBTOTAL ROW ===== */}
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

                {/* ===== GG ROW ===== */}
                {hasGG && (
                  <TableRow className="bg-muted/10">
                    <TableCell className="sticky left-0 bg-muted/10 z-10 text-xs border-r">
                      Gastos Generales ({licitacionGG}%)
                    </TableCell>
                    {!collapsed && (<><TableCell className="border-r" /><TableCell className="border-r" /></>)}
                    {ofertas.map(oferta => {
                      const sub = ofertaSubtotals.get(oferta.id) || 0;
                      const gg = oferta.gastos_generales != null ? oferta.gastos_generales : sub * (licitacionGG! / 100);
                      return (
                        <React.Fragment key={oferta.id}>
                          {!collapsed && (<><TableCell className="border-l" /><TableCell /></>)}
                          <TableCell className="text-right text-xs border-r">{fmt(gg)}</TableCell>
                        </React.Fragment>
                      );
                    })}
                  </TableRow>
                )}

                {/* ===== UTILIDADES ROW ===== */}
                {hasUtil && (
                  <TableRow className="bg-muted/10">
                    <TableCell className="sticky left-0 bg-muted/10 z-10 text-xs border-r">
                      Utilidades ({licitacionUtil}%)
                    </TableCell>
                    {!collapsed && (<><TableCell className="border-r" /><TableCell className="border-r" /></>)}
                    {ofertas.map(oferta => {
                      const sub = ofertaSubtotals.get(oferta.id) || 0;
                      const util = oferta.utilidades != null ? oferta.utilidades : sub * (licitacionUtil! / 100);
                      return (
                        <React.Fragment key={oferta.id}>
                          {!collapsed && (<><TableCell className="border-l" /><TableCell /></>)}
                          <TableCell className="text-right text-xs border-r">{fmt(util)}</TableCell>
                        </React.Fragment>
                      );
                    })}
                  </TableRow>
                )}

                {/* ===== IVA ROW ===== */}
                {hasIVA && (
                  <TableRow className="bg-muted/10">
                    <TableCell className="sticky left-0 bg-muted/10 z-10 text-xs border-r">
                      IVA ({licitacionIVA}%)
                    </TableCell>
                    {!collapsed && (<><TableCell className="border-r" /><TableCell className="border-r" /></>)}
                    {ofertas.map(oferta => {
                      const total = oferta.total || 0;
                      // IVA is typically on top of neto; estimate from total
                      const neto = total / (1 + licitacionIVA! / 100);
                      const iva = total - neto;
                      return (
                        <React.Fragment key={oferta.id}>
                          {!collapsed && (<><TableCell className="border-l" /><TableCell /></>)}
                          <TableCell className="text-right text-xs border-r">{fmt(iva)}</TableCell>
                        </React.Fragment>
                      );
                    })}
                  </TableRow>
                )}

                {/* ===== TOTAL ROW ===== */}
                <TableRow className="border-t-2 bg-muted/30">
                  <TableCell className="sticky left-0 bg-muted/30 z-10 font-bold border-r">TOTAL</TableCell>
                  {!collapsed && (<><TableCell className="border-r" /><TableCell className="border-r" /></>)}
                  {ofertas.map(oferta => {
                    const isAdj = oferta.estado === 'adjudicada';
                    return (
                      <React.Fragment key={oferta.id}>
                        {!collapsed && (<><TableCell className="border-l" /><TableCell /></>)}
                        <TableCell className={`text-right font-bold text-sm border-r ${isAdj ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300' : ''}`}>
                          {fmt(oferta.total)}
                        </TableCell>
                      </React.Fragment>
                    );
                  })}
                </TableRow>

                {/* ===== DURATION ROW ===== */}
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

                {/* ===== ADJUDICATION ROW ===== */}
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

      {/* ===== Per-oferta detail cards (notes, attachments) ===== */}
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
