import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, DollarSign } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useExecutiveSummary } from '@/hooks/useExecutiveSummary';
import { formatCurrency } from '@/utils/currencyUtils';

const ExecutiveSummary = () => {
  const { summaryData, loading, error } = useExecutiveSummary();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-muted-foreground">Cargando resumen ejecutivo...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-destructive">Error al cargar datos: {error}</div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aprobado':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pendiente':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'rechazado':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'enviado':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'aprobado':
        return 'default';
      case 'pendiente':
        return 'secondary';
      case 'rechazado':
        return 'destructive';
      case 'enviado':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Resumen Ejecutivo
          </h1>
          <p className="text-muted-foreground">
            Vista general del estado de proyectos y pagos activos
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Proyectos
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryData?.totalProjects || 0}</div>
              <p className="text-xs text-muted-foreground">
                Proyectos activos en el sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valor Total
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summaryData?.totalValue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Suma de todos los contratos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pagos Pendientes
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {summaryData?.pendingPayments || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Estados de pago pendientes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pagos Aprobados
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {summaryData?.approvedPayments || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Estados de pago aprobados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Payment States */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Últimos Estados de Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summaryData?.recentPayments?.map((payment, index) => (
                  <div key={`${payment.id}-${index}`} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {payment.projectName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {payment.paymentName} - {payment.contractorName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Vence: {new Date(payment.expiryDate).toLocaleDateString('es-CL')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-medium text-sm">
                          {formatCurrency(payment.amount, payment.currency)}
                        </div>
                      </div>
                      <Badge variant={getStatusVariant(payment.status)} className="flex items-center gap-1">
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </Badge>
                    </div>
                  </div>
                )) || (
                  <div className="text-center text-muted-foreground py-4">
                    No hay estados de pago recientes
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Resumen por Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summaryData?.statusSummary?.map((statusGroup, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(statusGroup.status)}
                      <span className="font-medium">{statusGroup.status}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground">
                        {statusGroup.count} pagos
                      </span>
                      <span className="font-medium">
                        {formatCurrency(statusGroup.totalAmount)}
                      </span>
                    </div>
                  </div>
                )) || (
                  <div className="text-center text-muted-foreground py-4">
                    No hay datos de estado disponibles
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummary;