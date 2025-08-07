
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

  const verifyEmailAccess = async () => {
    if (!email.trim()) {
      toast({
        title: "Email requerido",
        description: "Por favor ingresa tu email para verificar el acceso",
        variant: "destructive"
      });
      return;
    }

    if (needsPassword && !password.trim()) {
      toast({
        title: "Contraseña requerida",
        description: "Por favor ingresa tu contraseña para verificar el acceso",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const parsedPaymentId = parseInt(paymentId?.trim() || "", 10);

    console.log("paymentId (parsed):", parsedPaymentId);

    if (isNaN(parsedPaymentId)) {
      toast({
        title: "ID de pago inválido",
        description: "El ID de pago proporcionado no es válido.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      // Consulta a Supabase para obtener el estado de pago
      const { data: paymentData, error: paymentError } = await supabase
        .from('Estados de pago')
        .select(`
          id,
          Project,
          URLMandante,
          URLContratista
        `)
        .eq('id', parsedPaymentId)
        .maybeSingle();

      // Obtener datos del proyecto por separado
      let projectData = null;
      if (paymentData) {
        const { data: projectInfo } = await supabase
          .from('Proyectos')
          .select(`
            id,
            Owner,
            Contratista,
            Mandantes!Owner (
              id,
              CompanyName,
              ContactEmail,
              Password,
              auth_user_id
            ),
            Contratistas!Contratista (
              id,
              CompanyName,
              ContactEmail,
              Password,
              auth_user_id
            )
          `)
          .eq('id', paymentData.Project)
          .single();

        if (projectInfo) {
          projectData = projectInfo;
        }
      }

      console.log("paymentData:", paymentData);
      console.log("projectData:", projectData);

      if (paymentError) {
        console.error("Error en la consulta de Supabase:", paymentError);
        setPopupError('Error al verificar la información del estado de pago.');
        return;
      }

      if (!paymentData) {
        setPopupError('No se encontró el estado de pago con el ID proporcionado.');
        return;
      }

      if (!projectData) {
        setPopupError('No se encontró información del proyecto.');
        return;
      }

      // Verificar si es mandante o contratista
      let accessCheck = null;
      
      // Intentar verificar como mandante primero
      const mandanteEmail = projectData?.Mandantes?.ContactEmail;
      if (mandanteEmail) {
        const mandanteCheck = await checkMandanteAccount(email, projectData);
        if (mandanteCheck.hasAccess) {
          accessCheck = mandanteCheck;
        }
      }

      // Si no es mandante, intentar verificar como contratista
      if (!accessCheck) {
        const contratistaEmail = projectData?.Contratistas?.ContactEmail;
        if (contratistaEmail) {
          const contratistaCheck = await checkContratistaAccount(email, projectData);
          if (contratistaCheck.hasAccess) {
            accessCheck = contratistaCheck;
          }
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

      // Verificación del token según el tipo de usuario
      if (token) {
        const expectedUrl = `${window.location.origin}/email-access?paymentId=${paymentId}&token=${token}`;
        const storedUrl = accessCheck.userType === 'mandante' 
          ? paymentData?.URLMandante 
          : paymentData?.URLContratista;
        
        console.log('Comprobando URL:', { 
          esperado: expectedUrl, 
          almacenado: storedUrl,
          userType: accessCheck.userType 
        });

        if (storedUrl !== expectedUrl) {
          setPopupError('El enlace de acceso no es válido o ha expirado.');
          return;
        }
      }

      // Verificación de los estados de pago relacionados con el proyecto
      const { data: relatedPayments, error: relatedPaymentsError } = await supabase
        .from('Estados de pago')
        .select('id')
        .eq('Project', projectData.id);

      if (relatedPaymentsError) {
        console.error("Error al obtener los estados de pago relacionados:", relatedPaymentsError);
        setPopupError('Hubo un error al obtener los estados de pago relacionados.');
        return;
      }

      const isPaymentValid = relatedPayments && relatedPayments.some(payment => payment.id === parsedPaymentId);

      if (isPaymentValid) {
        toast({
          title: "Acceso verificado",
          description: "Estado de pago verificado correctamente.",
        });

        const accessData = {
          paymentId: paymentId,
          email: email,
          token: `${accessCheck.userType}_authenticated`,
          mandanteCompany: projectData?.Mandantes?.CompanyName || '',
          contratistaCompany: projectData?.Contratistas?.CompanyName || '',
          userType: accessCheck.userType,
          isRegistered: accessCheck.isRegistered,
          timestamp: Date.now()
        };

        sessionStorage.setItem('userAccess', JSON.stringify(accessData));

        // Redirección según el tipo de usuario y si está registrado
        if (accessCheck.userType === 'contratista') {
          // Todos los contratistas van al payment detail (registrados y no registrados)
          navigate(`/payment-detail/${paymentId}`);
        } else {
          // Mandantes van a submission view (registrados y no registrados con acceso limitado)
          navigate(`/submission/${paymentId}`);
        }
      } else {
        setPopupError('El estado de pago no coincide con los estados de pago encontrados para el proyecto.');
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
      verifyEmailAccess();
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
              onClick={verifyEmailAccess}
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
