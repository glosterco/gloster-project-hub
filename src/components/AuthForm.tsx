
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { signIn, signUp, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Campos requeridos",
        description: "Por favor ingresa tu email y contraseña",
        variant: "destructive",
      });
      return;
    }

    console.log('Attempting login with:', email);
    
    const { data, error } = await signIn(email, password);
    
    if (error) {
      console.error('Login failed:', error);
      toast({
        title: "Error al iniciar sesión",
        description: error.message || "Credenciales inválidas",
        variant: "destructive",
      });
    } else if (data?.user) {
      console.log('Login successful, redirecting...');
      toast({
        title: "Bienvenido",
        description: "Has iniciado sesión exitosamente",
      });
      navigate('/dashboard');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Contraseñas no coinciden",
        description: "Las contraseñas deben ser iguales",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await signUp(email, password);
    
    if (error) {
      toast({
        title: "Error al registrarse",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Registro exitoso",
        description: "Revisa tu email para confirmar tu cuenta",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <img 
              src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
              alt="Gloster Logo" 
              className="w-8 h-8"
            />
            <h1 className="text-xl font-bold text-slate-800 font-rubik">Gloster</h1>
          </div>
          <CardTitle className="font-rubik">Acceso a tu cuenta</CardTitle>
          <CardDescription className="font-rubik">
            Inicia sesión o crea una cuenta nueva
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Iniciar Sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Contraseña</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tu contraseña"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <div className="space-y-4">
                <div className="text-center p-6 bg-slate-100 rounded-lg">
                  <p className="text-slate-600 font-rubik mb-4">
                    Para crear una cuenta completa con información de tu empresa y proyectos, utiliza nuestro formulario de registro detallado.
                  </p>
                  <Button 
                    onClick={() => navigate('/register')}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-rubik font-semibold"
                  >
                    Ir al Registro Completo
                  </Button>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-300" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-slate-50 px-2 text-slate-500 font-rubik">O registrarse rápido</span>
                  </div>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Al menos 8 caracteres"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm">Confirmar Contraseña</Label>
                    <Input
                      id="signup-confirm"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirma tu contraseña"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creando cuenta..." : "Crear Cuenta Básica"}
                  </Button>
                </form>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-4 text-center">
            <Button 
              variant="link" 
              onClick={() => navigate('/')}
              className="text-sm text-slate-600"
            >
              Volver al inicio
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
