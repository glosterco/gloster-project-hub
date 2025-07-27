import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, MapPin, Building2, User, Phone, Mail, FileText, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';
import { useProjectsWithDetailsMandante } from '@/hooks/useProjectsWithDetailsMandante';
import { formatCurrency } from '@/utils/currencyUtils';
import { useNavigate } from 'react-router-dom';
import DynamicPageHeader from '@/components/DynamicPageHeader';

const DashboardMandante: React.FC = () => {
  const { projects, mandante, loading } = useProjectsWithDetailsMandante();
  const navigate = useNavigate();

  const getProjectProgress = (project: any) => {
    if (!project.EstadosPago || project.EstadosPago.length === 0 || !project.Budget) return 0;
    
    // Calcular el monto total aprobado
    const approvedAmount = project.EstadosPago
      .filter(payment => payment.Status === 'Aprobado')
      .reduce((sum, payment) => sum + (payment.Total || 0), 0);
    
    // Calcular progreso basado en monto aprobado vs presupuesto total
    return Math.round((approvedAmount / project.Budget) * 100);
  };

  const getProjectApprovedValue = (project: any) => {
    if (!project.EstadosPago || project.EstadosPago.length === 0) return 0;
    
    return project.EstadosPago
      .filter(payment => payment.Status === 'Aprobado')
      .reduce((sum, payment) => sum + (payment.Total || 0), 0);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Aprobado':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Enviado':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'Rechazado':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'Pendiente':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aprobado':
        return 'bg-green-100 text-green-800';
      case 'Enviado':
        return 'bg-blue-100 text-blue-800';
      case 'Rechazado':
        return 'bg-red-100 text-red-800';
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePaymentClick = (paymentId: number) => {
    navigate(`/submission/${paymentId}`);
  };

  const totalActiveProjects = projects.filter(p => p.Status).length;
  const totalContractsValue = projects.reduce((sum, project) => sum + (project.Budget || 0), 0);
  const totalApprovedValue = projects.reduce((sum, project) => sum + getProjectApprovedValue(project), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DynamicPageHeader 
        pageType="projects"
      />

      <div className="container mx-auto px-6 py-8">
        {/* Header con información del mandante */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Panel de Mandante
          </h1>
          <p className="text-gray-600">
            Bienvenido al panel de gestión de proyectos de {mandante?.CompanyName}
          </p>
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalActiveProjects}</div>
              <p className="text-xs text-muted-foreground">
                {projects.length} proyectos totales
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total Contratos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalContractsValue, projects[0]?.Currency || 'CLP')}
              </div>
              <p className="text-xs text-muted-foreground">
                Suma de todos los contratos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Aprobado</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalApprovedValue, projects[0]?.Currency || 'CLP')}
              </div>
              <p className="text-xs text-muted-foreground">
                Pagos aprobados totales
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de proyectos */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Mis Proyectos</h2>
          
          {projects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay proyectos</h3>
                <p className="text-gray-500 text-center max-w-md">
                  Aún no tienes proyectos asignados como mandante.
                </p>
              </CardContent>
            </Card>
          ) : (
            projects.map((project) => {
              const progress = getProjectProgress(project);
              const approvedValue = getProjectApprovedValue(project);

              return (
                <Card key={project.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl mb-2">{project.Name}</CardTitle>
                        <CardDescription className="text-sm">
                          {project.Description}
                        </CardDescription>
                      </div>
                      <Badge variant={project.Status ? "default" : "secondary"}>
                        {project.Status ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Información del proyecto */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{project.Location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{new Date(project.StartDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span>{project.Contratista?.CompanyName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{project.Contratista?.ContactName}</span>
                      </div>
                    </div>

                    {/* Progreso del proyecto */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Progreso del Proyecto</span>
                        <span className="text-sm text-gray-600">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {/* Información financiera */}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <div>
                        <p className="text-sm text-gray-600">Presupuesto Total</p>
                        <p className="font-semibold">{formatCurrency(project.Budget, project.Currency)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Aprobado</p>
                        <p className="font-semibold text-green-600">{formatCurrency(approvedValue, project.Currency)}</p>
                      </div>
                    </div>

                    {/* Estados de pago */}
                    {project.EstadosPago && project.EstadosPago.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Estados de Pago</h4>
                        <div className="grid gap-2 max-h-40 overflow-y-auto">
                          {project.EstadosPago.map((payment) => (
                            <div 
                              key={payment.id} 
                              className={`flex items-center justify-between p-2 rounded border text-sm ${
                                ['Enviado', 'Aprobado', 'Rechazado'].includes(payment.Status) 
                                  ? 'cursor-pointer hover:bg-gray-50' 
                                  : ''
                              }`}
                              onClick={() => {
                                if (['Enviado', 'Aprobado', 'Rechazado'].includes(payment.Status)) {
                                  handlePaymentClick(payment.id);
                                }
                              }}
                            >
                              <div className="flex items-center gap-2">
                                {getStatusIcon(payment.Status)}
                                <span className="font-medium">{payment.Name}</span>
                                <Badge className={`text-xs ${getStatusColor(payment.Status)}`}>
                                  {payment.Status}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">
                                  {formatCurrency(payment.Total, project.Currency)}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {payment.ExpiryDate}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Botón ver detalles */}
                    <div className="pt-4 border-t">
                      <Button 
                        onClick={() => navigate(`/project/${project.id}`)}
                        className="w-full"
                        variant="outline"
                      >
                        Ver Detalles del Proyecto
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardMandante;