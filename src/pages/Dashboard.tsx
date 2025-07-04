import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, FileText, Users, DollarSign } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import ProjectsGrid from '@/components/ProjectsGrid';
import PaymentStatesTable from '@/components/PaymentStatesTable';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const { data: projects, isLoading: isLoadingProjects, error: projectsError } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Proyectos')
        .select('*');

      if (error) {
        throw new Error(error.message);
      }

      return data;
    }
  });

  const { data: paymentStates, isLoading: isLoadingPaymentStates, error: paymentStatesError } = useQuery({
    queryKey: ['paymentStates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('Estados de pago')
        .select(`
          *,
          Proyectos (
            Name
          )
        `);

      if (error) {
        throw new Error(error.message);
      }

      return data;
    }
  });

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <PageHeader />

      <div className="container mx-auto px-6 py-8">
        <h2 className="text-3xl font-bold mb-4 text-slate-800">Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="border-gloster-gray/20 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 font-rubik">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-slate-800">Proyectos</span>
              </CardTitle>
              <CardDescription className="text-gloster-gray font-rubik text-sm">
                {projects ? projects.length : 'Cargando...'} Proyectos totales
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingProjects ? (
                <p>Cargando...</p>
              ) : projectsError ? (
                <p>Error: {projectsError.message}</p>
              ) : (
                <Button onClick={() => navigate('/projects')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-rubik">
                  Ver Proyectos
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-gloster-gray/20 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 font-rubik">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
                <span className="text-slate-800">Estados de Pago</span>
              </CardTitle>
              <CardDescription className="text-gloster-gray font-rubik text-sm">
                {paymentStates ? paymentStates.length : 'Cargando...'} Estados de pago totales
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingPaymentStates ? (
                <p>Cargando...</p>
              ) : paymentStatesError ? (
                <p>Error: {paymentStatesError.message}</p>
              ) : (
                <Button onClick={() => navigate('/payment-states')} className="w-full bg-green-600 hover:bg-green-700 text-white font-rubik">
                  Ver Estados de Pago
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="border-gloster-gray/20 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 font-rubik">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-yellow-600" />
                </div>
                <span className="text-slate-800">Usuarios</span>
              </CardTitle>
              <CardDescription className="text-gloster-gray font-rubik text-sm">
                Gestiona los usuarios de la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/users')} className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-rubik">
                Gestionar Usuarios
              </Button>
            </CardContent>
          </Card>

          <Card className="border-gloster-gray/20 hover:shadow-xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 font-rubik">
                <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="text-slate-800">Finanzas</span>
              </CardTitle>
              <CardDescription className="text-gloster-gray font-rubik text-sm">
                Visualiza el estado financiero de tus proyectos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate('/finances')} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-rubik">
                Ver Finanzas
              </Button>
            </CardContent>
          </Card>
        </div>

        <section className="mb-8">
          <h3 className="text-xl font-bold mb-4 text-slate-800 font-rubik">Proyectos Recientes</h3>
          {isLoadingProjects ? (
            <p>Cargando proyectos...</p>
          ) : projectsError ? (
            <p>Error: {projectsError.message}</p>
          ) : (
            <ProjectsGrid projects={projects || []} />
          )}
        </section>

        <section>
          <h3 className="text-xl font-bold mb-4 text-slate-800 font-rubik">Últimos Estados de Pago</h3>
          {isLoadingPaymentStates ? (
            <p>Cargando estados de pago...</p>
          ) : paymentStatesError ? (
            <p>Error: {paymentStatesError.message}</p>
          ) : (
            <PaymentStatesTable paymentStates={paymentStates || []} />
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
