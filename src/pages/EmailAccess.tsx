
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

  useEffect(() => {
    if (!paymentId) {
      navigate('/');
      return;
    }
  }, [paymentId, navigate]);

  const checkMandanteAccount = async (email: string, projectData: any) => {
    const mandanteEmail = projectData?.Mandantes?.ContactEmail;
    const mandantePassword = projectData?.Mandantes?.Password;
    const mandanteAuthUserId = projectData?.Mandantes?.auth_user_id;

    if (!mandanteEmail || email.toLowerCase() !== mandanteEmail.toLowerCase()) {
      return { hasAccess: false, error: 'El email ingresado no coincide con el mandante autorizado para este proyecto.' };
    }

    // Si el mandante tiene auth_user_id, requiere contraseña
    if (mandanteAuthUserId) {
      return { hasAccess: true, needsPassword: true, mandantePassword, userType: 'mandante', isRegistered: true };
    }

    // Si no tiene auth_user_id, solo verificación por email
    return { hasAccess: true, needsPassword: false, userType: 'mandante', isRegistered: false };
  };

  const checkContratistaAccount = async (email: string, projectData: any) => {
    const contratistaEmail = projectData?.Contratistas?.ContactEmail;
    const contratistaPassword = projectData?.Contratistas?.Password;
    const contratistaAuthUserId = projectData?.Contratistas?.auth_user_id;

    if (!contratistaEmail || email.toLowerCase() !== contratistaEmail.toLowerCase()) {
      return { hasAccess: false, error: 'El email ingresado no coincide con el contratista autorizado para este proyecto.' };
    }

    // Si el contratista tiene auth_user_id, requiere contraseña
    if (contratistaAuthUserId) {
      return { hasAccess: true, needsPassword: true, contratistaPassword, userType: 'contratista', isRegistered: true };
    }

    // Si no tiene auth_user_id, solo verificación por email
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

      // 1. VERIFICAR ACCESO POR TOKEN (URLContratista) PRIMERO
      if (token && (paymentData as any).URLContratista) {
        const urlContratista = (paymentData as any).URLContratista;
        const expectedToken = urlContratista.split('token=')[1];
        
        if (token === expectedToken) {
          // Token válido - acceso directo como contratista no registrado
          const accessData = {
            paymentId: paymentId.toString(),
            token: token,
            timestamp: Date.now(),
            userType: 'contratista',
            isRegistered: false
          };
          sessionStorage.setItem('contractorAccess', JSON.stringify(accessData));
          navigate(`/submission/${paymentId}`);
          return;
        }
      }

      // 2. VERIFICAR ACCESO POR EMAIL/CONTRASEÑA
      // Verificar si es mandante o contratista
      let accessCheck = null;
      
      // Intentar verificar como mandante primero
      const mandanteCheck = await checkMandanteAccount(email, projectData);
      if (mandanteCheck.hasAccess) {
        accessCheck = mandanteCheck;
      }

      // Si no es mandante, intentar verificar como contratista
      if (!accessCheck) {
        const contratistaCheck = await checkContratistaAccount(email, projectData);
        if (contratistaCheck.hasAccess) {
          accessCheck = contratistaCheck;
        }
      }

      // Si no coincide con ninguno
      if (!accessCheck || !accessCheck.hasAccess) {
        setPopupError('El email ingresado no coincide con el mandante o contratista autorizado para este proyecto.');
        return;
      }

      // Si necesita contraseña pero no la hemos verificado aún
      if (accessCheck.needsPassword && !needsPassword) {
        setNeedsPassword(true);
        const userTypeText = accessCheck.userType === 'mandante' ? 'mandante' : 'contratista';
        toast({
          title: "Contraseña requerida",
          description: `Este ${userTypeText} tiene una cuenta registrada. Por favor ingresa tu contraseña.`,
        });
        return;
      }

      // Verificar contraseña si es necesaria
      if (accessCheck.needsPassword) {
        const correctPassword = accessCheck.userType === 'mandante' 
          ? accessCheck.mandantePassword 
          : accessCheck.contratistaPassword;
          
        if (password !== correctPassword) {
          setPopupError('La contraseña ingresada es incorrecta.');
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
        navigate(`/submission/${paymentId}`);
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
