import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar, MapPin, Building2, User, Phone, Mail, FileText, CheckCircle, Clock, AlertCircle, XCircle, LogOut, DollarSign, FolderOpen, Search, Filter, ArrowUpDown, Plus, Folder, ChevronRight, ChevronDown, Edit2, Trash2 } from 'lucide-react';
import { useProjectsWithDetailsMandante } from '@/hooks/useProjectsWithDetailsMandante';
import { formatCurrency } from '@/utils/currencyUtils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ProjectFolder {
  id: string;
  name: string;
  projectIds: number[];
}

const DashboardMandante: React.FC = () => {
  const { projects, mandante, loading } = useProjectsWithDetailsMandante();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [mandanteInfo, setMandanteInfo] = useState<{
    ContactName: string;
    CompanyName: string;
  } | null>(null);
  
  // Estados para filtros y búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recibidos'); // 'recibidos', 'name', 'date', 'budget'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive'
  
  // Estados para carpetas
  const [folders, setFolders] = useState<ProjectFolder[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedProjectsForFolder, setSelectedProjectsForFolder] = useState<number[]>([]);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');

  useEffect(() => {
    const fetchMandanteInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        const { data: mandanteData, error } = await supabase
          .from('Mandantes')
          .select('ContactName, CompanyName')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (!error && mandanteData) {
          setMandanteInfo(mandanteData);
        }
      } catch (error) {
        console.error('Error fetching mandante info:', error);
      }
    };

    fetchMandanteInfo();
  }, []);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/');
    }
  };

  const getProjectProgress = (project: any) => {
    if (!project.EstadosPago || project.EstadosPago.length === 0 || !project.Budget) return 0;
    
    // Calcular el monto total aprobado
    const approvedAmount = project.EstadosPago
      .filter(payment => payment.Status === 'Aprobado')
      .reduce((sum, payment) => sum + (payment.Total || 0), 0);
    
    // Calcular progreso basado en monto aprobado vs presupuesto total
    return Math.round((approvedAmount / project.Budget) * 100);
  };

  const getProjectApprovedValue = (project: any) => {
    if (!project.EstadosPago || project.EstadosPago.length === 0) return 0;
    
    return project.EstadosPago
      .filter(payment => payment.Status === 'Aprobado')
      .reduce((sum, payment) => sum + (payment.Total || 0), 0);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Aprobado':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Enviado':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'Rechazado':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'Pendiente':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aprobado':
        return 'bg-green-100 text-green-800';
      case 'Enviado':
        return 'bg-blue-100 text-blue-800';
      case 'Rechazado':
        return 'bg-red-100 text-red-800';
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'Programado':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
        return 'Programado';
      case 'Programado':
        return 'Programado';
      default:
        return status;
    }
  };

  const handlePaymentClick = (paymentId: number) => {
    // Almacenar datos de acceso del mandante en sessionStorage para evitar verificación
    const accessData = {
      paymentId: paymentId.toString(),
      token: 'mandante_authenticated',
      timestamp: Date.now()
    };
    sessionStorage.setItem('mandanteAccess', JSON.stringify(accessData));
    navigate(`/submission/${paymentId}`);
  };

  const handleProjectDetails = (projectId: number) => {
    // Almacenar datos de acceso del mandante en sessionStorage para evitar verificación
    const accessData = {
      projectId: projectId.toString(),
      token: 'mandante_authenticated',
      timestamp: Date.now()
    };
    sessionStorage.setItem('mandanteAccess', JSON.stringify(accessData));
    navigate(`/project-mandante/${projectId}`);
  };

  const totalActiveProjects = projects.filter(p => p.Status).length;
  
  // Calcular totales por moneda
  const totalsByCurrency = projects.reduce((acc, project) => {
    const currency = project.Currency || 'CLP';
    if (!acc[currency]) {
      acc[currency] = 0;
    }
    acc[currency] += project.Budget || 0;
    return acc;
  }, {} as Record<string, number>);

  // Calcular totales aprobados por moneda
  const totalApprovedByCurrency = projects.reduce((acc, project) => {
    const currency = project.Currency || 'CLP';
    const approvedValue = getProjectApprovedValue(project);
    if (!acc[currency]) {
      acc[currency] = 0;
    }
    acc[currency] += approvedValue;
    return acc;
  }, {} as Record<string, number>);

  // Función para verificar si un proyecto tiene estados "Recibido" (Enviado)
  const hasReceivedPayments = (project: any) => {
    return project.EstadosPago?.some(payment => payment.Status === 'Enviado') || false;
  };

  // Función para filtrar y ordenar proyectos
  const filteredAndSortedProjects = useMemo(() => {
    let filtered = [...projects];

    // Aplicar filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(project => 
        project.Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.Description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.Location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.Contratista?.CompanyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.Contratista?.ContactName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtro de estado
    if (filterStatus !== 'all') {
      filtered = filtered.filter(project => 
        filterStatus === 'active' ? project.Status : !project.Status
      );
    }

    // Aplicar ordenamiento
    switch (sortBy) {
      case 'recibidos':
        // Ordenar por proyectos con estados recibidos primero, luego por nombre
        filtered.sort((a, b) => {
          const aHasReceived = hasReceivedPayments(a);
          const bHasReceived = hasReceivedPayments(b);
          if (aHasReceived && !bHasReceived) return -1;
          if (!aHasReceived && bHasReceived) return 1;
          return (a.Name || '').localeCompare(b.Name || '');
        });
        break;
      case 'name':
        filtered.sort((a, b) => (a.Name || '').localeCompare(b.Name || ''));
        break;
      case 'date':
        filtered.sort((a, b) => new Date(b.StartDate).getTime() - new Date(a.StartDate).getTime());
        break;
      case 'budget':
        filtered.sort((a, b) => (b.Budget || 0) - (a.Budget || 0));
        break;
      default:
        break;
    }

    return filtered;
  }, [projects, searchTerm, filterStatus, sortBy]);

  // Función para crear carpeta
  const handleCreateFolder = () => {
    if (!newFolderName.trim() || selectedProjectsForFolder.length === 0) return;
    
    const newFolder: ProjectFolder = {
      id: Date.now().toString(),
      name: newFolderName.trim(),
      projectIds: [...selectedProjectsForFolder]
    };
    
    setFolders(prev => [...prev, newFolder]);
    setNewFolderName('');
    setSelectedProjectsForFolder([]);
    setIsCreateFolderOpen(false);
  };

  // Función para obtener proyectos no asignados a carpetas
  const getUnassignedProjects = () => {
    const assignedProjectIds = new Set(folders.flatMap(folder => folder.projectIds));
    return filteredAndSortedProjects.filter(project => !assignedProjectIds.has(project.id));
  };

  // Función para alternar expansión de carpeta
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  // Función para obtener proyectos de una carpeta
  const getFolderProjects = (folder: ProjectFolder) => {
    return filteredAndSortedProjects.filter(project => folder.projectIds.includes(project.id));
  };

  // Función para editar carpeta
  const handleEditFolder = (folderId: string, currentName: string) => {
    setEditingFolder(folderId);
    setEditFolderName(currentName);
  };

  // Función para guardar edición de carpeta
  const handleSaveEditFolder = () => {
    if (!editFolderName.trim() || !editingFolder) return;
    
    setFolders(prev => prev.map(folder => 
      folder.id === editingFolder 
        ? { ...folder, name: editFolderName.trim() }
        : folder
    ));
    
    setEditingFolder(null);
    setEditFolderName('');
  };

  // Función para cancelar edición
  const handleCancelEdit = () => {
    setEditingFolder(null);
    setEditFolderName('');
  };

  // Función para eliminar carpeta
  const handleDeleteFolder = (folderId: string) => {
    setFolders(prev => prev.filter(folder => folder.id !== folderId));
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      newSet.delete(folderId);
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gloster-yellow mx-auto mb-4"></div>
          <p className="text-gloster-gray">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <header className="bg-white border-b border-gloster-gray/20 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
                alt="Gloster Logo" 
                className="w-8 h-8"
              />
              <div>
                <h1 className="text-xl font-bold text-slate-800 font-rubik">Dashboard Mandante</h1>
                <p className="text-sm text-gloster-gray font-rubik">
                  Gestiona tus proyectos y estados de pago
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gloster-gray">
                <User className="h-4 w-4" />
                <span className="text-sm font-rubik">
                  {mandanteInfo?.ContactName && mandanteInfo?.CompanyName 
                    ? `${mandanteInfo.ContactName} - ${mandanteInfo.CompanyName}` 
                    : 'Usuario Mandante'}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="text-gloster-gray hover:text-slate-800 border-gloster-gray/30 font-rubik"
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2 font-rubik">
              Mis Proyectos - {mandanteInfo?.CompanyName || 'Cargando...'}
            </h2>
            <p className="text-gloster-gray font-rubik">Gestiona tus proyectos activos y estados de pago</p>
          </div>
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-gloster-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gloster-gray font-rubik">
                Proyectos Activos
              </CardTitle>
              <div className="w-8 h-8 bg-gloster-yellow/20 rounded-lg flex items-center justify-center">
                <FolderOpen className="h-4 w-4 text-gloster-gray" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800 font-rubik">{totalActiveProjects}</div>
              <p className="text-xs text-gloster-gray font-rubik">
                {projects.length} proyectos totales
              </p>
            </CardContent>
          </Card>

          <Card className="border-gloster-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gloster-gray font-rubik">Total Contratos</CardTitle>
              <div className="w-8 h-8 bg-gloster-yellow/20 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-gloster-gray" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(totalsByCurrency).map(([currency, total]) => (
                  <div key={currency} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gloster-gray font-rubik">{currency}:</span>
                    <span className="text-lg font-bold text-slate-800 font-rubik">
                      {formatCurrency(total, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-gloster-gray/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gloster-gray font-rubik">Total Aprobado</CardTitle>
              <div className="w-8 h-8 bg-gloster-yellow/20 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-gloster-gray" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Object.entries(totalApprovedByCurrency).map(([currency, total]) => (
                  <div key={currency} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gloster-gray font-rubik">{currency}:</span>
                    <span className="text-lg font-bold text-green-600 font-rubik">
                      {formatCurrency(total, currency)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de proyectos con filtros y búsqueda */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-slate-800 font-rubik">Mis Proyectos</h2>
            
            {/* Botón crear carpeta */}
            <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="font-rubik">
                  <Folder className="h-4 w-4 mr-2" />
                  Crear Carpeta
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-rubik">Crear Nueva Carpeta</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="folder-name" className="font-rubik">Nombre de la carpeta</Label>
                    <Input
                      id="folder-name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="ej: Pocuro 347"
                      className="font-rubik"
                    />
                  </div>
                  <div>
                    <Label className="font-rubik">Seleccionar proyectos</Label>
                    <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-2">
                      {filteredAndSortedProjects.map((project) => (
                        <div key={project.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`project-${project.id}`}
                            checked={selectedProjectsForFolder.includes(project.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProjectsForFolder(prev => [...prev, project.id]);
                              } else {
                                setSelectedProjectsForFolder(prev => prev.filter(id => id !== project.id));
                              }
                            }}
                          />
                          <label htmlFor={`project-${project.id}`} className="text-sm font-rubik cursor-pointer">
                            {project.Name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)} className="font-rubik">
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateFolder} className="font-rubik">
                      Crear Carpeta
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Controles de búsqueda y filtros */}
          <Card className="border-gloster-gray/20">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Barra de búsqueda */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gloster-gray h-4 w-4" />
                  <Input
                    placeholder="Buscar proyectos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 font-rubik"
                  />
                </div>

                {/* Ordenamiento */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="font-rubik">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recibidos" className="font-rubik">Estados Recibidos Primero</SelectItem>
                    <SelectItem value="name" className="font-rubik">Nombre A-Z</SelectItem>
                    <SelectItem value="date" className="font-rubik">Fecha Más Reciente</SelectItem>
                    <SelectItem value="budget" className="font-rubik">Presupuesto Mayor</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filtro por estado */}
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="font-rubik">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filtrar estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="font-rubik">Todos los Proyectos</SelectItem>
                    <SelectItem value="active" className="font-rubik">Solo Activos</SelectItem>
                    <SelectItem value="inactive" className="font-rubik">Solo Inactivos</SelectItem>
                  </SelectContent>
                </Select>

                {/* Contador de resultados */}
                <div className="flex items-center justify-center text-sm text-gloster-gray font-rubik">
                  {filteredAndSortedProjects.length} de {projects.length} proyectos
                </div>
              </div>
            </CardContent>
          </Card>
          
          {projects.length === 0 ? (
            <Card className="border-gloster-gray/20">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="h-12 w-12 text-gloster-gray mb-4" />
                <h3 className="text-lg font-medium text-slate-800 mb-2 font-rubik">No hay proyectos</h3>
                <p className="text-gloster-gray text-center max-w-md font-rubik">
                  Aún no tienes proyectos asignados como mandante.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Carpetas */}
              {folders.map((folder) => {
                const folderProjects = getFolderProjects(folder);
                if (folderProjects.length === 0) return null;

                return (
                  <Card key={folder.id} className="border-gloster-gray/20">
                    <CardHeader>
                      <div className="flex items-center justify-between w-full">
                        <button
                          onClick={() => toggleFolder(folder.id)}
                          className="flex items-center gap-2 hover:bg-slate-50 rounded-lg p-2 transition-colors"
                        >
                          <Folder className="h-5 w-5 text-gloster-yellow" />
                          {editingFolder === folder.id ? (
                            <Input
                              value={editFolderName}
                              onChange={(e) => setEditFolderName(e.target.value)}
                              className="text-lg font-semibold text-slate-800 font-rubik h-8 min-w-0"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveEditFolder();
                                } else if (e.key === 'Escape') {
                                  handleCancelEdit();
                                }
                              }}
                              autoFocus
                            />
                          ) : (
                            <h3 className="text-lg font-semibold text-slate-800 font-rubik">{folder.name}</h3>
                          )}
                          <Badge variant="secondary" className="bg-gloster-yellow/20 text-gloster-gray font-rubik">
                            {folderProjects.length} proyectos
                          </Badge>
                          {expandedFolders.has(folder.id) ? 
                            <ChevronDown className="h-5 w-5 text-gloster-gray" /> : 
                            <ChevronRight className="h-5 w-5 text-gloster-gray" />
                          }
                        </button>
                        
                        <div className="flex items-center gap-2">
                          {editingFolder === folder.id ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleSaveEditFolder}
                                className="h-8 w-8 p-0"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEdit}
                                className="h-8 w-8 p-0"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditFolder(folder.id, folder.name)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteFolder(folder.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    {expandedFolders.has(folder.id) && (
                      <CardContent>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {folderProjects.map((project) => {
                            const progress = getProjectProgress(project);
                            const approvedValue = getProjectApprovedValue(project);

                            return (
                              <Card 
                                key={project.id} 
                                className="overflow-hidden border-gloster-gray/20 hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-gloster-yellow/50"
                              >
                                <CardHeader>
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <CardTitle className="text-xl mb-2 text-slate-800 font-rubik">
                                        {project.Name}
                                        {hasReceivedPayments(project) && (
                                          <Badge className="ml-2 bg-blue-100 text-blue-800 font-rubik">
                                            Estados Recibidos
                                          </Badge>
                                        )}
                                      </CardTitle>
                                      <CardDescription className="text-sm text-gloster-gray font-rubik">
                                        {project.Description}
                                      </CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="bg-gloster-yellow/20 text-gloster-gray border-gloster-yellow/30 text-xs font-rubik">
                                      {project.Status ? "Activo" : "Inactivo"}
                                    </Badge>
                                  </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                  {/* Información del proyecto */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-4 h-4 text-gloster-gray" />
                                      <span className="text-gloster-gray font-rubik">{project.Location}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4 text-gloster-gray" />
                                      <span className="text-gloster-gray font-rubik">{new Date(project.StartDate).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Building2 className="w-4 h-4 text-gloster-gray" />
                                      <span className="text-gloster-gray font-rubik">{project.Contratista?.CompanyName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4 text-gloster-gray" />
                                      <span className="text-gloster-gray font-rubik">{project.Contratista?.ContactName}</span>
                                    </div>
                                  </div>

                                  {/* Progreso del proyecto */}
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm font-medium text-gloster-gray font-rubik">Progreso del Proyecto</span>
                                      <span className="text-sm text-slate-800 font-rubik">{progress}%</span>
                                    </div>
                                    <div className="w-full bg-gloster-gray/20 rounded-full h-2">
                                      <div 
                                        className="bg-gloster-yellow h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                      ></div>
                                    </div>
                                  </div>

                                  {/* Información financiera */}
                                  <div className="flex justify-between items-center pt-2 border-t border-gloster-gray/20">
                                    <div>
                                      <p className="text-sm text-gloster-gray font-rubik">Presupuesto Total</p>
                                      <p className="font-semibold text-slate-800 font-rubik">{formatCurrency(project.Budget, project.Currency)}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-gloster-gray font-rubik">Total Aprobado</p>
                                      <p className="font-semibold text-green-600 font-rubik">{formatCurrency(approvedValue, project.Currency)}</p>
                                    </div>
                                  </div>

                                  {/* Estados recibidos para aprobación rápida */}
                                  {project.EstadosPago && project.EstadosPago.length > 0 && (
                                    <div className="space-y-2">
                                      <h4 className="text-sm font-medium text-slate-800 font-rubik">Estados Recibidos para Aprobación</h4>
                                      <div className="grid gap-2 max-h-32 overflow-y-auto">
                                        {project.EstadosPago
                                          .filter(payment => payment.Status === 'Enviado')
                                          .map((payment) => (
                                          <div 
                                            key={payment.id} 
                                            className="flex items-center justify-between p-2 rounded border text-sm cursor-pointer hover:bg-blue-50 border-blue-200"
                                            onClick={() => handlePaymentClick(payment.id)}
                                          >
                                            <div className="flex items-center gap-2">
                                              {getStatusIcon(payment.Status)}
                                              <span className="font-medium text-slate-800 font-rubik">{payment.Name}</span>
                                              <Badge className={`text-xs ${getStatusColor(payment.Status)} font-rubik`}>
                                                {getDisplayStatus(payment.Status)}
                                              </Badge>
                                            </div>
                                            <div className="text-right">
                                              <div className="font-medium text-slate-800 font-rubik">
                                                {formatCurrency(payment.Total, project.Currency)}
                                              </div>
                                              <div className="text-xs text-gloster-gray font-rubik">
                                                {payment.ExpiryDate}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                        {project.EstadosPago.filter(payment => payment.Status === 'Enviado').length === 0 && (
                                          <div className="text-sm text-gloster-gray text-center py-2 font-rubik">
                                            No hay estados recibidos para aprobación
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Botón ver detalles */}
                                  <div className="pt-4 border-t border-gloster-gray/20">
                                    <Button 
                                      onClick={() => handleProjectDetails(project.id)}
                                      className="w-full bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-semibold font-rubik"
                                      size="sm"
                                    >
                                      Ver Más Información del Proyecto
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}

              {/* Proyectos sin asignar a carpetas */}
              {getUnassignedProjects().length > 0 && (
                <div>
                  {folders.length > 0 && (
                    <h3 className="text-lg font-semibold text-slate-800 font-rubik mb-4">
                      Proyectos Individuales
                    </h3>
                  )}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {getUnassignedProjects().map((project) => {
                      const progress = getProjectProgress(project);
                      const approvedValue = getProjectApprovedValue(project);

                      return (
                        <Card 
                          key={project.id} 
                          className="overflow-hidden border-gloster-gray/20 hover:shadow-xl transition-all duration-300 cursor-pointer hover:border-gloster-yellow/50"
                        >
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-xl mb-2 text-slate-800 font-rubik">
                                  {project.Name}
                                  {hasReceivedPayments(project) && (
                                    <Badge className="ml-2 bg-blue-100 text-blue-800 font-rubik">
                                      Estados Recibidos
                                    </Badge>
                                  )}
                                </CardTitle>
                                <CardDescription className="text-sm text-gloster-gray font-rubik">
                                  {project.Description}
                                </CardDescription>
                              </div>
                              <Badge variant="secondary" className="bg-gloster-yellow/20 text-gloster-gray border-gloster-yellow/30 text-xs font-rubik">
                                {project.Status ? "Activo" : "Inactivo"}
                              </Badge>
                            </div>
                          </CardHeader>

                          <CardContent className="space-y-4">
                            {/* Información del proyecto */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-gloster-gray" />
                                <span className="text-gloster-gray font-rubik">{project.Location}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gloster-gray" />
                                <span className="text-gloster-gray font-rubik">{new Date(project.StartDate).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-gloster-gray" />
                                <span className="text-gloster-gray font-rubik">{project.Contratista?.CompanyName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gloster-gray" />
                                <span className="text-gloster-gray font-rubik">{project.Contratista?.ContactName}</span>
                              </div>
                            </div>

                            {/* Progreso del proyecto */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gloster-gray font-rubik">Progreso del Proyecto</span>
                                <span className="text-sm text-slate-800 font-rubik">{progress}%</span>
                              </div>
                              <div className="w-full bg-gloster-gray/20 rounded-full h-2">
                                <div 
                                  className="bg-gloster-yellow h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${progress}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Información financiera */}
                            <div className="flex justify-between items-center pt-2 border-t border-gloster-gray/20">
                              <div>
                                <p className="text-sm text-gloster-gray font-rubik">Presupuesto Total</p>
                                <p className="font-semibold text-slate-800 font-rubik">{formatCurrency(project.Budget, project.Currency)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gloster-gray font-rubik">Total Aprobado</p>
                                <p className="font-semibold text-green-600 font-rubik">{formatCurrency(approvedValue, project.Currency)}</p>
                              </div>
                            </div>

                            {/* Estados recibidos para aprobación rápida */}
                            {project.EstadosPago && project.EstadosPago.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-slate-800 font-rubik">Estados Recibidos para Aprobación</h4>
                                <div className="grid gap-2 max-h-32 overflow-y-auto">
                                  {project.EstadosPago
                                    .filter(payment => payment.Status === 'Enviado')
                                    .map((payment) => (
                                    <div 
                                      key={payment.id} 
                                      className="flex items-center justify-between p-2 rounded border text-sm cursor-pointer hover:bg-blue-50 border-blue-200"
                                      onClick={() => handlePaymentClick(payment.id)}
                                    >
                                      <div className="flex items-center gap-2">
                                        {getStatusIcon(payment.Status)}
                                        <span className="font-medium text-slate-800 font-rubik">{payment.Name}</span>
                                        <Badge className={`text-xs ${getStatusColor(payment.Status)} font-rubik`}>
                                          {getDisplayStatus(payment.Status)}
                                        </Badge>
                                      </div>
                                      <div className="text-right">
                                        <div className="font-medium text-slate-800 font-rubik">
                                          {formatCurrency(payment.Total, project.Currency)}
                                        </div>
                                        <div className="text-xs text-gloster-gray font-rubik">
                                          {payment.ExpiryDate}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                  {project.EstadosPago.filter(payment => payment.Status === 'Enviado').length === 0 && (
                                    <div className="text-sm text-gloster-gray text-center py-2 font-rubik">
                                      No hay estados recibidos para aprobación
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Botón ver detalles */}
                            <div className="pt-4 border-t border-gloster-gray/20">
                              <Button 
                                onClick={() => handleProjectDetails(project.id)}
                                className="w-full bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-semibold font-rubik"
                                size="sm"
                              >
                                Ver Más Información del Proyecto
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mensaje cuando no hay proyectos filtrados */}
              {filteredAndSortedProjects.length === 0 && projects.length > 0 && (
                <Card className="border-gloster-gray/20">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Search className="h-12 w-12 text-gloster-gray mb-4" />
                    <h3 className="text-lg font-medium text-slate-800 mb-2 font-rubik">No se encontraron proyectos</h3>
                    <p className="text-gloster-gray text-center max-w-md font-rubik">
                      No hay proyectos que coincidan con los filtros actuales. Intenta ajustar la búsqueda o los filtros.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardMandante;