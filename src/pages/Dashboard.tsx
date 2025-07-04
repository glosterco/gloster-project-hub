
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, FileText, Building, TrendingUp, Clock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProjectsGrid } from '@/components/ProjectsGrid';
import { PaymentStatesTable } from '@/components/PaymentStatesTable';
import { useProjectsWithDetails } from '@/hooks/useProjectsWithDetails';
import { useEstadosPago } from '@/hooks/useEstadosPago';

const Dashboard = () => {
  const { loading } = useAuth();
  const navigate = useNavigate();
  const { projects, loading: projectsLoading } = useProjectsWithDetails();
  const { estadosPago, loading: estadosLoading } = useEstadosPago();

  if (loading || projectsLoading || estadosLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  const activeProjects = projects.filter(p => p.Status);
  const pendingPayments = estadosPago.filter(ep => ep.Status === 'Pendiente');
  const completedPayments = estadosPago.filter(ep => ep.Status === 'Aprobado');

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Dashboard</h1>
          <p className="text-slate-600">Resumen de proyectos y estados de pago</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proyectos Activos</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProjects.length}</div>
              <p className="text-xs text-muted-foreground">
                {projects.length - activeProjects.length} inactivos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estados Pendientes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingPayments.length}</div>
              <p className="text-xs text-muted-foreground">
                Requieren atención
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Estados Completados</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedPayments.length}</div>
              <p className="text-xs text-muted-foreground">
                Este mes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Estados</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadosPago.length}</div>
              <p className="text-xs text-muted-foreground">
                Todos los estados
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Projects Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800">Proyectos</h2>
            <Button onClick={() => navigate('/register')}>
              Nuevo Proyecto
            </Button>
          </div>
          <ProjectsGrid projects={projects} />
        </div>

        {/* Recent Payment States */}
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Estados de Pago Recientes</h2>
          <PaymentStatesTable estadosPago={estadosPago.slice(0, 10)} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
