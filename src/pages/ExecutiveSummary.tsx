import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  XCircle,
  BarChart3,
  FileText,
  Image,
  Calendar,
  FolderOpen,
  Plus,
  HelpCircle,
} from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import PageHeader from "@/components/PageHeader";
import { useExecutiveSummary } from "@/hooks/useExecutiveSummary";
import { useExecutiveSummaryCC } from "@/hooks/useExecutiveSummaryCC";
import { formatCurrency } from "@/utils/currencyUtils";
import { ProjectFilter } from "@/components/ProjectFilter";
import { PresupuestoHistoricoChart } from "@/components/PresupuestoHistoricoChart";

const ExecutiveSummary = () => {
  // Verificar si es acceso CC
  const mandanteAccess = sessionStorage.getItem("mandanteAccess");
  const isCC = mandanteAccess ? JSON.parse(mandanteAccess).userType === "cc" : false;

  const [selectedProjects, setSelectedProjects] = React.useState<number[]>([]);
  const [allProjects, setAllProjects] = React.useState<{ id: number; name: string }[]>([]);

  // First fetch to get all projects
  const { summaryData: initialData } = isCC ? useExecutiveSummaryCC() : useExecutiveSummary();

  // Initialize all projects and selected projects
  React.useEffect(() => {
    if (initialData?.projects && allProjects.length === 0) {
      setAllProjects(initialData.projects);
      setSelectedProjects(initialData.projects.map((p) => p.id));
    }
  }, [initialData]);

  // Second fetch with filtered projects
  const { summaryData, loading, error } = isCC
    ? useExecutiveSummaryCC()
    : useExecutiveSummary(selectedProjects.length > 0 ? selectedProjects : undefined);

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
            {isCC && (
              <div className="mt-4 text-sm text-muted-foreground">
                Asegúrate de que tienes acceso al contratista correspondiente
              </div>
            )}
          </div>
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
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(summaryData?.montoPresentadoAdicionales || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground">Total en adicionales presentados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Monto Aprobado</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(summaryData?.montoAprobadoAdicionales || 0)}</div>
                  <p className="text-xs text-muted-foreground">Total en adicionales aprobados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Por Estado</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Pendientes:</span>
                      <span className="font-medium">{summaryData?.adicionalesPendientes || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Aprobados:</span>
                      <span className="font-medium">{summaryData?.adicionalesAprobados || 0}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Rechazados:</span>
                      <span className="font-medium">{summaryData?.adicionalesRechazados || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                              <div className="text-xs text-muted-foreground">
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
                              <div className="text-xs text-muted-foreground">
                                Aprobado: {formatCurrency(esp.montoAprobado)}
                              </div>
                            </div>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
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
                            <td className="text-right py-2 px-2">{formatCurrency(item.montoAprobado)}</td>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total RFI</CardTitle>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summaryData?.totalRFI || 0}</div>
                  <p className="text-xs text-muted-foreground">Solicitudes registradas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
                  <Clock className="h-4 w-4 text-gloster-yellow" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summaryData?.rfiPendientes || 0}</div>
                  <p className="text-xs text-muted-foreground">Pendientes de respuesta</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Respondidos</CardTitle>
                  <CheckCircle className="h-4 w-4 text-gloster-gray" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summaryData?.rfiRespondidos || 0}</div>
                  <p className="text-xs text-muted-foreground">RFI con respuesta</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Cerrados</CardTitle>
                  <XCircle className="h-4 w-4 text-gloster-dark" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summaryData?.rfiCerrados || 0}</div>
                  <p className="text-xs text-muted-foreground">RFI cerrados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Tiempo Promedio</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {summaryData?.rfiTiempoPromedioRespuesta 
                      ? `${summaryData.rfiTiempoPromedioRespuesta.toFixed(1)} días`
                      : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">Plazo de respuesta</p>
                </CardContent>
              </Card>
            </div>

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
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={summaryData.rfiDistribucionUrgencia.filter((u) => u.count > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                          outerRadius={70}
                          dataKey="count"
                          nameKey="urgencia"
                        >
                          {summaryData.rfiDistribucionUrgencia.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.urgencia === "Muy Urgente"
                                  ? "hsl(var(--destructive))"
                                  : entry.urgencia === "Urgente"
                                    ? "hsl(var(--primary))"
                                    : "hsl(var(--muted-foreground))"
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
                            className="h-full bg-primary rounded-full transition-all"
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

            {/* Status/Urgency Matrix and Specialty Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status vs Urgency Matrix */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5" />
                    Matriz Estado / Urgencia
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {summaryData?.rfiPorEspecialidad && summaryData.rfiPorEspecialidad.length > 0 ? (
                    (() => {
                      // Calculate totals by status and urgency
                      const matrix = {
                        Pendiente: { noUrgente: 0, urgente: 0, muyUrgente: 0, total: 0 },
                        Respondido: { noUrgente: 0, urgente: 0, muyUrgente: 0, total: 0 },
                        Cerrado: { noUrgente: 0, urgente: 0, muyUrgente: 0, total: 0 },
                      };

                      summaryData.rfiPorEspecialidad.forEach((esp) => {
                        // Distribute by status - we need to estimate since we only have totals per specialty
                        // Using the specialty data to build the matrix
                        matrix.Pendiente.noUrgente += Math.round(esp.pendientes * (esp.noUrgente / (esp.total || 1)));
                        matrix.Pendiente.urgente += Math.round(esp.pendientes * (esp.urgente / (esp.total || 1)));
                        matrix.Pendiente.muyUrgente += Math.round(esp.pendientes * (esp.muyUrgente / (esp.total || 1)));
                        matrix.Pendiente.total += esp.pendientes;

                        matrix.Respondido.noUrgente += Math.round(esp.respondidos * (esp.noUrgente / (esp.total || 1)));
                        matrix.Respondido.urgente += Math.round(esp.respondidos * (esp.urgente / (esp.total || 1)));
                        matrix.Respondido.muyUrgente += Math.round(
                          esp.respondidos * (esp.muyUrgente / (esp.total || 1)),
                        );
                        matrix.Respondido.total += esp.respondidos;

                        matrix.Cerrado.noUrgente += Math.round(esp.cerrados * (esp.noUrgente / (esp.total || 1)));
                        matrix.Cerrado.urgente += Math.round(esp.cerrados * (esp.urgente / (esp.total || 1)));
                        matrix.Cerrado.muyUrgente += Math.round(esp.cerrados * (esp.muyUrgente / (esp.total || 1)));
                        matrix.Cerrado.total += esp.cerrados;
                      });

                      const urgencyTotals = {
                        noUrgente: matrix.Pendiente.noUrgente + matrix.Respondido.noUrgente + matrix.Cerrado.noUrgente,
                        urgente: matrix.Pendiente.urgente + matrix.Respondido.urgente + matrix.Cerrado.urgente,
                        muyUrgente:
                          matrix.Pendiente.muyUrgente + matrix.Respondido.muyUrgente + matrix.Cerrado.muyUrgente,
                      };

                      return (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 px-3 font-medium">Estado</th>
                                <th className="text-center py-3 px-3 font-medium">No Urgente</th>
                                <th className="text-center py-3 px-3 font-medium">Urgente</th>
                                <th className="text-center py-3 px-3 font-medium">Muy Urgente</th>
                                <th className="text-center py-3 px-3 font-medium bg-muted/50">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-muted hover:bg-muted/30">
                                <td className="py-3 px-3">
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                    Pendiente
                                  </Badge>
                                </td>
                                <td className="text-center py-3 px-3">{matrix.Pendiente.noUrgente}</td>
                                <td className="text-center py-3 px-3">{matrix.Pendiente.urgente}</td>
                                <td className="text-center py-3 px-3 font-medium text-destructive">
                                  {matrix.Pendiente.muyUrgente}
                                </td>
                                <td className="text-center py-3 px-3 font-bold bg-muted/50">
                                  {matrix.Pendiente.total}
                                </td>
                              </tr>
                              <tr className="border-b border-muted hover:bg-muted/30">
                                <td className="py-3 px-3">
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                    Respondido
                                  </Badge>
                                </td>
                                <td className="text-center py-3 px-3">{matrix.Respondido.noUrgente}</td>
                                <td className="text-center py-3 px-3">{matrix.Respondido.urgente}</td>
                                <td className="text-center py-3 px-3 font-medium text-destructive">
                                  {matrix.Respondido.muyUrgente}
                                </td>
                                <td className="text-center py-3 px-3 font-bold bg-muted/50">
                                  {matrix.Respondido.total}
                                </td>
                              </tr>
                              <tr className="border-b border-muted hover:bg-muted/30">
                                <td className="py-3 px-3">
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    Cerrado
                                  </Badge>
                                </td>
                                <td className="text-center py-3 px-3">{matrix.Cerrado.noUrgente}</td>
                                <td className="text-center py-3 px-3">{matrix.Cerrado.urgente}</td>
                                <td className="text-center py-3 px-3 font-medium text-destructive">
                                  {matrix.Cerrado.muyUrgente}
                                </td>
                                <td className="text-center py-3 px-3 font-bold bg-muted/50">{matrix.Cerrado.total}</td>
                              </tr>
                              <tr className="bg-muted/50 font-bold">
                                <td className="py-3 px-3">Total</td>
                                <td className="text-center py-3 px-3">{urgencyTotals.noUrgente}</td>
                                <td className="text-center py-3 px-3">{urgencyTotals.urgente}</td>
                                <td className="text-center py-3 px-3 text-destructive">{urgencyTotals.muyUrgente}</td>
                                <td className="text-center py-3 px-3">{summaryData.totalRFI}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      );
                    })()
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No hay RFI registrados</p>
                  )}
                </CardContent>
              </Card>

              {/* Specialty Distribution Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Distribución por Especialidad
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {summaryData?.rfiPorEspecialidad && summaryData.rfiPorEspecialidad.length > 0 ? (
                    (() => {
                      // Brand colors: yellow, gray, light blue (matching the muted totals), plus additional colors
                      const brandColors = [
                        '#F5DF4D', // gloster-yellow
                        '#6B7280', // gloster-gray  
                        '#E2E8F0', // slate-200 (celeste/gris claro como los totales de la matriz)
                        '#1F2937', // gloster-dark
                        '#FCD34D', // amber-300
                        '#94A3B8', // slate-400
                        '#CBD5E1', // slate-300
                        '#475569', // slate-600
                      ];

                      return (
                        <ResponsiveContainer width="100%" height={280}>
                          <BarChart
                            data={summaryData.rfiPorEspecialidad.slice(0, 8)}
                            layout="vertical"
                            margin={{ left: 20, right: 20 }}
                          >
                            <XAxis type="number" />
                            <YAxis dataKey="especialidad" type="category" width={100} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="total" radius={[0, 4, 4, 0]} name="Total RFI">
                              {summaryData.rfiPorEspecialidad.slice(0, 8).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={brandColors[index % brandColors.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      );
                    })()
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No hay RFI registrados</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ExecutiveSummary;
