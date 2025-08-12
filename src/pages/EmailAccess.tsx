
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const EmailAccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const token = searchParams.get('token');
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [popupError, setPopupError] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [userType, setUserType] = useState<'contratista' | 'mandante' | null>(null);

  useEffect(() => {
    if (!paymentId) {
      navigate('/');
      return;
    }
  }, [paymentId, navigate]);

  // Detectar tipo de acceso desde URL params de forma segura
  useEffect(() => {
    const detectAccessType = async () => {
      if (!paymentId || !token) return;

      try {
        // Use secure edge function to verify token and determine user type
        const { data, error } = await supabase.functions.invoke('verify-email-access', {
          body: { paymentId, token }
        });

        if (error) {
          setPopupError('Token de acceso inválido');
          return;
        }

        if (data?.userType) {
          setUserType(data.userType);
        }
      } catch (error) {
        setPopupError('Error verificando el acceso');
      }
    };

    detectAccessType();
  }, [paymentId, token]);

  const checkUserAccount = async (email: string, userType: 'contratista' | 'mandante') => {
    try {
      // Use secure edge function to verify user access without exposing sensitive data
      const { data: result, error } = await supabase.functions.invoke(
        'verify-email-user-access',
        { 
          body: { 
            email: email, 
            paymentId: paymentId,
            userType: userType
          } 
        }
      );

      if (error) {
        return { hasAccess: false, needsPassword: false, userType, isRegistered: false, authUserId: null };
      }

      return result || { hasAccess: false, needsPassword: false, userType, isRegistered: false, authUserId: null };
    } catch (error) {
      return { hasAccess: false, needsPassword: false, userType, isRegistered: false, authUserId: null };
    }
  };

  const handleAccessAttempt = async () => {
    if (!email.trim()) {
      setPopupError('Por favor ingrese su email');
      return;
    }

    setLoading(true);
    setPopupError(null);

    try {
      // Verify token first if provided
      if (token && !userType) {
        setPopupError('Token de acceso inválido');
        return;
      }

      // Check user access using secure edge function
      let accessCheck = null;
      
      // If we detected the user type by token, verify only that type
      if (userType) {
        accessCheck = await checkUserAccount(email, userType);
      } else {
        // If no token specific, try both types (start with mandante)
        const mandanteCheck = await checkUserAccount(email, 'mandante');
        if (mandanteCheck.hasAccess) {
          accessCheck = mandanteCheck;
        } else {
          const contratistaCheck = await checkUserAccount(email, 'contratista');
          if (contratistaCheck.hasAccess) {
            accessCheck = contratistaCheck;
          }
        }
      }

      // Si no coincide con ninguno
      if (!accessCheck || !accessCheck.hasAccess) {
        if (userType === 'mandante') {
          setPopupError('El email ingresado no coincide con ningún usuario autorizado del mandante para este proyecto.');
        } else if (userType === 'contratista') {
          setPopupError('El email ingresado no coincide con el contratista autorizado para este proyecto.');
        } else {
          setPopupError('El email ingresado no coincide con el mandante o contratista autorizado para este proyecto.');
        }
        return;
      }

      // Si necesita contraseña pero no la hemos verificado aún
      if (accessCheck.needsPassword && !needsPassword) {
        console.log(`🔐 Usuario registrado detectado (${accessCheck.userType}), solicitando contraseña`);
        setNeedsPassword(true);
        const userTypeText = accessCheck.userType === 'mandante' ? 'mandante' : 'contratista';
        toast({
          title: "Contraseña requerida",
          description: `Este ${userTypeText} tiene una cuenta registrada. Por favor ingresa tu contraseña.`,
        });
        return;
      }

      // Verificar contraseña si es necesaria (autenticación con Supabase)
      if (accessCheck.needsPassword) {
        if (!password.trim()) {
          setPopupError('Por favor ingresa tu contraseña.');
          return;
        }

        try {
          // Intentar autenticación con Supabase
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
          });

          if (authError || !authData.user) {
            setPopupError('Email o contraseña incorrectos.');
            return;
          }

          // Verificar que el usuario autenticado coincide con el auth_user_id del proyecto
          if (authData.user.id !== accessCheck.authUserId) {
            setPopupError('Las credenciales no coinciden con el usuario autorizado para este proyecto.');
            // Cerrar sesión si se autenticó con credenciales incorrectas
            await supabase.auth.signOut();
            return;
          }
        } catch (error) {
          console.error('Error en autenticación:', error);
          setPopupError('Error al verificar las credenciales. Intenta nuevamente.');
          return;
        }
      }

      // Acceso concedido
      toast({
        title: "Acceso verificado",
        description: "Acceso concedido correctamente.",
      });

      const accessData = {
        paymentId: paymentId,
        userType: accessCheck.userType,
        isRegistered: accessCheck.isRegistered ?? false,
        token: accessCheck.userType === 'mandante' ? 'mandante_authenticated' : 'contratista_authenticated',
        timestamp: Date.now()
      };

      if (accessCheck.userType === 'mandante') {
        sessionStorage.setItem('mandanteAccess', JSON.stringify(accessData));
      } else {
        sessionStorage.setItem('contractorAccess', JSON.stringify(accessData));
      }

      // Redirección según el tipo de usuario
      if (accessCheck.userType === 'contratista') {
        navigate(`/payment/${paymentId}`);
      } else {
        navigate(`/submission/${paymentId}`);
      }

    } catch (error) {
      console.error('Error al verificar el acceso:', error);
      setPopupError('No se pudo verificar el acceso. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAccessAttempt();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-rubik flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-gloster-gray/20">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gloster-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-gloster-gray" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800 font-rubik">
            Verificación de Acceso
          </CardTitle>
          <CardDescription className="font-rubik">
            {needsPassword ? 
              'Ingresa tu email y contraseña para acceder' : 
              'Ingresa tu email para verificar el acceso'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700 font-rubik">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gloster-gray" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="tu.email@empresa.com"
                  className="pl-10 font-rubik"
                  disabled={loading}
                />
              </div>
            </div>

            {needsPassword && (
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700 font-rubik">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gloster-gray" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Contraseña"
                    className="pl-10 font-rubik"
                    disabled={loading}
                  />
                </div>
              </div>
            )}
            
            <Button
              onClick={handleAccessAttempt}
              disabled={loading || !email.trim() || (needsPassword && !password.trim())}
              className="w-full bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik font-medium"
            >
              {loading ? 'Verificando...' : 'Verificar Acceso'}
            </Button>

            {popupError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-rubik">{popupError}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailAccess;
