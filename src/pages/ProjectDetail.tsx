import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
import { useRFI, RFI } from '@/hooks/useRFI';
import { DocumentosTableWithSidebar } from '@/components/DocumentosTableWithSidebar';
import { FotosGrid } from '@/components/FotosGrid';
import { PresupuestoTable } from '@/components/PresupuestoTable';
import { ReunionesTable } from '@/components/ReunionesTable';
import { ProjectPhotoUpload } from '@/components/ProjectPhotoUpload';
import { ProjectDocumentUpload } from '@/components/ProjectDocumentUpload';
import { RFICards } from '@/components/RFICards';
import { RFIForm } from '@/components/RFIForm';
import { RFIDetailModal } from '@/components/RFIDetailModal';

const ProjectDetail = () => {
  console.log('🎨 ProjectDetail component rendering with SECURE MODE...');
  
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlAdicionalId = searchParams.get('adicionalId');
  const urlRfiId = searchParams.get('rfiId');
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('month');
  const [filterBy, setFilterBy] = useState('all');
  const [activeTab, setActiveTab] = useState('estados-pago');
  const [showAdicionalesForm, setShowAdicionalesForm] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [selectedAdicional, setSelectedAdicional] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { adicionales, loading: adicionalesLoading, refetch: refetchAdicionales } = useAdicionales(id || '');
  const { documentos, loading: documentosLoading, refetch: refetchDocumentos } = useDocumentos(id || '');
  const { fotos, loading: fotosLoading, refetch: refetchFotos } = useFotos(id || '');
  const { 
    presupuesto, 
    anticipos, 
    retenciones, 
    gastosGenerales, 
    utilidad, 
    loading: presupuestoLoading, 
    refetch: refetchPresupuesto 
  } = usePresupuesto(id || '');
  const { reuniones, loading: reunionesLoading, refetch: refetchReuniones } = useReuniones(id || '');
  const { rfis, loading: rfisLoading, refetch: refetchRfis } = useRFI(id || '');
  
  // Estado para búsqueda, filtrado y orden de cada pestaña
  const [adicionalesSearch, setAdicionalesSearch] = useState('');
  const [documentosSearch, setDocumentosSearch] = useState('');
  const [fotosSearch, setFotosSearch] = useState('');
  const [presupuestoSearch, setPresupuestoSearch] = useState('');
  const [reunionesSearch, setReunionesSearch] = useState('');
  const [rfiSearch, setRfiSearch] = useState('');
  
  // RFI modals
  const [showRFIForm, setShowRFIForm] = useState(false);
  const [selectedRFI, setSelectedRFI] = useState<RFI | null>(null);
  const [showRFIDetailModal, setShowRFIDetailModal] = useState(false);
  const handleAdicionalesSuccess = () => {
    refetchAdicionales();
  };

  const handleCardClick = (adicional: any) => {
    setSelectedAdicional(adicional);
    setShowDetailModal(true);
  };
  
  const handleRFICardClick = (rfi: RFI) => {
    setSelectedRFI(rfi);
    setShowRFIDetailModal(true);
  };
  
  // Deep link handling - open modal from URL params
  useEffect(() => {
    if (urlAdicionalId && adicionales.length > 0 && !adicionalesLoading) {
      const adicional = adicionales.find(a => a.id === parseInt(urlAdicionalId));
      if (adicional) {
        setSelectedAdicional(adicional);
        setShowDetailModal(true);
        setActiveTab('adicionales');
        // Clear URL params after opening modal
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('adicionalId');
        navigate(`/project/${id}${newSearchParams.toString() ? '?' + newSearchParams.toString() : ''}`, { replace: true });
      }
    }
  }, [urlAdicionalId, adicionales, adicionalesLoading]);

  useEffect(() => {
    if (urlRfiId && rfis.length > 0 && !rfisLoading) {
      const rfi = rfis.find(r => r.id === parseInt(urlRfiId));
      if (rfi) {
        setSelectedRFI(rfi);
        setShowRFIDetailModal(true);
        setActiveTab('rfi');
        // Clear URL params after opening modal
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('rfiId');
        navigate(`/project/${id}${newSearchParams.toString() ? '?' + newSearchParams.toString() : ''}`, { replace: true });
      }
    }
  }, [urlRfiId, rfis, rfisLoading]);

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
      case 'en revisión':
        return 'bg-amber-100 text-amber-700';
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
                
                {(status === 'Aprobado' || status === 'Enviado' || status === 'Rechazado' || status === 'En Revisión') && (
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
                  <TabsTrigger 
                    value="rfi" 
                    className="font-rubik font-medium transition-all duration-200 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm data-[state=active]:font-semibold"
                  >
                    RFI
                  </TabsTrigger>
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
                      () => setShowDocumentUpload(true)
                    )}
                    <DocumentosTableWithSidebar 
                      documentos={documentos} 
                      loading={documentosLoading} 
                      projectId={id || ""} 
                      onRefresh={refetchDocumentos}
                    />
                  </TabsContent>
                )}

                <ProjectDocumentUpload
                  projectId={parseInt(id || '0')}
                  open={showDocumentUpload}
                  onOpenChange={setShowDocumentUpload}
                  onUploadComplete={refetchDocumentos}
                />

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
                    <FotosGrid fotos={fotos} loading={fotosLoading} />
                  </TabsContent>
                )}

                <ProjectPhotoUpload
                  projectId={parseInt(id || '0')}
                  open={showPhotoUpload}
                  onOpenChange={setShowPhotoUpload}
                  onUploadComplete={refetchFotos}
                />

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
                          // Calcular valores base
                          const subtotalCostoDirecto = presupuesto.reduce((sum, item) => sum + (item.Total || 0), 0);
                          const avanceAcumuladoTotal = presupuesto.reduce((sum, item) => {
                            const monto = (item.Total || 0) * ((item["Avance Acumulado"] || 0) / 100);
                            return sum + monto;
                          }, 0);
                          const avanceParcialTotal = presupuesto.reduce((sum, item) => {
                            const monto = (item.Total || 0) * ((item["Avance Parcial"] || 0) / 100);
                            return sum + monto;
                          }, 0);

                          // Calcular avance acumulado anterior (total - parcial)
                          const avanceAcumuladoAnterior = presupuesto.reduce((sum, item) => {
                            const acumuladoAnterior = (item["Avance Acumulado"] || 0) - (item["Avance Parcial"] || 0);
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
                          const plazoEnDias = Math.ceil(
                            (fechaFin.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24),
                          );

                          // Porcentaje de avance financiero
                          const porcentajeAvance =
                            subtotalCostoDirecto > 0
                              ? ((avanceAcumuladoTotal / subtotalCostoDirecto) * 100).toFixed(2)
                              : "0.00";

                          // Primera página - Resumen del Contrato y Período
                          const page1 = document.createElement("div");
                          page1.style.padding = "40px";
                          page1.style.fontFamily = "Rubik, sans-serif";
                          page1.style.pageBreakAfter = "always";

                          page1.innerHTML = `
                            <!-- Logo Gloster -->
                            <div style="position: absolute; top: 20px; right: 20px; opacity: 0.7;">
                              <img 
                                src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
                                alt="Gloster Logo" 
                                style="width: 40px; height: 40px;"
                              />
                            </div>
                            
                            <div style="text-align: center; margin-bottom: 30px;">
                              <h1 style="color: #1F2937; margin-bottom: 10px; font-size: 26px; font-weight: bold;">Informe de Avance de Presupuesto</h1>
                              <h2 style="color: #6B7280; font-size: 18px;">${project?.Name || "Proyecto"}</h2>
                            </div>
                            
                            <div style="margin-bottom: 35px; padding: 25px; background-color: #FFFBEB; border-radius: 8px; border-left: 4px solid #F5DF4D;">
                              <h3 style="color: #1F2937; margin-bottom: 20px; font-size: 18px; font-weight: bold;">Datos del Contrato</h3>
                              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                                <div>
                                  <p style="color: #6B7280; font-size: 12px; margin-bottom: 5px;">Mandante</p>
                                  <p style="color: #1F2937; font-size: 14px; font-weight: 600;">${project?.Owner?.CompanyName || "-"}</p>
                                </div>
                                <div>
                                  <p style="color: #6B7280; font-size: 12px; margin-bottom: 5px;">Contratista</p>
                                  <p style="color: #1F2937; font-size: 14px; font-weight: 600;">${project?.Contratista?.CompanyName || "-"}</p>
                                </div>
                                <div>
                                  <p style="color: #6B7280; font-size: 12px; margin-bottom: 5px;">Fecha Inicio</p>
                                  <p style="color: #1F2937; font-size: 14px; font-weight: 600;">${project?.StartDate ? new Date(project.StartDate).toLocaleDateString("es-CL") : "-"}</p>
                                </div>
                                <div>
                                  <p style="color: #6B7280; font-size: 12px; margin-bottom: 5px;">Fin del Contrato</p>
                                  <p style="color: #1F2937; font-size: 14px; font-weight: 600;">${fechaFin.toLocaleDateString("es-CL")}</p>
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
                          const page2 = document.createElement("div");
                          page2.style.padding = "20px";
                          page2.style.fontFamily = "Rubik, sans-serif";
                          page2.style.pageBreakAfter = "always";
                          page2.style.position = "relative";

                          page2.innerHTML = `
                            <!-- Logo Gloster -->
                            <div style="position: absolute; top: 20px; right: 20px; opacity: 0.7;">
                              <img 
                                src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
                                alt="Gloster Logo" 
                                style="width: 40px; height: 40px;"
                              />
                            </div>
                            
                            <div style="text-align: center; margin-bottom: 10px;">
                              <h1 style="color: #1F2937; margin-bottom: 5px; font-size: 18px; font-weight: bold;">Resumen del Período Actualizado</h1>
                            </div>
                            
                            <div style="margin-bottom: 15px;">
                              <table style="width: 100%; max-width: 700px; margin: 0 auto; border-collapse: collapse; font-size: 13px;">
                                <!-- Información de fecha y avance -->
                                <tr style="background-color: #F8FAFC;">
                                  <td style="padding: 6px 8px; border: 1px solid #E5E7EB; border-bottom: 2px solid #6B7280; color: #6B7280; font-weight: 600; width: 60%;">Fecha de Actualización</td>
                                  <td style="padding: 6px 8px; text-align: right; border: 1px solid #E5E7EB; border-bottom: 2px solid #6B7280; color: #1F2937; font-weight: 700; font-size: 13px; width: 40%;">${new Date().toLocaleDateString("es-CL")}</td>
                                </tr>
                                <tr style="background-color: #F8FAFC;">
                                  <td style="padding: 6px 8px; border: 1px solid #E5E7EB; border-bottom: 2px solid #6B7280; color: #6B7280; font-weight: 600;">Porcentaje de Avance Financiero</td>
                                  <td style="padding: 6px 8px; text-align: right; border: 1px solid #E5E7EB; border-bottom: 2px solid #6B7280; color: #1F2937; font-weight: 700; font-size: 13px;">${porcentajeAvance}%</td>
                                </tr>
                                <tbody>
                                  <!-- Encabezado de tabla -->
                                  <tr style="background-color: #F5DF4D;">
                                    <th style="padding: 6px 8px; text-align: left; font-weight: 600; border: 1px solid #E5E7EB; color: #1F2937;">Concepto</th>
                                    <th style="padding: 6px 8px; text-align: right; font-weight: 600; border: 1px solid #E5E7EB; color: #1F2937;">Monto</th>
                                  </tr>
                                  <!-- SECCIÓN: COSTO DIRECTO -->
                                  <tr style="background-color: #FFFFFF;">
                                    <td style="padding: 5px 8px; border: 1px solid #E5E7EB; color: #1F2937;">Avance Acumulado Actual - Costo Directo</td>
                                    <td style="padding: 5px 8px; text-align: right; border: 1px solid #E5E7EB; color: #1F2937; font-weight: 600;">${formatCurrency(avanceAcumuladoTotal, project?.Currency)}</td>
                                  </tr>
                                  <tr style="background-color: #FFFFFF;">
                                    <td style="padding: 5px 8px; border: 1px solid #E5E7EB; color: #6B7280;">Avance Acumulado Anterior - Costo Directo</td>
                                    <td style="padding: 5px 8px; text-align: right; border: 1px solid #E5E7EB; color: #6B7280;">${formatCurrency(avanceAcumuladoAnterior, project?.Currency)}</td>
                                  </tr>
                                  <tr style="background-color: #FFFBEB;">
                                    <td style="padding: 5px 8px; border: 1px solid #E5E7EB; border-bottom: 2px solid #F5DF4D; color: #1F2937; font-weight: 600;">Avance Parcial - Costo Directo</td>
                                    <td style="padding: 5px 8px; text-align: right; border: 1px solid #E5E7EB; border-bottom: 2px solid #F5DF4D; color: #1F2937; font-weight: 700;">${formatCurrency(avanceParcialTotal, project?.Currency)}</td>
                                  </tr>
                                  
                                  <!-- SECCIÓN: GASTOS GENERALES Y UTILIDAD -->
                                  <tr style="background-color: #F8FAFC;">
                                    <td style="padding: 5px 8px; border: 1px solid #E5E7EB; color: #6B7280;">Gastos Generales (${gastosGenerales.toFixed(1)}%)</td>
                                    <td style="padding: 5px 8px; text-align: right; border: 1px solid #E5E7EB; color: #6B7280;">${formatCurrency(montoGastosGeneralesParcial, project?.Currency)}</td>
                                  </tr>
                                  <tr style="background-color: #F8FAFC;">
                                    <td style="padding: 5px 8px; border: 1px solid #E5E7EB; border-bottom: 2px solid #F5DF4D; color: #6B7280;">Utilidad (${utilidad.toFixed(1)}%)</td>
                                    <td style="padding: 5px 8px; text-align: right; border: 1px solid #E5E7EB; border-bottom: 2px solid #F5DF4D; color: #6B7280;">${formatCurrency(montoUtilidadParcial, project?.Currency)}</td>
                                  </tr>
                                  
                                  <!-- SECCIÓN: SUBTOTALES -->
                                  <tr style="background-color: #FFFBEB;">
                                    <td style="padding: 6px 8px; border: 1px solid #E5E7EB; color: #1F2937; font-weight: 700;">Subtotal</td>
                                    <td style="padding: 6px 8px; text-align: right; border: 1px solid #E5E7EB; color: #1F2937; font-weight: 700;">${formatCurrency(subtotal, project?.Currency)}</td>
                                  </tr>
                                  <tr style="background-color: #FFFFFF;">
                                    <td style="padding: 5px 8px; border: 1px solid #E5E7EB; color: #6B7280;">Retenciones (${retenciones.total > 0 ? ((retenciones.actual / retenciones.total) * 100).toFixed(1) : "0.0"}%)</td>
                                    <td style="padding: 5px 8px; text-align: right; border: 1px solid #E5E7EB; color: #6B7280;">-${formatCurrency(retenciones.actual || 0, project?.Currency)}</td>
                                  </tr>
                                  <tr style="background-color: #FFFFFF;">
                                    <td style="padding: 5px 8px; border: 1px solid #E5E7EB; color: #6B7280;">Devolución Anticipo (${anticipos.total > 0 ? ((anticipos.actual / anticipos.total) * 100).toFixed(1) : "0.0"}%)</td>
                                    <td style="padding: 5px 8px; text-align: right; border: 1px solid #E5E7EB; color: #6B7280;">-${formatCurrency(anticipos.actual || 0, project?.Currency)}</td>
                                  </tr>
                                  <tr style="background-color: #FFFBEB;">
                                    <td style="padding: 6px 8px; border: 1px solid #E5E7EB; border-top: 2px solid #6B7280; color: #1F2937; font-weight: 700;">Subtotal Neto</td>
                                    <td style="padding: 6px 8px; text-align: right; border: 1px solid #E5E7EB; border-top: 2px solid #6B7280; color: #1F2937; font-weight: 700;">${formatCurrency(subtotalNeto, project?.Currency)}</td>
                                  </tr>
                                  <tr style="background-color: #F8FAFC;">
                                    <td style="padding: 5px 8px; border: 1px solid #E5E7EB; color: #6B7280;">IVA (19%)</td>
                                    <td style="padding: 5px 8px; text-align: right; border: 1px solid #E5E7EB; color: #6B7280;">${formatCurrency(ivaTotal, project?.Currency)}</td>
                                  </tr>
                                  <tr style="background-color: #FFFBEB;">
                                    <td style="padding: 7px 8px; border: 1px solid #E5E7EB; border-top: 3px solid #F5DF4D; color: #1F2937; font-weight: 800; font-size: 12px;">TOTAL</td>
                                    <td style="padding: 7px 8px; text-align: right; border: 1px solid #E5E7EB; border-top: 3px solid #F5DF4D; color: #1F2937; font-weight: 800; font-size: 12px;">${formatCurrency(totalFinal, project?.Currency)}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                              
                              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 5px;">
                                <div style="padding: 10px; background-color: #FFFBEB; border-radius: 6px; border: 2px solid #F5DF4D;">
                                  <h4 style="color: #1F2937; margin-bottom: 5px; font-size: 11px; font-weight: bold;">Control de Anticipos</h4>
                                  <table style="width: 100%; font-size: 11px;">
                                    <tr>
                                      <td style="color: #6B7280; padding: 5px 0;">Total Anticipos:</td>
                                      <td style="color: #1F2937; font-weight: 600; text-align: right;">${formatCurrency(anticipos.total || 0, project?.Currency)}</td>
                                    </tr>
                                    <tr>
                                      <td style="color: #6B7280; padding: 5px 0;">Devolución Actual:</td>
                                      <td style="color: #1F2937; font-weight: 600; text-align: right;">${formatCurrency(anticipos.actual || 0, project?.Currency)}</td>
                                    </tr>
                                    <tr>
                                      <td style="color: #6B7280; padding: 5px 0;">Devolución Acumulada:</td>
                                      <td style="color: #1F2937; font-weight: 600; text-align: right;">${formatCurrency(anticipos.acumulado || 0, project?.Currency)}</td>
                                    </tr>
                                    <tr style="border-top: 2px solid #F5DF4D;">
                                      <td style="color: #1F2937; padding: 5px 0 0 0; font-weight: 700;">Saldo por Devolver:</td>
                                      <td style="color: #1F2937; font-weight: 700; text-align: right; padding-top: 5px; font-size: 10px;">${formatCurrency((anticipos.total || 0) - (anticipos.acumulado || 0), project?.Currency)}</td>
                                    </tr>
                                  </table>
                                </div>
                                
                                <div style="padding: 5px; background-color: #F8FAFC; border-radius: 6px; border: 2px solid #6B7280;">
                                  <h4 style="color: #1F2937; margin-bottom: 5px; font-size: 11px; font-weight: bold;">Control de Retenciones</h4>
                                  <table style="width: 100%; font-size: 11px;">
                                    <tr>
                                      <td style="color: #6B7280; padding: 5px 0;">Total Retenciones:</td>
                                      <td style="color: #1F2937; font-weight: 600; text-align: right;">${formatCurrency(retenciones.total || 0, project?.Currency)}</td>
                                    </tr>
                                    <tr>
                                      <td style="color: #6B7280; padding: 5px 0;">Retención Actual:</td>
                                      <td style="color: #1F2937; font-weight: 600; text-align: right;">${formatCurrency(retenciones.actual || 0, project?.Currency)}</td>
                                    </tr>
                                    <tr>
                                      <td style="color: #6B7280; padding: 5px 0;">Retención Acumulada:</td>
                                      <td style="color: #1F2937; font-weight: 600; text-align: right;">${formatCurrency(retenciones.acumulado || 0, project?.Currency)}</td>
                                    </tr>
                                    <tr style="border-top: 2px solid #6B7280;">
                                      <td style="color: #1F2937; padding: 5px 0 0 0; font-weight: 700;">Saldo por Retener:</td>
                                      <td style="color: #1F2937; font-weight: 700; text-align: right; padding-top: 5px; font-size: 10px;">${formatCurrency((retenciones.total || 0) - (retenciones.acumulado || 0), project?.Currency)}</td>
                                    </tr>
                                  </table>
                                </div>
                              </div>
                          `;

                          // Tercera página - Desglose Detallado del Presupuesto
                          const page3 = document.createElement("div");
                          page3.style.padding = "20px";
                          page3.style.fontFamily = "Rubik, sans-serif";
                          page3.style.pageBreakAfter = "always";
                          page3.style.position = "relative";

                          // Crear filas de la tabla de presupuesto
                          const presupuestoRows = presupuesto
                            .map(
                              (item) => `
                            <tr style="border-bottom: 1px solid #e2e8f0;">
                              <td style="padding: 4px 6px; font-size: 9px; color: #1e293b; text-align: left;">${item.Item || "-"}</td>
                              <td style="padding: 4px 6px; font-size: 9px; color: #475569; text-align: center;">${item.Unidad || "-"}</td>
                              <td style="padding: 4px 6px; font-size: 9px; color: #475569; text-align: right;">${item.Cantidad || 0}</td>
                              <td style="padding: 4px 6px; font-size: 9px; color: #475569; text-align: right;">${formatCurrency(item.PU || 0, project?.Currency)}</td>
                              <td style="padding: 4px 6px; font-size: 9px; color: #1e293b; font-weight: 600; text-align: right;">${formatCurrency(item.Total || 0, project?.Currency)}</td>
                              <td style="padding: 4px 6px; font-size: 9px; color: #475569; text-align: right;">${(item["Avance Parcial"] || 0).toFixed(1)}%</td>
                              <td style="padding: 4px 6px; font-size: 9px; color: #475569; text-align: right;">${(item["Avance Acumulado"] || 0).toFixed(1)}%</td>
                              <td style="padding: 4px 6px; font-size: 8px; color: #6b7280; text-align: center;">${item["Ult. Actualizacion"] ? new Date(item["Ult. Actualizacion"]).toLocaleDateString("es-CL") : "-"}</td>
                            </tr>
                          `,
                            )
                            .join("");

                          page3.innerHTML = `
                            <!-- Logo Gloster -->
                            <div style="position: absolute; top: 20px; right: 20px; opacity: 0.7;">
                              <img 
                                src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
                                alt="Gloster Logo" 
                                style="width: 40px; height: 40px;"
                              />
                            </div>

                            <h2 style="color: #1e293b; margin-bottom: 12px; margin-top: 10px; font-size: 16px; font-weight: bold; text-align: center;">
                              Desglose Detallado del Presupuesto
                            </h2>
                            
                            <!-- Budget Detail Table -->
                            <table style="width: 100%; border-collapse: collapse; font-size: 9px;">
                              <thead>
                                <tr style="background-color: #FEF3C7; border-bottom: 2px solid #92400E;">
                                  <th style="padding: 6px 5px; text-align: left; font-weight: bold; color: #1e293b; font-size: 9px;">Ítem</th>
                                  <th style="padding: 6px 5px; text-align: center; font-weight: bold; color: #1e293b; font-size: 9px;">Unidad</th>
                                  <th style="padding: 6px 5px; text-align: right; font-weight: bold; color: #1e293b; font-size: 9px;">Cantidad</th>
                                  <th style="padding: 6px 5px; text-align: right; font-weight: bold; color: #1e293b; font-size: 9px;">P.U.</th>
                                  <th style="padding: 6px 5px; text-align: right; font-weight: bold; color: #1e293b; font-size: 9px;">Total</th>
                                  <th style="padding: 6px 5px; text-align: right; font-weight: bold; color: #1e293b; font-size: 9px;">Avance Parcial</th>
                                  <th style="padding: 6px 5px; text-align: right; font-weight: bold; color: #1e293b; font-size: 9px;">Avance Acum.</th>
                                  <th style="padding: 6px 5px; text-align: center; font-weight: bold; color: #1e293b; font-size: 9px;">Últ. Act.</th>
                                </tr>
                              </thead>
                              <tbody>
                                ${presupuestoRows}
                                <!-- Fila de Subtotal Costo Directo -->
                                <tr style="background-color: #FFFBEB; border-top: 2px solid #F5DF4D;">
                                  <td colspan="4" style="padding: 6px 5px; font-weight: 700; color: #1e293b; text-align: right; font-size: 10px;">Subtotal Costo Directo:</td>
                                  <td style="padding: 6px 5px; font-weight: 700; color: #1e293b; text-align: right; font-size: 10px;">${formatCurrency(subtotalCostoDirecto, project?.Currency)}</td>
                                  <td colspan="3"></td>
                                </tr>
                                <!-- Fila de Gastos Generales -->
                                <tr style="background-color: #F8FAFC;">
                                  <td colspan="4" style="padding: 5px 5px; color: #475569; text-align: right; font-size: 9px;">Gastos Generales (${gastosGenerales.toFixed(1)}%):</td>
                                  <td style="padding: 5px 5px; color: #475569; text-align: right; font-size: 9px;">${formatCurrency(subtotalCostoDirecto * (gastosGenerales / 100), project?.Currency)}</td>
                                  <td colspan="3"></td>
                                </tr>
                                <!-- Fila de Utilidad -->
                                <tr style="background-color: #FFFFFF;">
                                  <td colspan="4" style="padding: 5px 5px; color: #475569; text-align: right; font-size: 9px;">Utilidad (${utilidad.toFixed(1)}%):</td>
                                  <td style="padding: 5px 5px; color: #475569; text-align: right; font-size: 9px;">${formatCurrency(subtotalCostoDirecto * (utilidad / 100), project?.Currency)}</td>
                                  <td colspan="3"></td>
                                </tr>
                                <!-- Fila de Subtotal Neto -->
                                <tr style="background-color: #FFFBEB; border-top: 2px solid #6B7280;">
                                  <td colspan="4" style="padding: 6px 5px; font-weight: 700; color: #1e293b; text-align: right; font-size: 10px;">Subtotal Neto:</td>
                                  <td style="padding: 6px 5px; font-weight: 700; color: #1e293b; text-align: right; font-size: 10px;">${formatCurrency(valorTotalNeto, project?.Currency)}</td>
                                  <td colspan="3"></td>
                                </tr>
                                <!-- Fila de IVA -->
                                <tr style="background-color: #F8FAFC;">
                                  <td colspan="4" style="padding: 5px 5px; color: #475569; text-align: right; font-size: 9px;">IVA (19%):</td>
                                  <td style="padding: 5px 5px; color: #475569; text-align: right; font-size: 9px;">${formatCurrency(valorTotalIVA, project?.Currency)}</td>
                                  <td colspan="3"></td>
                                </tr>
                                <!-- Fila de Total con IVA -->
                                <tr style="background-color: #FFFBEB; border-top: 3px solid #F5DF4D;">
                                  <td colspan="4" style="padding: 7px 5px; font-weight: 800; color: #1e293b; text-align: right; font-size: 11px;">TOTAL CON IVA:</td>
                                  <td style="padding: 7px 5px; font-weight: 800; color: #1e293b; text-align: right; font-size: 11px;">${formatCurrency(valorTotalConIVA, project?.Currency)}</td>
                                  <td colspan="3"></td>
                                </tr>
                              </tbody>
                            </table>
                          `;

                          // Contenedor con las tres páginas
                          const container = document.createElement("div");
                          container.appendChild(page1);
                          container.appendChild(page2);
                          container.appendChild(page3);

                          const opt = {
                            margin: 10,
                            filename: `avance-presupuesto-${project?.Name || "proyecto"}.pdf`,
                            image: { type: "jpeg", quality: 0.98 },
                            html2canvas: { scale: 2 },
                            jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
                          };

                          await html2pdf().set(opt).from(container).save();

                          toast({
                            title: "PDF generado",
                            description: "El avance del presupuesto se ha exportado correctamente",
                          });
                        } catch (error) {
                          console.error("Error generando PDF:", error);
                          toast({
                            title: "Error",
                            description: "No se pudo generar el PDF",
                            variant: "destructive",
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
                          gastosGeneralesFromProject={gastosGenerales}
                          utilidadFromProject={utilidad}
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

                <TabsContent value="rfi" className="space-y-6">
                  <Card className="mb-6">
                    <CardHeader>
                      <CardTitle className="text-xl font-rubik">RFI - Solicitudes de Información</CardTitle>
                      <CardDescription className="font-rubik">
                        Gestiona las solicitudes de información del proyecto
                      </CardDescription>
                    </CardHeader>
                  </Card>
                  {renderControls(
                    rfiSearch, 
                    setRfiSearch, 
                    'Nuevo RFI', 
                    () => setShowRFIForm(true)
                  )}
                  <RFICards 
                    rfis={rfis}
                    loading={rfisLoading}
                    onCardClick={handleRFICardClick}
                  />
                </TabsContent>
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

      <RFIForm
        open={showRFIForm}
        onOpenChange={setShowRFIForm}
        projectId={id || ''}
        onSuccess={refetchRfis}
      />

      <RFIDetailModal
        open={showRFIDetailModal}
        onOpenChange={setShowRFIDetailModal}
        rfi={selectedRFI}
        isMandante={false}
        isContratista={userType === 'contratista'}
        projectId={id}
        userEmail={userEntity?.ContactEmail || user?.email || ''}
        userName={userEntity?.ContactName || user?.user_metadata?.full_name || ''}
        onSuccess={refetchRfis}
      />
    </div>
  );
};

export default ProjectDetail;