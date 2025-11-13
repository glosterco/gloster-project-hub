import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PresupuestoHistoricoChartProps {
  historico: Array<{
    id: number;
    TotalAcumulado: number;
    TotalParcial: number;
    created_at: string;
  }>;
  currency?: string;
}

export const PresupuestoHistoricoChart: React.FC<PresupuestoHistoricoChartProps> = ({ 
  historico,
  currency = 'CLP'
}) => {
  // Agrupar datos por fecha (día)
  const groupedData = historico.reduce((acc, item) => {
    const fecha = format(new Date(item.created_at), 'dd/MM/yy', { locale: es });
    const fechaCompleta = format(new Date(item.created_at), 'dd/MM/yyyy', { locale: es });
    const timestamp = new Date(item.created_at).getTime();
    
    if (!acc[fecha]) {
      acc[fecha] = {
        fecha,
        fechaCompleta,
        // Para el acumulado, tomamos el valor directamente (ya es la suma total acumulada)
        acumulado: item.TotalAcumulado,
        // Para el parcial, sumamos todos los parciales del mismo día
        parcial: item.TotalParcial,
        timestamp: timestamp
      };
    } else {
      // Si hay múltiples registros del mismo día:
      // 1. Tomar el ÚLTIMO TotalAcumulado (es el más actualizado del día)
      if (timestamp > acc[fecha].timestamp) {
        acc[fecha].acumulado = item.TotalAcumulado;
        acc[fecha].timestamp = timestamp;
      }
      // 2. SUMAR todos los TotalParcial del día (pueden ser múltiples actualizaciones)
      acc[fecha].parcial += item.TotalParcial;
    }
    return acc;
  }, {} as Record<string, any>);

  // Convertir a array y ordenar por fecha cronológicamente
  const chartData = Object.values(groupedData).sort((a: any, b: any) => a.timestamp - b.timestamp);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Histórico de Avance de Presupuesto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No hay datos históricos disponibles. Los datos se generarán al actualizar los avances del presupuesto.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Histórico de Avance de Presupuesto
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Evolución de los totales acumulados y parciales en el tiempo
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="fecha" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              formatter={(value: number) => formatCurrency(value, currency)}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return payload[0].payload.fechaCompleta;
                }
                return label;
              }}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => {
                if (value === 'acumulado') return 'Total Acumulado (Línea)';
                if (value === 'parcial') return 'Avance Parcial (Barras)';
                return value;
              }}
            />
            <Bar 
              dataKey="parcial" 
              fill="hsl(var(--primary))"
              name="parcial"
              radius={[4, 4, 0, 0]}
            />
            <Line 
              type="monotone" 
              dataKey="acumulado" 
              stroke="hsl(var(--chart-2))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--chart-2))', r: 5 }}
              activeDot={{ r: 7 }}
              name="acumulado"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
