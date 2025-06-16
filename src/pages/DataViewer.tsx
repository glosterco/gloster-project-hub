
import React, { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ProjectsGrid } from '@/components/ProjectsGrid';
import { PaymentStatesTable } from '@/components/PaymentStatesTable';
import { useProjectsWithDetails } from '@/hooks/useProjectsWithDetails';
import { RefreshCw, Database, Building2, FileText } from 'lucide-react';

const DataViewer = () => {
  const { projects, loading, refetch } = useProjectsWithDetails();
  const [activeTab, setActiveTab] = useState('projects');

  // Flatten all payment states from all projects
  const allPaymentStates = projects.flatMap(project => 
    project.EstadosPago.map(ep => ({
      ...ep,
      projectName: project.Name
    }))
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Panel de Datos
              </h1>
              <p className="text-gray-600">
                Visualización completa de proyectos y estados de pago desde Supabase
              </p>
            </div>
            <Button
              onClick={refetch}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar Datos
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Proyectos</p>
                  <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Estados de Pago</p>
                  <p className="text-2xl font-bold text-gray-900">{allPaymentStates.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Database className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Completados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {allPaymentStates.filter(ep => ep.Completion).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Data Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="projects">Proyectos</TabsTrigger>
            <TabsTrigger value="payments">Estados de Pago</TabsTrigger>
          </TabsList>
          
          <TabsContent value="projects" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Proyectos Activos</CardTitle>
                <CardDescription>
                  Vista detallada de todos los proyectos con información de contratistas, mandantes y progreso
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-600">Cargando proyectos...</span>
                  </div>
                ) : projects.length > 0 ? (
                  <ProjectsGrid projects={projects} />
                ) : (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No hay proyectos disponibles</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="payments" className="space-y-6">
            {loading ? (
              <Card>
                <CardContent className="p-12">
                  <div className="flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-gray-600">Cargando estados de pago...</span>
                  </div>
                </CardContent>
              </Card>
            ) : allPaymentStates.length > 0 ? (
              <PaymentStatesTable paymentStates={allPaymentStates} />
            ) : (
              <Card>
                <CardContent className="p-12">
                  <div className="text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No hay estados de pago disponibles</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DataViewer;
