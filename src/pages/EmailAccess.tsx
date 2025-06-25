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
  const [popupError, setPopupError] = useState<string | null>(null);
  const [paymentDataLog, setPaymentDataLog] = useState<any>(null); // Used for logging

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

    // Paso 1: Asegurarnos de que el paymentId es un número
    const parsedPaymentId = parseInt(paymentId?.trim() || "", 10);

    // Verificamos que el paymentId se ha convertido correctamente a número
    console.log("paymentId (parsed):", parsedPaymentId);

    if (isNaN(parsedPaymentId)) {
      toast({
        title: "ID de pago inválido",
        description: "El ID de pago proporcionado no es válido.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Paso 2: Consulta a Supabase para obtener el estado de pago
      const { data: paymentData, error: paymentError } = await supabase
        .from('Estados de pago')
        .select(`
          id,
          Proyectos!inner (
            id,
            Mandantes!inner (*)
          )
        `)
        .eq('id', parsedPaymentId); // Buscamos por el id correctamente convertido

      // Mostrar los datos que devuelve la consulta
      console.log("paymentData:", paymentData);
      console.log("paymentError:", paymentError);

      if (paymentError) {
        console.error("Error en la consulta de Supabase:", paymentError);
        setPopupError('Error al verificar la información del estado de pago.');
        setPaymentDataLog({ paymentId: parsedPaymentId, error: paymentError });
        return;
      }

      // Paso 3: Verificación de la existencia de datos
      if (!paymentData || paymentData.length === 0) {
        console.log("Estado de pago no encontrado en la base de datos.");
        setPopupError('No se encontró el estado de pago con el ID proporcionado.');
        setPaymentDataLog({ paymentId: parsedPaymentId, error: "Estado de pago no encontrado" });
        return;
      }

      // Paso 4: Datos encontrados, procesamos la información
      console.log("Estado de pago encontrado:", paymentData[0]);

      // Verificar el email del mandante
      const mandanteEmail = paymentData[0]?.Proyectos?.Mandantes?.ContactEmail;

      if (!mandanteEmail) {
        console.log("No se encontró el email del mandante.");
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
        console.log('Comprobando URL:', { esperado: expectedUrl, almacenado: paymentData[0]?.URLMandante });

        if (paymentData[0]?.URLMandante !== expectedUrl) {
          setPopupError('El enlace de acceso no es válido o ha expirado.');
          return;
        }
      }

      // Paso 6: Verificación de los estados de pago relacionados con el proyecto
      const { data: relatedPayments, error: relatedPaymentsError } = await supabase
        .from('Estados de pago')
        .select('id')
        .eq('proyecto_id', paymentData[0]?.Proyectos.id); // Buscamos todos los estados de pago asociados al proyecto

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
          variant: "success",
        });

        // Guardamos en sessionStorage si el acceso es válido
        const accessData = {
          paymentId: paymentId,
          email: email,
          token: token || 'verified',
          mandanteCompany: paymentData[0]?.Proyectos?.Mandantes?.CompanyName || '',
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
                  className="pl-10 font-rubik"
                  disabled={loading}
                />
              </div>
            </div>
            
            <Button
              onClick={verifyEmailAccess}
              disabled={loading || !email.trim()}
              className="w-full bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
            >
              {loading ? 'Verificando...' : 'Verificar Acceso'}
            </Button>
            
            <div className="text-center">
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                className="text-gloster-gray hover:text-slate-800 font-rubik"
              >
                Volver al Inicio
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pop-up de error o log */}
      {popupError && (
        <div className="popup-error">
          <p>{popupError}</p>
          <pre>{JSON.stringify(paymentDataLog, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default EmailAccess;
