import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { DollarSign, TrendingUp, CheckCircle, XCircle, Clock, Layers, Wrench } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';
import { Adicional } from '@/hooks/useAdicionales';

interface AdicionalesMetricsProps {
  adicionales: Adicional[];
  currency?: string;
}

const COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4'];

export const AdicionalesMetrics: React.FC<AdicionalesMetricsProps> = ({
  adicionales,
  currency = 'CLP'
}) => {
  // Calculate general metrics
  const totalPresentado = adicionales.reduce((sum, a) => sum + (a.Monto_presentado || 0), 0);
  const totalAprobado = adicionales.reduce((sum, a) => sum + (a.Monto_aprobado || 0), 0);
  const aprobados = adicionales.filter(a => a.Status === 'Aprobado');
  const rechazados = adicionales.filter(a => a.Status === 'Rechazado');
  const pendientes = adicionales.filter(a => a.Status === 'Pendiente' || a.Status === 'Enviado');

  // Group by category
  const byCategory = adicionales.reduce((acc, a) => {
    const cat = a.Categoria || 'Sin categoría';
    if (!acc[cat]) {
      acc[cat] = { name: cat, presentado: 0, aprobado: 0, count: 0 };
    }
    acc[cat].presentado += a.Monto_presentado || 0;
    acc[cat].aprobado += a.Monto_aprobado || 0;
    acc[cat].count += 1;
    return acc;
  }, {} as Record<string, { name: string; presentado: number; aprobado: number; count: number }>);

  const categoryData = Object.values(byCategory).sort((a, b) => b.presentado - a.presentado);

  // Group by specialty
  const bySpecialty = adicionales.reduce((acc, a) => {
    const spec = a.Especialidad || 'Sin especialidad';
    if (!acc[spec]) {
      acc[spec] = { name: spec, presentado: 0, aprobado: 0, count: 0 };
    }
    acc[spec].presentado += a.Monto_presentado || 0;
    acc[spec].aprobado += a.Monto_aprobado || 0;
    acc[spec].count += 1;
    return acc;
  }, {} as Record<string, { name: string; presentado: number; aprobado: number; count: number }>);

  const specialtyData = Object.values(bySpecialty).sort((a, b) => b.presentado - a.presentado);

  // Status distribution for pie chart
  const statusData = [
    { name: 'Aprobados', value: aprobados.length, color: '#22c55e' },
    { name: 'Rechazados', value: rechazados.length, color: '#ef4444' },
    { name: 'Pendientes', value: pendientes.length, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const approvalRate = adicionales.length > 0 
    ? Math.round((aprobados.length / adicionales.length) * 100) 
    : 0;

  if (adicionales.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground font-rubik">Total Presentado</p>
                <p className="text-2xl font-bold font-rubik">{formatCurrency(totalPresentado, currency)}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground font-rubik">Total Aprobado</p>
                <p className="text-2xl font-bold text-green-600 font-rubik">{formatCurrency(totalAprobado, currency)}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground font-rubik">Tasa de Aprobación</p>
                <p className="text-2xl font-bold font-rubik">{approvalRate}%</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <Progress value={approvalRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground font-rubik">Pendientes</p>
                <p className="text-2xl font-bold text-orange-600 font-rubik">{pendientes.length}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-rubik">
              <Layers className="h-5 w-5" />
              Análisis por Categoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryData.map((cat, index) => (
                <div key={cat.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        style={{ borderColor: COLORS[index % COLORS.length], color: COLORS[index % COLORS.length] }}
                      >
                        {cat.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-rubik">({cat.count})</span>
                    </div>
                    <span className="text-sm font-semibold font-rubik">
                      {formatCurrency(cat.presentado, currency)}
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Progress 
                      value={totalPresentado > 0 ? (cat.presentado / totalPresentado) * 100 : 0} 
                      className="flex-1"
                    />
                    <span className="text-xs text-muted-foreground font-rubik w-12 text-right">
                      {totalPresentado > 0 ? Math.round((cat.presentado / totalPresentado) * 100) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Specialty Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-rubik">
              <Wrench className="h-5 w-5" />
              Análisis por Especialidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {specialtyData.map((spec, index) => (
                <div key={spec.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="secondary"
                        className="font-rubik"
                      >
                        {spec.name}
                      </Badge>
                      <span className="text-xs text-muted-foreground font-rubik">({spec.count})</span>
                    </div>
                    <span className="text-sm font-semibold font-rubik">
                      {formatCurrency(spec.presentado, currency)}
                    </span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all"
                        style={{ width: `${totalPresentado > 0 ? (spec.presentado / totalPresentado) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground font-rubik w-12 text-right">
                      {totalPresentado > 0 ? Math.round((spec.presentado / totalPresentado) * 100) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      {statusData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="font-rubik">Distribución por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 justify-center">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-rubik text-sm">
                    {item.name}: <strong>{item.value}</strong>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};