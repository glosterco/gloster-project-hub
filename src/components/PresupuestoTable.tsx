import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList } from 'lucide-react';
import { Presupuesto } from '@/hooks/usePresupuesto';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PresupuestoTableProps {
  presupuesto: Presupuesto[];
  loading: boolean;
  currency?: string;
  onUpdate?: () => void;
  projectId: number;
}

export const PresupuestoTable: React.FC<PresupuestoTableProps> = ({
  presupuesto, 
  loading, 
  currency = 'CLP',
  onUpdate,
  projectId
}) => {
  const [editingValues, setEditingValues] = useState<{ [key: number]: number }>({});
  const [gastosGenerales, setGastosGenerales] = useState<number>(0);
  const [utilidad, setUtilidad] = useState<number>(0);
  
  // Estados para Control de Anticipos
  const [totalAnticipos, setTotalAnticipos] = useState<number>(0);
  const [devolucionActual, setDevolucionActual] = useState<number>(0);
  const [devolucionAcumulado, setDevolucionAcumulado] = useState<number>(0);
  
  // Estados para Control de Retenciones
  const [totalRetenciones, setTotalRetenciones] = useState<number>(0);
  const [retencionActual, setRetencionActual] = useState<number>(0);
  const [retencionAcumulado, setRetencionAcumulado] = useState<number>(0);
  
  // Estados para rastrear si hay controles en DB
  const [anticiposId, setAnticiposId] = useState<number | null>(null);
  const [retencionesId, setRetencionesId] = useState<number | null>(null);
  const [controlsLoaded, setControlsLoaded] = useState(false);
  
  const { toast } = useToast();
  
  // Cálculos para Anticipos - NO sumar el actual hasta que se actualice
  const totalDevuelto = devolucionAcumulado;
  const saldoPorDevolver = totalAnticipos - totalDevuelto;
  
  // Cálculos para Retenciones - NO sumar el actual hasta que se actualice
  const totalRetenido = retencionAcumulado;
  const saldoPorRetener = totalRetenciones - totalRetenido;

  const formatCurrency = (amount: number) => {
    if (currency === 'UF') {
      return `UF ${new Intl.NumberFormat('es-CL', { minimumFractionDigits: 2 }).format(amount)}`;
    }
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Cargar controles desde la base de datos
  React.useEffect(() => {
    const loadControls = async () => {
      if (!projectId || controlsLoaded) return;
      
      try {
        const { data, error } = await supabase
          .from('Presupuesto' as any)
          .select('*')
          .eq('Project_ID', projectId)
          .in('Item', ['Control de Anticipos', 'Control de Retenciones', 'Gastos Generales', 'Utilidad']);
        
        if (error) throw error;
        
        data?.forEach((item: any) => {
          if (item.Item === 'Control de Anticipos') {
            setTotalAnticipos(item.Total || 0);
            setDevolucionAcumulado(item['Avance Acumulado'] || 0);
            setDevolucionActual(item['Avance Parcial'] || 0);
            setAnticiposId(item.id);
          } else if (item.Item === 'Control de Retenciones') {
            setTotalRetenciones(item.Total || 0);
            setRetencionAcumulado(item['Avance Acumulado'] || 0);
            setRetencionActual(item['Avance Parcial'] || 0);
            setRetencionesId(item.id);
          } else if (item.Item === 'Gastos Generales') {
            setGastosGenerales(item.PU || 0); // Usamos PU para guardar el porcentaje
          } else if (item.Item === 'Utilidad') {
            setUtilidad(item.PU || 0); // Usamos PU para guardar el porcentaje
          }
        });
        
        setControlsLoaded(true);
      } catch (error) {
        console.error('Error loading controls:', error);
      }
    };
    
    loadControls();
  }, [projectId, controlsLoaded]);

  const handleAvanceParcialChange = (id: number, value: string) => {
    const numValue = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
    setEditingValues(prev => ({ ...prev, [id]: numValue }));
  };

  const handleUpdatePresupuesto = async (item: Presupuesto) => {
    const avanceParcialMonto = editingValues[item.id] || 0;
    if (avanceParcialMonto === 0) {
      toast({
        title: "Error",
        description: "Ingrese una cantidad válida para actualizar",
        variant: "destructive",
      });
      return;
    }
    
    // Calcular el nuevo avance acumulado como monto
    const avanceAcumuladoMonto = item.Total ? (item.Total * ((item['Avance Acumulado'] || 0) / 100)) : 0;
    const newAvanceAcumuladoMonto = avanceAcumuladoMonto + avanceParcialMonto;
    
    // Convertir a porcentaje
    const newAvanceAcumulado = item.Total ? (newAvanceAcumuladoMonto / item.Total) * 100 : 0;
    
    console.log('📊 Actualizando presupuesto:', {
      itemId: item.id,
      itemName: item.Item,
      totalItem: item.Total,
      avanceAcumuladoAnterior: item['Avance Acumulado'],
      avanceAcumuladoMontoAnterior: avanceAcumuladoMonto,
      avanceParcialMonto: avanceParcialMonto,
      newAvanceAcumuladoMonto: newAvanceAcumuladoMonto,
      newAvanceAcumuladoPorcentaje: newAvanceAcumulado
    });

    try {
      const { error } = await supabase
        .from('Presupuesto' as any)
        .update({
          'Avance Parcial': 0, // Resetear a 0 después de actualizar
          'Avance Acumulado': newAvanceAcumulado,
          'Ult. Actualizacion': new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) {
        console.error('❌ Error al actualizar:', error);
        throw error;
      }
      
      console.log('✅ Presupuesto actualizado correctamente');

      // Guardar en histórico después de actualizar
      if (projectId) {
        // Calcular el total acumulado de todo el proyecto
        const totalAcumulado = presupuesto.reduce((sum, p) => {
          const avanceAcum = p.id === item.id ? newAvanceAcumulado : (p['Avance Acumulado'] || 0);
          const totalItem = p.Total || 0;
          return sum + (totalItem * avanceAcum / 100);
        }, 0);
        
        // El monto parcial de este ítem específico
        const montoParcialItem = avanceParcialMonto;
        const porcentajeParcial = item.Total ? (montoParcialItem / item.Total) * 100 : 0;
        
        // 1. Guardar el detalle de esta actualización individual
        await supabase
          .from('PresupuestoHistoricoDetalle' as any)
          .insert({
            Project_ID: Number(projectId),
            Item_ID: item.id,
            Item_Nombre: item.Item,
            Monto_Parcial: montoParcialItem,
            Monto_Total: item.Total,
            Porcentaje_Parcial: porcentajeParcial,
            Porcentaje_Acumulado: newAvanceAcumulado
          });
        
        console.log('✅ Detalle guardado para ítem:', item.Item, 'Monto:', montoParcialItem);
        
        // 2. Calcular el TotalParcial del día sumando TODOS los montos parciales del día
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        
        // Obtener TODOS los detalles del día para sumarlos
        const { data: detallesHoy, error: detallesError } = await supabase
          .from('PresupuestoHistoricoDetalle' as any)
          .select('Monto_Parcial')
          .eq('Project_ID', Number(projectId))
          .gte('created_at', startOfDay.toISOString())
          .lt('created_at', endOfDay.toISOString());
        
        if (detallesError) {
          console.error('❌ Error al obtener detalles:', detallesError);
        }
        
        // Sumar TODOS los montos parciales del día (no solo las últimas actualizaciones)
        const totalParcialDelDia = (detallesHoy || []).reduce(
          (sum: number, detalle: any) => sum + (detalle.Monto_Parcial || 0),
          0
        );
        
        console.log('📊 Total parcial calculado del día:', totalParcialDelDia, 'Total actualizaciones:', detallesHoy?.length || 0);
        
        // 3. Actualizar o crear UN SOLO registro en PresupuestoHistorico para el día
        const { data: existingRecords, error: fetchError } = await supabase
          .from('PresupuestoHistorico' as any)
          .select('*')
          .eq('Project_ID', Number(projectId))
          .gte('created_at', startOfDay.toISOString())
          .lt('created_at', endOfDay.toISOString())
          .order('created_at', { ascending: false });
        
        if (fetchError) {
          console.error('❌ Error al buscar registros históricos:', fetchError);
        }
        
        if (existingRecords && existingRecords.length > 0) {
          // Si hay múltiples registros del día, actualizar el primero y eliminar los demás
          const firstRecord = existingRecords[0];
          
          // Actualizar el primer registro
          await supabase
            .from('PresupuestoHistorico' as any)
            .update({
              TotalAcumulado: totalAcumulado,
              TotalParcial: totalParcialDelDia
            })
            .eq('id', (firstRecord as any).id);
          
          // Eliminar registros duplicados si existen
          if (existingRecords.length > 1) {
            const duplicateIds = existingRecords.slice(1).map((r: any) => r.id);
            console.log('🧹 Eliminando', duplicateIds.length, 'registros duplicados del día');
            await supabase
              .from('PresupuestoHistorico' as any)
              .delete()
              .in('id', duplicateIds);
          }
          
          console.log('✅ Histórico actualizado - Total parcial:', totalParcialDelDia, 'Total acumulado:', totalAcumulado);
        } else {
          // Crear un nuevo registro solo si no existe ninguno para el día
          await supabase
            .from('PresupuestoHistorico' as any)
            .insert({
              Project_ID: Number(projectId),
              TotalAcumulado: totalAcumulado,
              TotalParcial: totalParcialDelDia
            });
          
          console.log('✅ Histórico creado - Total parcial:', totalParcialDelDia, 'Total acumulado:', totalAcumulado);
        }
      }

      // Guardar controles también
      await saveControls();

      toast({
        title: "Actualizado",
        description: "El avance del presupuesto ha sido actualizado correctamente",
      });

      // NO limpiar el valor editado - mantener hasta cerrar pestaña
      // Los valores parciales se mantienen visibles para el usuario

      // Refrescar datos
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating presupuesto:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el presupuesto",
        variant: "destructive",
      });
    }
  };

  const saveControls = async () => {
    try {
      // Calcular nuevos acumulados sumando el actual
      const newDevolucionAcumulado = devolucionAcumulado + devolucionActual;
      const newRetencionAcumulado = retencionAcumulado + retencionActual;

      // Guardar Control de Anticipos
      if (anticiposId) {
        await supabase
          .from('Presupuesto' as any)
          .update({
            Total: totalAnticipos,
            'Avance Acumulado': newDevolucionAcumulado,
            'Avance Parcial': devolucionActual,
            'Ult. Actualizacion': new Date().toISOString(),
          })
          .eq('id', anticiposId);
      } else if (totalAnticipos > 0 || devolucionActual > 0) {
        const { data, error } = await supabase
          .from('Presupuesto' as any)
          .insert({
            Project_ID: projectId,
            Item: 'Control de Anticipos',
            Total: totalAnticipos,
            'Avance Acumulado': newDevolucionAcumulado,
            'Avance Parcial': devolucionActual,
            'Ult. Actualizacion': new Date().toISOString(),
          })
          .select()
          .single();
        if (data && !error) setAnticiposId((data as any).id);
      }

      // Guardar Control de Retenciones
      if (retencionesId) {
        await supabase
          .from('Presupuesto' as any)
          .update({
            Total: totalRetenciones,
            'Avance Acumulado': newRetencionAcumulado,
            'Avance Parcial': retencionActual,
            'Ult. Actualizacion': new Date().toISOString(),
          })
          .eq('id', retencionesId);
      } else if (totalRetenciones > 0 || retencionActual > 0) {
        const { data, error } = await supabase
          .from('Presupuesto' as any)
          .insert({
            Project_ID: projectId,
            Item: 'Control de Retenciones',
            Total: totalRetenciones,
            'Avance Acumulado': newRetencionAcumulado,
            'Avance Parcial': retencionActual,
            'Ult. Actualizacion': new Date().toISOString(),
          })
          .select()
          .single();
        if (data && !error) setRetencionesId((data as any).id);
      }

      // Guardar Gastos Generales y Utilidad
      const { data: existingGG, error: ggError } = await supabase
        .from('Presupuesto' as any)
        .select('id')
        .eq('Project_ID', projectId)
        .eq('Item', 'Gastos Generales')
        .maybeSingle();

      if (!ggError && existingGG && 'id' in existingGG) {
        await supabase
          .from('Presupuesto' as any)
          .update({ PU: gastosGenerales })
          .eq('id', existingGG.id);
      } else if (gastosGenerales > 0) {
        await supabase
          .from('Presupuesto' as any)
          .insert({
            Project_ID: projectId,
            Item: 'Gastos Generales',
            PU: gastosGenerales,
          });
      }

      const { data: existingUtil, error: utilError } = await supabase
        .from('Presupuesto' as any)
        .select('id')
        .eq('Project_ID', projectId)
        .eq('Item', 'Utilidad')
        .maybeSingle();

      if (!utilError && existingUtil && 'id' in existingUtil) {
        await supabase
          .from('Presupuesto' as any)
          .update({ PU: utilidad })
          .eq('id', existingUtil.id);
      } else if (utilidad > 0) {
        await supabase
          .from('Presupuesto' as any)
          .insert({
            Project_ID: projectId,
            Item: 'Utilidad',
            PU: utilidad,
          });
      }

      // Actualizar estados locales después de guardar
      setDevolucionAcumulado(newDevolucionAcumulado);
      setRetencionAcumulado(newRetencionAcumulado);
      setDevolucionActual(0);
      setRetencionActual(0);
    } catch (error) {
      console.error('Error saving controls:', error);
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  // Calcular totales
  const subtotalCostoDirecto = presupuesto.reduce((sum, item) => sum + (item.Total || 0), 0);
  const avanceAcumuladoTotal = presupuesto.reduce((sum, item) => {
    const monto = (item.Total || 0) * ((item['Avance Acumulado'] || 0) / 100);
    return sum + monto;
  }, 0);
  // Avance parcial ahora es la suma de las cantidades ingresadas, NO porcentajes
  const avanceParcialTotal = presupuesto.reduce((sum, item) => {
    const monto = editingValues[item.id] || 0;
    return sum + monto;
  }, 0);
  
  const montoGastosGenerales = subtotalCostoDirecto * (gastosGenerales / 100);
  const montoGastosGeneralesAcum = avanceAcumuladoTotal * (gastosGenerales / 100);
  const montoGastosGeneralesParcial = avanceParcialTotal * (gastosGenerales / 100);
  
  const montoUtilidad = subtotalCostoDirecto * (utilidad / 100);
  const montoUtilidadAcum = avanceAcumuladoTotal * (utilidad / 100);
  const montoUtilidadParcial = avanceParcialTotal * (utilidad / 100);
  
  const totalNeto = subtotalCostoDirecto + montoGastosGenerales + montoUtilidad;
  const totalNetoAcum = avanceAcumuladoTotal + montoGastosGeneralesAcum + montoUtilidadAcum;
  const totalNetoParcial = avanceParcialTotal + montoGastosGeneralesParcial + montoUtilidadParcial;
  
  const iva = totalNeto * 0.19;
  const ivaAcum = totalNetoAcum * 0.19;
  const ivaParcial = totalNetoParcial * 0.19;
  
  const totalFinal = totalNeto + iva;
  const totalFinalAcum = totalNetoAcum + ivaAcum;
  const totalFinalParcial = totalNetoParcial + ivaParcial;

  return (
    <div className="space-y-4">
      {/* Tabla Principal de Presupuesto */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="h-10">
              <TableHead className="font-rubik min-w-[200px] py-2">Item</TableHead>
              <TableHead className="font-rubik py-2">Unidad</TableHead>
              <TableHead className="font-rubik text-right py-2">Cantidad</TableHead>
              <TableHead className="font-rubik text-right py-2">P.U.</TableHead>
              <TableHead className="font-rubik text-right py-2">Total</TableHead>
              <TableHead className="font-rubik text-right py-2">Avance Acum.</TableHead>
              <TableHead className="font-rubik text-right py-2">Avance Parcial</TableHead>
              <TableHead className="font-rubik py-2">Última Actualización</TableHead>
              <TableHead className="font-rubik py-2">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr]:h-10">
            {presupuesto.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-center">
                    <ClipboardList className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground font-rubik text-sm">No hay partidas registradas</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              presupuesto.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50 h-10">
                  <TableCell className="font-medium font-rubik py-2">
                    {item.Item || `Item ${item.id}`}
                  </TableCell>
                  <TableCell className="font-rubik py-2">{item.Unidad || '-'}</TableCell>
                  <TableCell className="font-rubik text-right py-2">
                    {item.Cantidad ? new Intl.NumberFormat('es-CL').format(item.Cantidad) : '-'}
                  </TableCell>
                  <TableCell className="font-rubik text-right py-2">
                    {item.PU ? formatCurrency(item.PU) : '-'}
                  </TableCell>
                  <TableCell className="font-rubik text-right font-semibold py-2">
                    {item.Total ? formatCurrency(item.Total) : '-'}
                  </TableCell>
                  <TableCell className="font-rubik text-right py-2">
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {item.Total && item['Avance Acumulado'] 
                          ? formatCurrency(item.Total * (item['Avance Acumulado'] / 100))
                          : '-'}
                      </span>
                      {item['Avance Acumulado'] !== null && item['Avance Acumulado'] !== undefined && (
                        <span className="text-xs text-muted-foreground">
                          {item['Avance Acumulado'].toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-rubik py-2">
                    <Input
                      type="text"
                      placeholder="0"
                      value={editingValues[item.id] ? formatCurrency(editingValues[item.id]) : ''}
                      onChange={(e) => handleAvanceParcialChange(item.id, e.target.value)}
                      className="w-32 text-right font-rubik h-8"
                    />
                  </TableCell>
                  <TableCell className="font-rubik text-sm text-muted-foreground py-2">
                    {item['Ult. Actualizacion']
                      ? new Date(item['Ult. Actualizacion']).toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })
                      : '-'}
                  </TableCell>
                  <TableCell className="font-rubik py-2">
                    <button
                      onClick={() => handleUpdatePresupuesto(item)}
                      disabled={!editingValues[item.id] || editingValues[item.id] === 0}
                      className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Actualizar
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
            
            {/* Subtotal Costo Directo */}
            <TableRow className="bg-muted/50 font-semibold border-t-2 h-10">
              <TableCell colSpan={4} className="font-rubik text-right py-2">
                Subtotal Costo Directo:
              </TableCell>
              <TableCell className="font-rubik text-right py-2">
                {formatCurrency(subtotalCostoDirecto)}
              </TableCell>
              <TableCell className="font-rubik text-right py-2">
                <div className="flex flex-col">
                  <span className="font-semibold">{formatCurrency(avanceAcumuladoTotal)}</span>
                  <span className="text-xs text-muted-foreground">
                    {subtotalCostoDirecto > 0 ? ((avanceAcumuladoTotal / subtotalCostoDirecto) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="font-rubik text-right py-2">
                <div className="flex flex-col">
                  <span className="font-semibold">{formatCurrency(avanceParcialTotal)}</span>
                  <span className="text-xs text-muted-foreground">
                    {subtotalCostoDirecto > 0 ? ((avanceParcialTotal / subtotalCostoDirecto) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </TableCell>
              <TableCell colSpan={2}></TableCell>
            </TableRow>
            
            {/* Gastos Generales */}
            <TableRow className="hover:bg-muted/50 h-10">
              <TableCell colSpan={2} className="font-rubik font-medium py-2">
                Gastos Generales
              </TableCell>
              <TableCell className="font-rubik py-2">%</TableCell>
              <TableCell className="font-rubik text-right py-2">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  value={gastosGenerales || ''}
                  onChange={(e) => setGastosGenerales(parseFloat(e.target.value) || 0)}
                  className="w-24 text-right font-rubik h-8"
                />
              </TableCell>
              <TableCell className="font-rubik text-right font-semibold py-2">
                {formatCurrency(montoGastosGenerales)}
              </TableCell>
              <TableCell className="font-rubik text-right py-2">
                <div className="flex flex-col">
                  <span className="font-semibold">{formatCurrency(montoGastosGeneralesAcum)}</span>
                </div>
              </TableCell>
              <TableCell className="font-rubik text-right py-2">
                <div className="flex flex-col">
                  <span className="font-semibold">{formatCurrency(montoGastosGeneralesParcial)}</span>
                </div>
              </TableCell>
              <TableCell colSpan={2}></TableCell>
            </TableRow>
            
            {/* Utilidad */}
            <TableRow className="hover:bg-muted/50 h-10">
              <TableCell colSpan={2} className="font-rubik font-medium py-2">
                Utilidad
              </TableCell>
              <TableCell className="font-rubik py-2">%</TableCell>
              <TableCell className="font-rubik text-right py-2">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  value={utilidad || ''}
                  onChange={(e) => setUtilidad(parseFloat(e.target.value) || 0)}
                  className="w-24 text-right font-rubik h-8"
                />
              </TableCell>
              <TableCell className="font-rubik text-right font-semibold py-2">
                {formatCurrency(montoUtilidad)}
              </TableCell>
              <TableCell className="font-rubik text-right py-2">
                <div className="flex flex-col">
                  <span className="font-semibold">{formatCurrency(montoUtilidadAcum)}</span>
                </div>
              </TableCell>
              <TableCell className="font-rubik text-right py-2">
                <div className="flex flex-col">
                  <span className="font-semibold">{formatCurrency(montoUtilidadParcial)}</span>
                </div>
              </TableCell>
              <TableCell colSpan={2}></TableCell>
            </TableRow>
            
            {/* Subtotal Neto */}
            <TableRow className="bg-amber-50 dark:bg-amber-950/50 font-semibold border-t-2 h-10">
              <TableCell colSpan={4} className="font-rubik text-right py-2">
                Subtotal Neto:
              </TableCell>
              <TableCell className="font-rubik text-right py-2">
                {formatCurrency(totalNeto)}
              </TableCell>
              <TableCell className="font-rubik text-right py-2">
                <div className="flex flex-col">
                  <span className="font-semibold">{formatCurrency(totalNetoAcum)}</span>
                  <span className="text-xs text-muted-foreground">
                    {totalNeto > 0 ? ((totalNetoAcum / totalNeto) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="font-rubik text-right py-2">
                <div className="flex flex-col">
                  <span className="font-semibold">{formatCurrency(totalNetoParcial)}</span>
                  <span className="text-xs text-muted-foreground">
                    {totalNeto > 0 ? ((totalNetoParcial / totalNeto) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </TableCell>
              <TableCell colSpan={2}></TableCell>
            </TableRow>
            
            {/* IVA */}
            <TableRow className="hover:bg-muted/50 h-10">
              <TableCell colSpan={2} className="font-rubik font-medium py-2">
                IVA
              </TableCell>
              <TableCell className="font-rubik py-2">%</TableCell>
              <TableCell className="font-rubik text-right py-2">19</TableCell>
              <TableCell className="font-rubik text-right font-semibold py-2">
                {formatCurrency(iva)}
              </TableCell>
              <TableCell className="font-rubik text-right py-2">
                <div className="flex flex-col">
                  <span className="font-semibold">{formatCurrency(ivaAcum)}</span>
                </div>
              </TableCell>
              <TableCell className="font-rubik text-right py-2">
                <div className="flex flex-col">
                  <span className="font-semibold">{formatCurrency(ivaParcial)}</span>
                </div>
              </TableCell>
              <TableCell colSpan={2}></TableCell>
            </TableRow>
            
            {/* Total Final */}
            <TableRow className="bg-primary/10 font-bold border-t-2 h-11">
              <TableCell colSpan={4} className="font-rubik text-right py-2">
                TOTAL CON IVA:
              </TableCell>
              <TableCell className="font-rubik text-right py-2">
                {formatCurrency(totalFinal)}
              </TableCell>
              <TableCell className="font-rubik text-right py-2">
                <div className="flex flex-col">
                  <span className="font-semibold">{formatCurrency(totalFinalAcum)}</span>
                  <span className="text-xs text-muted-foreground">
                    {totalFinal > 0 ? ((totalFinalAcum / totalFinal) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="font-rubik text-right py-2">
                <div className="flex flex-col">
                  <span className="font-semibold">{formatCurrency(totalFinalParcial)}</span>
                  <span className="text-xs text-muted-foreground">
                    {totalFinal > 0 ? ((totalFinalParcial / totalFinal) * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </TableCell>
              <TableCell colSpan={2}></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Tablas de Control en Paralelo */}
      <div className="grid grid-cols-2 gap-4">
        {/* Control de Anticipos */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="font-rubik text-base">Control de Anticipos</CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            <Table>
              <TableHeader>
                <TableRow className="h-9">
                  <TableHead className="font-rubik py-2">Concepto</TableHead>
                  <TableHead className="font-rubik text-right py-2">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr]:h-10">
                {/* Total Anticipos */}
                <TableRow className="bg-muted/50 font-semibold h-10">
                  <TableCell className="font-rubik py-2">
                    Total Anticipos
                  </TableCell>
                  <TableCell className="font-rubik text-right font-semibold py-2">
                    {formatCurrency(totalAnticipos)}
                  </TableCell>
                </TableRow>
                
                {/* Devolución Actual */}
                <TableRow className="hover:bg-muted/50 h-10">
                  <TableCell className="font-rubik py-2">
                    Devolución de Anticipo Actual
                  </TableCell>
                  <TableCell className="font-rubik text-right py-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      value={devolucionActual || ''}
                      onChange={(e) => setDevolucionActual(parseFloat(e.target.value) || 0)}
                      className="w-32 text-right font-rubik ml-auto h-8"
                    />
                  </TableCell>
                </TableRow>
                
                {/* Devolución Acumulado */}
                <TableRow className="hover:bg-muted/50 h-10">
                  <TableCell className="font-rubik py-2">
                    Devolución de Anticipo Acumulado
                  </TableCell>
                  <TableCell className="font-rubik text-right font-semibold py-2">
                    {formatCurrency(devolucionAcumulado)}
                  </TableCell>
                </TableRow>
                
                {/* Total Devuelto */}
                <TableRow className="bg-accent/20 font-semibold h-10">
                  <TableCell className="font-rubik py-2">
                    Total Devuelto
                  </TableCell>
                  <TableCell className="font-rubik text-right py-2">
                    {formatCurrency(totalDevuelto)}
                  </TableCell>
                </TableRow>
                
                {/* Saldo por Devolver */}
                <TableRow className="bg-primary/10 font-bold border-t-2 h-10">
                  <TableCell className="font-rubik py-2">
                    Saldo por Devolver
                  </TableCell>
                  <TableCell className="font-rubik text-right py-2">
                    {formatCurrency(saldoPorDevolver)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Control de Retenciones */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="font-rubik text-base">Control de Retenciones</CardTitle>
          </CardHeader>
          <CardContent className="py-3">
            <Table>
              <TableHeader>
                <TableRow className="h-9">
                  <TableHead className="font-rubik py-2">Concepto</TableHead>
                  <TableHead className="font-rubik text-right py-2">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="[&_tr]:h-10">
                {/* Total Retenciones */}
                <TableRow className="bg-muted/50 font-semibold h-10">
                  <TableCell className="font-rubik py-2">
                    Total Retenciones
                  </TableCell>
                  <TableCell className="font-rubik text-right font-semibold py-2">
                    {formatCurrency(totalRetenciones)}
                  </TableCell>
                </TableRow>
                
                {/* Retención Actual */}
                <TableRow className="hover:bg-muted/50 h-10">
                  <TableCell className="font-rubik py-2">
                    Retención de Anticipo Actual
                  </TableCell>
                  <TableCell className="font-rubik text-right py-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0"
                      value={retencionActual || ''}
                      onChange={(e) => setRetencionActual(parseFloat(e.target.value) || 0)}
                      className="w-32 text-right font-rubik ml-auto h-8"
                    />
                  </TableCell>
                </TableRow>
                
                {/* Retención Acumulado */}
                <TableRow className="hover:bg-muted/50 h-10">
                  <TableCell className="font-rubik py-2">
                    Retención de Anticipo Acumulado
                  </TableCell>
                  <TableCell className="font-rubik text-right font-semibold py-2">
                    {formatCurrency(retencionAcumulado)}
                  </TableCell>
                </TableRow>
                
                {/* Total Retenido */}
                <TableRow className="bg-accent/20 font-semibold h-10">
                  <TableCell className="font-rubik py-2">
                    Total Retenido
                  </TableCell>
                  <TableCell className="font-rubik text-right py-2">
                    {formatCurrency(totalRetenido)}
                  </TableCell>
                </TableRow>
                
                {/* Saldo por Retener */}
                <TableRow className="bg-primary/10 font-bold border-t-2 h-10">
                  <TableCell className="font-rubik py-2">
                    Saldo por Retener
                  </TableCell>
                  <TableCell className="font-rubik text-right py-2">
                    {formatCurrency(saldoPorRetener)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
