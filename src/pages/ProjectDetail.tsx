
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Building2, Calendar, DollarSign, FileText, ChevronRight } from 'lucide-react';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Datos simulados del proyecto
  const project = {
    id: parseInt(id || '1'),
    name: "Edificio Residencial Las Torres",
    description: "Construcción de complejo habitacional de 15 pisos con 120 departamentos. Incluye obras civiles, instalaciones eléctricas, sanitarias y acabados completos.",
    status: "activo",
    progress: 65,
    totalValue: 150000000,
    paidValue: 97500000,
    client: "Constructora Del Valle S.A.",
    location: "Santiago Centro",
    startDate: "2024-01-15",
    estimatedEndDate: "2024-12-30",
    projectManager: "Ana Rodríguez",
    contactEmail: "ana.rodriguez@delvalle.cl"
  };

  const paymentStates = [
    {
      id: 1,
      month: "Enero 2024",
      status: "pagado",
      amount: 25000000,
      dueDate: "2024-01-30",
      paidDate: "2024-01-28",
      documents: ["F30", "F30-1", "Finiquito", "Planilla de Avance"]
    },
    {
      id: 2,
      month: "Febrero 2024",
      status: "pagado",
      amount: 22000000,
      dueDate: "2024-02-29",
      paidDate: "2024-02-27",
      documents: ["F30", "F30-1", "Finiquito", "Planilla de Avance"]
    },
    {
      id: 3,
      month: "Marzo 2024",
      status: "pagado",
      amount: 25500000,
      dueDate: "2024-03-30",
      paidDate: "2024-03-29",
      documents: ["F30", "F30-1", "Finiquito", "Planilla de Avance"]
    },
    {
      id: 4,
      month: "Abril 2024",
      status: "pagado",
      amount: 25000000,
      dueDate: "2024-04-30",
      paidDate: "2024-04-28",
      documents: ["F30", "F30-1", "Finiquito", "Planilla de Avance"]
    },
    {
      id: 5,
      month: "Mayo 2024",
      status: "pendiente",
      amount: 28000000,
      dueDate: "2024-05-30",
      documents: ["F30", "F30-1", "Finiquito", "Planilla de Avance"]
    },
    {
      id: 6,
      month: "Junio 2024",
      status: "programado",
      amount: 24500000,
      dueDate: "2024-06-30",
      documents: ["F30", "F30-1", "Finiquito", "Planilla de Avance"]
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pagado':
        return 'bg-green-100 text-green-700';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-700';
      case 'programado':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="text-slate-600 hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Gloster</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Project Banner */}
        <Card className="mb-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{project.name}</CardTitle>
                <CardDescription className="text-blue-100 text-base">
                  {project.description}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {project.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-blue-200 text-sm">Cliente</p>
                <p className="font-semibold">{project.client}</p>
              </div>
              <div>
                <p className="text-blue-200 text-sm">Ubicación</p>
                <p className="font-semibold">{project.location}</p>
              </div>
              <div>
                <p className="text-blue-200 text-sm">Valor Total</p>
                <p className="font-semibold">{formatCurrency(project.totalValue)}</p>
              </div>
              <div>
                <p className="text-blue-200 text-sm">Progreso</p>
                <div className="flex items-center space-x-2">
                  <Progress value={project.progress} className="flex-1 bg-blue-800" />
                  <span className="font-semibold text-sm">{project.progress}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment States */}
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-slate-800 mb-6">Estados de Pago</h3>
          
          {paymentStates.map((payment) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800">{payment.month}</h4>
                      <p className="text-slate-600 text-sm">
                        Vencimiento: {payment.dueDate}
                        {payment.paidDate && ` • Pagado: ${payment.paidDate}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-semibold text-slate-800">
                        {formatCurrency(payment.amount)}
                      </p>
                      <Badge variant="secondary" className={getStatusColor(payment.status)}>
                        {payment.status}
                      </Badge>
                    </div>
                    
                    {payment.status === 'pendiente' && (
                      <Button
                        onClick={() => navigate(`/payment/${payment.id}`)}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        Gestionar Documentos
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                    
                    {payment.status === 'pagado' && (
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/payment/${payment.id}`)}
                      >
                        Ver Documentos
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                    
                    {payment.status === 'programado' && (
                      <Button variant="ghost" disabled>
                        Programado
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Project Info */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Información del Proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-slate-600 text-sm">Fecha de Inicio</p>
                  <p className="font-medium">{project.startDate}</p>
                </div>
                <div>
                  <p className="text-slate-600 text-sm">Fecha Estimada de Término</p>
                  <p className="font-medium">{project.estimatedEndDate}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-slate-600 text-sm">Project Manager</p>
                  <p className="font-medium">{project.projectManager}</p>
                </div>
                <div>
                  <p className="text-slate-600 text-sm">Contacto</p>
                  <p className="font-medium">{project.contactEmail}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectDetail;
