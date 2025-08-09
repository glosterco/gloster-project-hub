
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

  // Detectar tipo de acceso desde URL params
  useEffect(() => {
    const detectAccessType = async () => {
      if (!paymentId) return;

      try {
        const { data: paymentData } = await supabase
          .from('Estados de pago')
          .select('URLContratista, URLMandante')
          .eq('id', parseInt(paymentId))
          .single();

        if (paymentData) {
          // Determinar de qué tipo de URL viene basado en el token
          if (token && paymentData.URLContratista && paymentData.URLContratista.includes(token)) {
            setUserType('contratista');
            console.log('🔍 Acceso detectado como contratista via URLContratista');
          } else if (token && paymentData.URLMandante && paymentData.URLMandante.includes(token)) {
            setUserType('mandante');
            console.log('🔍 Acceso detectado como mandante via URLMandante');
          }
        }
      } catch (error) {
        console.error('Error detectando tipo de acceso:', error);
      }
    };

    detectAccessType();
  }, [paymentId, token]);

  const checkMandanteAccount = async (email: string, projectData: any) => {
    const mandanteEmail = projectData?.Mandantes?.ContactEmail;
    const mandanteAuthUserId = projectData?.Mandantes?.auth_user_id;
    const mandanteId = projectData?.Mandantes?.id;

    // Verificar si el email coincide con el mandante principal
    const isMainMandante = mandanteEmail && email.toLowerCase() === mandanteEmail.toLowerCase();
    
    // Verificar si es un usuario asociado al mandante
    let isAssociatedUser = false;
    let associatedUserAuthId = null;
    
    if (mandanteId) {
      try {
        // Llamar a la edge function para verificar usuarios asociados del mandante
        const response = await fetch('https://mqzuvqwsaeguphqjwvap.supabase.co/functions/v1/verify-mandante-user-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
          },
          body: JSON.stringify({
            email: email,
            mandanteId: mandanteId
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.hasAccess && result.isAssociatedUser) {
            isAssociatedUser = true;
            associatedUserAuthId = result.authUserId;
            console.log('✅ Usuario asociado del mandante encontrado');
          }
        }
      } catch (error) {
        console.error('Error verificando usuarios del mandante:', error);
      }
    }

    // Si no coincide con ninguno
    if (!isMainMandante && !isAssociatedUser) {
      return { hasAccess: false, error: 'El email ingresado no coincide con el mandante autorizado para este proyecto.' };
    }

    // Determinar si necesita contraseña
    const authUserId = isMainMandante ? mandanteAuthUserId : associatedUserAuthId;
    
    if (authUserId) {
      return { hasAccess: true, needsPassword: true, userType: 'mandante', isRegistered: true, authUserId };
    }

    // Si no tiene auth_user_id, solo verificación por email (solo para mandante principal)
    return { hasAccess: true, needsPassword: false, userType: 'mandante', isRegistered: false };
  };

  const checkContratistaAccount = async (email: string, projectData: any) => {
    const contratistaEmail = projectData?.Contratistas?.ContactEmail;
    const contratistaAuthUserId = projectData?.Contratistas?.auth_user_id;
    const contratistaId = projectData?.Contratistas?.id;

    // Verificar si el email coincide con el contratista principal
    const isMainContratista = contratistaEmail && email.toLowerCase() === contratistaEmail.toLowerCase();
    
    // Verificar si es un usuario asociado al contratista
    let isAssociatedUser = false;
    let associatedUserAuthId = null;
    
    if (!isMainContratista && contratistaId) {
      try {
        // Llamar a la edge function para verificar usuarios asociados del contratista
        const response = await fetch('https://mqzuvqwsaeguphqjwvap.supabase.co/functions/v1/verify-contratista-user-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token || ''}`,
          },
          body: JSON.stringify({
            email: email,
            contratistaId: contratistaId
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.hasAccess && result.isAssociatedUser) {
            isAssociatedUser = true;
            associatedUserAuthId = result.authUserId;
            console.log('✅ Usuario asociado del contratista encontrado');
          }
        }
      } catch (error) {
        console.error('Error verificando usuarios del contratista:', error);
      }
    }
    
    // Si no coincide con ninguno
    if (!isMainContratista && !isAssociatedUser) {
      return { hasAccess: false, error: 'El email ingresado no coincide con el contratista autorizado para este proyecto.' };
    }

    // Determinar si necesita contraseña
    const authUserId = isMainContratista ? contratistaAuthUserId : associatedUserAuthId;
    
    if (authUserId) {
      return { hasAccess: true, needsPassword: true, userType: 'contratista', isRegistered: true, authUserId };
    }

    // Si no tiene auth_user_id, solo verificación por email (solo para contratista principal)
    return { hasAccess: true, needsPassword: false, userType: 'contratista', isRegistered: false };
  };

  const handleAccessAttempt = async () => {
    if (!email.trim()) {
      setPopupError('Por favor ingrese su email');
      return;
    }

    setLoading(true);
    setPopupError(null);

    try {
      // Obtener información del estado de pago
      const { data: paymentData, error: paymentError } = await supabase
        .from('Estados de pago')
        .select(`
          *,
          Proyectos:Project (
            *,
            Mandantes:Owner (*),
            Contratistas:Contratista (*)
          )
        `)
        .eq('id', parseInt(paymentId || '0'))
        .single();

      if (paymentError || !paymentData) {
        setPopupError('Estado de pago no encontrado');
        return;
      }

      const projectData = paymentData.Proyectos;

      // ✅ 1. VERIFICAR ACCESO POR TOKEN DIRECTO PRIMERO
      if (token) {
        // Verificar token de URLContratista
        if (userType === 'contratista' && paymentData.URLContratista) {
          const urlContratista = paymentData.URLContratista;
          const expectedToken = urlContratista.split('token=')[1];
          
          console.log('🔐 Verificando token de contratista:', { token, expectedToken, urlContratista });
          
          if (token === expectedToken) {
            // Verificar si el contratista tiene cuenta registrada
            const contratistaAuthUserId = projectData?.Contratistas?.auth_user_id;
            
            if (contratistaAuthUserId) {
              // Contratista registrado - necesita email y contraseña
              console.log('🔐 Contratista registrado detectado, requiere autenticación');
              // Continúa con el flujo normal de verificación
            } else {
              // Contratista no registrado - requiere verificación de email
              console.log('📧 Contratista no registrado, requiere verificación de email');
              // Continúa con el flujo normal de verificación de email
            }
          } else {
            console.log('❌ Token de contratista inválido');
            setPopupError('Token de acceso inválido');
            return;
          }
        }
        
        // Verificar token de URLMandante
        if (userType === 'mandante' && paymentData.URLMandante) {
          const urlMandante = paymentData.URLMandante;
          const expectedToken = urlMandante.split('token=')[1];
          
          console.log('🔐 Verificando token de mandante:', { token, expectedToken, urlMandante });
          
          if (token === expectedToken) {
            // Token válido para mandante - continúa con verificación de email/contraseña
            console.log('✅ Token de mandante válido, continuando con verificación');
          } else {
            console.log('❌ Token de mandante inválido');
            setPopupError('Token de acceso inválido');
            return;
          }
        }
      }

      // 2. VERIFICAR ACCESO POR EMAIL/CONTRASEÑA
      let accessCheck = null;
      
      // Si ya detectamos el tipo de usuario por token, verificar solo ese tipo
      if (userType === 'mandante') {
        const mandanteCheck = await checkMandanteAccount(email, projectData);
        if (mandanteCheck.hasAccess) {
          accessCheck = mandanteCheck;
        }
      } else if (userType === 'contratista') {
        const contratistaCheck = await checkContratistaAccount(email, projectData);
        if (contratistaCheck.hasAccess) {
          accessCheck = contratistaCheck;
        }
      } else {
        // Si no hay token específico, intentar ambos tipos (empezar con mandante)
        const mandanteCheck = await checkMandanteAccount(email, projectData);
        if (mandanteCheck.hasAccess) {
          accessCheck = mandanteCheck;
        } else {
          const contratistaCheck = await checkContratistaAccount(email, projectData);
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

          console.log('✅ Usuario autenticado correctamente:', authData.user.email);
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
        email: email,
        token: `${accessCheck.userType}_authenticated`,
        userType: accessCheck.userType,
        isRegistered: accessCheck.isRegistered,
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
