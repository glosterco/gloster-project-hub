import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, AlertCircle, CheckCircle, Clock, XCircle, ArrowLeft, LogOut, User, ChevronDown, DollarSign, BarChart3 } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useExecutiveSummaryMandante } from '@/hooks/useExecutiveSummaryMandante';
import { formatCurrency } from '@/utils/currencyUtils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const ExecutiveSummaryMandante = () => {
  const { summaryData, loading, error } = useExecutiveSummaryMandante();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [mandanteInfo, setMandanteInfo] = React.useState<{
    ContactName: string;
    CompanyName: string;
  } | null>(null);
  const [hasMultipleRoles, setHasMultipleRoles] = React.useState(false);

  React.useEffect(() => {
    const fetchMandanteInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role_type, entity_id')
        .eq('auth_user_id', user.id);

      const mandanteRole = userRoles?.find(role => role.role_type === 'mandante');
      if (!mandanteRole) return;

      const { data: mandanteData } = await supabase
        .from('Mandantes')
        .select('ContactName, CompanyName')
        .eq('id', mandanteRole.entity_id)
        .maybeSingle();

      if (mandanteData) {
        setMandanteInfo(mandanteData);
      }

      setHasMultipleRoles((userRoles?.length || 0) > 1);
    };

    fetchMandanteInfo();
  }, []);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const PageHeader = () => (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard-mandante')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver al Dashboard</span>
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            {hasMultipleRoles ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gloster-gray hover:text-slate-800">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-rubik">
                      {mandanteInfo?.ContactName && mandanteInfo?.CompanyName 
                        ? `${mandanteInfo.ContactName} - ${mandanteInfo.CompanyName}` 
                        : 'Usuario Mandante'}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white z-50">
                  <DropdownMenuItem 
                    onClick={() => navigate('/role-selection')}
                    className="cursor-pointer font-rubik"
                  >
                    Cambiar de rol
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2 text-gloster-gray">
                <User className="h-4 w-4" />
                <span className="text-sm font-rubik">
                  {mandanteInfo?.ContactName && mandanteInfo?.CompanyName 
                    ? `${mandanteInfo.ContactName} - ${mandanteInfo.CompanyName}` 
                    : 'Usuario Mandante'}
                </span>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );

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
          <div className="text-center text-destructive">
            Error al cargar datos: {error}
          </div>
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

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Status Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Distribución de Estados de Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Aprobados', value: summaryData?.approvedPayments || 0, color: '#22c55e' },
                      { name: 'Pendientes', value: summaryData?.pendingPayments || 0, color: '#eab308' },
                      { name: 'Rechazados', value: summaryData?.rejectedPayments || 0, color: '#ef4444' },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Aprobados', value: summaryData?.approvedPayments || 0, color: '#22c55e' },
                      { name: 'Pendientes', value: summaryData?.pendingPayments || 0, color: '#eab308' },
                      { name: 'Rechazados', value: summaryData?.rejectedPayments || 0, color: '#ef4444' },
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Amount Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Montos por Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { 
                      name: 'Aprobados', 
                      monto: summaryData?.approvedPaymentsAmount || 0,
                      fill: '#22c55e'
                    },
                    { 
                      name: 'Pendientes', 
                      monto: summaryData?.pendingPaymentsAmount || 0,
                      fill: '#eab308'
                    },
                    { 
                      name: 'Rechazados', 
                      monto: summaryData?.rejectedPaymentsAmount || 0,
                      fill: '#ef4444'
                    },
                  ]}
                >
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="monto" />
                </BarChart>
              </ResponsiveContainer>
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

export default ExecutiveSummaryMandante;
