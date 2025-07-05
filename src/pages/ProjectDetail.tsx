import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Calendar, ChevronRight, Search, Filter, Plus, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';
import PaymentStatusDebugger from '@/components/PaymentStatusDebugger';
import { useProjectDetail } from '@/hooks/useProjectDetail';

const ProjectDetail = () => {
  console.log('🎨 ProjectDetail component rendering...');
  
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('month');
  const [filterBy, setFilterBy] = useState('all');
  
  console.log('📊 Project ID from params:', id);
  
  const { project, loading } = useProjectDetail(id || '');

  // Log project data whenever it changes
  React.useEffect(() => {
    console.log('🔄 Project data changed:', project?.EstadosPago?.length || 0, 'payment states');
    if (project?.EstadosPago) {
      project.EstadosPago.forEach((payment, index) => {
        console.log(`📋 [${index}] "${payment.Name}" status: "${payment.Status}"`);
      });
    }
  }, [project]);

  const formatCurrency = (amount: number, currency: string = 'CLP') => {
    const currencyMap: { [key: string]: Intl.NumberFormatOptions } = {
      'CLP': { style: 'currency' as const, currency: 'CLP', minimumFractionDigits: 0 },
      'USD': { style: 'currency' as const, currency: 'USD', minimumFractionDigits: 0 },
      'UF': { style: 'decimal' as const, minimumFractionDigits: 2 }
    };

    const config = currencyMap[currency] || currencyMap.CLP;
    
    if (currency === 'UF') {
      return `UF ${new Intl.NumberFormat('es-CL', config).format(amount)}`;
    }
    
    return new Intl.NumberFormat('es-CL', config).format(amount);
  };

  const getPaymentStatus = (payment: any) => {
    const dbStatus = payment.Status;
    console.log(`📋 getPaymentStatus for "${payment.Name}": "${dbStatus}"`);
    return dbStatus || 'Sin Estado';
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    
    switch (normalizedStatus) {
      case 'aprobado':
        return 'bg-green-100 text-green-700';
      case 'pendiente':
        return 'bg-gloster-yellow/20 text-gloster-gray';
      case 'programado':
        return 'bg-blue-100 text-blue-700';
      case 'enviado':
        return 'bg-orange-100 text-orange-700';
      case 'rechazado':
        return 'bg-red-100 text-red-700';
      case 'en progreso':
        return 'bg-gloster-yellow/20 text-gloster-gray';
      case 'sin estado':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getProjectProgress = () => {
    if (!project?.EstadosPago || project.EstadosPago.length === 0) return 0;
    
    const totalPayments = project.EstadosPago.length;
    const completedPayments = project.EstadosPago.filter(payment => 
      payment.Completion === true
    ).length;
    
    return Math.round((completedPayments / totalPayments) * 100);
  };

  const getPaidValue = () => {
    if (!project?.EstadosPago || project.EstadosPago.length === 0) return 0;
    
    return project.EstadosPago
      .filter(payment => payment.Completion === true)
      .reduce((sum, payment) => sum + (payment.Total || 0), 0);
  };

  const handleAddExtraordinaryPayment = () => {
    toast({
      title: "Función en desarrollo",
      description: "La funcionalidad para agregar estados de pago extraordinarios estará disponible pronto",
    });
  };

  const handlePaymentClick = (payment: any) => {
    const status = getPaymentStatus(payment);
    console.log(`🖱️ Payment clicked: "${payment.Name}" with status: "${status}"`);
    
    if (status === 'Programado') {
      toast({
        title: "Estado programado",
        description: "Este estado de pago aún no está disponible para gestionar",
        variant: "destructive",
      });
      return;
    }
    
    navigate(`/payment/${payment.id}`);
  };

  const handleViewDocuments = (payment: any) => {
    console.log(`👁️ View documents clicked for: "${payment.Name}"`);
    navigate(`/payment/${payment.id}`);
  };

  const filteredAndSortedPayments = project?.EstadosPago
    ? project.EstadosPago
        .filter(payment => {
          const matchesSearch = payment.Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                               payment.Mes?.toLowerCase().includes(searchTerm.toLowerCase());
          const status = getPaymentStatus(payment);
          const matchesFilter = filterBy === 'all' || status.toLowerCase() === filterBy.toLowerCase();
          return matchesSearch && matchesFilter;
        })
        .sort((a, b) => {
          switch (sortBy) {
            case 'month':
              return new Date(b.ExpiryDate).getTime() - new Date(a.ExpiryDate).getTime();
            case 'amount':
              const amountA = a.Total || 0;
              const amountB = b.Total || 0;
              return amountB - amountA;
            case 'status':
              const statusA = getPaymentStatus(a);
              const statusB = getPaymentStatus(b);
              return statusA.localeCompare(statusB);
            default:
              return 0;
          }
        })
    : [];

  if (loading) {
    console.log('⏳ Component is loading...');
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <PageHeader />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">Cargando proyecto...</div>
        </div>
      </div>
    );
  }

  if (!project) {
    console.log('❌ No project data available');
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <PageHeader />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-gloster-gray">Proyecto no encontrado o no tienes acceso a él.</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Volver al Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const progress = getProjectProgress();
  const paidValue = getPaidValue();

  console.log('🏗️ Rendering ProjectDetail with', project.EstadosPago?.length || 0, 'payment states');

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <PageHeader />
      
      {/* Debugger component */}
      <PaymentStatusDebugger projectId={id || ''} />

      {/* Volver al Dashboard */}
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
                <CardTitle className="text-2xl mb-2 font-rubik text-slate-800">{project.Name}</CardTitle>
                <CardDescription className="text-gloster-gray text-base font-rubik">
                  {project.Description}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-gloster-gray/20 text-gloster-gray border-gloster-gray/30 font-rubik self-start">
                {project.Status ? 'activo' : 'inactivo'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Mandante</p>
                  <p className="font-semibold text-slate-800 font-rubik break-words">{project.Owner?.CompanyName}</p>
                </div>
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Contratista</p>
                  <p className="font-semibold text-slate-800 font-rubik break-words">{project.Contratista?.CompanyName}</p>
                </div>
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Ubicación</p>
                  <p className="font-semibold text-slate-800 font-rubik">{project.Location}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Valor Total</p>
                  <p className="font-semibold text-slate-800 font-rubik text-sm md:text-base">
                    {formatCurrency(project.Budget || 0, project.Currency || 'CLP')}
                  </p>
                </div>
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Progreso</p>
                  <div className="flex items-center space-x-2">
                    <Progress value={progress} className="flex-1 bg-gloster-gray/20 [&>div]:bg-gloster-yellow" />
                    <span className="font-semibold text-sm text-slate-800 font-rubik">{progress}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Total Pagado</p>
                  <p className="font-semibold text-green-600 font-rubik">{formatCurrency(paidValue, project.Currency || 'CLP')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estados de Pago */}
        <div className="space-y-6">
          <h3 className="text-2xl font-bold text-slate-800 mb-6 font-rubik">Estados de Pago</h3>
          
          {/* Search, Filter and Sort Controls */}
          <div className="mb-6 p-4 bg-white rounded-lg border border-gloster-gray/20">
            <div className="flex items-center gap-4 w-full">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gloster-gray h-4 w-4" />
                <Input
                  placeholder="Buscar estados de pago..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 font-rubik"
                />
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 font-rubik">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="month">Fecha</SelectItem>
                  <SelectItem value="amount">Monto</SelectItem>
                  <SelectItem value="status">Estado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-44 font-rubik">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="aprobado">Aprobado</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="programado">Programado</SelectItem>
                  <SelectItem value="enviado">Enviado</SelectItem>
                  <SelectItem value="rechazado">Rechazado</SelectItem>
                  <SelectItem value="en progreso">En Progreso</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={handleAddExtraordinaryPayment}
                className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-semibold font-rubik whitespace-nowrap"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Estado Extraordinario
              </Button>
            </div>
          </div>
          
          {filteredAndSortedPayments.length === 0 ? (
            <Card className="p-8 text-center">
              <CardContent>
                <p className="text-gloster-gray font-rubik">No hay estados de pago para este proyecto.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedPayments.map((payment) => {
                const status = getPaymentStatus(payment);
                console.log(`🔄 Rendering payment card: "${payment.Name}" with status: "${status}"`);
                
                return (
                  <Card 
                    key={payment.id} 
                    className={`hover:shadow-xl transition-all duration-300 border-gloster-gray/20 hover:border-gloster-gray/50 h-full ${
                      status === 'Programado' ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <CardContent className="p-4 md:p-6 h-full flex flex-col">
                      <div className="space-y-4 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className="w-10 h-10 bg-gloster-yellow/20 rounded-lg flex items-center justify-center shrink-0">
                              <Calendar className="h-5 w-5 text-gloster-gray" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-slate-800 font-rubik text-sm md:text-base">
                                {payment.Name}
                              </h4>
                              <p className="text-gloster-gray text-xs md:text-sm font-rubik">
                                {payment.Mes} {payment.Año}
                              </p>
                              <p className="text-gloster-gray text-xs md:text-sm font-rubik">
                                Vencimiento: {new Date(payment.ExpiryDate).toLocaleDateString('es-CL')}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className={`${getStatusColor(status)} text-xs shrink-0`}>
                            {status}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-gloster-gray text-xs md:text-sm font-rubik">Monto:</span>
                            <span className="font-semibold text-slate-800 font-rubik text-xs md:text-sm">
                              {payment.Total ? formatCurrency(payment.Total, project.Currency || 'CLP') : 'Sin monto definido'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-auto">
                        {(status === 'Pendiente' || status === 'En Progreso') && (
                          <Button
                            onClick={() => handlePaymentClick(payment)}
                            className="w-full bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-semibold font-rubik"
                            size="sm"
                          >
                            Gestionar Documentos
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        )}
                        
                        {(status === 'Aprobado' || status === 'Enviado' || status === 'Rechazado') && (
                          <Button
                            variant="outline"
                            onClick={() => handleViewDocuments(payment)}
                            className="w-full border-gloster-gray/30 hover:bg-gloster-gray/10 font-rubik"
                            size="sm"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Documentos
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        )}
                        
                        {status === 'Programado' && (
                          <Button variant="ghost" disabled className="w-full font-rubik" size="sm">
                            Programado
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
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
                  <p className="font-medium font-rubik">
                    {project.StartDate ? new Date(project.StartDate).toLocaleDateString('es-CL') : 'No definida'}
                  </p>
                </div>
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Duración (meses)</p>
                  <p className="font-medium font-rubik">{project.Duration || 'No definida'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Contacto Mandante</p>
                  <p className="font-medium font-rubik">{project.Owner?.ContactName}</p>
                  <p className="font-medium font-rubik break-words text-sm">{project.Owner?.ContactEmail}</p>
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
