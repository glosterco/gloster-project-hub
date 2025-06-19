import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, Plus, User, LogOut, FileText, Calendar, DollarSign, Shield } from 'lucide-react';
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
      if (session?.user) {
        setUser(session.user);
        // Redirigir automáticamente al dashboard si ya está autenticado
        navigate('/dashboard');
        return;
      }
      setLoading(false);
    };

    getSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser(session.user);
          // Redirigir al dashboard inmediatamente después del login exitoso
          navigate('/dashboard');
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/');
    }
  };

  const handleLoginSuccess = () => {
    // No necesitamos toast aquí porque la redirección es automática
    // El useEffect se encargará de redirigir al dashboard
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

  // Si hay usuario autenticado, no mostrar nada (la redirección ya ocurrió)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-rubik">
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

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6 font-rubik">
            Gestiona tus Estados de Pago
            <br />
            <span className="text-gloster-yellow">de Forma Simple</span>
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto font-rubik">
            Plataforma digital que simplifica la gestión de estados de pago para contratistas y mandantes, 
            automatizando procesos y mejorando la transparencia en tus proyectos de construcción.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center p-6 bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-gloster-yellow/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-gloster-yellow" />
              </div>
              <CardTitle className="text-lg font-rubik">Estados de Pago Digitales</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 font-rubik">
                Crea y gestiona estados de pago de manera digital, eliminando el papeleo y agilizando los procesos.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-gloster-yellow/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-gloster-yellow" />
              </div>
              <CardTitle className="text-lg font-rubik">Seguimiento Automático</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 font-rubik">
                Monitorea automáticamente los vencimientos y estados de tus pagos con notificaciones oportunas.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center p-6 bg-white shadow-md hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-gloster-yellow/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-gloster-yellow" />
              </div>
              <CardTitle className="text-lg font-rubik">Transparencia Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 font-rubik">
                Mantén una comunicación clara entre contratistas y mandantes con historial completo de estados.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Login Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-slate-800 font-rubik">
              ¿Listo para digitalizar tus estados de pago?
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-slate-700 font-rubik">Registro rápido en menos de 10 minutos</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-slate-700 font-rubik">Gestión completa de proyectos y pagos</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-slate-700 font-rubik">Interfaz intuitiva y fácil de usar</span>
              </li>
            </ul>
          </div>

          <div className="max-w-md mx-auto w-full">
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
    </div>
  );
};

export default Index;
