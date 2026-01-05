
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const EmailAccess = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const params = useMemo(() => new URLSearchParams(window.location.search || location.search), [location.search]);

  const paymentId = params.get('paymentId');
  const contractorId = params.get('contractorId');
  const mandanteId = params.get('mandanteId');
  const projectId = params.get('projectId');
  const adicionalId = params.get('adicionalId');
  const rfiId = params.get('rfiId');
  const token = params.get('token');
  const urlType = params.get('type');

  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [popupError, setPopupError] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [userType, setUserType] = useState<'contratista' | 'mandante' | 'cc' | null>(null);

  // Validar enlace
  useEffect(() => {
    const hasAnyId = !!(paymentId || contractorId || mandanteId || projectId);
    if (!hasAnyId) {
      setPopupError('Enlace inválido o incompleto.');
      return;
    }
    if (!token) {
      setPopupError('Enlace inválido: falta token de acceso.');
      return;
    }
  }, [paymentId, contractorId, mandanteId, projectId, token]);

  // Detectar tipo de acceso
  useEffect(() => {
    const detectAccessType = async () => {
      if ((!paymentId && !contractorId && !mandanteId && !projectId) || !token) return;

      try {
        const { data, error } = await supabase.functions.invoke('verify-email-access', {
          body: { 
            paymentId: paymentId || undefined, 
            contractorId: contractorId || undefined,
            mandanteId: mandanteId || undefined,
            projectId: projectId || undefined,
            rfiId: rfiId || undefined,
            adicionalId: adicionalId || undefined,
            token 
          }
        });

        if (error) {
          console.log('❌ Error en verificación inicial:', error);
          return;
        }

        if (data?.userType) {
          setUserType(data.userType);
          console.log('✅ Tipo de usuario detectado:', data.userType);
        }
      } catch (error) {
        console.log('❌ Error verificando acceso:', error);
      }
    };

    detectAccessType();
  }, [paymentId, contractorId, mandanteId, projectId, rfiId, adicionalId, token]);

  const checkUserAccount = async (email: string, userType: 'contratista' | 'mandante') => {
    try {
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
      // Verificar token y email
      if (token) {
        const { data: tokenVerification, error: tokenError } = await supabase.functions.invoke('verify-email-access', {
          body: { 
            paymentId: paymentId || undefined, 
            contractorId: contractorId || undefined,
            mandanteId: mandanteId || undefined,
            projectId: projectId || undefined,
            rfiId: rfiId || undefined,
            adicionalId: adicionalId || undefined,
            token, 
            email 
          }
        });

        if (tokenError || !tokenVerification?.userType) {
          // Mensaje de error unificado
          setPopupError('Acceso no autorizado. Verifique que su email corresponda al destinatario del enlace.');
          return;
        }

        console.log('🔍 Verificación exitosa:', tokenVerification);
        
        let finalUserType = tokenVerification.userType;
        let redirectPath = '';
        
        // Determinar redirección
        if (tokenVerification.accessType === 'cc') {
          finalUserType = 'cc';
          redirectPath = `/executive-summary`;
        } else if (tokenVerification.accessType === 'mandante' || urlType === 'mandante') {
          finalUserType = 'mandante';
          if (projectId) {
            const urlParams = new URLSearchParams();
            if (adicionalId) urlParams.set('adicionalId', adicionalId);
            if (rfiId) urlParams.set('rfiId', rfiId);
            redirectPath = `/project-access/${projectId}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
          } else if (paymentId) {
            redirectPath = `/submission/${paymentId}`;
          } else {
            redirectPath = `/dashboard-mandante`;
          }
        } else if (tokenVerification.accessType === 'contratista') {
          finalUserType = 'contratista';
          if (paymentId) {
            redirectPath = `/payment/${paymentId}`;
          } else {
            redirectPath = `/dashboard`;
          }
        } else if (tokenVerification.accessType === 'specialist') {
          finalUserType = 'mandante';
          if (projectId) {
            const urlParams = new URLSearchParams();
            if (rfiId) urlParams.set('rfiId', rfiId);
            redirectPath = `/project-access/${projectId}${urlParams.toString() ? `?${urlParams.toString()}` : ''}`;
          }
        }

        const accessData = {
          paymentId: paymentId || contractorId || projectId,
          projectId: projectId || null,
          email: email,
          userType: finalUserType,
          isRegistered: false,
          isLimitedAccess: tokenVerification.accessType === 'specialist',
          hasFullAccess: tokenVerification.accessType === 'mandante',
          token: finalUserType === 'mandante' ? 'mandante_authenticated' : 
                 finalUserType === 'cc' ? 'cc_authenticated' : 'contratista_authenticated',
          accessToken: token,
          // Modo de vista: 'rfi', 'adicional', o 'general'
          viewMode: tokenVerification.viewMode || 'general',
          // Arrays de IDs autorizados
          authorizedRfiIds: tokenVerification.authorizedRfiIds || [],
          authorizedAdicionalIds: tokenVerification.authorizedAdicionalIds || [],
          // IDs del deep link específico (para scroll/highlight)
          deepLinkRfiId: tokenVerification.deepLinkRfiId || rfiId || null,
          deepLinkAdicionalId: tokenVerification.deepLinkAdicionalId || adicionalId || null,
          timestamp: Date.now()
        };

        if (finalUserType === 'mandante' || finalUserType === 'cc') {
          sessionStorage.setItem('mandanteAccess', JSON.stringify(accessData));
        } else {
          sessionStorage.setItem('contractorAccess', JSON.stringify(accessData));
        }

        navigate(redirectPath);
        return;
      }

      // Fallback para acceso sin token
      if (userType && userType !== 'cc') {
        const accessCheck = await checkUserAccount(email, userType);

        if (!accessCheck || !accessCheck.hasAccess) {
          setPopupError('Acceso no autorizado. Verifique que su email corresponda al destinatario del enlace.');
          return;
        }

        if (accessCheck.needsPassword && !needsPassword) {
          setNeedsPassword(true);
          toast({
            title: "Contraseña requerida",
            description: "Este usuario tiene cuenta registrada. Por favor ingresa tu contraseña.",
          });
          return;
        }

        if (accessCheck.needsPassword) {
          if (!password.trim()) {
            setPopupError('Por favor ingresa tu contraseña.');
            return;
          }

          try {
            const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
              email: email,
              password: password
            });

            if (authError || !authData.user) {
              setPopupError('Email o contraseña incorrectos.');
              return;
            }

            if (authData.user.id !== accessCheck.authUserId) {
              setPopupError('Las credenciales no coinciden con el usuario autorizado.');
              await supabase.auth.signOut();
              return;
            }
          } catch (error) {
            setPopupError('Error al verificar las credenciales.');
            return;
          }
        }

        toast({
          title: "Acceso verificado",
          description: "Acceso concedido.",
        });

        const accessData = {
          paymentId: paymentId,
          email: email,
          userType: accessCheck.userType,
          isRegistered: accessCheck.isRegistered ?? false,
          isLimitedAccess: accessCheck.userType === 'mandante' && !accessCheck.needsPassword,
          hasFullAccess: accessCheck.needsPassword || accessCheck.userType === 'contratista',
          token: accessCheck.userType === 'mandante' ? 'mandante_authenticated' : 'contratista_authenticated',
          accessToken: token || null,
          timestamp: Date.now()
        };

        if (accessCheck.userType === 'mandante') {
          sessionStorage.setItem('mandanteAccess', JSON.stringify(accessData));
          if (accessCheck.needsPassword) {
            navigate('/dashboard-mandante');
          } else {
            navigate(`/submission/${paymentId}`);
          }
        } else {
          sessionStorage.setItem('contractorAccess', JSON.stringify(accessData));
          if (accessCheck.needsPassword) {
            navigate('/dashboard');
          } else {
            navigate(`/payment/${paymentId}`);
          }
        }
      } else {
        setPopupError('Acceso no autorizado. Verifique que su email corresponda al destinatario del enlace.');
      }

    } catch (error) {
      console.error('Error al verificar acceso:', error);
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
