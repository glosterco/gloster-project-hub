
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, FileText, LogOut, User, FolderOpen, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const projects = [
    {
      id: 2,
      name: "Centro Comercial Plaza Norte",
      description: "Obras de acabados e instalaciones eléctricas en centro comercial de 3 pisos.",
      status: "activo",
      progress: 40,
      totalValue: 85000000,
      paidValue: 34000000,
      client: "Inversiones Comerciales Ltda.",
      location: "Santiago Centro",
      nextPayment: "15 Enero 2025"
    },
    {
      id: 3,
      name: "Proyecto Habitacional Vista Mar",
      description: "Instalaciones sanitarias completas para complejo habitacional de 80 departamentos.",
      status: "activo",
      progress: 75,
      totalValue: 45000000,
      paidValue: 33750000,
      client: "Constructora Pacífico SpA",
      location: "Viña del Mar",
      nextPayment: "22 Enero 2025"
    },
    {
      id: 4,
      name: "Oficinas Corporativas Las Américas",
      description: "Instalación eléctrica y automatización de edificio corporativo de 15 pisos.",
      status: "planificado",
      progress: 0,
      totalValue: 120000000,
      paidValue: 0,
      client: "Grupo Empresarial Las Américas",
      location: "Las Condes",
      nextPayment: "Por definir"
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleCreateProject = () => {
    navigate('/create-project');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <PageHeader title="Gloster" />

      <div className="container mx-auto px-6 py-8">
        {/* Page Title with Create Button */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2 font-rubik">Mis Proyectos - Constructora San Miguel Ltda.</h2>
            <p className="text-gloster-gray font-rubik">Gestiona tus proyectos activos y estados de pago</p>
          </div>
          <Button 
            onClick={handleCreateProject}
            className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-semibold font-rubik self-start sm:self-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Crear Nuevo Proyecto
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-gloster-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gloster-gray font-rubik">
                Proyectos Activos
              </CardTitle>
              <div className="w-8 h-8 bg-gloster-yellow/20 rounded-lg flex items-center justify-center">
                <FolderOpen className="h-4 w-4 text-gloster-gray" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800 font-rubik">{projects.length}</div>
            </CardContent>
          </Card>

          <Card className="border-gloster-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gloster-gray font-rubik">
                Valor Total Contratos
              </CardTitle>
              <div className="w-8 h-8 bg-gloster-yellow/20 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-gloster-gray" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800 font-rubik">
                {formatCurrency(projects.reduce((sum, p) => sum + p.totalValue, 0))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gloster-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gloster-gray font-rubik">
                Total Pagado
              </CardTitle>
              <div className="w-8 h-8 bg-gloster-yellow/20 rounded-lg flex items-center justify-center">
                <FileText className="h-4 w-4 text-gloster-gray" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800 font-rubik">
                {formatCurrency(projects.reduce((sum, p) => sum + p.paidValue, 0))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Mosaic Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project, index) => (
            <Card 
              key={project.id} 
              className="hover:shadow-xl transition-all duration-300 cursor-pointer border-gloster-gray/20 hover:border-gloster-yellow/50"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg text-slate-800 leading-tight font-rubik">{project.name}</CardTitle>
                    <CardDescription className="text-gloster-gray text-sm font-rubik">
                      {project.description}
                    </CardDescription>
                    <div className="flex items-center space-x-2 text-xs text-gloster-gray/80">
                      <span className="font-rubik">{project.client}</span>
                      <span>•</span>
                      <span className="font-rubik">{project.location}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-gloster-yellow/20 text-gloster-gray border-gloster-yellow/30 font-rubik">
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gloster-gray font-rubik">Progreso</span>
                    <span className="font-medium text-slate-800 font-rubik">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gloster-gray/20 rounded-full h-2">
                    <div 
                      className="bg-gloster-yellow h-2 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gloster-gray font-rubik">Valor total:</span>
                    <span className="font-semibold text-slate-800 font-rubik">
                      {formatCurrency(project.totalValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gloster-gray font-rubik">Pagado:</span>
                    <span className="font-semibold text-green-600 font-rubik">
                      {formatCurrency(project.paidValue)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gloster-gray font-rubik">Pendiente:</span>
                    <span className="font-semibold text-red-600 font-rubik">
                      {formatCurrency(project.totalValue - project.paidValue)}
                    </span>
                  </div>
                </div>

                <Button 
                  onClick={() => navigate(`/project/${project.id}`)}
                  className="w-full bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-semibold font-rubik"
                  size="sm"
                >
                  Ver Detalles
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
