import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Calendar, ChevronRight, Search, Filter, Plus, Eye, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import html2pdf from 'html2pdf.js';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';
import { useProjectDetailSecure } from '@/hooks/useProjectDetailSecure';
import { useProjectDetailMandante } from '@/hooks/useProjectDetailMandante';
import { useAuth } from '@/hooks/useAuth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdicionales } from '@/hooks/useAdicionales';
import { AdicionalesCards } from '@/components/AdicionalesCards';
import { AdicionalesForm } from '@/components/AdicionalesForm';
import { AdicionalesDetailModal } from '@/components/AdicionalesDetailModal';
import { useDocumentos } from '@/hooks/useDocumentos';
import { useFotos } from '@/hooks/useFotos';
import { usePresupuesto } from '@/hooks/usePresupuesto';
import { useReuniones } from '@/hooks/useReuniones';
import { DocumentosTable } from '@/components/DocumentosTable';
import { FotosGrid } from '@/components/FotosGrid';
import { PresupuestoTable } from '@/components/PresupuestoTable';
import { ReunionesTable } from '@/components/ReunionesTable';
import { ProjectPhotoUpload } from '@/components/ProjectPhotoUpload';

const ProjectDetail = () => {
  console.log('🎨 ProjectDetail component rendering with SECURE MODE...');
  
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('month');
  const [filterBy, setFilterBy] = useState('all');
  const [activeTab, setActiveTab] = useState('estados-pago');
  const [showAdicionalesForm, setShowAdicionalesForm] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [selectedAdicional, setSelectedAdicional] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { adicionales, loading: adicionalesLoading, refetch: refetchAdicionales } = useAdicionales(id || '');
  const { documentos, loading: documentosLoading, refetch: refetchDocumentos } = useDocumentos(id || '');
  const { fotos, loading: fotosLoading, refetch: refetchFotos } = useFotos(id || '');
  const { presupuesto, loading: presupuestoLoading, refetch: refetchPresupuesto } = usePresupuesto(id || '');
  const { reuniones, loading: reunionesLoading, refetch: refetchReuniones } = useReuniones(id || '');
  
  // Estado para búsqueda, filtrado y orden de cada pestaña
  const [adicionalesSearch, setAdicionalesSearch] = useState('');
  const [documentosSearch, setDocumentosSearch] = useState('');
  const [fotosSearch, setFotosSearch] = useState('');
  const [presupuestoSearch, setPresupuestoSearch] = useState('');
  const [reunionesSearch, setReunionesSearch] = useState('');
  const handleAdicionalesSuccess = () => {
    refetchAdicionales();
  };

  const handleCardClick = (adicional: any) => {
    setSelectedAdicional(adicional);
    setShowDetailModal(true);
  };
  
  useEffect(() => {
    if (activeTab === 'estados-pago' && adicionales.length > 0) {
      setActiveTab('adicionales');
    }
  }, [adicionales]);
  
  console.log('📊 Project ID from params:', id);
  
  const { user } = useAuth();
  
  // Determinar si es mandante o contratista
  const [userType, setUserType] = useState<'mandante' | 'contratista' | null>(null);
  const [userEntity, setUserEntity] = useState<any>(null);
  
  useEffect(() => {
    const verifyStrictProjectAccess = async () => {
      if (!user?.id) {
        // Check for session-based access for non-authenticated users
        const mandanteAccess = sessionStorage.getItem('mandanteAccess');
        if (mandanteAccess) {
          try {
            const accessData = JSON.parse(mandanteAccess);
            // CRITICAL: Limited access users cannot access project detail pages
            if (accessData.isLimitedAccess || !accessData.hasFullAccess) {
              console.log('❌ LIMITED ACCESS user blocked from project detail page');
              navigate(`/submission/${accessData.paymentId || ''}`);
              return;
            }
          } catch (error) {
            console.error('Error parsing mandante access:', error);
          }
        }
        
        console.log('❌ No authenticated user for project detail');
        navigate('/');
        return;
      }
      
      // Check BOTH roles to determine which one to use for THIS page
      // Priority: Check contractor FIRST since this is ProjectDetail (contractor page)
      const { data: contratistaData } = await supabase
        .from('Contratistas')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();
        
      const { data: mandanteData } = await supabase
        .from('Mandantes')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      
      // Determine which role to use based on activeRole in sessionStorage
      const activeRole = sessionStorage.getItem('activeRole');
      
      // CRITICAL: ProjectDetail is a CONTRACTOR-ONLY page
      // If user has mandante as active role, redirect to mandante dashboard
      if (activeRole === 'mandante' && mandanteData?.auth_user_id === user.id) {
        console.log('🔄 User has mandante as active role, redirecting to mandante dashboard');
        navigate('/dashboard-mandante');
        return;
      }
      
      if (activeRole === 'contratista' && contratistaData?.auth_user_id === user.id) {
        // User explicitly selected contratista role
        console.log('✅ User selected contratista role for this session');
        setUserType('contratista');
        setUserEntity(contratistaData);
        return;
      }
      
      // No explicit role selected - use default logic
      // If user has contractor role, use it (since this is ProjectDetail)
      if (contratistaData?.auth_user_id === user.id) {
        console.log('✅ Default: Using contratista role for ProjectDetail');
        setUserType('contratista');
        setUserEntity(contratistaData);
        // Set active role if not set
        if (!activeRole) {
          sessionStorage.setItem('activeRole', 'contratista');
        }
        return;
      }
      
      // If user only has mandante role, redirect to mandante dashboard
      if (mandanteData?.auth_user_id === user.id) {
        console.log('🔄 User only has mandante role, redirecting to mandante dashboard');
        navigate('/dashboard-mandante');
        return;
      }
      
      // No valid authentication found
      console.log('❌ User does not have valid user_auth_id for project access');
      navigate('/');
    };
    
    verifyStrictProjectAccess();
  }, [user, navigate]);
  
  // Usar el hook apropiado según el tipo de usuario
  const contratistaHook = useProjectDetailSecure(userType === 'contratista' ? (id || '') : '');
  const mandanteHook = useProjectDetailMandante(userType === 'mandante' ? (id || '') : '');
  
  const project = userType === 'mandante' ? mandanteHook.project : contratistaHook.project;
  const loading = userType === 'mandante' ? mandanteHook.loading : contratistaHook.loading;

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
        return 'bg-purple-100 text-purple-700';
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
    
    // Calcular el monto total aprobado
    const approvedAmount = project.EstadosPago
      .filter(payment => payment.Status === 'Aprobado')
      .reduce((sum, payment) => sum + (payment.Total || 0), 0);
    
    // Calcular progreso basado en monto aprobado vs presupuesto total
    return Math.round((approvedAmount / project.Budget) * 100);
  };

  const getApprovedValue = () => {
    if (!project?.EstadosPago || project.EstadosPago.length === 0) return 0;
    
    return project.EstadosPago
      .filter(payment => payment.Status === 'Aprobado')
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
    
    // Para contratistas: ir a la página de payment
    if (userType === 'contratista') {
      navigate(`/payment/${payment.id}`);
    } else {
      // Para mandantes: ir a submission con token de acceso (solo autenticados)
      const accessData = {
        paymentId: payment.id.toString(),
        token: 'mandante_authenticated',
        userType: 'mandante',
        hasFullAccess: true, // Solo mandantes autenticados pueden llegar aquí
        isLimitedAccess: false,
        timestamp: Date.now()
      };
      sessionStorage.setItem('mandanteAccess', JSON.stringify(accessData));
      navigate(`/submission/${payment.id}`);
    }
  };

  const handleViewDocuments = (payment: any) => {
    console.log(`👁️ View documents clicked for: "${payment.Name}"`);
    
    // Para contratistas: ir a la página de payment
    if (userType === 'contratista') {
      navigate(`/payment/${payment.id}`);
    } else {
      // Para mandantes: ir a submission con token de acceso (solo autenticados)
      const accessData = {
        paymentId: payment.id.toString(),
        token: 'mandante_authenticated',
        userType: 'mandante',
        hasFullAccess: true, // Solo mandantes autenticados pueden llegar aquí
        isLimitedAccess: false,
        timestamp: Date.now()
      };
      sessionStorage.setItem('mandanteAccess', JSON.stringify(accessData));
      navigate(`/submission/${payment.id}`);
    }
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
              // Cambiar a orden ascendente por fecha
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
  const approvedValue = getApprovedValue();

  console.log('🏗️ Rendering ProjectDetail with', project.EstadosPago?.length || 0, 'payment states');

  const renderPaymentCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredAndSortedPayments.map((payment) => {
        const status = getPaymentStatus(payment);
        console.log(`🔄 Rendering payment card: "${payment.Name}" with status: "${status}"`);
        
        return (
          <Card 
            key={payment.id} 
            className={`hover:shadow-xl transition-all duration-300 border-gloster-gray/20 hover:border-gloster-gray/50 h-full ${
              status === 'Pendiente' ? 'ring-2 ring-gloster-yellow ring-opacity-50' : ''
            }`}
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
                  <Badge variant="secondary" className={`${getStatusColor(status)} text-xs shrink-0`}>
                    {status}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gloster-gray text-xs md:text-sm font-rubik">Monto:</span>
                    <span className="font-bold text-slate-800 text-sm md:text-base font-rubik">
                      {payment.Total ? formatCurrency(payment.Total, project.Currency || 'CLP') : 'Sin monto definido'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-auto">
                {(status === 'Pendiente') && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={() => handlePaymentClick(payment)}
                          className="w-full bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-semibold font-rubik"
                          size="sm"
                        >
                          Gestionar
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Gestionar documentos y completar estado de pago</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {(status === 'Aprobado' || status === 'Enviado' || status === 'Rechazado') && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          onClick={() => handleViewDocuments(payment)}
                          className="w-full border-gloster-gray/30 hover:bg-gloster-gray/10 font-rubik"
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ver documentos y detalles del estado de pago</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
            <SelectItem value="enviado">Enviado</SelectItem>
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
    onExportExcel: () => void,
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
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="enviado">Enviado</SelectItem>
            <SelectItem value="aprobado">Aprobado</SelectItem>
            <SelectItem value="rechazado">Rechazado</SelectItem>
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-semibold font-rubik whitespace-nowrap">
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
            onClick={() => navigate(userType === 'mandante' ? '/dashboard-mandante' : '/dashboard')}
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

        {/* Estados de Pago - Con pestañas si tiene adicionales */}
        <div className="space-y-6">
          {(() => {
            console.log('🔍 DEBUG: userEntity?.Adicionales =', (userEntity as any)?.Adicionales, 'type:', typeof (userEntity as any)?.Adicionales);
            return null;
          })()}
{(() => {
            const entity = (userEntity as any) || {};
            const features = {
              adicionales: Boolean(entity?.Adicionales),
              documentos: Boolean(entity?.Documentos),
              fotos: Boolean(entity?.Fotos),
              presupuesto: Boolean(entity?.Presupuesto),
              reuniones: Boolean(entity?.Reuniones),
            };
            console.log('🔍 DEBUG: features =', features);
            const hasAnyFeature = Object.values(features).some(Boolean);

            if (!hasAnyFeature) {
              return (
                <>
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-xl font-rubik">Estados de Pago</CardTitle>
                      <CardDescription className="font-rubik">
                        Gestiona los estados de pago del proyecto
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  {renderControls(searchTerm, setSearchTerm, 'Agregar Estado Extraordinario', handleAddExtraordinaryPayment)}
                  {filteredAndSortedPayments.length === 0 ? (
                    <Card className="p-8 text-center">
                      <CardContent>
                        <p className="text-gloster-gray font-rubik">No hay estados de pago para este proyecto.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    renderPaymentCards()
                  )}
                </>
              );
            }

            return (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="flex flex-wrap gap-2 bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-1">
                  <TabsTrigger 
                    value="estados-pago" 
                    className="font-rubik font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                  >
                    Estados de Pago
                  </TabsTrigger>
                  {features.adicionales && (
                    <TabsTrigger 
                      value="adicionales" 
                      className="font-rubik font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                    >
                      Adicionales
                    </TabsTrigger>
                  )}
                  {features.documentos && (
                    <TabsTrigger 
                      value="documentos" 
                      className="font-rubik font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                    >
                      Documentos
                    </TabsTrigger>
                  )}
                  {features.fotos && (
                    <TabsTrigger 
                      value="fotos" 
                      className="font-rubik font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                    >
                      Fotos
                    </TabsTrigger>
                  )}
                  {features.presupuesto && (
                    <TabsTrigger 
                      value="presupuesto" 
                      className="font-rubik font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                    >
                      Presupuesto
                    </TabsTrigger>
                  )}
                  {features.reuniones && (
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
                        Gestiona los estados de pago del proyecto
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  {renderControls(searchTerm, setSearchTerm, 'Agregar Estado Extraordinario', handleAddExtraordinaryPayment)}
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

                {features.adicionales && (
                  <TabsContent value="adicionales" className="space-y-6">
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle className="text-xl font-rubik">Adicionales</CardTitle>
                        <CardDescription className="font-rubik">
                          Gestiona los adicionales presentados para el proyecto
                        </CardDescription>
                      </CardHeader>
                    </Card>
                    {renderControls(
                      adicionalesSearch, 
                      setAdicionalesSearch, 
                      'Presentar Nuevo Adicional', 
                      () => setShowAdicionalesForm(true)
                    )}
                    <AdicionalesCards 
                      adicionales={adicionales}
                      loading={adicionalesLoading}
                      currency={project?.Currency}
                      onCardClick={handleCardClick}
                    />
                  </TabsContent>
                )}

                {features.documentos && (
                  <TabsContent value="documentos" className="space-y-6">
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle className="text-xl font-rubik">Documentos del Proyecto</CardTitle>
                        <CardDescription className="font-rubik">
                          Gestiona los documentos cargados para este proyecto
                        </CardDescription>
                      </CardHeader>
                    </Card>
                    {renderControls(
                      documentosSearch, 
                      setDocumentosSearch, 
                      'Cargar Nuevo Documento', 
                      () => toast({ title: "Función en desarrollo", description: "Próximamente podrás cargar documentos" })
                    )}
                    <Card>
                      <CardContent className="pt-6">
                        <DocumentosTable documentos={documentos} loading={documentosLoading} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {features.fotos && (
                  <TabsContent value="fotos" className="space-y-6">
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle className="text-xl font-rubik">Fotos del Proyecto</CardTitle>
                        <CardDescription className="font-rubik">
                          Visualiza las fotos cargadas para este proyecto
                        </CardDescription>
                      </CardHeader>
                    </Card>
                    {renderControls(
                      fotosSearch, 
                      setFotosSearch, 
                      'Cargar Nueva Foto', 
                      () => setShowPhotoUpload(true)
                    )}
                    <Card>
                      <CardContent className="pt-6">
                        <FotosGrid fotos={fotos} loading={fotosLoading} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {features.presupuesto && (
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
                          const { anticipos, retenciones, gastosGenerales, utilidad } = await import('@/hooks/usePresupuesto').then(m => {
                            const result = m.usePresupuesto(id || '');
                            return result;
                          });

                          const formatCurrency = (value: number, currency?: string) => {
                            return new Intl.NumberFormat('es-CL', {
                              style: 'currency',
                              currency: currency === 'USD' ? 'USD' : currency === 'UF' ? 'CLF' : 'CLP'
                            }).format(value);
                          };

                          const subtotalCostoDirecto = presupuesto.reduce((sum, item) => sum + (item.Total || 0), 0);
                          const valorGastosGenerales = subtotalCostoDirecto * (gastosGenerales / 100);
                          const valorUtilidad = subtotalCostoDirecto * (utilidad / 100);
                          const valorTotalNeto = subtotalCostoDirecto + valorGastosGenerales + valorUtilidad;
                          const valorTotalIVA = valorTotalNeto * 0.19;
                          const valorTotalConIVA = valorTotalNeto + valorTotalIVA;

                          const previousMonth = presupuesto.reduce((acc, item) => {
                            const previousAccumulated = (item['Avance Acumulado'] || 0) - (item['Avance Parcial'] || 0);
                            return acc + (previousAccumulated / 100) * (item.Total || 0);
                          }, 0);

                          const currentMonth = presupuesto.reduce((acc, item) => {
                            return acc + ((item['Avance Parcial'] || 0) / 100) * (item.Total || 0);
                          }, 0);

                          const totalAccumulated = presupuesto.reduce((acc, item) => {
                            return acc + ((item['Avance Acumulado'] || 0) / 100) * (item.Total || 0);
                          }, 0);

                          const page1 = document.createElement('div');
                          page1.style.cssText = 'page-break-after: always; padding: 20px; background-color: white;';
                          page1.innerHTML = `
                            <div style="text-align: center; margin-bottom: 20px;">
                              <h1 style="font-size: 24px; font-weight: 700; color: #1e293b; margin-bottom: 8px;">Avance de Presupuesto</h1>
                              <h2 style="font-size: 18px; color: #475569;">${project?.Name || 'Proyecto'}</h2>
                            </div>
                            <div style="margin-top: 30px; padding: 15px; background-color: #FFFBEB; border-radius: 8px; border: 2px solid #F5DF4D;">
                              <h3 style="font-size: 16px; font-weight: 700; margin-bottom: 15px; color: #1e293b;">Resumen de Avances</h3>
                              <table style="width: 100%; border-collapse: collapse;">
                                <tr>
                                  <td style="padding: 8px; color: #475569;">Acumulado Anterior:</td>
                                  <td style="padding: 8px; text-align: right; font-weight: 700; color: #1e293b;">${formatCurrency(previousMonth, project?.Currency)}</td>
                                </tr>
                                <tr>
                                  <td style="padding: 8px; color: #475569;">Avance Último Mes:</td>
                                  <td style="padding: 8px; text-align: right; font-weight: 700; color: #1e293b;">${formatCurrency(currentMonth, project?.Currency)}</td>
                                </tr>
                                <tr style="border-top: 2px solid #F5DF4D;">
                                  <td style="padding: 10px; font-weight: 700; color: #1e293b;">Total Acumulado:</td>
                                  <td style="padding: 10px; text-align: right; font-weight: 700; font-size: 18px; color: #1e293b;">${formatCurrency(totalAccumulated, project?.Currency)}</td>
                                </tr>
                              </table>
                            </div>
                          `;

                          const page2 = document.createElement('div');
                          page2.style.cssText = 'page-break-after: always; padding: 20px; background-color: white;';
                          page2.innerHTML = `
                            <h3 style="font-size: 14px; font-weight: 700; margin-bottom: 15px; color: #1e293b;">Detalle por Partida</h3>
                            <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                              <thead>
                                <tr style="background-color: #F8FAFC; border-bottom: 2px solid #E2E8F0;">
                                  <th style="padding: 8px; text-align: left; color: #475569;">Ítem</th>
                                  <th style="padding: 8px; text-align: right; color: #475569;">Total</th>
                                  <th style="padding: 8px; text-align: right; color: #475569;">Avance Parcial</th>
                                  <th style="padding: 8px; text-align: right; color: #475569;">Avance Acum.</th>
                                  <th style="padding: 8px; text-align: left; color: #475569;">Última Act.</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${presupuesto.map((item, idx) => `
                                  <tr style="border-bottom: 1px solid #E2E8F0; background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
                                    <td style="padding: 6px;">${item.Item || '-'}</td>
                                    <td style="padding: 6px; text-align: right;">${formatCurrency(item.Total || 0, project?.Currency)}</td>
                                    <td style="padding: 6px; text-align: right;">${item['Avance Parcial'] || 0}%</td>
                                    <td style="padding: 6px; text-align: right;">${item['Avance Acumulado'] || 0}%</td>
                                    <td style="padding: 6px;">${item['Ult. Actualizacion'] ? new Date(item['Ult. Actualizacion']).toLocaleDateString('es-CL') : '-'}</td>
                                  </tr>
                                `).join('')}
                              </tbody>
                            </table>
                          `;

                          const page3 = document.createElement('div');
                          page3.style.cssText = 'padding: 20px; background-color: white;';
                          page3.innerHTML = `
                            <h3 style="font-size: 14px; font-weight: 700; margin-bottom: 15px; color: #1e293b;">Controles Financieros</h3>
                            <table style="width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 20px;">
                              <thead>
                                <tr style="background-color: #F8FAFC;">
                                  <th colspan="8" style="padding: 8px 5px; text-align: left; color: #1e293b; font-weight: 700; font-size: 11px; border-bottom: 2px solid #E2E8F0;">Resumen del Presupuesto</th>
                                </tr>
                                <tr style="background-color: #F1F5F9; border-bottom: 2px solid #CBD5E1;">
                                  <th style="padding: 6px 5px; text-align: left; color: #475569; font-weight: 600;">Ítem</th>
                                  <th style="padding: 6px 5px; text-align: center; color: #475569; font-weight: 600;">Unidad</th>
                                  <th style="padding: 6px 5px; text-align: center; color: #475569; font-weight: 600;">Cant.</th>
                                  <th style="padding: 6px 5px; text-align: right; color: #475569; font-weight: 600;">P.U.</th>
                                  <th style="padding: 6px 5px; text-align: right; color: #475569; font-weight: 600;">Total</th>
                                  <th style="padding: 6px 5px; text-align: center; color: #475569; font-weight: 600;">Avance P.</th>
                                  <th style="padding: 6px 5px; text-align: center; color: #475569; font-weight: 600;">Avance A.</th>
                                  <th style="padding: 6px 5px; text-align: left; color: #475569; font-weight: 600;">Últ. Act.</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${presupuesto.map((item, idx) => `
                                  <tr style="border-bottom: 1px solid #E2E8F0; background-color: ${idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC'};">
                                    <td style="padding: 5px 5px; font-size: 8px;">${item.Item || '-'}</td>
                                    <td style="padding: 5px 5px; text-align: center; font-size: 8px;">${item.Unidad || '-'}</td>
                                    <td style="padding: 5px 5px; text-align: center; font-size: 8px;">${item.Cantidad || 0}</td>
                                    <td style="padding: 5px 5px; text-align: right; font-size: 8px;">${formatCurrency(item.PU || 0, project?.Currency)}</td>
                                    <td style="padding: 5px 5px; text-align: right; font-size: 8px;">${formatCurrency(item.Total || 0, project?.Currency)}</td>
                                    <td style="padding: 5px 5px; text-align: center; font-size: 8px;">${item['Avance Parcial'] || 0}%</td>
                                    <td style="padding: 5px 5px; text-align: center; font-size: 8px;">${item['Avance Acumulado'] || 0}%</td>
                                    <td style="padding: 5px 5px; font-size: 8px;">${item['Ult. Actualizacion'] ? new Date(item['Ult. Actualizacion']).toLocaleDateString('es-CL') : '-'}</td>
                                  </tr>
                                `).join('')}
                                <tr style="background-color: #F8FAFC; border-top: 2px solid #CBD5E1;">
                                  <td colspan="4" style="padding: 6px 5px; font-weight: 700; color: #1e293b; text-align: right; font-size: 10px;">Subtotal Costo Directo:</td>
                                  <td style="padding: 6px 5px; font-weight: 700; color: #1e293b; text-align: right; font-size: 10px;">${formatCurrency(subtotalCostoDirecto, project?.Currency)}</td>
                                  <td colspan="3"></td>
                                </tr>
                                <tr style="background-color: #FFFFFF;">
                                  <td colspan="4" style="padding: 5px 5px; color: #475569; text-align: right; font-size: 9px;">Gastos Generales (${gastosGenerales.toFixed(1)}%):</td>
                                  <td style="padding: 5px 5px; color: #475569; text-align: right; font-size: 9px;">${formatCurrency(valorGastosGenerales, project?.Currency)}</td>
                                  <td colspan="3"></td>
                                </tr>
                                <tr style="background-color: #FFFFFF;">
                                  <td colspan="4" style="padding: 5px 5px; color: #475569; text-align: right; font-size: 9px;">Utilidad (${utilidad.toFixed(1)}%):</td>
                                  <td style="padding: 5px 5px; color: #475569; text-align: right; font-size: 9px;">${formatCurrency(valorUtilidad, project?.Currency)}</td>
                                  <td colspan="3"></td>
                                </tr>
                                <tr style="background-color: #FFFBEB; border-top: 2px solid #6B7280;">
                                  <td colspan="4" style="padding: 6px 5px; font-weight: 700; color: #1e293b; text-align: right; font-size: 10px;">Subtotal Neto:</td>
                                  <td style="padding: 6px 5px; font-weight: 700; color: #1e293b; text-align: right; font-size: 10px;">${formatCurrency(valorTotalNeto, project?.Currency)}</td>
                                  <td colspan="3"></td>
                                </tr>
                                <tr style="background-color: #F8FAFC;">
                                  <td colspan="4" style="padding: 5px 5px; color: #475569; text-align: right; font-size: 9px;">IVA (19%):</td>
                                  <td style="padding: 5px 5px; color: #475569; text-align: right; font-size: 9px;">${formatCurrency(valorTotalIVA, project?.Currency)}</td>
                                  <td colspan="3"></td>
                                </tr>
                                <tr style="background-color: #FFFBEB; border-top: 3px solid #F5DF4D;">
                                  <td colspan="4" style="padding: 7px 5px; font-weight: 800; color: #1e293b; text-align: right; font-size: 11px;">TOTAL CON IVA:</td>
                                  <td style="padding: 7px 5px; font-weight: 800; color: #1e293b; text-align: right; font-size: 11px;">${formatCurrency(valorTotalConIVA, project?.Currency)}</td>
                                  <td colspan="3"></td>
                                </tr>
                              </tbody>
                            </table>
                          `;

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
                            title: 'PDF generado',
                            description: 'El avance del presupuesto se ha exportado correctamente'
                          });
                        } catch (error) {
                          console.error('Error generando PDF:', error);
                          toast({
                            title: 'Error',
                            description: 'No se pudo generar el PDF',
                            variant: 'destructive'
                          });
                        }
                      },
                      () => {
                        try {
                          const formatCurrency = (value: number, currency?: string) => {
                            return new Intl.NumberFormat('es-CL', {
                              style: 'currency',
                              currency: currency === 'USD' ? 'USD' : currency === 'UF' ? 'CLF' : 'CLP'
                            }).format(value);
                          };

                          const previousMonth = presupuesto.reduce((acc, item) => {
                            const previousAccumulated = (item['Avance Acumulado'] || 0) - (item['Avance Parcial'] || 0);
                            return acc + (previousAccumulated / 100) * (item.Total || 0);
                          }, 0);

                          const currentMonth = presupuesto.reduce((acc, item) => {
                            return acc + ((item['Avance Parcial'] || 0) / 100) * (item.Total || 0);
                          }, 0);

                          const totalAccumulated = presupuesto.reduce((acc, item) => {
                            return acc + ((item['Avance Acumulado'] || 0) / 100) * (item.Total || 0);
                          }, 0);

                          const subtotalNeto = presupuesto.reduce((sum, item) => sum + (item.Total || 0), 0);
                          const iva = subtotalNeto * 0.19;
                          const totalConIva = subtotalNeto + iva;

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

                          const wb = XLSX.utils.book_new();

                          const ws1 = XLSX.utils.aoa_to_sheet(resumenData);
                          const ws2 = XLSX.utils.aoa_to_sheet(detalleData);

                          ws1['!cols'] = [{ wch: 40 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];
                          ws2['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 18 }, { wch: 20 }];

                          XLSX.utils.book_append_sheet(wb, ws1, 'Resumen');
                          XLSX.utils.book_append_sheet(wb, ws2, 'Detalle Completo');

                          XLSX.writeFile(wb, `avance-presupuesto-${project?.Name || 'proyecto'}.xlsx`);

                          toast({
                            title: 'Excel generado',
                            description: 'El avance del presupuesto se ha exportado correctamente'
                          });
                        } catch (error) {
                          console.error('Error generando Excel:', error);
                          toast({
                            title: 'Error',
                            description: 'No se pudo generar el archivo Excel',
                            variant: 'destructive'
                          });
                        }
                      }
                    )}
                    <Card>
                      <CardContent className="pt-6">
                        <PresupuestoTable 
                          presupuesto={presupuesto} 
                          loading={presupuestoLoading} 
                          currency={project?.Currency}
                          onUpdate={refetchPresupuesto}
                          projectId={parseInt(id || '0')}
                        />
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}

                {features.reuniones && (
                  <TabsContent value="reuniones" className="space-y-6">
                    <Card className="mb-6">
                      <CardHeader>
                        <CardTitle className="text-xl font-rubik">Reuniones del Proyecto</CardTitle>
                        <CardDescription className="font-rubik">
                          Gestiona las minutas de reunión del proyecto
                        </CardDescription>
                      </CardHeader>
                    </Card>
                    {renderControls(
                      reunionesSearch, 
                      setReunionesSearch, 
                      'Crear Nueva Minuta', 
                      () => toast({ title: "Función en desarrollo", description: "Próximamente podrás crear minutas" })
                    )}
                    <Card>
                      <CardContent className="pt-6">
                        <ReunionesTable reuniones={reuniones} loading={reunionesLoading} />
                      </CardContent>
                    </Card>
                  </TabsContent>
                )}
              </Tabs>
            );
          })()}
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

      {/* Modales */}
      <AdicionalesForm
        open={showAdicionalesForm}
        onOpenChange={setShowAdicionalesForm}
        projectId={id!}
        onSuccess={handleAdicionalesSuccess}
        currency={project?.Currency}
      />

      <AdicionalesDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        adicional={selectedAdicional}
        currency={project?.Currency}
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

export default ProjectDetail;