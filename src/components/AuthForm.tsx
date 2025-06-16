
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import RegistrationProgressBar from './registration/RegistrationProgressBar';
import ClientInfoStep from './registration/ClientInfoStep';
import CompanyInfoStep from './registration/CompanyInfoStep';
import ContactInfoStep from './registration/ContactInfoStep';
import ProjectInfoStep from './registration/ProjectInfoStep';
import PaymentInfoStep from './registration/PaymentInfoStep';
import RegistrationBreakPage from './registration/RegistrationBreakPage';
import { useRegistrationForm } from '@/hooks/useRegistrationForm';
import { useRegistrationSteps } from '@/hooks/useRegistrationSteps';

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Registration states
  const { formData, updateFormData } = useRegistrationForm();
  const { currentStep, goToNextStep, goToPreviousStep, resetSteps } = useRegistrationSteps();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/dashboard');
      }
    };
    checkUser();
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

    const { error } = await signIn(email, password);
    
    if (error) {
      console.error('Login error:', error);
      
      // Manejo específico de errores de autenticación
      if (error.message?.includes('Invalid login credentials') || 
          error.message?.includes('invalid_credentials') ||
          error.message?.includes('Invalid email or password')) {
        toast({
          title: "Credenciales incorrectas",
          description: "El email o la contraseña son incorrectos. Por favor verifica e intenta nuevamente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error al iniciar sesión",
          description: error.message || "Hubo un problema al iniciar sesión",
          variant: "destructive",
        });
      }
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Campos requeridos",
        description: "Por favor ingresa tu email y contraseña",
        variant: "destructive",
      });
      return;
    }

    const { error } = await signUp(email, password);
    
    if (error) {
      toast({
        title: "Error en el registro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Actualizar el formData con email y contraseña
      updateFormData({ email, password });
      goToNextStep(); // Ir al primer paso del registro completo
    }
  };

  const handleStepSubmit = (stepData: any) => {
    updateFormData(stepData);
    goToNextStep();
  };

  const handleRegistrationComplete = () => {
    toast({
      title: "¡Registro completado!",
      description: "Tu cuenta ha sido creada exitosamente. Puedes iniciar sesión ahora.",
    });
    setIsLogin(true);
    resetSteps();
    setEmail('');
    setPassword('');
  };

  // Si estamos en el proceso de registro (después del paso inicial)
  if (!isLogin && currentStep > 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-rubik">
        <div className="w-full max-w-4xl">
          <RegistrationProgressBar currentStep={currentStep} />
          
          {currentStep === 1 && (
            <ClientInfoStep
              onNext={handleStepSubmit}
              onBack={goToPreviousStep}
              initialData={formData}
            />
          )}
          
          {currentStep === 2 && (
            <CompanyInfoStep
              onNext={handleStepSubmit}
              onBack={goToPreviousStep}
              initialData={formData}
            />
          )}
          
          {currentStep === 3 && (
            <ContactInfoStep
              onNext={handleStepSubmit}
              onBack={goToPreviousStep}
              initialData={formData}
            />
          )}
          
          {currentStep === 4 && (
            <RegistrationBreakPage onContinue={goToNextStep} />
          )}
          
          {currentStep === 5 && (
            <ProjectInfoStep
              onNext={handleStepSubmit}
              onBack={goToPreviousStep}
              initialData={formData}
            />
          )}
          
          {currentStep === 6 && (
            <PaymentInfoStep
              onNext={handleRegistrationComplete}
              onBack={goToPreviousStep}
              initialData={formData}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-rubik">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-slate-800 font-rubik">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </CardTitle>
          <CardDescription className="font-rubik">
            {isLogin 
              ? 'Ingresa tus credenciales para acceder' 
              : 'Completa el formulario para crear tu cuenta'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={isLogin ? handleLogin : handleRegisterSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 font-rubik">
                Correo electrónico
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="font-rubik"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 font-rubik">
                Contraseña
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="font-rubik"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-semibold font-rubik"
              disabled={loading}
            >
              {loading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Continuar con Registro')}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-gloster-gray hover:text-slate-800 text-sm font-rubik"
            >
              {isLogin 
                ? '¿No tienes cuenta? Regístrate aquí' 
                : '¿Ya tienes cuenta? Inicia sesión'
              }
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthForm;
