
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Calendar, DollarSign, FileText, Search, Plus, Filter, ArrowUpDown, MapPin, User, Mail, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Estado para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('recent');

  // Datos simulados del proyecto
  const project = {
    id: parseInt(id || '1'),
    name: "Centro Comercial Plaza Norte",
    mandante: "Inversiones Comerciales Ltda.",
    contractor: "Constructora ABC Ltda.",
    location: "Las Condes",
    projectManager: "Ana Rodríguez",
    contactEmail: "ana.rodriguez@inversiones.cl",
    status: "activo",
    progress: 68,
    budget: 2450000000,
    startDate: "2024-01-15",
    endDate: "2024-12-30"
  };

  // Estados de pago simulados
  const [paymentStates] = useState([
    {
      id: 1,
      month: "Enero 2024",
      status: "aprobado",
      amount: 28000000,
      dueDate: "2024-01-30",
      uploadedDocs: 6,
      totalDocs: 6
    },
    {
      id: 2,
      month: "Febrero 2024", 
      status: "aprobado",
      amount: 32000000,
      dueDate: "2024-02-28",
      uploadedDocs: 6,
      totalDocs: 6
    },
    {
      id: 3,
      month: "Marzo 2024",
      status: "aprobado", 
      amount: 29500000,
      dueDate: "2024-03-30",
      uploadedDocs: 6,
      totalDocs: 6
    },
    {
      id: 4,
      month: "Abril 2024",
      status: "pendiente",
      amount: 31000000,
      dueDate: "2024-04-30",
      uploadedDocs: 4,
      totalDocs: 6
    },
    {
      id: 5,
      month: "Mayo 2024",
      status: "pendiente",
      amount: 28000000,
      dueDate: "2024-05-30",
      uploadedDocs: 5,
      totalDocs: 6
    }
  ]);

  // Filtrar estados de pago
  const filteredPaymentStates = paymentStates.filter(state => {
    const matchesSearch = state.month.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || state.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (sortOrder === 'recent') {
      return b.id - a.id;
    } else if (sortOrder === 'oldest') {
      return a.id - b.id;
    } else if (sortOrder === 'amount-high') {
      return b.amount - a.amount;
    } else if (sortOrder === 'amount-low') {
      return a.amount - b.amount;
    }
    return 0;
  });

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
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rechazado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleAddExtraordinaryState = () => {
    toast({
      title: "Estado Extraordinario",
      description: "Funcionalidad próximamente disponible",
    });
  };

  const totalAmount = paymentStates.reduce((sum, state) => sum + state.amount, 0);
  const approvedAmount = paymentStates
    .filter(state => state.status === 'aprobado')
    .reduce((sum, state) => sum + state.amount, 0);

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      {/* Header */}
      <header className="bg-gloster-white border-b border-gloster-gray/20 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
                alt="Gloster Logo" 
                className="w-8 h-8"
              />
              <h1 className="text-xl font-bold text-slate-800 font-rubik">{project.name}</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gloster-gray">
                <span className="font-rubik">Constructora ABC Ltda.</span>
              </div>
              <Button variant="ghost" size="sm" className="text-gloster-gray hover:text-slate-800 font-rubik">
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

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
        {/* Banner de Información del Proyecto */}
        <Card className="mb-8 border-l-4 border-l-gloster-yellow hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-rubik text-slate-800">Información del Proyecto</CardTitle>
            <CardDescription className="text-gloster-gray font-rubik">
              Detalles generales y resumen financiero
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Mandante</p>
                  <p className="font-semibold text-slate-800 font-rubik">{project.mandante}</p>
                </div>
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Contratista</p>
                  <p className="font-semibold text-slate-800 font-rubik">{project.contractor}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Ubicación</p>
                  <p className="font-semibold text-slate-800 font-rubik flex items-center space-x-1">
                    <MapPin className="h-4 w-4 text-gloster-gray" />
                    <span>{project.location}</span>
                  </p>
                </div>
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Project Manager</p>
                  <p className="font-semibold text-slate-800 font-rubik flex items-center space-x-1">
                    <User className="h-4 w-4 text-gloster-gray" />
                    <span>{project.projectManager}</span>
                  </p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Presupuesto Total</p>
                  <p className="font-bold text-lg text-slate-800 font-rubik">{formatCurrency(project.budget)}</p>
                </div>
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Monto Aprobado</p>
                  <p className="font-bold text-lg text-green-600 font-rubik">{formatCurrency(approvedAmount)}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Progreso</p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gloster-yellow h-2 rounded-full transition-all duration-300"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="font-semibold text-slate-800 font-rubik text-sm">{project.progress}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Estados de Pago</p>
                  <p className="font-semibold text-slate-800 font-rubik">{paymentStates.length} registrados</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Banner de Controles - Una fila justificada */}
        <Card className="mb-6 border-gloster-gray/20">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gloster-gray h-4 w-4" />
                  <Input
                    placeholder="Buscar por período..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 font-rubik border-gloster-gray/30"
                  />
                </div>
                
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className="w-full sm:w-44 font-rubik border-gloster-gray/30">
                    <ArrowUpDown className="h-4 w-4 mr-2 text-gloster-gray" />
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Más reciente</SelectItem>
                    <SelectItem value="oldest">Más antiguo</SelectItem>
                    <SelectItem value="amount-high">Monto mayor</SelectItem>
                    <SelectItem value="amount-low">Monto menor</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 font-rubik border-gloster-gray/30">
                    <Filter className="h-4 w-4 mr-2 text-gloster-gray" />
                    <SelectValue placeholder="Filtrar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="aprobado">Aprobados</SelectItem>
                    <SelectItem value="pendiente">Pendientes</SelectItem>
                    <SelectItem value="rechazado">Rechazados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button
                onClick={handleAddExtraordinaryState}
                className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Estado Extraordinario
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Estados de Pago */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-800 font-rubik">Estados de Pago ({filteredPaymentStates.length})</h2>
          
          {filteredPaymentStates.map((state) => (
            <Card 
              key={state.id} 
              className="border-gloster-gray/20 hover:shadow-lg transition-all duration-200 cursor-pointer"
              onClick={() => navigate(`/payment/${state.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                      <h3 className="text-lg font-bold text-slate-800 font-rubik">{state.month}</h3>
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(state.status)} font-rubik w-fit`}
                      >
                        {state.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <p className="text-gloster-gray text-sm font-rubik">Monto</p>
                        <p className="font-bold text-slate-800 font-rubik">{formatCurrency(state.amount)}</p>
                      </div>
                      <div>
                        <p className="text-gloster-gray text-sm font-rubik">Fecha de Vencimiento</p>
                        <p className="font-medium text-slate-800 font-rubik">{state.dueDate}</p>
                      </div>
                      <div>
                        <p className="text-gloster-gray text-sm font-rubik">Documentos</p>
                        <p className="font-medium text-slate-800 font-rubik">
                          {state.uploadedDocs}/{state.totalDocs} completados
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end">
                    <div className="text-right">
                      <div className="w-8 h-8 bg-gloster-yellow/20 rounded-full flex items-center justify-center">
                        <ArrowLeft className="h-4 w-4 text-gloster-gray rotate-180" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredPaymentStates.length === 0 && (
            <Card className="border-gloster-gray/20">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gloster-gray mx-auto mb-3" />
                <p className="text-gloster-gray font-rubik">No se encontraron estados de pago que coincidan con los filtros.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
