
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Users, FileText, DollarSign, Shield, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: FileText,
      title: 'Gestión de Documentos',
      description: 'Centraliza y organiza toda la documentación de tus proyectos de construcción de manera eficiente.'
    },
    {
      icon: DollarSign,
      title: 'Estados de Pago',
      description: 'Controla y gestiona los estados de pago de cada proyecto con transparencia total.'
    },
    {
      icon: Users,
      title: 'Colaboración',
      description: 'Facilita la comunicación entre contratistas y mandantes en tiempo real.'
    },
    {
      icon: Shield,
      title: 'Seguridad',
      description: 'Mantén tus datos protegidos con los más altos estándares de seguridad.'
    }
  ];

  const benefits = [
    'Reduce tiempos de gestión administrativa',
    'Mejora la transparencia en los proyectos',
    'Facilita el cumplimiento normativo',
    'Optimiza el flujo de caja',
    'Centraliza la información del proyecto'
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
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
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/auth')}
                className="font-rubik border-slate-300 hover:bg-slate-100"
              >
                Iniciar Sesión
              </Button>
              <Button 
                onClick={() => navigate('/register')}
                className="bg-slate-900 hover:bg-slate-800 text-white font-rubik font-semibold px-6 shadow-lg"
              >
                Registrarse
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl md:text-6xl font-bold text-slate-800 mb-6 font-rubik">
            Gestión inteligente para
            <span className="text-yellow-500"> proyectos de construcción</span>
          </h2>
          <p className="text-xl text-slate-600 mb-8 font-rubik leading-relaxed">
            Simplifica la administración de tus proyectos de construcción con nuestra plataforma integral 
            que conecta contratistas y mandantes de forma eficiente y transparente.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/register')}
              className="bg-slate-900 hover:bg-slate-800 text-white font-rubik font-bold px-8 py-4 text-lg shadow-xl"
            >
              Comenzar Ahora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => navigate('/auth')}
              className="font-rubik border-2 border-slate-300 hover:bg-slate-100 px-8 py-4 text-lg"
            >
              Ver Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-slate-800 mb-4 font-rubik">
              Todo lo que necesitas para gestionar tus proyectos
            </h3>
            <p className="text-slate-600 text-lg font-rubik">
              Herramientas diseñadas específicamente para la industria de la construcción
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow border-slate-200">
                <CardHeader>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-6 w-6 text-slate-600" />
                  </div>
                  <CardTitle className="font-rubik text-slate-800">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="font-rubik">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl font-bold text-slate-800 mb-6 font-rubik">
                Beneficios para tu empresa
              </h3>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-600 font-rubik">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg border border-slate-200">
              <h4 className="text-xl font-bold text-slate-800 mb-4 font-rubik">
                ¿Listo para comenzar?
              </h4>
              <p className="text-slate-600 mb-6 font-rubik">
                Únete a cientos de empresas que ya confían en Gloster para gestionar sus proyectos de construcción.
              </p>
              <Button 
                onClick={() => navigate('/register')}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-rubik font-bold py-3 shadow-lg"
              >
                Crear cuenta gratuita
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-6">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
              alt="Gloster Logo" 
              className="w-6 h-6"
            />
            <span className="font-bold text-slate-800 font-rubik">Gloster</span>
          </div>
          <p className="text-slate-600 text-sm font-rubik">
            © 2024 Gloster. Transformando la gestión de proyectos de construcción.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
