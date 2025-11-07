import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Calendar, Search, Eye, Settings, Bell, ChevronRight, Plus, Filter, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';
import { useProjectDetailMandante } from '@/hooks/useProjectDetailMandante';
import { useContractorNotification } from '@/hooks/useContractorNotification';
import { formatCurrency } from '@/utils/currencyUtils';
import { useAdicionales } from '@/hooks/useAdicionales';
import { AdicionalesCards } from '@/components/AdicionalesCards';
import { AdicionalesDetailModal } from '@/components/AdicionalesDetailModal';
import { AdicionalesForm } from '@/components/AdicionalesForm';
import { useDocumentos } from '@/hooks/useDocumentos';
import { useFotos } from '@/hooks/useFotos';
import { usePresupuesto } from '@/hooks/usePresupuesto';
import { useReuniones } from '@/hooks/useReuniones';
import { DocumentosTableWithSidebar } from '@/components/DocumentosTableWithSidebar';
import { FotosCards } from '@/components/FotosCards';
import { ReunionesCards } from '@/components/ReunionesCards';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProjectDocumentUpload } from '@/components/ProjectDocumentUpload';
import { ProjectPhotoUpload } from '@/components/ProjectPhotoUpload';
import { PresupuestoTable } from '@/components/PresupuestoTable';
import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';

const ProjectDetailMandante = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('month');
  const [filterBy, setFilterBy] = useState('all');
  const [activeTab, setActiveTab] = useState('estados-pago');
  const [selectedAdicional, setSelectedAdicional] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAdicionalesForm, setShowAdicionalesForm] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const { adicionales, loading: adicionalesLoading, refetch: refetchAdicionales } = useAdicionales(id || '');
  const { documentos, loading: documentosLoading, refetch: refetchDocumentos } = useDocumentos(id || '');
  const { fotos, loading: fotosLoading, refetch: refetchFotos } = useFotos(id || '');
  const { presupuesto, anticipos, retenciones, gastosGenerales, utilidad, loading: presupuestoLoading, refetch: refetchPresupuesto } = usePresupuesto(id || '');
  const { reuniones, loading: reunionesLoading } = useReuniones(id || '');
  
  // Estado para búsqueda de cada pestaña
  const [adicionalesSearch, setAdicionalesSearch] = useState('');
  const [documentosSearch, setDocumentosSearch] = useState('');
  const [fotosSearch, setFotosSearch] = useState('');
  const [presupuestoSearch, setPresupuestoSearch] = useState('');
  const [reunionesSearch, setReunionesSearch] = useState('');
  
  const handleCardClick = (adicional: any) => {
    setSelectedAdicional(adicional);
    setShowDetailModal(true);
  };
  
  const { project, loading, refetch, mandante } = useProjectDetailMandante(id || '');
  const { sendContractorPaymentNotification, loading: notificationLoading } = useContractorNotification();
  
  // Check which features are enabled for this mandante
  const adicionalesEnabled = mandante?.Adicionales === true;
  const documentosEnabled = mandante?.Documentos === true;
  const fotosEnabled = mandante?.Fotos === true;
  const presupuestoEnabled = mandante?.Presupuesto === true;
  const reunionesEnabled = mandante?.Reuniones === true;
  
  // Count how many tabs should be shown
  const hasAnyTab = adicionalesEnabled || documentosEnabled || fotosEnabled || presupuestoEnabled || reunionesEnabled;

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
              return new Date(a.ExpiryDate).getTime() - new Date(b.ExpiryDate).getTime();
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

  const progress = getProjectProgress();
  const approvedValue = getApprovedValue();

  const renderPaymentCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredAndSortedPayments.map((payment) => {
        const status = getPaymentStatus(payment);
        const displayStatus = getDisplayStatus(status);
        
        return (
          <Card 
            key={payment.id} 
            className="hover:shadow-xl transition-all duration-300 border-gloster-gray/20 hover:border-gloster-gray/50 h-full"
          >
            <CardContent className="p-4 md:p-6 h-full flex flex-col">
              <div className="space-y-4 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-gloster-gray/20 rounded-lg flex items-center justify-center shrink-0">
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
                  <Badge variant="secondary" className={`${getStatusColor(displayStatus)} text-xs shrink-0`}>
                    {displayStatus}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gloster-gray text-xs md:text-sm font-rubik">Monto:</span>
                    <span className="font-bold text-slate-800 text-sm md:text-base font-rubik">
                      {formatCurrency(payment.Total || 0, project.Currency)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-auto space-y-2">
                {canManagePayment(status) && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          onClick={() => handlePaymentAction(payment, 'manage')}
                          className="w-full bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-semibold font-rubik"
                          size="sm"
                        >
                          <Settings className="h-4 w-4 mr-2" />
                          Gestionar
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Aprobar o rechazar estado de pago</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {canViewPayment(status) && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline"
                          onClick={() => handlePaymentAction(payment, 'view')}
                          className="w-full border-gloster-gray/30 hover:bg-gloster-gray/10 font-rubik"
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ver detalles del estado de pago</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {shouldShowNotifyButton(payment) && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="outline" 
                          onClick={() => handleNotifyContractor(payment)}
                          disabled={notificationLoading}
                          className="w-full border-gloster-gray/30 hover:bg-gloster-gray/10 font-rubik"
                          size="sm"
                        >
                          <Bell className="h-4 w-4 mr-2" />
                          Notificar
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Notificar al contratista sobre este pago</p>
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
  );

  const renderControls = (
    searchValue: string,
    onSearchChange: (value: string) => void,
    buttonText: string,
    onButtonClick: () => void
  ) => (
    <div className="mb-6 p-4 bg-white rounded-lg border border-gloster-gray/20">
      <div className="flex items-center gap-4 w-full">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gloster-gray h-4 w-4" />
          <Input
            placeholder="Buscar..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
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
            <SelectItem value="enviado">Recibido</SelectItem>
            <SelectItem value="rechazado">Rechazado</SelectItem>
          </SelectContent>
        </Select>

        <Button 
          onClick={onButtonClick}
          className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-semibold font-rubik whitespace-nowrap"
        >
          <Plus className="h-4 w-4 mr-2" />
          {buttonText}
        </Button>
      </div>
    </div>
  );

  const renderPresupuestoControls = (
    searchValue: string,
    onSearchChange: (value: string) => void,
    onExportPDF: () => void,
    onExportExcel: () => void
  ) => (
    <div className="mb-6 p-4 bg-white rounded-lg border border-gloster-gray/20">
      <div className="flex items-center gap-4 w-full">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gloster-gray h-4 w-4" />
          <Input
            placeholder="Buscar..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
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
            <SelectItem value="enviado">Recibido</SelectItem>
            <SelectItem value="rechazado">Rechazado</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-semibold font-rubik whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-2" />
              Exportar Avance
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="font-rubik">
            <DropdownMenuItem onClick={onExportPDF} className="cursor-pointer">
              <FileText className="h-4 w-4 mr-2" />
              Exportar PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onExportExcel} className="cursor-pointer">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

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
                  <p className="text-gloster-gray text-sm font-rubik">Total Aprobado</p>
                  <p className="font-semibold text-green-600 font-rubik">{formatCurrency(approvedValue, project.Currency || 'CLP')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs System */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex flex-wrap gap-2 bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-1">
              <TabsTrigger 
                value="estados-pago" 
                className="font-rubik font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:font-semibold"
              >
                Estados de Pago
              </TabsTrigger>
              {adicionalesEnabled && (
                <TabsTrigger 
                  value="adicionales" 
                  className="font-rubik font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                >
                  Adicionales
                </TabsTrigger>
              )}
              {documentosEnabled && (
                <TabsTrigger 
                  value="documentos" 
                  className="font-rubik font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                >
                  Documentos
                </TabsTrigger>
              )}
              {fotosEnabled && (
                <TabsTrigger 
                  value="fotos" 
                  className="font-rubik font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                >
                  Fotos
                </TabsTrigger>
              )}
              {presupuestoEnabled && (
                <TabsTrigger 
                  value="presupuesto" 
                  className="font-rubik font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                >
                  Presupuesto
                </TabsTrigger>
              )}
              {reunionesEnabled && (
                <TabsTrigger 
                  value="reuniones" 
                  className="font-rubik font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                >
                  Reuniones
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="estados-pago" className="space-y-6">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-xl font-rubik">Estados de Pago</CardTitle>
                  <CardDescription className="font-rubik">
                    Gestiona y aprueba los estados de pago del proyecto
                  </CardDescription>
                </CardHeader>
              </Card>
              {renderControls(searchTerm, setSearchTerm, 'Estado Extraordinario', () => toast({ title: "Función en desarrollo" }))}
              {filteredAndSortedPayments.length === 0 ? (
                <Card className="p-8 text-center">
                  <CardContent>
                    <p className="text-gloster-gray font-rubik">No hay estados de pago para este proyecto.</p>
                  </CardContent>
                </Card>
              ) : (
                renderPaymentCards()
              )}
            </TabsContent>

            {adicionalesEnabled && (
              <TabsContent value="adicionales" className="space-y-6">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-xl font-rubik">Adicionales</CardTitle>
                    <CardDescription className="font-rubik">
                      Visualiza los adicionales del proyecto
                    </CardDescription>
                  </CardHeader>
                </Card>
                {renderControls(adicionalesSearch, setAdicionalesSearch, 'Nuevo Adicional', () => setShowAdicionalesForm(true))}
                <AdicionalesCards 
                  adicionales={adicionales}
                  loading={adicionalesLoading}
                  currency={project?.Currency}
                  onCardClick={handleCardClick}
                />
              </TabsContent>
            )}

            {documentosEnabled && (
              <TabsContent value="documentos" className="space-y-6">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-xl font-rubik">Documentos del Proyecto</CardTitle>
                    <CardDescription className="font-rubik">
                      Gestiona los documentos cargados para este proyecto
                    </CardDescription>
                  </CardHeader>
                </Card>
                {renderControls(documentosSearch, setDocumentosSearch, 'Cargar Documento', () => setShowDocumentUpload(true))}
                <DocumentosTableWithSidebar 
                  documentos={documentos}
                  loading={documentosLoading}
                  projectId={id || ''}
                />
              </TabsContent>
            )}

            <ProjectDocumentUpload
              projectId={parseInt(id || '0')}
              open={showDocumentUpload}
              onOpenChange={setShowDocumentUpload}
              onUploadComplete={refetchDocumentos}
            />

            {fotosEnabled && (
              <TabsContent value="fotos" className="space-y-6">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-xl font-rubik">Fotos del Proyecto</CardTitle>
                    <CardDescription className="font-rubik">
                      Visualiza las fotos cargadas para este proyecto
                    </CardDescription>
                  </CardHeader>
                </Card>
                {renderControls(fotosSearch, setFotosSearch, 'Cargar Foto', () => setShowPhotoUpload(true))}
                <FotosCards 
                  fotos={fotos}
                  loading={fotosLoading}
                />
              </TabsContent>
            )}

            {presupuestoEnabled && (
              <TabsContent value="presupuesto" className="space-y-6">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-xl font-rubik">Presupuesto del Proyecto</CardTitle>
                    <CardDescription className="font-rubik">
                      Visualiza y actualiza el desglose del presupuesto
                    </CardDescription>
                  </CardHeader>
                </Card>
                {renderPresupuestoControls(
                  presupuestoSearch,
                  setPresupuestoSearch,
                  async () => {
                    try {
                      // Calcular valores base
                      const subtotalCostoDirecto = presupuesto.reduce((sum, item) => sum + (item.Total || 0), 0);
                      const avanceAcumuladoTotal = presupuesto.reduce((sum, item) => {
                        const monto = (item.Total || 0) * ((item['Avance Acumulado'] || 0) / 100);
                        return sum + monto;
                      }, 0);
                      const avanceParcialTotal = presupuesto.reduce((sum, item) => {
                        const monto = (item.Total || 0) * ((item['Avance Parcial'] || 0) / 100);
                        return sum + monto;
                      }, 0);
                      
                      // Calcular avance acumulado anterior (total - parcial)
                      const avanceAcumuladoAnterior = presupuesto.reduce((sum, item) => {
                        const acumuladoAnterior = (item['Avance Acumulado'] || 0) - (item['Avance Parcial'] || 0);
                        const monto = (item.Total || 0) * (acumuladoAnterior / 100);
                        return sum + monto;
                      }, 0);
                      
                      // Gastos Generales y Utilidad
                      const montoGastosGeneralesParcial = avanceParcialTotal * (gastosGenerales / 100);
                      const montoUtilidadParcial = avanceParcialTotal * (utilidad / 100);
                      
                      // Subtotal (Costo Directo + GG + Utilidad)
                      const subtotal = avanceParcialTotal + montoGastosGeneralesParcial + montoUtilidadParcial;
                      
                      // Aplicar retenciones y anticipos (valores negativos)
                      const subtotalNeto = subtotal - (retenciones.actual || 0) - (anticipos.actual || 0);
                      
                      // IVA y Total
                      const ivaTotal = subtotalNeto * 0.19;
                      const totalFinal = subtotalNeto + ivaTotal;
                      
                      // Valores totales del contrato
                      const montoGastosGenerales = subtotalCostoDirecto * (gastosGenerales / 100);
                      const montoUtilidad = subtotalCostoDirecto * (utilidad / 100);
                      const valorTotalNeto = subtotalCostoDirecto + montoGastosGenerales + montoUtilidad;
                      const valorTotalIVA = valorTotalNeto * 0.19;
                      const valorTotalConIVA = valorTotalNeto + valorTotalIVA;
                      
                      // Calcular fecha fin del contrato
                      const fechaInicio = project?.StartDate ? new Date(project.StartDate) : new Date();
                      const fechaFin = new Date(fechaInicio);
                      fechaFin.setMonth(fechaFin.getMonth() + (project?.Duration || 0));
                      
                      // Calcular plazo en días entre fecha inicio y fecha fin
                      const plazoEnDias = Math.ceil((fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24));
                      
                      // Porcentaje de avance financiero
                      const porcentajeAvance = subtotalCostoDirecto > 0 
                        ? ((avanceAcumuladoTotal / subtotalCostoDirecto) * 100).toFixed(2)
                        : '0.00';

                      // Primera página - Resumen del Contrato y Período
                      const page1 = document.createElement('div');
                      page1.style.padding = '40px';
                      page1.style.fontFamily = 'Rubik, sans-serif';
                      page1.style.pageBreakAfter = 'always';
                      
                      page1.innerHTML = `
                        <div style="text-align: center; margin-bottom: 30px;">
                          <h1 style="color: #1F2937; margin-bottom: 10px; font-size: 26px; font-weight: bold;">Informe de Avance de Presupuesto</h1>
                          <h2 style="color: #6B7280; font-size: 18px;">${project?.Name || 'Proyecto'}</h2>
                        </div>
                        
                        <div style="margin-bottom: 35px; padding: 25px; background-color: #FFFBEB; border-radius: 8px; border-left: 4px solid #F5DF4D;">
                          <h3 style="color: #1F2937; margin-bottom: 20px; font-size: 18px; font-weight: bold;">Datos del Contrato</h3>
                          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                            <div>
                              <p style="color: #6B7280; font-size: 12px; margin-bottom: 5px;">Mandante</p>
                              <p style="color: #1F2937; font-size: 14px; font-weight: 600;">${project?.Owner?.CompanyName || '-'}</p>
                            </div>
                            <div>
                              <p style="color: #6B7280; font-size: 12px; margin-bottom: 5px;">Contratista</p>
                              <p style="color: #1F2937; font-size: 14px; font-weight: 600;">${project?.Contratista?.CompanyName || '-'}</p>
                            </div>
                            <div>
                              <p style="color: #6B7280; font-size: 12px; margin-bottom: 5px;">Fecha Inicio</p>
                              <p style="color: #1F2937; font-size: 14px; font-weight: 600;">${project?.StartDate ? new Date(project.StartDate).toLocaleDateString('es-CL') : '-'}</p>
                            </div>
                            <div>
                              <p style="color: #6B7280; font-size: 12px; margin-bottom: 5px;">Fin del Contrato</p>
                              <p style="color: #1F2937; font-size: 14px; font-weight: 600;">${fechaFin.toLocaleDateString('es-CL')}</p>
                            </div>
                            <div style="grid-column: 1 / -1;">
                              <p style="color: #6B7280; font-size: 12px; margin-bottom: 5px;">Plazo</p>
                              <p style="color: #1F2937; font-size: 14px; font-weight: 600;">${plazoEnDias} días corridos</p>
                            </div>
                          </div>
                          <div style="border-top: 2px solid #F5DF4D; padding-top: 15px;">
                            <div style="margin-bottom: 10px;">
                              <p style="color: #6B7280; font-size: 12px; margin-bottom: 5px;">Valor Total Costo Directo</p>
                              <p style="color: #1F2937; font-size: 16px; font-weight: 700;">${formatCurrency(subtotalCostoDirecto, project?.Currency)}</p>
                            </div>
                            <div style="margin-bottom: 10px;">
                              <p style="color: #6B7280; font-size: 12px; margin-bottom: 5px;">Valor Total Neto</p>
                              <p style="color: #1F2937; font-size: 16px; font-weight: 700;">${formatCurrency(valorTotalNeto, project?.Currency)}</p>
                            </div>
                            <div>
                              <p style="color: #6B7280; font-size: 12px; margin-bottom: 5px;">Valor Total IVA Incluido</p>
                              <p style="color: #1F2937; font-size: 18px; font-weight: 700;">${formatCurrency(valorTotalConIVA, project?.Currency)}</p>
                            </div>
                          </div>
                        </div>
                      `;

                      // Segunda página - Resumen del Período y Controles
                      const page2 = document.createElement('div');
                      page2.style.padding = '30px';
                      page2.style.fontFamily = 'Rubik, sans-serif';
                      page2.style.pageBreakAfter = 'always';
                      
                      page2.innerHTML = `
                        <div style="text-align: center; margin-bottom: 20px;">
                          <h1 style="color: #1F2937; margin-bottom: 5px; font-size: 20px; font-weight: bold;">Resumen del Período Actualizado</h1>
                        </div>
                        
                        <div style="margin-bottom: 18px;">
                          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 15px;">
                            <div style="padding: 10px; background-color: #F8FAFC; border-radius: 6px; border-left: 3px solid #6B7280;">
                              <p style="color: #6B7280; font-size: 11px; margin-bottom: 3px;">Fecha de Actualización</p>
                              <p style="color: #1F2937; font-size: 13px; font-weight: 600;">${new Date().toLocaleDateString('es-CL')}</p>
                            </div>
                            <div style="padding: 10px; background-color: #FFFBEB; border-radius: 6px; border-left: 3px solid #F5DF4D;">
                              <p style="color: #6B7280; font-size: 11px; margin-bottom: 3px;">Porcentaje de Avance Financiero</p>
                              <p style="color: #1F2937; font-size: 13px; font-weight: 700;">${porcentajeAvance}%</p>
                            </div>
                          </div>
                          
                          <table style="width: 100%; max-width: 700px; margin: 0 auto; border-collapse: collapse; font-size: 11px;">
                            <thead>
                              <tr style="background-color: #F5DF4D;">
                                <th style="padding: 8px; text-align: left; font-weight: 600; border: 1px solid #E5E7EB; width: 60%; color: #1F2937;">Concepto</th>
                                <th style="padding: 8px; text-align: right; font-weight: 600; border: 1px solid #E5E7EB; width: 40%; color: #1F2937;">Monto</th>
                              </tr>
                            </thead>
                            <tbody>
                              <!-- SECCIÓN: COSTO DIRECTO -->
                              <tr style="background-color: #FFFFFF;">
                                <td style="padding: 7px 8px; border: 1px solid #E5E7EB; color: #1F2937;">Avance Acumulado Actual - Costo Directo</td>
                                <td style="padding: 7px 8px; text-align: right; border: 1px solid #E5E7EB; color: #1F2937; font-weight: 600;">${formatCurrency(avanceAcumuladoTotal, project?.Currency)}</td>
                              </tr>
                              <tr style="background-color: #F8FAFC;">
                                <td style="padding: 7px 8px; border: 1px solid #E5E7EB; color: #6B7280;">Avance Acumulado Anterior - Costo Directo</td>
                                <td style="padding: 7px 8px; text-align: right; border: 1px solid #E5E7EB; color: #6B7280;">${formatCurrency(avanceAcumuladoAnterior, project?.Currency)}</td>
                              </tr>
                              <tr style="background-color: #FFFBEB;">
                                <td style="padding: 7px 8px; border: 1px solid #E5E7EB; border-bottom: 2px solid #F5DF4D; color: #1F2937; font-weight: 600;">Avance Parcial - Costo Directo</td>
                                <td style="padding: 7px 8px; text-align: right; border: 1px solid #E5E7EB; border-bottom: 2px solid #F5DF4D; color: #1F2937; font-weight: 700;">${formatCurrency(avanceParcialTotal, project?.Currency)}</td>
                              </tr>
                              
                              <!-- SECCIÓN: GASTOS GENERALES Y UTILIDAD -->
                              <tr style="background-color: #FFFFFF;">
                                <td style="padding: 7px 8px; border: 1px solid #E5E7EB; color: #6B7280;">Gastos Generales (${gastosGenerales.toFixed(1)}%)</td>
                                <td style="padding: 7px 8px; text-align: right; border: 1px solid #E5E7EB; color: #6B7280;">${formatCurrency(montoGastosGeneralesParcial, project?.Currency)}</td>
                              </tr>
                              <tr style="background-color: #F8FAFC;">
                                <td style="padding: 7px 8px; border: 1px solid #E5E7EB; border-bottom: 2px solid #F5DF4D; color: #6B7280;">Utilidad (${utilidad.toFixed(1)}%)</td>
                                <td style="padding: 7px 8px; text-align: right; border: 1px solid #E5E7EB; border-bottom: 2px solid #F5DF4D; color: #6B7280;">${formatCurrency(montoUtilidadParcial, project?.Currency)}</td>
                              </tr>
                              
                              <!-- SECCIÓN: SUBTOTALES -->
                              <tr style="background-color: #FFFBEB;">
                                <td style="padding: 8px; border: 1px solid #E5E7EB; color: #1F2937; font-weight: 700;">Subtotal</td>
                                <td style="padding: 8px; text-align: right; border: 1px solid #E5E7EB; color: #1F2937; font-weight: 700;">${formatCurrency(subtotal, project?.Currency)}</td>
                              </tr>
                              <tr style="background-color: #FFFFFF;">
                                <td style="padding: 7px 8px; border: 1px solid #E5E7EB; color: #6B7280;">Retenciones (${retenciones.total > 0 ? ((retenciones.actual / retenciones.total) * 100).toFixed(1) : '0.0'}%)</td>
                                <td style="padding: 7px 8px; text-align: right; border: 1px solid #E5E7EB; color: #6B7280;">-${formatCurrency(retenciones.actual || 0, project?.Currency)}</td>
                              </tr>
                              <tr style="background-color: #F8FAFC;">
                                <td style="padding: 7px 8px; border: 1px solid #E5E7EB; color: #6B7280;">Devolución Anticipo (${anticipos.total > 0 ? ((anticipos.actual / anticipos.total) * 100).toFixed(1) : '0.0'}%)</td>
                                <td style="padding: 7px 8px; text-align: right; border: 1px solid #E5E7EB; color: #6B7280;">-${formatCurrency(anticipos.actual || 0, project?.Currency)}</td>
                              </tr>
                              <tr style="background-color: #FFFFFF;">
                                <td style="padding: 8px; border: 1px solid #E5E7EB; border-top: 2px solid #6B7280; color: #1F2937; font-weight: 700;">Subtotal Neto</td>
                                <td style="padding: 8px; text-align: right; border: 1px solid #E5E7EB; border-top: 2px solid #6B7280; color: #1F2937; font-weight: 700;">${formatCurrency(subtotalNeto, project?.Currency)}</td>
                              </tr>
                              <tr style="background-color: #F8FAFC;">
                                <td style="padding: 7px 8px; border: 1px solid #E5E7EB; color: #6B7280;">IVA (19%)</td>
                                <td style="padding: 7px 8px; text-align: right; border: 1px solid #E5E7EB; color: #6B7280;">${formatCurrency(ivaTotal, project?.Currency)}</td>
                              </tr>
                              <tr style="background-color: #FFFBEB;">
                                <td style="padding: 10px 8px; border: 1px solid #E5E7EB; border-top: 3px solid #F5DF4D; color: #1F2937; font-weight: 800; font-size: 12px;">TOTAL</td>
                                <td style="padding: 10px 8px; text-align: right; border: 1px solid #E5E7EB; border-top: 3px solid #F5DF4D; color: #1F2937; font-weight: 800; font-size: 12px;">${formatCurrency(totalFinal, project?.Currency)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
                          <div style="padding: 12px; background-color: #FFFBEB; border-radius: 6px; border: 2px solid #F5DF4D;">
                            <h4 style="color: #1F2937; margin-bottom: 10px; font-size: 12px; font-weight: bold;">Control de Anticipos</h4>
                            <table style="width: 100%; font-size: 10px;">
                              <tr>
                                <td style="color: #6B7280; padding: 4px 0;">Total Anticipos:</td>
                                <td style="color: #1F2937; font-weight: 600; text-align: right;">${formatCurrency(anticipos.total || 0, project?.Currency)}</td>
                              </tr>
                              <tr>
                                <td style="color: #6B7280; padding: 4px 0;">Devolución Actual:</td>
                                <td style="color: #1F2937; font-weight: 600; text-align: right;">${formatCurrency(anticipos.actual || 0, project?.Currency)}</td>
                              </tr>
                              <tr>
                                <td style="color: #6B7280; padding: 4px 0;">Devolución Acumulada:</td>
                                <td style="color: #1F2937; font-weight: 600; text-align: right;">${formatCurrency(anticipos.acumulado || 0, project?.Currency)}</td>
                              </tr>
                              <tr style="border-top: 2px solid #F5DF4D;">
                                <td style="color: #1F2937; padding: 6px 0 0 0; font-weight: 700;">Saldo por Devolver:</td>
                                <td style="color: #1F2937; font-weight: 700; text-align: right; padding-top: 6px; font-size: 11px;">${formatCurrency((anticipos.total || 0) - (anticipos.acumulado || 0), project?.Currency)}</td>
                              </tr>
                            </table>
                          </div>
                          
                          <div style="padding: 12px; background-color: #F8FAFC; border-radius: 6px; border: 2px solid #6B7280;">
                            <h4 style="color: #1F2937; margin-bottom: 10px; font-size: 12px; font-weight: bold;">Control de Retenciones</h4>
                            <table style="width: 100%; font-size: 10px;">
                              <tr>
                                <td style="color: #6B7280; padding: 4px 0;">Total Retenciones:</td>
                                <td style="color: #1F2937; font-weight: 600; text-align: right;">${formatCurrency(retenciones.total || 0, project?.Currency)}</td>
                              </tr>
                              <tr>
                                <td style="color: #6B7280; padding: 4px 0;">Retención Actual:</td>
                                <td style="color: #1F2937; font-weight: 600; text-align: right;">${formatCurrency(retenciones.actual || 0, project?.Currency)}</td>
                              </tr>
                              <tr>
                                <td style="color: #6B7280; padding: 4px 0;">Retención Acumulada:</td>
                                <td style="color: #1F2937; font-weight: 600; text-align: right;">${formatCurrency(retenciones.acumulado || 0, project?.Currency)}</td>
                              </tr>
                              <tr style="border-top: 2px solid #6B7280;">
                                <td style="color: #1F2937; padding: 6px 0 0 0; font-weight: 700;">Saldo por Retener:</td>
                                <td style="color: #1F2937; font-weight: 700; text-align: right; padding-top: 6px; font-size: 11px;">${formatCurrency((retenciones.total || 0) - (retenciones.acumulado || 0), project?.Currency)}</td>
                              </tr>
                            </table>
                          </div>
                        </div>
                      `;

                      // Tercera página - Detalle completo
                      const page3 = document.createElement('div');
                      page3.style.padding = '40px';
                      page3.style.fontFamily = 'Rubik, sans-serif';
                      
                      page3.innerHTML = `
                        <h1 style="color: #1e293b; margin-bottom: 20px; font-size: 22px; font-weight: bold;">Detalle Completo del Presupuesto</h1>
                        <h2 style="color: #64748b; margin-bottom: 30px; font-size: 16px;">${project?.Name || 'Proyecto'}</h2>

                        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px;">
                          <thead>
                            <tr style="background-color: #f1f5f9; border-bottom: 2px solid #e2e8f0;">
                              <th style="padding: 8px; text-align: left; font-size: 10px; color: #64748b; font-weight: 600;">Ítem</th>
                              <th style="padding: 8px; text-align: center; font-size: 10px; color: #64748b; font-weight: 600;">Unidad</th>
                              <th style="padding: 8px; text-align: right; font-size: 10px; color: #64748b; font-weight: 600;">Cantidad</th>
                              <th style="padding: 8px; text-align: right; font-size: 10px; color: #64748b; font-weight: 600;">P.U.</th>
                              <th style="padding: 8px; text-align: right; font-size: 10px; color: #64748b; font-weight: 600;">Total</th>
                              <th style="padding: 8px; text-align: right; font-size: 10px; color: #64748b; font-weight: 600;">Avance Parcial</th>
                              <th style="padding: 8px; text-align: right; font-size: 10px; color: #64748b; font-weight: 600;">Avance Acum.</th>
                              <th style="padding: 8px; text-align: center; font-size: 10px; color: #64748b; font-weight: 600;">Última Act.</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${presupuesto.map((item, index) => `
                              <tr style="border-bottom: 1px solid #e2e8f0; ${index % 2 === 0 ? 'background-color: #ffffff;' : 'background-color: #f8fafc;'}">
                                <td style="padding: 8px; font-size: 10px; color: #1e293b;">${item.Item || '-'}</td>
                                <td style="padding: 8px; text-align: center; font-size: 10px; color: #64748b;">${item.Unidad || '-'}</td>
                                <td style="padding: 8px; text-align: right; font-size: 10px; color: #1e293b;">${item.Cantidad ? new Intl.NumberFormat('es-CL').format(item.Cantidad) : '-'}</td>
                                <td style="padding: 8px; text-align: right; font-size: 10px; color: #1e293b;">${item.PU ? formatCurrency(item.PU, project?.Currency) : '-'}</td>
                                <td style="padding: 8px; text-align: right; font-size: 10px; color: #1e293b; font-weight: 600;">${item.Total ? formatCurrency(item.Total, project?.Currency) : '-'}</td>
                                <td style="padding: 8px; text-align: right; font-size: 10px; color: #16a34a; font-weight: 500;">${item['Avance Parcial'] !== null ? item['Avance Parcial'] + '%' : '-'}</td>
                                <td style="padding: 8px; text-align: right; font-size: 10px; color: #1e293b; font-weight: 600;">${item['Avance Acumulado'] !== null ? item['Avance Acumulado'] + '%' : '-'}</td>
                                <td style="padding: 8px; text-align: center; font-size: 9px; color: #64748b;">${item['Ult. Actualizacion'] ? new Date(item['Ult. Actualizacion']).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-'}</td>
                              </tr>
                            `).join('')}
                             
                             <tr style="background-color: #f1f5f9; border-top: 2px solid #e2e8f0; font-weight: 600;">
                               <td colspan="4" style="padding: 8px; text-align: right; font-size: 10px; color: #1e293b;">Subtotal Costo Directo:</td>
                               <td style="padding: 8px; text-align: right; font-size: 10px; color: #1e293b; font-weight: bold;">${formatCurrency(subtotalCostoDirecto, project?.Currency)}</td>
                               <td colspan="3"></td>
                             </tr>
                             
                             <tr style="background-color: #f1f5f9; font-weight: 600;">
                               <td colspan="4" style="padding: 8px; text-align: right; font-size: 10px; color: #1e293b;">IVA (19%):</td>
                               <td style="padding: 8px; text-align: right; font-size: 10px; color: #1e293b; font-weight: bold;">${formatCurrency(valorTotalIVA, project?.Currency)}</td>
                               <td colspan="3"></td>
                             </tr>
                             
                             <tr style="background-color: #e2e8f0; border-top: 2px solid #cbd5e1; font-weight: bold;">
                               <td colspan="4" style="padding: 8px; text-align: right; font-size: 11px; color: #1e293b;">Total con IVA:</td>
                               <td style="padding: 8px; text-align: right; font-size: 11px; color: #1e293b; font-weight: bold;">${formatCurrency(valorTotalConIVA, project?.Currency)}</td>
                               <td colspan="3"></td>
                             </tr>
                          </tbody>
                        </table>
                      `;

                      // Contenedor con las tres páginas
                      const container = document.createElement('div');
                      container.appendChild(page1);
                      container.appendChild(page2);
                      container.appendChild(page3);

                      const opt = {
                        margin: 10,
                        filename: `avance-presupuesto-${project?.Name || 'proyecto'}.pdf`,
                        image: { type: 'jpeg', quality: 0.98 },
                        html2canvas: { scale: 2 },
                        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
                      };

                      await html2pdf().set(opt).from(container).save();
                      
                      toast({
                        title: "PDF generado",
                        description: "El avance del presupuesto se ha exportado correctamente"
                      });
                    } catch (error) {
                      console.error('Error generando PDF:', error);
                      toast({
                        title: "Error",
                        description: "No se pudo generar el PDF",
                        variant: "destructive"
                      });
                    }
                  },
                  () => {
                    try {
                      // Calcular avances
                      const previousMonth = presupuesto.reduce((acc, item) => {
                        const previousAccumulated = (item['Avance Acumulado'] || 0) - (item['Avance Parcial'] || 0);
                        return acc + (previousAccumulated / 100 * (item.Total || 0));
                      }, 0);
                      
                      const currentMonth = presupuesto.reduce((acc, item) => {
                        return acc + ((item['Avance Parcial'] || 0) / 100 * (item.Total || 0));
                      }, 0);
                      
                      const totalAccumulated = presupuesto.reduce((acc, item) => {
                        return acc + ((item['Avance Acumulado'] || 0) / 100 * (item.Total || 0));
                      }, 0);
                      
                      const subtotalNeto = presupuesto.reduce((sum, item) => sum + (item.Total || 0), 0);
                      const iva = subtotalNeto * 0.19;
                      const totalConIva = subtotalNeto + iva;

                      // Hoja 1: Resumen
                      const resumenData = [
                        ['Avance de Presupuesto'],
                        [project?.Name || 'Proyecto'],
                        [],
                        ['Resumen de Avances'],
                        ['Acumulado Anterior', formatCurrency(previousMonth, project?.Currency)],
                        ['Avance Último Mes', formatCurrency(currentMonth, project?.Currency)],
                        ['Total Acumulado', formatCurrency(totalAccumulated, project?.Currency)],
                        [],
                        ['Ítem', 'Total', 'Avance Parcial (%)', 'Avance Acumulado (%)', 'Última Actualización'],
                        ...presupuesto.map(item => [
                          item.Item || '-',
                          item.Total || 0,
                          item['Avance Parcial'] || 0,
                          item['Avance Acumulado'] || 0,
                          item['Ult. Actualizacion'] ? new Date(item['Ult. Actualizacion']).toLocaleDateString('es-CL') : '-'
                        ])
                      ];

                      // Hoja 2: Detalle Completo
                      const detalleData = [
                        ['Detalle Completo del Presupuesto'],
                        [project?.Name || 'Proyecto'],
                        [],
                        ['Ítem', 'Unidad', 'Cantidad', 'P.U.', 'Total', 'Avance Parcial (%)', 'Avance Acumulado (%)', 'Última Actualización'],
                        ...presupuesto.map(item => [
                          item.Item || '-',
                          item.Unidad || '-',
                          item.Cantidad || 0,
                          item.PU || 0,
                          item.Total || 0,
                          item['Avance Parcial'] || 0,
                          item['Avance Acumulado'] || 0,
                          item['Ult. Actualizacion'] ? new Date(item['Ult. Actualizacion']).toLocaleDateString('es-CL') : '-'
                        ]),
                        [],
                        ['', '', '', 'Subtotal Neto:', subtotalNeto],
                        ['', '', '', 'IVA (19%):', iva],
                        ['', '', '', 'Total con IVA:', totalConIva]
                      ];

                      // Crear libro de Excel
                      const wb = XLSX.utils.book_new();
                      
                      const ws1 = XLSX.utils.aoa_to_sheet(resumenData);
                      const ws2 = XLSX.utils.aoa_to_sheet(detalleData);
                      
                      // Ajustar anchos de columna
                      ws1['!cols'] = [
                        { wch: 40 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }
                      ];
                      ws2['!cols'] = [
                        { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, 
                        { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 20 }
                      ];
                      
                      XLSX.utils.book_append_sheet(wb, ws1, 'Resumen');
                      XLSX.utils.book_append_sheet(wb, ws2, 'Detalle Completo');
                      
                      XLSX.writeFile(wb, `avance-presupuesto-${project?.Name || 'proyecto'}.xlsx`);
                      
                      toast({
                        title: "Excel generado",
                        description: "El avance del presupuesto se ha exportado correctamente"
                      });
                    } catch (error) {
                      console.error('Error generando Excel:', error);
                      toast({
                        title: "Error",
                        description: "No se pudo generar el archivo Excel",
                        variant: "destructive"
                      });
                    }
                  }
                )}
                <PresupuestoTable
                  presupuesto={presupuesto}
                  loading={presupuestoLoading}
                  currency={project?.Currency}
                  onUpdate={refetchPresupuesto}
                  projectId={parseInt(id || '0')}
                />
                <div className="flex justify-center mt-6">
                  <Button 
                    onClick={() => toast({ title: "Información", description: "Edita los valores de avance en la tabla" })}
                    className="font-rubik"
                  >
                    Actualizar Avance
                  </Button>
                </div>
              </TabsContent>
            )}

            {reunionesEnabled && (
              <TabsContent value="reuniones" className="space-y-6">
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-xl font-rubik">Reuniones del Proyecto</CardTitle>
                    <CardDescription className="font-rubik">
                      Gestiona las minutas de reunión del proyecto
                    </CardDescription>
                  </CardHeader>
                </Card>
                {renderControls(reunionesSearch, setReunionesSearch, 'Crear Minuta', () => toast({ title: "Función en desarrollo" }))}
                <ReunionesCards 
                  reuniones={reuniones}
                  loading={reunionesLoading}
                />
              </TabsContent>
            )}
          </Tabs>
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
                  <p className="text-gloster-gray text-sm font-rubik">Contacto Contratista</p>
                  <p className="font-medium font-rubik">{project.Contratista?.ContactName}</p>
                  <p className="font-medium font-rubik break-words text-sm">{project.Contratista?.ContactEmail}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Detalle */}
      <AdicionalesDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        adicional={selectedAdicional}
        currency={project?.Currency}
      />

      {/* Modal de Nuevo Adicional */}
      <AdicionalesForm
        open={showAdicionalesForm}
        onOpenChange={setShowAdicionalesForm}
        projectId={id || '0'}
        currency={project?.Currency}
        onSuccess={() => {
          refetchAdicionales();
          setShowAdicionalesForm(false);
        }}
      />

      <ProjectPhotoUpload
        projectId={parseInt(id || '0')}
        open={showPhotoUpload}
        onOpenChange={setShowPhotoUpload}
        onUploadComplete={() => {
          refetchFotos();
          setShowPhotoUpload(false);
        }}
      />
    </div>
  );
};

export default ProjectDetailMandante;