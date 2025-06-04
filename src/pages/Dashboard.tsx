
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Calendar, DollarSign, FileText, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const projects = [
    {
      id: 1,
      name: "Edificio Residencial Las Torres",
      description: "Construcción de complejo habitacional de 15 pisos",
      status: "activo",
      progress: 65,
      nextPayment: "2024-06-15",
      totalValue: 150000000,
      paidValue: 97500000,
      client: "Constructora Del Valle S.A.",
      location: "Santiago Centro"
    },
    {
      id: 2,
      name: "Centro Comercial Plaza Norte",
      description: "Obras de acabados y instalaciones eléctricas",
      status: "activo",
      progress: 40,
      nextPayment: "2024-06-30",
      totalValue: 85000000,
      paidValue: 34000000,
      client: "Inversiones Comerciales Ltda.",
      location: "Las Condes"
    },
    {
      id: 3,
      name: "Proyecto Habitacional Vista Mar",
      description: "Construcción de 45 casas unifamiliares",
      status: "activo",
      progress: 80,
      nextPayment: "2024-06-10",
      totalValue: 200000000,
      paidValue: 160000000,
      client: "Inmobiliaria Costa S.A.",
      location: "Viña del Mar"
    }
  ];

  const handleLogout = () => {
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    });
    navigate('/');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Gloster</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-slate-600">
                <User className="h-4 w-4" />
                <span className="text-sm">Juan Pérez - Subcontratista</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="text-slate-600 hover:text-slate-800"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Mis Proyectos</h2>
          <p className="text-slate-600">Gestiona tus proyectos activos y estados de pago</p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Proyectos Activos
              </CardTitle>
              <Building2 className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">{projects.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Valor Total Contratos
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">
                {formatCurrency(projects.reduce((sum, p) => sum + p.totalValue, 0))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Pagado
              </CardTitle>
              <FileText className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800">
                {formatCurrency(projects.reduce((sum, p) => sum + p.paidValue, 0))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
        <div className="grid gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl text-slate-800">{project.name}</CardTitle>
                    <CardDescription className="text-slate-600">
                      {project.description}
                    </CardDescription>
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                      <span>{project.client}</span>
                      <span>•</span>
                      <span>{project.location}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600">Progreso del proyecto</span>
                        <span className="font-medium text-slate-800">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-slate-600">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">Próximo pago: {project.nextPayment}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Valor total:</span>
                      <span className="font-semibold text-slate-800">
                        {formatCurrency(project.totalValue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Pagado:</span>
                      <span className="font-semibold text-green-600">
                        {formatCurrency(project.paidValue)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Pendiente:</span>
                      <span className="font-semibold text-orange-600">
                        {formatCurrency(project.totalValue - project.paidValue)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <Button 
                    onClick={() => navigate(`/project/${project.id}`)}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Ver Detalles del Proyecto
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
