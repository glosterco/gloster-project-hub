import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Clock, DollarSign, XCircle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useExecutiveSummary } from '@/hooks/useExecutiveSummary';
import { useExecutiveSummaryCC } from '@/hooks/useExecutiveSummaryCC';
import { formatCurrency } from '@/utils/currencyUtils';

const ExecutiveSummary = () => {
  // Verificar si es acceso CC
  const mandanteAccess = sessionStorage.getItem('mandanteAccess');
  const isCC = mandanteAccess ? JSON.parse(mandanteAccess).userType === 'cc' : false;
  
  const { summaryData, loading, error } = isCC ? useExecutiveSummaryCC() : useExecutiveSummary();

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
              <div className="text-sm font-medium text-muted-foreground">
                {formatCurrency(summaryData?.totalValue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Proyectos activos y valor total
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
              <div className="text-sm font-medium text-yellow-600">
                {formatCurrency(summaryData?.pendingPaymentsAmount || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Estados de pago pendientes y enviados
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
              <div className="text-sm font-medium text-green-600">
                {formatCurrency(summaryData?.approvedPaymentsAmount || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Estados de pago aprobados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pagos Rechazados
              </CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {summaryData?.rejectedPayments || 0}
              </div>
              <div className="text-sm font-medium text-red-600">
                {formatCurrency(summaryData?.rejectedPaymentsAmount || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Estados de pago rechazados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Description */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            A continuación se muestra el estado de los últimos estados de pago presentados por proyecto.
          </p>
        </div>

        {/* Project Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {summaryData?.projectSummaries?.map((project, index) => (
            <Card key={`${project.id}-${index}`} className="h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold">
                  {project.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {project.contractorName}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Últimos Estados de Pago:
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {project.recentPayments.map((payment, paymentIndex) => (
                      <div key={`${payment.id}-${paymentIndex}`} className="p-3 bg-muted/30 rounded-md text-center">
                        <div className="font-medium text-sm mb-1">
                          {payment.paymentName}
                        </div>
                        <div className="text-xs text-muted-foreground mb-2">
                          {payment.month} {payment.year}
                        </div>
                        <div className="mb-2">
                          <Badge variant={getStatusVariant(payment.status)} className="flex items-center gap-1 justify-center">
                            {getStatusIcon(payment.status)}
                            {payment.status}
                          </Badge>
                        </div>
                        <div className="font-medium text-xs text-muted-foreground">
                          {formatCurrency(payment.amount, payment.currency)}
                        </div>
                      </div>
                    ))}
                  </div>
                  {project.recentPayments.length === 0 && (
                    <div className="text-center text-muted-foreground py-4 text-sm">
                      No hay estados de pago recientes
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )) || (
            <div className="col-span-full text-center text-muted-foreground py-8">
              No hay proyectos con estados de pago disponibles
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummary;