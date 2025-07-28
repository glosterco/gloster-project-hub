
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
      return { hasAccess: true, needsPassword: true, mandantePassword };
    }

    // Si no tiene auth_user_id, solo verificación por email
    return { hasAccess: true, needsPassword: false };
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
      // Paso 2: Consulta a Supabase para obtener el estado de pago con query simplificada
      const { data: paymentData, error: paymentError } = await supabase
        .from('Estados de pago')
        .select(`
          id,
          Project,
          URLMandante
        `)
        .eq('id', parsedPaymentId)
        .maybeSingle();

      // Obtener datos del proyecto por separado para evitar problemas de join
      let projectData = null;
      if (paymentData) {
        const { data: projectInfo } = await supabase
          .from('Proyectos')
          .select(`
            id,
            Owner,
            Mandantes!Owner (
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
      console.log("paymentError:", paymentError);

      if (paymentError) {
        console.error("Error en la consulta de Supabase:", paymentError);
        setPopupError('Error al verificar la información del estado de pago.');
        return;
      }

      if (!paymentData) {
        console.log("Estado de pago no encontrado en la base de datos.");
        setPopupError('No se encontró el estado de pago con el ID proporcionado.');
        return;
      }

      if (!projectData) {
        console.log("Proyecto no encontrado.");
        setPopupError('No se encontró información del proyecto.');
        return;
      }

      console.log("Estado de pago encontrado:", paymentData);

      // Verificar el email y contraseña del mandante
      const mandanteEmail = projectData?.Mandantes?.ContactEmail;
      const mandantePassword = projectData?.Mandantes?.Password;

      if (!mandanteEmail) {
        console.log("No se encontró el email del mandante.");
        setPopupError('No se encontró el email del mandante para este proyecto.');
        return;
      }

      // Verificar acceso del mandante
      const accessCheck = await checkMandanteAccount(email, projectData);
      
      if (!accessCheck.hasAccess) {
        setPopupError(accessCheck.error);
        return;
      }

      // Si el mandante necesita contraseña pero no la hemos verificado aún
      if (accessCheck.needsPassword && !needsPassword) {
        setNeedsPassword(true);
        toast({
          title: "Contraseña requerida",
          description: "Este mandante tiene una cuenta. Por favor ingresa tu contraseña.",
        });
        return;
      }

      // Verificar contraseña si es necesaria
      if (accessCheck.needsPassword && password !== accessCheck.mandantePassword) {
        setPopupError('La contraseña ingresada es incorrecta.');
        return;
      }

      // Paso 5: Verificación del token si está presente
      if (token) {
        const expectedUrl = `${window.location.origin}/email-access?paymentId=${paymentId}&token=${token}`;
        console.log('Comprobando URL:', { esperado: expectedUrl, almacenado: paymentData?.URLMandante });

        if (paymentData?.URLMandante !== expectedUrl) {
          setPopupError('El enlace de acceso no es válido o ha expirado.');
          return;
        }
      }

      // Paso 6: Verificación de los estados de pago relacionados con el proyecto
      const { data: relatedPayments, error: relatedPaymentsError } = await supabase
        .from('Estados de pago')
        .select('id')
        .eq('Project', projectData.id);

      console.log("Estados de pago relacionados (relatedPayments):", relatedPayments);
      console.log("Error al obtener estados de pago relacionados (relatedPaymentsError):", relatedPaymentsError);

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
          token: 'mandante_authenticated',
          mandanteCompany: projectData?.Mandantes?.CompanyName || '',
          timestamp: Date.now()
        };

        sessionStorage.setItem('mandanteAccess', JSON.stringify(accessData));

        navigate(`/submission/${paymentId}`);
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
                Email del Mandante
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gloster-gray" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="mandante@empresa.com"
                  className="pl-10 font-rubik"
                  disabled={loading}
                />
              </div>
            </div>

            {needsPassword && (
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700 font-rubik">
                  Contraseña del Mandante
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
