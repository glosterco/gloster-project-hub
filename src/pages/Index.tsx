
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Shield, FileText, Clock } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Gloster</h1>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Hero Section */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-5xl font-bold text-white leading-tight">
                Gestiona tus proyectos de
                <span className="text-orange-400"> construcción</span>
              </h2>
              <p className="text-xl text-slate-300 leading-relaxed">
                La plataforma integral para subcontratistas. Administra estados de pago, 
                documentación contractual y mantén el control total de tus proyectos.
              </p>
            </div>

            {/* Features */}
            <div className="grid gap-4">
              <div className="flex items-center space-x-3 text-slate-200">
                <Shield className="h-5 w-5 text-orange-400" />
                <span>Gestión segura de documentos</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-200">
                <FileText className="h-5 w-5 text-orange-400" />
                <span>Certificados F30 y documentación contractual</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-200">
                <Clock className="h-5 w-5 text-orange-400" />
                <span>Estados de pago en tiempo real</span>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-white">Iniciar Sesión</CardTitle>
                <CardDescription className="text-slate-300">
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
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                      required
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
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
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
    </div>
  );
};

export default Index;
