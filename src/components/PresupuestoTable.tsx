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
  const { toast } = useToast();

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
    <div className="space-y-6">
      {/* Tabla Principal de Presupuesto */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-rubik min-w-[200px]">Item</TableHead>
              <TableHead className="font-rubik">Unidad</TableHead>
              <TableHead className="font-rubik text-right">Cantidad</TableHead>
              <TableHead className="font-rubik text-right">P.U.</TableHead>
              <TableHead className="font-rubik text-right">Total</TableHead>
              <TableHead className="font-rubik text-right">Avance Acum. (%)</TableHead>
              <TableHead className="font-rubik text-right">Avance Parcial (%)</TableHead>
              <TableHead className="font-rubik">Última Actualización</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {presupuesto.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground font-rubik">No hay partidas registradas</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              presupuesto.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium font-rubik">
                    {item.Item || `Item ${item.id}`}
                  </TableCell>
                  <TableCell className="font-rubik">{item.Unidad || '-'}</TableCell>
                  <TableCell className="font-rubik text-right">
                    {item.Cantidad ? new Intl.NumberFormat('es-CL').format(item.Cantidad) : '-'}
                  </TableCell>
                  <TableCell className="font-rubik text-right">
                    {item.PU ? formatCurrency(item.PU) : '-'}
                  </TableCell>
                  <TableCell className="font-rubik text-right font-semibold">
                    {item.Total ? formatCurrency(item.Total) : '-'}
                  </TableCell>
                  <TableCell className="font-rubik text-right">
                    {item['Avance Acumulado'] !== null && item['Avance Acumulado'] !== undefined
                      ? `${item['Avance Acumulado'].toFixed(1)}%`
                      : '-'}
                  </TableCell>
                  <TableCell className="font-rubik">
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
                      className="w-24 text-right font-rubik"
                    />
                  </TableCell>
                  <TableCell className="font-rubik text-sm text-muted-foreground">
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
            <TableRow className="bg-muted/50 font-semibold border-t-2">
              <TableCell colSpan={4} className="font-rubik text-right">
                Subtotal Costo Directo:
              </TableCell>
              <TableCell className="font-rubik text-right">
                {formatCurrency(subtotalCostoDirecto)}
              </TableCell>
              <TableCell colSpan={3}></TableCell>
            </TableRow>
            
            {/* Sección Gastos Generales y Utilidad */}
            <TableRow className="bg-accent/30">
              <TableCell colSpan={8} className="font-rubik font-bold text-center py-2">
                Gastos Generales y Utilidad
              </TableCell>
            </TableRow>
            
            <TableRow className="hover:bg-muted/50">
              <TableCell colSpan={2} className="font-rubik font-medium">
                Gastos Generales
              </TableCell>
              <TableCell className="font-rubik">%</TableCell>
              <TableCell className="font-rubik text-right">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  value={gastosGenerales || ''}
                  onChange={(e) => setGastosGenerales(parseFloat(e.target.value) || 0)}
                  className="w-24 text-right font-rubik"
                />
              </TableCell>
              <TableCell className="font-rubik text-right font-semibold">
                {formatCurrency(montoGastosGenerales)}
              </TableCell>
              <TableCell colSpan={3}></TableCell>
            </TableRow>
            
            <TableRow className="hover:bg-muted/50">
              <TableCell colSpan={2} className="font-rubik font-medium">
                Utilidad
              </TableCell>
              <TableCell className="font-rubik">%</TableCell>
              <TableCell className="font-rubik text-right">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  value={utilidad || ''}
                  onChange={(e) => setUtilidad(parseFloat(e.target.value) || 0)}
                  className="w-24 text-right font-rubik"
                />
              </TableCell>
              <TableCell className="font-rubik text-right font-semibold">
                {formatCurrency(montoUtilidad)}
              </TableCell>
              <TableCell colSpan={3}></TableCell>
            </TableRow>
            
            {/* Total Neto */}
            <TableRow className="bg-muted/50 font-semibold border-t-2">
              <TableCell colSpan={4} className="font-rubik text-right">
                Total Neto:
              </TableCell>
              <TableCell className="font-rubik text-right">
                {formatCurrency(totalNeto)}
              </TableCell>
              <TableCell colSpan={3}></TableCell>
            </TableRow>
            
            {/* IVA */}
            <TableRow className="hover:bg-muted/50">
              <TableCell colSpan={2} className="font-rubik font-medium">
                IVA
              </TableCell>
              <TableCell className="font-rubik">%</TableCell>
              <TableCell className="font-rubik text-right">19</TableCell>
              <TableCell className="font-rubik text-right font-semibold">
                {formatCurrency(iva)}
              </TableCell>
              <TableCell colSpan={3}></TableCell>
            </TableRow>
            
            {/* Total Final */}
            <TableRow className="bg-primary/10 font-bold border-t-2">
              <TableCell colSpan={4} className="font-rubik text-right text-lg">
                Total Final:
              </TableCell>
              <TableCell className="font-rubik text-right text-lg">
                {formatCurrency(totalFinal)}
              </TableCell>
              <TableCell colSpan={3}></TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Control de Anticipos */}
      <Card>
        <CardHeader>
          <CardTitle className="font-rubik">Control de Anticipos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-rubik">Concepto</TableHead>
                <TableHead className="font-rubik">Unidad</TableHead>
                <TableHead className="font-rubik text-right">Cantidad</TableHead>
                <TableHead className="font-rubik text-right">P.U.</TableHead>
                <TableHead className="font-rubik text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-rubik">
                  No hay anticipos registrados
                </TableCell>
              </TableRow>
              <TableRow className="bg-muted/50 font-semibold border-t-2">
                <TableCell colSpan={4} className="font-rubik text-right">
                  Total Anticipos:
                </TableCell>
                <TableCell className="font-rubik text-right">
                  {formatCurrency(0)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Control de Retenciones */}
      <Card>
        <CardHeader>
          <CardTitle className="font-rubik">Control de Retenciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-rubik">Concepto</TableHead>
                <TableHead className="font-rubik">Unidad</TableHead>
                <TableHead className="font-rubik text-right">Cantidad</TableHead>
                <TableHead className="font-rubik text-right">P.U.</TableHead>
                <TableHead className="font-rubik text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground font-rubik">
                  No hay retenciones registradas
                </TableCell>
              </TableRow>
              <TableRow className="bg-muted/50 font-semibold border-t-2">
                <TableCell colSpan={4} className="font-rubik text-right">
                  Total Retenciones:
                </TableCell>
                <TableCell className="font-rubik text-right">
                  {formatCurrency(0)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
