import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  LogOut,
  User,
  ChevronDown,
  DollarSign,
  BarChart3,
  FileText,
  Image,
  Calendar,
  FolderOpen,
  Plus,
  HelpCircle,
} from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useExecutiveSummaryMandante } from "@/hooks/useExecutiveSummaryMandante";
import { formatCurrency } from "@/utils/currencyUtils";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ProjectFilter } from "@/components/ProjectFilter";
import { PresupuestoHistoricoChart } from "@/components/PresupuestoHistoricoChart";

const ExecutiveSummaryMandante = () => {
  const [selectedProjects, setSelectedProjects] = React.useState<number[]>([]);
  const [allProjects, setAllProjects] = React.useState<{ id: number; name: string }[]>([]);

  // Fetch summary with selected projects
  const { summaryData, loading, error } = useExecutiveSummaryMandante(
    selectedProjects.length > 0 ? selectedProjects : undefined,
  );

  // Initialize projects list and select all by default
  React.useEffect(() => {
    if (summaryData?.projects && allProjects.length === 0) {
      setAllProjects(summaryData.projects);
      setSelectedProjects(summaryData.projects.map((p) => p.id));
    }
  }, [summaryData?.projects, allProjects.length]);

  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [mandanteInfo, setMandanteInfo] = React.useState<{
    ContactName: string;
    CompanyName: string;
  } | null>(null);
  const [hasMultipleRoles, setHasMultipleRoles] = React.useState(false);

  React.useEffect(() => {
    const fetchMandanteInfo = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userRoles } = await supabase
        .from("user_roles")
        .select("role_type, entity_id")
        .eq("auth_user_id", user.id);

      const mandanteRole = userRoles?.find((role) => role.role_type === "mandante");
      if (!mandanteRole) return;

      const { data: mandanteData } = await supabase
        .from("Mandantes")
        .select("ContactName, CompanyName")
        .eq("id", mandanteRole.entity_id)
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
    navigate("/");
  };

  const PageHeader = () => (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard-mandante")}
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-2 text-gloster-gray hover:text-slate-800"
                  >
                    <User className="h-4 w-4" />
                    <span className="text-sm font-rubik">
                      {mandanteInfo?.ContactName && mandanteInfo?.CompanyName
                        ? `${mandanteInfo.ContactName} - ${mandanteInfo.CompanyName}`
                        : "Usuario Mandante"}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white z-50">
                  <DropdownMenuItem onClick={() => navigate("/role-selection")} className="cursor-pointer font-rubik">
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
                    : "Usuario Mandante"}
                </span>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={handleLogout} className="flex items-center space-x-2">
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
          <div className="text-center text-destructive">Error al cargar datos: {error}</div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "aprobado":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "pendiente":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "rechazado":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case "enviado":
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "aprobado":
        return "default";
      case "pendiente":
        return "secondary";
      case "rechazado":
        return "destructive";
      case "enviado":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Resumen Ejecutivo</h1>
          <p className="text-muted-foreground">Vista general del estado de proyectos activos</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="estados-pago" className="w-full">
          <TabsList
            className={`grid w-full mb-8`}
            style={{
              gridTemplateColumns: `repeat(${1 + (summaryData?.features.Adicionales ? 1 : 0) + (summaryData?.features.Documentos ? 1 : 0) + (summaryData?.features.Fotos ? 1 : 0) + (summaryData?.features.Presupuesto ? 1 : 0) + (summaryData?.features.Reuniones ? 1 : 0) + (summaryData?.features.RFI ? 1 : 0)}, minmax(0, 1fr))`,
            }}
          >
            <TabsTrigger value="estados-pago">Estados de pago</TabsTrigger>
            {summaryData?.features.Adicionales && <TabsTrigger value="adicionales">Adicionales</TabsTrigger>}
            {summaryData?.features.Documentos && <TabsTrigger value="documentos">Documentos</TabsTrigger>}
            {summaryData?.features.Fotos && <TabsTrigger value="fotos">Fotos</TabsTrigger>}
            {summaryData?.features.Presupuesto && <TabsTrigger value="presupuesto">Presupuesto</TabsTrigger>}
            {summaryData?.features.Reuniones && <TabsTrigger value="reuniones">Reuniones</TabsTrigger>}
            {summaryData?.features.RFI && <TabsTrigger value="rfi">RFI</TabsTrigger>}
          </TabsList>

          {/* Project Filter */}
          <ProjectFilter
            projects={allProjects}
            selectedProjects={selectedProjects}
            onProjectsChange={setSelectedProjects}
          />

          {/* Estados de Pago Tab */}
          <TabsContent value="estados-pago">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Proyectos</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summaryData?.totalProjects || 0}</div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {formatCurrency(summaryData?.totalValue || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Proyectos activos y valor total</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pagos Pendientes</CardTitle>
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{summaryData?.pendingPayments || 0}</div>
                  <div className="text-sm font-medium text-yellow-600">
                    {formatCurrency(summaryData?.pendingPaymentsAmount || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Estados de pago pendientes y enviados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pagos Aprobados</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{summaryData?.approvedPayments || 0}</div>
                  <div className="text-sm font-medium text-green-600">
                    {formatCurrency(summaryData?.approvedPaymentsAmount || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Estados de pago aprobados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pagos Rechazados</CardTitle>
                  <XCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{summaryData?.rejectedPayments || 0}</div>
                  <div className="text-sm font-medium text-red-600">
                    {formatCurrency(summaryData?.rejectedPaymentsAmount || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Estados de pago rechazados</p>
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
                          { name: "Aprobados", value: summaryData?.approvedPayments || 0, color: "#22c55e" },
                          { name: "Pendientes", value: summaryData?.pendingPayments || 0, color: "#eab308" },
                          { name: "Rechazados", value: summaryData?.rejectedPayments || 0, color: "#ef4444" },
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
                          { name: "Aprobados", value: summaryData?.approvedPayments || 0, color: "#22c55e" },
                          { name: "Pendientes", value: summaryData?.pendingPayments || 0, color: "#eab308" },
                          { name: "Rechazados", value: summaryData?.rejectedPayments || 0, color: "#ef4444" },
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
                          name: "Aprobados",
                          monto: summaryData?.approvedPaymentsAmount || 0,
                          fill: "#22c55e",
                        },
                        {
                          name: "Pendientes",
                          monto: summaryData?.pendingPaymentsAmount || 0,
                          fill: "#eab308",
                        },
                        {
                          name: "Rechazados",
                          monto: summaryData?.rejectedPaymentsAmount || 0,
                          fill: "#ef4444",
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
                    <CardTitle className="text-lg font-semibold">{project.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{project.contractorName}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-muted-foreground mb-2">Últimos Estados de Pago:</div>
                      <div className="grid grid-cols-2 gap-2">
                        {project.recentPayments.map((payment, paymentIndex) => (
                          <div key={`${payment.id}-${paymentIndex}`} className="p-3 bg-muted/30 rounded-md text-center">
                            <div className="font-medium text-sm mb-1">{payment.paymentName}</div>
                            <div className="text-xs text-muted-foreground mb-2">
                              {payment.month} {payment.year}
                            </div>
                            <div className="mb-2">
                              <Badge
                                variant={getStatusVariant(payment.status)}
                                className="flex items-center gap-1 justify-center"
                              >
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
          </TabsContent>

          {/* Adicionales Tab */}
          <TabsContent value="adicionales">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Adicionales</CardTitle>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summaryData?.totalAdicionales || 0}</div>
                  <p className="text-xs text-muted-foreground">Adicionales registrados en el sistema</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Monto Presentado</CardTitle>
                  <DollarSign className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(summaryData?.montoPresentadoAdicionales || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Total en adicionales presentados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Monto Aprobado</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(summaryData?.montoAprobadoAdicionales || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Total en adicionales aprobados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Por Estado</CardTitle>
                  <BarChart3 className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Pendientes:</span>
                      <span className="font-medium">{summaryData?.adicionalesPendientes || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Aprobados:</span>
                      <span className="font-medium text-green-600">{summaryData?.adicionalesAprobados || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Rechazados:</span>
                      <span className="font-medium text-red-600">{summaryData?.adicionalesRechazados || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category and Specialty Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* By Category */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Montos por Categoría
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {summaryData?.adicionalesPorCategoria && summaryData.adicionalesPorCategoria.length > 0 ? (
                    <div className="space-y-4">
                      {summaryData.adicionalesPorCategoria.map((cat) => (
                        <div key={cat.categoria} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{cat.categoria}</Badge>
                              <span className="text-xs text-muted-foreground">({cat.count})</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">{formatCurrency(cat.montoPresentado)}</div>
                              <div className="text-xs text-green-600">
                                Aprobado: {formatCurrency(cat.montoAprobado)}
                              </div>
                            </div>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{
                                width: `${
                                  summaryData.montoPresentadoAdicionales > 0
                                    ? (cat.montoPresentado / summaryData.montoPresentadoAdicionales) * 100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No hay adicionales registrados</p>
                  )}
                </CardContent>
              </Card>

              {/* By Specialty */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Montos por Especialidad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {summaryData?.adicionalesPorEspecialidad && summaryData.adicionalesPorEspecialidad.length > 0 ? (
                    <div className="space-y-4">
                      {summaryData.adicionalesPorEspecialidad.map((esp) => (
                        <div key={esp.especialidad} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary">{esp.especialidad}</Badge>
                              <span className="text-xs text-muted-foreground">({esp.count})</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-semibold">{formatCurrency(esp.montoPresentado)}</div>
                              <div className="text-xs text-green-600">
                                Aprobado: {formatCurrency(esp.montoAprobado)}
                              </div>
                            </div>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                              style={{
                                width: `${
                                  summaryData.montoPresentadoAdicionales > 0
                                    ? (esp.montoPresentado / summaryData.montoPresentadoAdicionales) * 100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No hay adicionales registrados</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Combined Category + Specialty */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Montos por Categoría y Especialidad (Combinado)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summaryData?.adicionalesCombinados && summaryData.adicionalesCombinados.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Categoría</th>
                          <th className="text-left py-2 px-2">Especialidad</th>
                          <th className="text-center py-2 px-2">Cantidad</th>
                          <th className="text-right py-2 px-2">Presentado</th>
                          <th className="text-right py-2 px-2">Aprobado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summaryData.adicionalesCombinados.map((item, idx) => (
                          <tr key={idx} className="border-b border-muted">
                            <td className="py-2 px-2">
                              <Badge variant="outline" className="text-xs">
                                {item.categoria}
                              </Badge>
                            </td>
                            <td className="py-2 px-2">
                              <Badge variant="secondary" className="text-xs">
                                {item.especialidad}
                              </Badge>
                            </td>
                            <td className="text-center py-2 px-2">{item.count}</td>
                            <td className="text-right py-2 px-2 font-medium">{formatCurrency(item.montoPresentado)}</td>
                            <td className="text-right py-2 px-2 text-green-600">
                              {formatCurrency(item.montoAprobado)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No hay adicionales registrados</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documentos Tab */}
          <TabsContent value="documentos">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Documentos</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summaryData?.totalDocumentos || 0}</div>
                  <p className="text-xs text-muted-foreground">Documentos en el sistema</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Tamaño Total</CardTitle>
                  <FolderOpen className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {((summaryData?.totalSizeDocumentos || 0) / (1024 * 1024)).toFixed(2)} MB
                  </div>
                  <p className="text-xs text-muted-foreground">Espacio utilizado</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Tipos de Archivo</CardTitle>
                  <FileText className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {summaryData?.documentosPorTipo?.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Formatos diferentes</p>
                </CardContent>
              </Card>
            </div>

            {summaryData?.documentosPorTipo && summaryData.documentosPorTipo.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Documentos por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={summaryData.documentosPorTipo}>
                      <XAxis dataKey="tipo" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Fotos Tab */}
          <TabsContent value="fotos">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Fotos</CardTitle>
                  <Image className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summaryData?.totalFotos || 0}</div>
                  <p className="text-xs text-muted-foreground">Fotos en el sistema</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Promedio por Proyecto</CardTitle>
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {summaryData?.fotosPorProyecto && summaryData.fotosPorProyecto.length > 0
                      ? (summaryData.totalFotos / summaryData.fotosPorProyecto.length).toFixed(1)
                      : "0"}
                  </div>
                  <p className="text-xs text-muted-foreground">Fotos por proyecto en promedio</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Presupuesto Tab */}
          <TabsContent value="presupuesto">
            {/* Gráfico de histórico */}
            <div className="mb-8">
              <PresupuestoHistoricoChart historico={summaryData?.presupuestoHistorico || []} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Items Totales</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summaryData?.totalPresupuestoItems || 0}</div>
                  <p className="text-xs text-muted-foreground">Partidas en presupuestos</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Avance Promedio</CardTitle>
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {(summaryData?.avancePromedioPresupuesto || 0).toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Avance acumulado promedio</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Monto Total</CardTitle>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(summaryData?.montoTotalPresupuesto || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Total en presupuestos</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reuniones Tab */}
          <TabsContent value="reuniones">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Reuniones</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summaryData?.totalReuniones || 0}</div>
                  <p className="text-xs text-muted-foreground">Reuniones registradas en el sistema</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Promedio por Proyecto</CardTitle>
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {summaryData?.totalProjects && summaryData.totalProjects > 0
                      ? ((summaryData.totalReuniones || 0) / summaryData.totalProjects).toFixed(1)
                      : "0"}
                  </div>
                  <p className="text-xs text-muted-foreground">Reuniones por proyecto</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* RFI Tab */}
          <TabsContent value="rfi">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total RFI</CardTitle>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summaryData?.totalRFI || 0}</div>
                  <p className="text-xs text-muted-foreground">Solicitudes de información registradas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
                  <Clock className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-amber-600">{summaryData?.rfiPendientes || 0}</div>
                  <p className="text-xs text-muted-foreground">RFI pendientes de respuesta</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Respondidos</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{summaryData?.rfiRespondidos || 0}</div>
                  <p className="text-xs text-muted-foreground">RFI con respuesta</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Cerrados</CardTitle>
                  <XCircle className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-600">{summaryData?.rfiCerrados || 0}</div>
                  <p className="text-xs text-muted-foreground">RFI cerrados</p>
                </CardContent>
              </Card>
            </div>

            {/* Urgency Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Distribución de Urgencia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {summaryData?.rfiDistribucionUrgencia &&
                  summaryData.rfiDistribucionUrgencia.some((u) => u.count > 0) ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={summaryData.rfiDistribucionUrgencia.filter((u) => u.count > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={60}
                          dataKey="count"
                          nameKey="urgencia"
                        >
                          {summaryData.rfiDistribucionUrgencia.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.urgencia === "Muy Urgente"
                                  ? "#ef4444"
                                  : entry.urgencia === "Urgente"
                                    ? "#f59e0b"
                                    : "#22c55e"
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No hay RFI registrados</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Resumen de Urgencia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {summaryData?.rfiDistribucionUrgencia?.map((item) => (
                      <div key={item.urgencia} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Badge
                            variant={
                              item.urgencia === "Muy Urgente"
                                ? "destructive"
                                : item.urgencia === "Urgente"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {item.urgencia}
                          </Badge>
                          <span className="font-semibold">{item.count}</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              item.urgencia === "Muy Urgente"
                                ? "bg-red-500"
                                : item.urgencia === "Urgente"
                                  ? "bg-amber-500"
                                  : "bg-green-500"
                            }`}
                            style={{
                              width: `${summaryData.totalRFI > 0 ? (item.count / summaryData.totalRFI) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RFI by Specialty */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  RFI por Especialidad (ordenado descendente)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summaryData?.rfiPorEspecialidad && summaryData.rfiPorEspecialidad.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-2">Especialidad</th>
                          <th className="text-center py-2 px-2">Total</th>
                          <th className="text-center py-2 px-2">Pendientes</th>
                          <th className="text-center py-2 px-2">Respondidos</th>
                          <th className="text-center py-2 px-2">Cerrados</th>
                          <th className="text-center py-2 px-2">No Urgente</th>
                          <th className="text-center py-2 px-2">Urgente</th>
                          <th className="text-center py-2 px-2">Muy Urgente</th>
                        </tr>
                      </thead>
                      <tbody>
                        {summaryData.rfiPorEspecialidad.map((esp) => (
                          <tr key={esp.especialidad} className="border-b border-muted">
                            <td className="py-2 px-2">
                              <Badge variant="secondary" className="text-xs">
                                {esp.especialidad}
                              </Badge>
                            </td>
                            <td className="text-center py-2 px-2 font-bold">{esp.total}</td>
                            <td className="text-center py-2 px-2 text-amber-600">{esp.pendientes}</td>
                            <td className="text-center py-2 px-2 text-green-600">{esp.respondidos}</td>
                            <td className="text-center py-2 px-2 text-gray-600">{esp.cerrados}</td>
                            <td className="text-center py-2 px-2">{esp.noUrgente}</td>
                            <td className="text-center py-2 px-2 text-amber-600">{esp.urgente}</td>
                            <td className="text-center py-2 px-2 text-red-600">{esp.muyUrgente}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No hay RFI registrados</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ExecutiveSummaryMandante;
