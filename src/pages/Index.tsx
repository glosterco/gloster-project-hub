import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, FileText, DollarSign, HelpCircle, Camera, BarChart3, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/auth/LoginForm';

const tools = [
  {
    id: 'estados-pago',
    title: 'Estados de Pago',
    description: 'Gestiona y automatiza el proceso de cobro con seguimiento de vencimientos, aprobaciones múltiples y notificaciones automáticas.',
    icon: DollarSign,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    id: 'adicionales',
    title: 'Adicionales',
    description: 'Registra y controla trabajos adicionales con flujo de aprobación, montos, y trazabilidad completa del proceso de revisión.',
    icon: FileText,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  {
    id: 'rfi',
    title: 'RFI (Solicitudes)',
    description: 'Sistema de consultas técnicas con seguimiento de respuestas, reenvío a especialistas, y historial conversacional completo.',
    icon: HelpCircle,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    id: 'presupuesto',
    title: 'Presupuesto',
    description: 'Control del avance físico y financiero del proyecto con seguimiento de partidas, actualizaciones parciales y totales.',
    icon: BarChart3,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    id: 'documentos',
    title: 'Documentos',
    description: 'Repositorio centralizado de documentación del proyecto integrado con Google Drive para fácil acceso y organización.',
    icon: FileText,
    color: 'text-slate-600',
    bgColor: 'bg-slate-100',
  },
  {
    id: 'fotos',
    title: 'Registro Fotográfico',
    description: 'Galería de fotos del proyecto para documentar avances, problemas y el estado general de la obra.',
    icon: Camera,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
  },
];

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { signOut } = useAuth();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        navigate('/role-selection');
        return;
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          navigate('/role-selection');
        } else {
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Auto-rotate carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % tools.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const handleLoginSuccess = () => {};

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % tools.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + tools.length) % tools.length);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">Cargando...</div>
        </div>
      </div>
    );
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
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => {
                  const loginSection = document.getElementById('login-section');
                  if (loginSection) {
                    loginSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                variant="outline"
                className="border-gloster-yellow text-gloster-gray hover:bg-gloster-yellow/10 font-rubik"
              >
                Iniciar Sesión
              </Button>
              <Button 
                onClick={() => navigate('/register')}
                className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
              >
                Crear Cuenta
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6 font-rubik">
            Gestiona tus <span className="text-gloster-yellow">Subcontratos</span>
            <br />
            de Forma Simple
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto font-rubik">
            Plataforma digital que simplifica la gestión de subcontratos para contratistas y mandantes, 
            automatizando procesos y mejorando la transparencia en tus proyectos de construcción.
          </p>
        </div>

        {/* Platform Advantages */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {[
            {
              icon: Clock,
              title: 'Seguimiento Automático',
              description: 'Notificaciones de vencimientos y recordatorios automáticos para nunca perder un plazo',
              color: 'text-blue-600',
              bgColor: 'bg-blue-100'
            },
            {
              icon: CheckCircle,
              title: 'Transparencia Total',
              description: 'Trazabilidad completa de cada acción, aprobación y cambio en tus proyectos',
              color: 'text-green-600',
              bgColor: 'bg-green-100'
            },
            {
              icon: FileText,
              title: 'Centralización',
              description: 'Toda la documentación, comunicación y gestión en un solo lugar accesible',
              color: 'text-purple-600',
              bgColor: 'bg-purple-100'
            },
            {
              icon: BarChart3,
              title: 'Métricas',
              description: 'Dashboards con indicadores clave, análisis de RFIs, adicionales y avance financiero',
              color: 'text-amber-600',
              bgColor: 'bg-amber-100'
            }
          ].map((advantage, index) => (
            <Card key={index} className="text-center p-6 bg-white shadow-md hover:shadow-lg transition-shadow border-t-4 border-t-gloster-yellow">
              <CardHeader>
                <div className={`w-12 h-12 ${advantage.bgColor} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                  <advantage.icon className={`h-6 w-6 ${advantage.color}`} />
                </div>
                <CardTitle className="text-lg font-rubik">{advantage.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 font-rubik text-sm">
                  {advantage.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Login Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-slate-800 font-rubik">
              ¿Listo para digitalizar tus proyectos?
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
                <span className="text-slate-700 font-rubik">Adicionales, RFI y documentación centralizada</span>
              </li>
              <li className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-slate-700 font-rubik">Interfaz intuitiva y fácil de usar</span>
              </li>
            </ul>
          </div>

          <div id="login-section" className="max-w-md mx-auto w-full">
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

        {/* Tools Carousel Section */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-bold text-slate-800 font-rubik mb-4">
              Conoce nuestras herramientas
            </h3>
            <p className="text-slate-600 font-rubik max-w-2xl mx-auto">
              Explora cada una de las funcionalidades que Gloster ofrece para optimizar la gestión de tus proyectos
            </p>
          </div>

          <div className="relative">
            {/* Carousel Container */}
            <div className="overflow-hidden rounded-2xl shadow-2xl">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {tools.map((tool, index) => (
                  <div 
                    key={tool.id}
                    className="min-w-full relative"
                  >
                    {/* Background gradient based on tool color */}
                    <div className={`h-80 md:h-96 bg-gradient-to-br ${
                      tool.id === 'estados-pago' ? 'from-green-600 to-green-800' :
                      tool.id === 'adicionales' ? 'from-amber-500 to-amber-700' :
                      tool.id === 'rfi' ? 'from-blue-600 to-blue-800' :
                      tool.id === 'presupuesto' ? 'from-purple-600 to-purple-800' :
                      tool.id === 'documentos' ? 'from-slate-600 to-slate-800' :
                      'from-pink-500 to-pink-700'
                    } flex items-center justify-center relative overflow-hidden`}>
                      {/* Decorative elements */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute top-10 left-10 w-32 h-32 border-4 border-white rounded-full" />
                        <div className="absolute bottom-10 right-10 w-48 h-48 border-4 border-white rounded-full" />
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white rounded-full" />
                      </div>
                      
                      {/* Content */}
                      <div className="relative z-10 text-center px-8 max-w-2xl">
                        <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
                          <tool.icon className="h-10 w-10 text-white" />
                        </div>
                        <h4 className="text-3xl md:text-4xl font-bold text-white mb-4 font-rubik">
                          {tool.title}
                        </h4>
                        <p className="text-lg text-white/90 font-rubik">
                          {tool.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all"
            >
              <ChevronLeft className="h-6 w-6 text-slate-700" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all"
            >
              <ChevronRight className="h-6 w-6 text-slate-700" />
            </button>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-6">
              {tools.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-all ${
                    currentSlide === index 
                      ? 'bg-gloster-yellow w-8' 
                      : 'bg-slate-300 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
