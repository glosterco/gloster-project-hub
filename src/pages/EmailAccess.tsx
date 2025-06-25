
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
  const [loading, setLoading] = useState(false);
  const [popupError, setPopupError] = useState('');
  const [paymentDataLog, setPaymentDataLog] = useState<any>(null);

  useEffect(() => {
    if (!paymentId) {
      navigate('/');
      return;
    }
  }, [paymentId, navigate]);

  const verifyEmailAccess = async () => {
    if (!email.trim()) {
      toast({
        title: "Email requerido",
        description: "Por favor ingresa tu email para verificar el acceso",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const parsedPaymentId = Number(paymentId?.trim());
    console.log("paymentId:", parsedPaymentId);

    if (isNaN(parsedPaymentId)) {
      toast({
        title: "ID de pago inválido",
        description: "El ID de pago proporcionado no es válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Paso 1: Consulta simplificada para obtener el estado de pago
      const { data: paymentData, error: paymentError } = await supabase
        .from('Estados de pago')
        .select('id, URLMandante, Project')
        .eq('id', parsedPaymentId)
        .single();

      console.log("Estado de pago encontrado (paymentData):", paymentData);
      console.log("Error al obtener estado de pago (paymentError):", paymentError);

      if (paymentError) {
        console.error('Error al obtener datos del estado de pago:', paymentError);
        setPopupError('No se pudo verificar la información del estado de pago.');
        setPaymentDataLog({ paymentId: parsedPaymentId, error: paymentError });
        return;
      }

      if (!paymentData) {
        setPopupError('No se encontró el estado de pago con el ID proporcionado.');
        setPaymentDataLog({ paymentId: parsedPaymentId, error: 'Estado de pago no encontrado' });
        return;
      }

      // Paso 2: Obtener datos del proyecto y mandante por separado
      const { data: projectData, error: projectError } = await supabase
        .from('Proyectos')
        .select(`
          id,
          Owner,
          Mandantes!inner (
            id,
            CompanyName,
            ContactEmail,
            ContactName,
            ContactPhone,
            Status
          )
        `)
        .eq('id', paymentData.Project)
        .single();

      if (projectError || !projectData) {
        console.error('Error al obtener datos del proyecto:', projectError);
        setPopupError('No se pudieron obtener los datos del proyecto.');
        setPaymentDataLog({ paymentId: parsedPaymentId, error: projectError });
        return;
      }

      // Paso 3: Guardamos el resultado de la consulta
      setPaymentDataLog({
        paymentId: parsedPaymentId,
        paymentData: paymentData,
        projectData: projectData,
        mandanteEmail: projectData.Mandantes?.ContactEmail
      });

      // Paso 4: Verificación del email
      const mandanteEmail = projectData.Mandantes?.ContactEmail;
      if (!mandanteEmail) {
        setPopupError('No se encontró el email del mandante para este proyecto.');
        return;
      }

      console.log('Comparando emails:', { proporcionado: email.toLowerCase(), mandante: mandanteEmail.toLowerCase() });

      if (email.toLowerCase() !== mandanteEmail.toLowerCase()) {
        setPopupError('El email ingresado no coincide con el mandante autorizado para este proyecto.');
        return;
      }

      // Paso 5: Verificación del token si está presente
      if (token) {
        const expectedUrl = `${window.location.origin}/email-access?paymentId=${paymentId}&token=${token}`;
        console.log('Comprobando URL:', { esperado: expectedUrl, almacenado: paymentData.URLMandante });

        if (paymentData.URLMandante !== expectedUrl) {
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

      // Verificamos si el estado de pago con el ID solicitado está entre los relacionados
      const isPaymentValid = relatedPayments && relatedPayments.some(payment => payment.id === parsedPaymentId);

      if (isPaymentValid) {
        toast({
          title: "Acceso verificado",
          description: "Estado de pago verificado correctamente.",
        });

        // Guardamos en sessionStorage si el acceso es válido
        const accessData = {
          paymentId: paymentId,
          email: email,
          token: token || 'verified',
          mandanteCompany: projectData.Mandantes?.CompanyName || '',
          timestamp: new Date().toISOString()
        };

        sessionStorage.setItem('mandanteAccess', JSON.stringify(accessData));

        // Redirigir a la vista de submission
        setTimeout(() => {
          navigate(`/submission-view?paymentId=${paymentId}`);
        }, 1000);
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
      {/* Ventana emergente con la información del error */}
      {popupError && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg">
            <h3 className="text-lg font-bold text-red-600">{popupError}</h3>
            <h4 className="mt-2 font-medium">Información adicional:</h4>
            <pre className="bg-gray-100 p-2 rounded-lg text-xs">{JSON.stringify(paymentDataLog, null, 2)}</pre>
            <Button
              onClick={() => setPopupError('')}
              className="mt-4 w-full bg-red-600 text-white hover:bg-red-700"
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}

      <Card className="w-full max-w-md border-gloster-gray/20">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gloster-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-gloster-gray" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800 font-rubik">
            Verificación de Acceso
          </CardTitle>
          <CardDescription className="font-rubik">
            Ingresa tu email para acceder al estado de pago
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
                  className="pl-10"
                />
              </div>
            </div>
            <Button onClick={verifyEmailAccess} disabled={loading} className="w-full">
              {loading ? 'Verificando...' : 'Verificar acceso'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailAccess;
