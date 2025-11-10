
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DollarSign, FileText, FolderOpen, Plus, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/PageHeader';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowUpDown, Filter } from 'lucide-react';
import { useProjectsWithDetails } from '@/hooks/useProjectsWithDetails';
import TotalContractsValue from '@/components/TotalContractsValue';
import TotalApprovedValue from '@/components/TotalApprovedValue';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreateProjectDialogOpen, setIsCreateProjectDialogOpen] = useState(false);
  const { projects, contractor, loading } = useProjectsWithDetails();

  // CRITICAL: STRICT verification for contractor dashboard - ONLY authenticated contractors
  useEffect(() => {
    const verifyStrictContractorAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user?.id) {
          console.log('❌ No authenticated user for contractor dashboard');
          navigate('/');
          return;
        }

        // STRICT: Verify user is authenticated contractor with user_auth_id
        const { data: contratistaData } = await supabase
          .from('Contratistas')
          .select('id, auth_user_id')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (!contratistaData || contratistaData.auth_user_id !== user.id) {
          console.log('❌ Access DENIED: User is not an authenticated contratista with user_auth_id');
          
          // Only redirect to mandante if they explicitly don't have contractor role
          const { data: mandanteData } = await supabase
            .from('Mandantes')
            .select('id, auth_user_id')
            .eq('auth_user_id', user.id)
            .maybeSingle();
            
          if (mandanteData && mandanteData.auth_user_id === user.id) {
            console.log('🔄 User is mandante, not contractor - redirecting to mandante dashboard');
            navigate('/dashboard-mandante');
          } else {
            console.log('❌ User has no valid role, redirecting to home');
            navigate('/');
          }
          return;
        }

        // REMOVED: Don't auto-redirect based on activeRole - respect current page
        // Users with multiple roles should use role selector to switch
        console.log('✅ Contractor access verified, staying on contractor dashboard');

        console.log('✅ Verified authenticated contractor access');
      } catch (error) {
        console.error('Error verifying contractor access:', error);
        navigate('/');
      }
    };

    verifyStrictContractorAccess();
  }, [navigate]);

  const handleCreateProject = () => {
    setIsCreateProjectDialogOpen(true);
  };

  const handleContactGloster = () => {
    toast({
      title: "Contactando equipo Gloster",
      description: "Te redirigiremos a nuestro formulario de contacto",
    });
    window.open('mailto:soporte.gloster@gmail.com?subject=Solicitud%20de%20Creación%20de%20Nuevo%20Proyecto', '_blank');
    setIsCreateProjectDialogOpen(false);
  };

  const formatCurrency = (amount: number, currency: string = 'CLP') => {
    const currencyMap: { [key: string]: Intl.NumberFormatOptions } = {
      'CLP': { style: 'currency' as const, currency: 'CLP', minimumFractionDigits: 0 },
      '$': { style: 'currency' as const, currency: 'CLP', minimumFractionDigits: 0 },
      'USD': { style: 'currency' as const, currency: 'USD', minimumFractionDigits: 0 },
      'UF': { style: 'decimal' as const, minimumFractionDigits: 2 }
    };

    const config = currencyMap[currency] || currencyMap.CLP;
    
    if (currency === 'UF') {
      return `UF ${new Intl.NumberFormat('es-CL', config).format(amount)}`;
    }
    
    if (currency === 'USD') {
      return `US$${new Intl.NumberFormat('es-CL', { minimumFractionDigits: 0 }).format(amount)}`;
    }
    
    return new Intl.NumberFormat('es-CL', config).format(amount);
  };

  const getProjectProgress = (project: any) => {
    if (!project.EstadosPago || project.EstadosPago.length === 0 || !project.Budget) return 0;
    
    const approvedAmount = project.EstadosPago
      .filter((payment: any) => payment.Status === 'Aprobado' || payment.Completion === true)
      .reduce((sum: number, payment: any) => sum + (payment.Total || 0), 0);
    
    return Math.round((approvedAmount / project.Budget) * 100);
  };

  const getProjectApprovedValue = (project: any) => {
    if (!project.EstadosPago || project.EstadosPago.length === 0) return 0;
    
    return project.EstadosPago
      .filter((payment: any) => payment.Status === 'Aprobado' || payment.Completion === true)
      .reduce((sum: number, payment: any) => sum + (payment.Total || 0), 0);
  };

  // Remove totalApprovedValueUF calculation as it's now in TotalApprovedValue component

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <PageHeader />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">Cargando proyectos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <PageHeader />

      <div className="container mx-auto px-6 py-8">
        {/* Page Title */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2 font-rubik">
              Mis Proyectos - {contractor?.CompanyName || 'Cargando...'}
            </h2>
            <p className="text-gloster-gray font-rubik">Gestiona tus proyectos activos y estados de pago</p>
          </div>
          
          <Dialog open={isCreateProjectDialogOpen} onOpenChange={setIsCreateProjectDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={handleCreateProject}
                className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-semibold font-rubik"
              >
                <Plus className="h-4 w-4 mr-2" />
                Crear Nuevo Proyecto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2 font-rubik">
                  <AlertCircle className="h-5 w-5 text-gloster-yellow" />
                  <span>Función Premium</span>
                </DialogTitle>
                <DialogDescription className="font-rubik">
                  La creación de nuevos proyectos está fuera del período de prueba gratuita.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-gloster-gray font-rubik">
                  Para acceder a esta funcionalidad y crear nuevos proyectos, necesitas contactar 
                  directamente con el equipo de Gloster.
                </p>
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateProjectDialogOpen(false)}
                    className="flex-1 font-rubik"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleContactGloster}
                    className="flex-1 bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
                  >
                    Contactar Gloster
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
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
              <div className="text-2xl font-bold text-slate-800 font-rubik">{projects.length}</div>
            </CardContent>
          </Card>

          <TotalContractsValue projects={projects} />

          <TotalApprovedValue projects={projects} />
        </div>

        {/* Barra de búsqueda y filtros - POSICIONADA CORRECTAMENTE ABAJO DE SUMMARY CARDS */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gloster-gray h-4 w-4" />
              <Input
                placeholder="Buscar proyectos por nombre, descripción, ubicación..."
                className="pl-10 font-rubik"
              />
            </div>
          </div>
          
          <Select defaultValue="recientes">
            <SelectTrigger className="font-rubik">
              <SelectValue>
                <div className="flex items-center">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <span>Por Recientes</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recientes">Por Recientes</SelectItem>
              <SelectItem value="nombre">Por Nombre</SelectItem>
              <SelectItem value="progreso">Por Progreso</SelectItem>
              <SelectItem value="monto">Por Monto</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="todos">
            <SelectTrigger className="font-rubik">
              <SelectValue>
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  <span>Todos</span>
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="activos">Activos</SelectItem>
              <SelectItem value="pendientes">Pendientes</SelectItem>
              <SelectItem value="completados">Completados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Projects Mosaic Grid */}
        {projects.length === 0 ? (
          <Card className="p-8 text-center">
            <CardContent>
              <p className="text-gloster-gray font-rubik">No tienes proyectos asignados actualmente.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project) => {
              const progress = getProjectProgress(project);
              const approvedValue = getProjectApprovedValue(project);
              
              return (
                <Card 
                  key={project.id} 
                  className="hover:shadow-xl transition-all duration-300 cursor-pointer border-gloster-gray/20 hover:border-gloster-yellow/50"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg text-slate-800 leading-tight font-rubik">{project.Name}</CardTitle>
                        <CardDescription className="text-gloster-gray text-sm font-rubik">
                          {project.Description}
                        </CardDescription>
                        <div className="flex items-center space-x-2 text-xs text-gloster-gray/80">
                          <span className="font-rubik">{project.Owner?.CompanyName}</span>
                          <span>•</span>
                          <span className="font-rubik">{project.Location}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-gloster-yellow/20 text-gloster-gray border-gloster-yellow/30 font-rubik">
                        {project.Status ? 'activo' : 'inactivo'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gloster-gray font-rubik">Progreso</span>
                        <span className="font-medium text-slate-800 font-rubik">{progress}%</span>
                      </div>
                      <div className="w-full bg-gloster-gray/20 rounded-full h-2">
                        <div 
                          className="bg-gloster-yellow h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gloster-gray font-rubik">Valor total:</span>
                        <span className="font-semibold text-slate-800 font-rubik">
                          {formatCurrency(project.Budget || 0, project.Currency || 'CLP')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gloster-gray font-rubik">Aprobado:</span>
                        <span className="font-semibold text-green-600 font-rubik">
                          {formatCurrency(approvedValue, project.Currency || 'CLP')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gloster-gray font-rubik">Pendiente:</span>
                        <span className="font-semibold text-red-600 font-rubik">
                          {formatCurrency((project.Budget || 0) - approvedValue, project.Currency || 'CLP')}
                        </span>
                      </div>
                    </div>

                    <Button 
                      onClick={() => navigate(`/project/${project.id}`)}
                      className="w-full bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-semibold font-rubik"
                      size="sm"
                    >
                      Ver Detalles
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
