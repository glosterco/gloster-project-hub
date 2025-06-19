
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, Plus, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useProjectsWithDetails } from '@/hooks/useProjectsWithDetails';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import LoginForm from '@/components/auth/LoginForm';

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { signOut } = useAuth();
  const { toast } = useToast();
  
  // Solo cargar proyectos si hay usuario autenticado
  const { projects, loading: projectsLoading } = useProjectsWithDetails();

  useEffect(() => {
    // Verificar sesión actual
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      setLoading(false);
    };

    getSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/');
    }
  };

  const handleLoginSuccess = () => {
    toast({
      title: "Bienvenido",
      description: "Has iniciado sesión exitosamente",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aprobado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Rechazado':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Programado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Aprobado':
        return <CheckCircle className="h-4 w-4" />;
      case 'Pendiente':
        return <Clock className="h-4 w-4" />;
      case 'Rechazado':
        return <AlertCircle className="h-4 w-4" />;
      case 'Programado':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getNextPayment = (project: any) => {
    if (!project.EstadosPago || project.EstadosPago.length === 0) return null;
    
    // Find the first payment that is not completed and is either pending or scheduled
    const nextPayment = project.EstadosPago.find((payment: any) => 
      !payment.Completion && (payment.Status === 'Pendiente' || payment.Status === 'Programado')
    );
    
    return nextPayment;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">Cargando...</div>
        </div>
      </div>
    );
  }

  if (!user) {
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
                <h1 className="text-xl font-bold text-slate-800 font-rubik">Gloster</h1>
              </div>
              <Button 
                onClick={() => navigate('/register')}
                className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
              >
                Crear Cuenta
              </Button>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-6 py-16">
          <div className="max-w-md mx-auto">
            <LoginForm onSuccess={handleLoginSuccess} />
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 font-rubik">
                ¿No tienes cuenta?{' '}
                <button 
                  onClick={() => navigate('/register')}
                  className="text-gloster-yellow hover:underline font-medium"
                >
                  Regístrate aquí
                </button>
              </p>
            </div>
          </div>
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
              <h1 className="text-xl font-bold text-slate-800 font-rubik">Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 text-sm text-slate-600">
                <User className="h-4 w-4" />
                <span className="font-rubik">{user.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="font-rubik"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 font-rubik">Mis Proyectos</h2>
            <Button 
              onClick={() => navigate('/register')}
              className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Proyecto
            </Button>
          </div>

          {projectsLoading ? (
            <div className="text-center py-8">
              <p className="text-gloster-gray font-rubik">Cargando proyectos...</p>
            </div>
          ) : projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => {
                const nextPayment = getNextPayment(project);
                
                return (
                  <Card 
                    key={project.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow bg-white"
                    onClick={() => navigate(`/project/${project.id}`)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg font-rubik">{project.Name}</CardTitle>
                      <CardDescription className="font-rubik">
                        {project.Owner?.CompanyName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="text-sm text-gloster-gray font-rubik">
                          <p><span className="font-medium">Ubicación:</span> {project.Location}</p>
                          <p><span className="font-medium">Presupuesto:</span> ${project.Budget?.toLocaleString()}</p>
                        </div>
                        
                        {nextPayment && (
                          <div className="pt-3 border-t border-gloster-gray/20">
                            <p className="text-sm font-medium text-slate-700 mb-2 font-rubik">Próximo Estado de Pago:</p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gloster-gray font-rubik">
                                {nextPayment.Mes} {nextPayment.Año}
                              </span>
                              <Badge 
                                variant="outline" 
                                className={`${getStatusColor(nextPayment.Status)} font-rubik`}
                              >
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(nextPayment.Status)}
                                  <span>{nextPayment.Status}</span>
                                </div>
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-medium text-slate-800 mb-2 font-rubik">
                  No tienes proyectos registrados
                </h3>
                <p className="text-gloster-gray mb-6 font-rubik">
                  Crea tu primer proyecto para comenzar a gestionar tus estados de pago
                </p>
                <Button 
                  onClick={() => navigate('/register')}
                  className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Primer Proyecto
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
