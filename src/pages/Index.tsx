
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, FileText, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    console.log('Login attempt:', { email, password });
    
    // Simulamos autenticación
    setTimeout(() => {
      if (email && password) {
        toast({
          title: "¡Bienvenido a Gloster!",
          description: "Sesión iniciada exitosamente",
        });
        navigate('/dashboard');
      } else {
        toast({
          title: "Error de autenticación",
          description: "Por favor verifica tus credenciales",
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1000);
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
    <div className="min-h-screen bg-gradient-to-br from-gloster-gray via-slate-600 to-gloster-gray">
      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="flex items-center space-x-3">
          <img 
            src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
            alt="Gloster Logo" 
            className="w-12 h-12"
          />
          <h1 className="text-2xl font-bold text-gloster-white font-rubik">Gloster</h1>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
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
              <CardContent>
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
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-semibold font-rubik transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Iniciando sesión...' : 'Acceder'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="w-full h-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23F5DF4D' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
    </div>
  );
};

export default Index;
