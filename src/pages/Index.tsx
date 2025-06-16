
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, FileText, Clock, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, loading } = useAuth();

  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && event === 'SIGNED_IN') {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Campos requeridos",
        description: "Por favor ingresa tu email y contraseña",
        variant: "destructive",
      });
      return;
    }

    console.log('Login attempt:', { email });
    
    const { data, error } = await signIn(email, password);
    
    if (data && !error) {
      // Navigation will be handled by the auth state change listener
      console.log('Login successful');
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Email changed:', e.target.value);
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('Password changed:', e.target.value);
    setPassword(e.target.value);
  };

  return (
    <div className="min-h-screen relative">
      {/* Header - White strip */}
      <header className="relative z-10 bg-gloster-white p-6 shadow-sm">
        <div className="flex items-center space-x-3">
          <img 
            src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
            alt="Gloster Logo" 
            className="w-12 h-12"
          />
          <h1 className="text-2xl font-bold text-slate-800 font-rubik">Gloster</h1>
        </div>
      </header>

      {/* Background with construction theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-gloster-gray via-slate-600 to-gloster-gray">
        {/* Construction-themed background pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-repeat opacity-30" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F5DF4D' fill-opacity='0.15'%3E%3Cpath d='M50 5L90 25v50L50 95L10 75V25L50 5z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        {/* Subtle crane silhouettes */}
        <div className="absolute bottom-0 left-0 w-full h-1/3 opacity-10">
          <div className="w-full h-full bg-gradient-to-t from-gloster-yellow/20 to-transparent"></div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Hero Section */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-5xl font-bold text-gloster-white leading-tight font-rubik">
                Gestiona tus proyectos de
                <span className="text-gloster-yellow"> construcción</span>
              </h2>
              <p className="text-xl text-gloster-white/80 leading-relaxed font-rubik">
                La plataforma integral para subcontratistas. Administra estados de pago, 
                documentación contractual y mantén el control total de tus proyectos.
              </p>
            </div>

            {/* Features */}
            <div className="grid gap-4">
              <div className="flex items-center space-x-3 text-gloster-white">
                <Shield className="h-5 w-5 text-gloster-yellow" />
                <span className="font-rubik">Gestión segura de documentos</span>
              </div>
              <div className="flex items-center space-x-3 text-gloster-white">
                <FileText className="h-5 w-5 text-gloster-yellow" />
                <span className="font-rubik">Certificados F30 y documentación contractual</span>
              </div>
              <div className="flex items-center space-x-3 text-gloster-white">
                <Clock className="h-5 w-5 text-gloster-yellow" />
                <span className="font-rubik">Estados de pago en tiempo real</span>
              </div>
              <div className="flex items-center space-x-3 text-gloster-white">
                <Database className="h-5 w-5 text-gloster-yellow" />
                <span className="font-rubik">Visualización completa de datos</span>
              </div>
            </div>

            {/* Quick Access Button */}
            <div className="pt-4">
              <Button 
                onClick={() => navigate('/data-viewer')}
                variant="outline"
                className="border-gloster-yellow text-gloster-yellow hover:bg-gloster-yellow hover:text-black font-rubik"
              >
                <Database className="h-4 w-4 mr-2" />
                Ver Datos en Vivo
              </Button>
            </div>
          </div>

          {/* Login Form */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md bg-gloster-white/10 backdrop-blur-lg border-gloster-white/20">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-gloster-white font-rubik">Iniciar Sesión</CardTitle>
                <CardDescription className="text-gloster-white/80 font-rubik">
                  Accede a tu panel de proyectos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      type="email"
                      placeholder="correo@empresa.com"
                      value={email}
                      onChange={handleEmailChange}
                      className="bg-gloster-white/10 border-gloster-white/20 text-gloster-white placeholder:text-gloster-white/60 font-rubik focus:bg-gloster-white/20 focus:border-gloster-white/40"
                      required
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="Contraseña"
                      value={password}
                      onChange={handlePasswordChange}
                      className="bg-gloster-white/10 border-gloster-white/20 text-gloster-white placeholder:text-gloster-white/60 font-rubik focus:bg-gloster-white/20 focus:border-gloster-white/40"
                      required
                      autoComplete="current-password"
                      disabled={loading}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-semibold font-rubik transition-colors"
                    disabled={loading}
                  >
                    {loading ? 'Iniciando sesión...' : 'Acceder'}
                  </Button>
                </form>
                
                <div className="text-center pt-4 border-t border-gloster-white/20">
                  <p className="text-gloster-white/80 text-sm font-rubik mb-3">
                    ¿No tienes cuenta?
                  </p>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/register')}
                    className="w-full border-gloster-white/20 text-gloster-white hover:bg-gloster-white/10 font-rubik"
                    disabled={loading}
                  >
                    Registrarse como Contratista
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
