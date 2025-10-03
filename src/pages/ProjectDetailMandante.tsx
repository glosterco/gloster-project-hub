import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Calendar, Search, Eye, Settings, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';
import { useProjectDetailMandante } from '@/hooks/useProjectDetailMandante';
import { useContractorNotification } from '@/hooks/useContractorNotification';
import { formatCurrency } from '@/utils/currencyUtils';
import { useAdicionales } from '@/hooks/useAdicionales';
import { AdicionalesCards } from '@/components/AdicionalesCards';
import { AdicionalesDetailModal } from '@/components/AdicionalesDetailModal';

const ProjectDetailMandante = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('month');
  const [filterBy, setFilterBy] = useState('all');
  const [selectedAdicional, setSelectedAdicional] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { adicionales, loading: adicionalesLoading } = useAdicionales(id || '');
  
  const handleCardClick = (adicional: any) => {
    setSelectedAdicional(adicional);
    setShowDetailModal(true);
  };
  
  const { project, loading, refetch, mandante } = useProjectDetailMandante(id || '');
  const { sendContractorPaymentNotification, loading: notificationLoading } = useContractorNotification();
  
  // Check if Adicionales feature is enabled for this mandante
  const adicionalesEnabled = mandante?.Adicionales === true;

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
            <p>Proyecto no encontrado</p>
            <Button onClick={() => navigate('/dashboard-mandante')} className="mt-4">
              Volver al Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <PageHeader />
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard-mandante')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold text-slate-800 font-rubik">{project.Name}</h1>
        </div>

        {/* Project Progress Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="font-rubik">Progreso del Proyecto</CardTitle>
            <CardDescription className="font-rubik">
              {getApprovedValue() > 0 
                ? `${formatCurrency(getApprovedValue(), project.Currency)} de ${formatCurrency(project.Budget, project.Currency)} aprobados`
                : `Presupuesto: ${formatCurrency(project.Budget, project.Currency)}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={getProjectProgress()} className="h-3" />
            <p className="text-sm text-gloster-gray mt-2 font-rubik">{getProjectProgress()}% completado</p>
          </CardContent>
        </Card>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gloster-gray h-4 w-4" />
            <Input
              placeholder="Buscar estados de pago..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 font-rubik"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48 font-rubik">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              <SelectItem value="month" className="font-rubik">Por mes</SelectItem>
              <SelectItem value="amount" className="font-rubik">Por monto</SelectItem>
              <SelectItem value="status" className="font-rubik">Por estado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-full md:w-48 font-rubik">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent className="bg-white z-50">
              <SelectItem value="all" className="font-rubik">Todos</SelectItem>
              <SelectItem value="pendiente" className="font-rubik">Pendiente</SelectItem>
              <SelectItem value="enviado" className="font-rubik">Recibido</SelectItem>
              <SelectItem value="aprobado" className="font-rubik">Aprobado</SelectItem>
              <SelectItem value="rechazado" className="font-rubik">Rechazado</SelectItem>
              <SelectItem value="programado" className="font-rubik">Programado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Payment States Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedPayments.map((payment) => {
            const status = getPaymentStatus(payment);
            const displayStatus = getDisplayStatus(status);
            
            return (
              <Card key={payment.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg font-rubik">{payment.Name}</CardTitle>
                    <Badge className={getStatusColor(displayStatus)}>
                      {displayStatus}
                    </Badge>
                  </div>
                  <CardDescription className="font-rubik">
                    {payment.Mes} {payment.Año}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gloster-gray font-rubik">Monto:</span>
                      <span className="font-semibold font-rubik">
                        {formatCurrency(payment.Total || 0, project.Currency)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gloster-gray font-rubik">Vencimiento:</span>
                      <span className="text-sm font-rubik">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {new Date(payment.ExpiryDate).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                      {canViewPayment(status) && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handlePaymentAction(payment, 'view')}
                          className="flex-1 font-rubik"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                      )}
                      
                      {canManagePayment(status) && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => handlePaymentAction(payment, 'manage')}
                          className="flex-1 font-rubik"
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Gestionar
                        </Button>
                      )}
                      
                      {shouldShowNotifyButton(payment) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleNotifyContractor(payment)}
                                disabled={notificationLoading}
                                className="flex-1 font-rubik"
                              >
                                <Bell className="h-4 w-4 mr-1" />
                                Notificar
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-white border border-gloster-gray/20 shadow-lg">
                              <p className="font-rubik text-sm">Notificar al contratista sobre este pago</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredAndSortedPayments.length === 0 && (
          <div className="text-center py-8 text-gloster-gray font-rubik">
            No se encontraron estados de pago
          </div>
        )}
        
        {/* Adicionales Section - Only show if enabled */}
        {adicionalesEnabled && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-slate-800 font-rubik mb-4">Adicionales</h2>
            <AdicionalesCards 
              adicionales={adicionales}
              loading={adicionalesLoading}
              currency={project?.Currency}
              onCardClick={handleCardClick}
            />
          </div>
        )}
      </div>

      {/* Modal de Detalle */}
      <AdicionalesDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        adicional={selectedAdicional}
        currency={project?.Currency}
      />
    </div>
  );
};

export default ProjectDetailMandante;