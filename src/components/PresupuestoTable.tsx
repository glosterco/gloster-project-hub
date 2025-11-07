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
}

export const PresupuestoTable: React.FC<PresupuestoTableProps> = ({
  presupuesto, 
  loading, 
  currency = 'CLP',
  onUpdate 
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
  
  const { toast } = useToast();
  
  // Cálculos para Anticipos
  const totalDevuelto = devolucionAcumulado + devolucionActual;
  const saldoPorDevolver = totalAnticipos - totalDevuelto;
  
  // Cálculos para Retenciones
  const totalRetenido = retencionAcumulado + retencionActual;
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

  const handleAvanceParcialChange = (id: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditingValues(prev => ({ ...prev, [id]: numValue }));
  };

  const handleUpdatePresupuesto = async (item: Presupuesto) => {
    const avanceParcial = editingValues[item.id] || 0;
    const newAvanceAcumulado = (item['Avance Acumulado'] || 0) + avanceParcial;

    try {
      const { error } = await supabase
        .from('Presupuesto' as any)
        .update({
          'Avance Parcial': avanceParcial,
          'Avance Acumulado': newAvanceAcumulado,
          'Ult. Actualizacion': new Date().toISOString()
        })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: "Actualizado",
        description: "El avance del presupuesto ha sido actualizado correctamente",
      });

      // Limpiar el valor editado
      setEditingValues(prev => {
        const newValues = { ...prev };
        delete newValues[item.id];
        return newValues;
      });

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
  const montoGastosGenerales = subtotalCostoDirecto * (gastosGenerales / 100);
  const montoUtilidad = subtotalCostoDirecto * (utilidad / 100);
  const totalNeto = subtotalCostoDirecto + montoGastosGenerales + montoUtilidad;
  const iva = totalNeto * 0.19;
  const totalFinal = totalNeto + iva;

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
              <TableHead className="font-rubik text-right py-2">Avance Acum. (%)</TableHead>
              <TableHead className="font-rubik text-right py-2">Avance Parcial (%)</TableHead>
              <TableHead className="font-rubik py-2">Última Actualización</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="[&_tr]:h-10">
            {presupuesto.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
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
                    {item['Avance Acumulado'] !== null && item['Avance Acumulado'] !== undefined
                      ? `${item['Avance Acumulado'].toFixed(1)}%`
                      : '-'}
                  </TableCell>
                  <TableCell className="font-rubik py-2">
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      placeholder="0.0"
                      value={editingValues[item.id] ?? ''}
                      onChange={(e) => handleAvanceParcialChange(item.id, e.target.value)}
                      onBlur={() => {
                        if (editingValues[item.id] !== undefined) {
                          handleUpdatePresupuesto(item);
                        }
                      }}
                      className="w-24 text-right font-rubik h-8"
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
              <TableCell colSpan={3}></TableCell>
            </TableRow>
            
            {/* Sección Gastos Generales y Utilidad */}
            <TableRow className="bg-accent/30 h-9">
              <TableCell colSpan={8} className="font-rubik font-bold text-center py-1.5 text-sm">
                Gastos Generales y Utilidad
              </TableCell>
            </TableRow>
            
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
              <TableCell colSpan={3}></TableCell>
            </TableRow>
            
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
              <TableCell colSpan={3}></TableCell>
            </TableRow>
            
            {/* Total Neto */}
            <TableRow className="bg-muted/50 font-semibold border-t-2 h-10">
              <TableCell colSpan={4} className="font-rubik text-right py-2">
                Total Neto:
              </TableCell>
              <TableCell className="font-rubik text-right py-2">
                {formatCurrency(totalNeto)}
              </TableCell>
              <TableCell colSpan={3}></TableCell>
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
              <TableCell colSpan={3}></TableCell>
            </TableRow>
            
            {/* Total Final */}
            <TableRow className="bg-primary/10 font-bold border-t-2 h-11">
              <TableCell colSpan={4} className="font-rubik text-right py-2">
                Total Final:
              </TableCell>
              <TableCell className="font-rubik text-right py-2">
                {formatCurrency(totalFinal)}
              </TableCell>
              <TableCell colSpan={3}></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

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
                <TableCell className="font-rubik text-right py-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={totalAnticipos || ''}
                    onChange={(e) => setTotalAnticipos(parseFloat(e.target.value) || 0)}
                    className="w-32 text-right font-rubik ml-auto h-8"
                  />
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
                <TableCell className="font-rubik text-right py-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={devolucionAcumulado || ''}
                    onChange={(e) => setDevolucionAcumulado(parseFloat(e.target.value) || 0)}
                    className="w-32 text-right font-rubik ml-auto h-8"
                  />
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
                <TableCell className="font-rubik text-right py-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={totalRetenciones || ''}
                    onChange={(e) => setTotalRetenciones(parseFloat(e.target.value) || 0)}
                    className="w-32 text-right font-rubik ml-auto h-8"
                  />
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
                <TableCell className="font-rubik text-right py-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={retencionAcumulado || ''}
                    onChange={(e) => setRetencionAcumulado(parseFloat(e.target.value) || 0)}
                    className="w-32 text-right font-rubik ml-auto h-8"
                  />
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
  );
};
