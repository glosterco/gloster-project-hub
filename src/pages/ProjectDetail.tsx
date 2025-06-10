
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Calendar, ChevronRight, Search, Filter, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('month');
  const [filterBy, setFilterBy] = useState('all');

  // Datos simulados del proyecto
  const project = {
    id: parseInt(id || '1'),
    name: "Centro Comercial Plaza Norte",
    description: "Obras de acabados e instalaciones eléctricas en centro comercial de 3 pisos. Incluye obras civiles, instalaciones eléctricas, sanitarias y acabados completos.",
    status: "activo",
    progress: 40,
    totalValue: 85000000,
    paidValue: 34000000,
    contractor: "Constructora ABC Ltda.",
    client: "Inversiones Comerciales Ltda.",
    location: "Las Condes",
    startDate: "2024-01-15",
    estimatedEndDate: "2024-12-30",
    projectManager: "Ana Rodríguez",
    contactEmail: "ana.rodriguez@inversiones.cl"
  };

  const paymentStates = [
    {
      id: 6,
      month: "Junio 2024",
      status: "programado",
      amount: null,
      dueDate: "2024-06-30",
      documents: ["EEPP", "Planilla de Avance", "F30", "F30-1", "Finiquito"]
    },
    {
      id: 5,
      month: "Mayo 2024",
      status: "pendiente",
      amount: 28000000,
      dueDate: "2024-05-30",
      documents: ["EEPP", "Planilla de Avance", "F30", "F30-1", "Finiquito"]
    },
    {
      id: 4,
      month: "Abril 2024",
      status: "aprobado",
      amount: 25000000,
      dueDate: "2024-04-30",
      paidDate: "2024-04-28",
      documents: ["EEPP", "Planilla de Avance", "F30", "F30-1", "Finiquito"]
    },
    {
      id: 3,
      month: "Marzo 2024",
      status: "aprobado",
      amount: 25500000,
      dueDate: "2024-03-30",
      paidDate: "2024-03-29",
      documents: ["EEPP", "Planilla de Avance", "F30", "F30-1", "Finiquito"]
    },
    {
      id: 2,
      month: "Febrero 2024",
      status: "aprobado",
      amount: 22000000,
      dueDate: "2024-02-29",
      paidDate: "2024-02-27",
      documents: ["EEPP", "Planilla de Avance", "F30", "F30-1", "Finiquito"]
    },
    {
      id: 1,
      month: "Enero 2024",
      status: "aprobado",
      amount: 25000000,
      dueDate: "2024-01-30",
      paidDate: "2024-01-28",
      documents: ["EEPP", "Planilla de Avance", "F30", "F30-1", "Finiquito"]
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
      case 'aprobado':
        return 'bg-green-100 text-green-700';
      case 'pendiente':
        return 'bg-gloster-yellow/20 text-gloster-gray';
      case 'programado':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleAddExtraordinaryPayment = () => {
    toast({
      title: "Función en desarrollo",
      description: "La funcionalidad para agregar estados de pago extraordinarios estará disponible pronto",
    });
  };

  const filteredAndSortedPayments = paymentStates
    .filter(payment => {
      const matchesSearch = payment.month.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterBy === 'all' || payment.status === filterBy;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'month':
          return b.id - a.id; // Más reciente primero
        case 'amount':
          const amountA = a.amount || 0;
          const amountB = b.amount || 0;
          return amountB - amountA;
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <PageHeader title="Gloster" />

      {/* Volver al Dashboard - fuera del banner blanco */}
      <div className="bg-slate-50 py-2">
        <div className="container mx-auto px-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-gloster-gray hover:text-slate-800 text-sm font-rubik flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Project Banner Card */}
        <Card className="mb-6 border-l-4 border-l-gloster-gray hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2 font-rubik text-slate-800">{project.name}</CardTitle>
                <CardDescription className="text-gloster-gray text-base font-rubik">
                  {project.description}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-gloster-gray/20 text-gloster-gray border-gloster-gray/30 font-rubik self-start">
                {project.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Mandante</p>
                  <p className="font-semibold text-slate-800 font-rubik break-words">{project.client}</p>
                </div>
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Contratista</p>
                  <p className="font-semibold text-slate-800 font-rubik break-words">{project.contractor}</p>
                </div>
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Ubicación</p>
                  <p className="font-semibold text-slate-800 font-rubik">{project.location}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Valor Total</p>
                  <p className="font-semibold text-slate-800 font-rubik text-sm md:text-base">{formatCurrency(project.totalValue)}</p>
                </div>
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Progreso</p>
                  <div className="flex items-center space-x-2">
                    <Progress value={project.progress} className="flex-1 bg-gloster-gray/20 [&>div]:bg-gloster-yellow" />
                    <span className="font-semibold text-sm text-slate-800 font-rubik">{project.progress}%</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estados de Pago in Mosaic Layout */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-slate-800 mb-6 font-rubik">Estados de Pago</h3>
          
          {/* Search, Filter and Sort Controls - Optimized Layout */}
          <div className="mb-6 p-4 bg-white rounded-lg border border-gloster-gray/20">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="relative w-full lg:flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gloster-gray h-4 w-4" />
                <Input
                  placeholder="Buscar estados de pago..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 font-rubik"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:flex-shrink-0">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-40 font-rubik">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Mes</SelectItem>
                    <SelectItem value="amount">Monto</SelectItem>
                    <SelectItem value="status">Estado</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-full sm:w-40 font-rubik">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="aprobado">Aprobado</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="programado">Programado</SelectItem>
                  </SelectContent>
                </Select>

                <Button 
                  onClick={handleAddExtraordinaryPayment}
                  className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-semibold font-rubik w-full sm:w-auto whitespace-nowrap"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Estado Extraordinario
                </Button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Payment States Cards */}
            {filteredAndSortedPayments.map((payment) => (
              <Card 
                key={payment.id} 
                className="hover:shadow-xl transition-all duration-300 cursor-pointer border-gloster-gray/20 hover:border-gloster-gray/50 h-full"
              >
                <CardContent className="p-4 md:p-6 h-full flex flex-col">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <div className="w-10 h-10 bg-gloster-yellow/20 rounded-lg flex items-center justify-center shrink-0">
                          <Calendar className="h-5 w-5 text-gloster-gray" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold text-slate-800 font-rubik text-sm md:text-base">{payment.month}</h4>
                          <p className="text-gloster-gray text-xs md:text-sm font-rubik">
                            Vencimiento: {payment.dueDate}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className={`${getStatusColor(payment.status)} text-xs shrink-0`}>
                        {payment.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gloster-gray text-xs md:text-sm font-rubik">Monto:</span>
                        <span className="font-semibold text-slate-800 font-rubik text-xs md:text-sm">
                          {payment.amount ? formatCurrency(payment.amount) : '-'}
                        </span>
                      </div>
                      {payment.paidDate && (
                        <div className="flex justify-between items-center">
                          <span className="text-gloster-gray text-xs md:text-sm font-rubik">Aprobado:</span>
                          <span className="text-green-600 text-xs md:text-sm font-rubik">{payment.paidDate}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 mt-auto">
                    {payment.status === 'pendiente' && (
                      <Button
                        onClick={() => navigate(`/payment/${payment.id}`)}
                        className="w-full bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-semibold font-rubik"
                        size="sm"
                      >
                        Gestionar Documentos
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                    
                    {payment.status === 'aprobado' && (
                      <Button
                        variant="outline"
                        onClick={() => navigate(`/payment/${payment.id}`)}
                        className="w-full border-gloster-gray/30 hover:bg-gloster-gray/10 font-rubik"
                        size="sm"
                      >
                        Ver Documentos
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                    
                    {payment.status === 'programado' && (
                      <Button variant="ghost" disabled className="w-full font-rubik" size="sm">
                        Programado
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Project Info */}
        <Card className="mt-8 border-gloster-gray/20">
          <CardHeader>
            <CardTitle className="font-rubik text-slate-800">Información del Proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Fecha de Inicio</p>
                  <p className="font-medium font-rubik">{project.startDate}</p>
                </div>
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Fecha Estimada de Término</p>
                  <p className="font-medium font-rubik">{project.estimatedEndDate}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Project Manager</p>
                  <p className="font-medium font-rubik">{project.projectManager}</p>
                </div>
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Contacto</p>
                  <p className="font-medium font-rubik break-words">{project.contactEmail}</p>
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
