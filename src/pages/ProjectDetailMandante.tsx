import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Calendar, Search, Filter, Eye, Settings, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';
import { useProjectDetailMandante } from '@/hooks/useProjectDetailMandante';
import { useContractorNotification } from '@/hooks/useContractorNotification';
import { formatCurrency } from '@/utils/currencyUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdicionales } from '@/hooks/useAdicionales';
import { AdicionalesCards } from '@/components/AdicionalesCards';

const ProjectDetailMandante = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('month');
  const [filterBy, setFilterBy] = useState('all');
  const [activeTab, setActiveTab] = useState('estados-pago');
  const { adicionales, loading: adicionalesLoading } = useAdicionales(id || '');
  
  useEffect(() => {
    if (activeTab === 'estados-pago' && adicionales.length > 0) {
      setActiveTab('adicionales');
    }
  }, [adicionales]);
  
  const { project, loading, refetch, mandante } = useProjectDetailMandante(id || '');
  const { sendContractorPaymentNotification, loading: notificationLoading } = useContractorNotification();

  const getPaymentStatus = (payment: any) => {
    return payment.Status || 'Sin Estado';
  };

  const getDisplayStatus = (status: string) => {
    switch (status) {
      case 'Enviado':
        return 'Recibido';
      case 'Aprobado':
        return 'Aprobado';
      case 'Rechazado':
        return 'Rechazado';
      case 'Pendiente':
        return 'Pendiente'; // ✅ CORREGIDO: Mostrar como "Pendiente" no "Programado"
      case 'Programado':
        return 'Programado';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    
    switch (normalizedStatus) {
      case 'aprobado':
        return 'bg-green-100 text-green-700';
      case 'pendiente':
        return 'bg-blue-100 text-blue-700';
      case 'programado':
        return 'bg-blue-100 text-blue-700';
      case 'enviado':
        return 'bg-orange-100 text-orange-700';
      case 'rechazado':
        return 'bg-red-100 text-red-700';
      case 'sin estado':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getProjectProgress = () => {
    if (!project?.EstadosPago || project.EstadosPago.length === 0 || !project.Budget) return 0;
    
    const approvedAmount = project.EstadosPago
      .filter(payment => payment.Status === 'Aprobado')
      .reduce((sum, payment) => sum + (payment.Total || 0), 0);
    
    return Math.round((approvedAmount / project.Budget) * 100);
  };

  const getApprovedValue = () => {
    if (!project?.EstadosPago || project.EstadosPago.length === 0) return 0;
    
    return project.EstadosPago
      .filter(payment => payment.Status === 'Aprobado')
      .reduce((sum, payment) => sum + (payment.Total || 0), 0);
  };

  const handlePaymentAction = (payment: any, action: 'view' | 'manage') => {
    // CRÍTICO: Solo mandantes autenticados (con user_auth_id) pueden acceder desde project-mandante
    const accessData = {
      paymentId: payment.id.toString(),
      token: 'mandante_authenticated',
      userType: 'mandante',
      hasFullAccess: true, // Usuario autenticado con acceso completo
      isLimitedAccess: false,
      timestamp: Date.now()
    };
    sessionStorage.setItem('mandanteAccess', JSON.stringify(accessData));
    navigate(`/submission/${payment.id}`);
  };

  const canViewPayment = (status: string) => {
    // Solo para estados aprobados y rechazados se muestra el botón "Ver"
    return status === 'Aprobado' || status === 'Rechazado';
  };

  const canManagePayment = (status: string) => {
    // Solo para estados "Enviado" (que se muestran como "Recibido" al mandante) se muestra "Gestionar"
    return status === 'Enviado';
  };

  // ✅ FUNCIÓN CORREGIDA: Obtener el estado de pago más cercano a notificar (solo el más cercano)
  const getClosestPaymentToNotify = () => {
    if (!project?.EstadosPago) return null;
    
    console.log('🔍 Verificando pagos para notificación:', project.EstadosPago);
    
    const eligiblePayments = project.EstadosPago.filter((payment: any) => {
      const eligibleStatuses = ['Pendiente', 'Programado'];
      const hasUrl = Boolean(payment.URLContratista);
      const isEligible = eligibleStatuses.includes(payment.Status) && hasUrl;
      
      console.log(`💰 Pago ${payment.id}: Status=${payment.Status}, URLContratista=${hasUrl ? 'SÍ' : 'NO'}, Elegible=${isEligible}`);
      return isEligible;
    });
    
    console.log('📋 Pagos elegibles para notificación:', eligiblePayments.length);
    
    if (eligiblePayments.length === 0) return null;
    
    // Ordenar por fecha de vencimiento más cercana
    const sortedPayments = eligiblePayments.sort((a, b) => 
      new Date(a.ExpiryDate).getTime() - new Date(b.ExpiryDate).getTime()
    );
    
    console.log('🎯 Pago más cercano para notificar:', sortedPayments[0]);
    return sortedPayments[0]; // Solo el más cercano
  };

  // ✅ FUNCIÓN CORREGIDA: Notificar contratista
  const handleNotifyContractor = async (payment: any) => {
    console.log('🔔 Iniciando notificación para pago:', payment.id);
    await sendContractorPaymentNotification(payment.id, false); // false = notificación manual
  };

  // ✅ FUNCIÓN CORREGIDA: Determinar si debe mostrarse el botón notificar (solo en el pago más cercano)
  const shouldShowNotifyButton = (payment: any) => {
    const closestPayment = getClosestPaymentToNotify();
    const shouldShow = closestPayment && closestPayment.id === payment.id;
    console.log(`🔔 ¿Mostrar botón notificar para pago ${payment.id}?`, shouldShow ? 'SÍ' : 'NO');
    return shouldShow;
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
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <PageHeader />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-gloster-gray">Proyecto no encontrado o no tienes acceso a él.</p>
            <Button onClick={() => navigate('/dashboard-mandante')} className="mt-4">
              Volver al Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const progress = getProjectProgress();
  const approvedValue = getApprovedValue();

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <PageHeader />

      {/* Volver al Dashboard */}
      <div className="bg-slate-50 py-2">
        <div className="container mx-auto px-6">
          <button 
            onClick={() => navigate('/dashboard-mandante')}
            className="text-gloster-gray hover:text-slate-800 text-sm font-rubik flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Project Banner Card */}
        <Card className="mb-6 border-l-4 border-l-gloster-yellow hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2 font-rubik text-slate-800">{project.Name}</CardTitle>
                <CardDescription className="text-gloster-gray text-base font-rubik">
                  {project.Description}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-gloster-yellow/20 text-gloster-gray border-gloster-yellow/30 font-rubik self-start">
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
                  <p className="text-gloster-gray text-sm font-rubik">Total Aprobado</p>
                  <p className="font-semibold text-green-600 font-rubik">{formatCurrency(approvedValue, project.Currency || 'CLP')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estados de Pago - Con pestañas si tiene adicionales */}
        <div className="space-y-6">
          {((mandante as any)?.Adicionales === true) ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-1">
                <TabsTrigger 
                  value="estados-pago" 
                  className="font-rubik font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                >
                  Estados de Pago
                </TabsTrigger>
                <TabsTrigger 
                  value="adicionales" 
                  className="font-rubik font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                >
                  Adicionales
                </TabsTrigger>
              </TabsList>
              <TabsContent value="estados-pago" className="space-y-6">
                {/* Contenido de Estados de Pago */}
          
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
                        <SelectItem value="enviado">Recibido</SelectItem>
                        <SelectItem value="rechazado">Rechazado</SelectItem>
                        <SelectItem value="pendiente">Pendiente</SelectItem>
                        <SelectItem value="programado">Programado</SelectItem>
                      </SelectContent>
                    </Select>
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
                      const displayStatus = getDisplayStatus(status);
                      
                      return (
                        <Card 
                          key={payment.id} 
                          className="hover:shadow-xl transition-all duration-300 border-gloster-gray/20 hover:border-gloster-yellow/50 h-full"
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
                                  {displayStatus}
                                </Badge>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-gloster-gray text-xs md:text-sm font-rubik">Monto:</span>
                                  <span className="font-bold text-slate-800 text-sm md:text-base font-rubik">
                                    {formatCurrency(payment.Total || 0, project.Currency || 'CLP')}
                                  </span>
                                </div>
                                
                              </div>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="mt-4 pt-4 border-t border-gloster-gray/20">
                              <div className="flex gap-2 mb-2">
                                {canViewPayment(status) && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handlePaymentAction(payment, 'view')}
                                          className="flex-1 border-gloster-yellow text-gloster-gray hover:bg-gloster-yellow/10"
                                        >
                                          <Eye className="h-4 w-4 mr-1" />
                                          Ver
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Ver los documentos enviados por el contratista para este estado de pago</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                
                                {canManagePayment(status) && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          onClick={() => handlePaymentAction(payment, 'manage')}
                                          className="flex-1 bg-gloster-yellow hover:bg-gloster-yellow/90 text-black"
                                        >
                                          <Settings className="h-4 w-4 mr-1" />
                                          Gestionar
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Gestionar la aprobación o rechazo de este estado de pago</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                              
                              {shouldShowNotifyButton(payment) && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleNotifyContractor(payment)}
                                        disabled={notificationLoading}
                                        className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                                      >
                                        <Bell className="h-4 w-4 mr-1" />
                                        {notificationLoading ? 'Notificando...' : 'Notificar Contratista'}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Enviar notificación manual al contratista sobre este estado de pago pendiente</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="adicionales" className="mt-6">
                <AdicionalesCards 
                  adicionales={adicionales}
                  loading={adicionalesLoading}
                  currency={project?.Currency}
                />
              </TabsContent>
            </Tabs>
          ) : (
            <>
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
                      <SelectItem value="enviado">Recibido</SelectItem>
                      <SelectItem value="rechazado">Rechazado</SelectItem>
                      <SelectItem value="pendiente">Pendiente</SelectItem>
                      <SelectItem value="programado">Programado</SelectItem>
                    </SelectContent>
                  </Select>
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
                    const displayStatus = getDisplayStatus(status);
                    
                    return (
                      <Card 
                        key={payment.id} 
                        className="hover:shadow-xl transition-all duration-300 border-gloster-gray/20 hover:border-gloster-yellow/50 h-full"
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
                                {displayStatus}
                              </Badge>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-gloster-gray text-xs md:text-sm font-rubik">Monto:</span>
                                <span className="font-bold text-slate-800 text-sm md:text-base font-rubik">
                                  {formatCurrency(payment.Total || 0, project.Currency || 'CLP')}
                                </span>
                              </div>
                              
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="mt-4 pt-4 border-t border-gloster-gray/20">
                            <div className="flex gap-2 mb-2">
                              {canViewPayment(status) && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handlePaymentAction(payment, 'view')}
                                        className="flex-1 border-gloster-yellow text-gloster-gray hover:bg-gloster-yellow/10"
                                      >
                                        <Eye className="h-4 w-4 mr-1" />
                                        Ver
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Ver los documentos enviados por el contratista para este estado de pago</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                              
                              {canManagePayment(status) && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        onClick={() => handlePaymentAction(payment, 'manage')}
                                        className="flex-1 bg-gloster-yellow hover:bg-gloster-yellow/90 text-black"
                                      >
                                        <Settings className="h-4 w-4 mr-1" />
                                        Gestionar
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Gestionar la aprobación o rechazo de este estado de pago</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            
                            {shouldShowNotifyButton(payment) && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleNotifyContractor(payment)}
                                      disabled={notificationLoading}
                                      className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
                                    >
                                      <Bell className="h-4 w-4 mr-1" />
                                      {notificationLoading ? 'Notificando...' : 'Notificar Contratista'}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Enviar notificación manual al contratista sobre este estado de pago pendiente</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailMandante;