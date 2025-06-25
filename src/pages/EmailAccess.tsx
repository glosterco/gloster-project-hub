
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft } from 'lucide-react';

const EmailAccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId');
  const token = searchParams.get('token');
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [popupError, setPopupError] = useState<string | null>(null);
  const [paymentDataLog, setPaymentDataLog] = useState<any>(null);

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
      // Paso 1: Consulta a Supabase para obtener todos los estados de pago con ese ID
      const { data: paymentData, error: paymentError } = await supabase
        .from('Estados de pago')
        .select(`
          id,
          URLMandante,
          Proyectos!inner (
            id,
            Mandantes!inner (*)
          )
        `)
        .eq('id', parsedPaymentId);

      console.log("Estados de pago encontrados (paymentData):", paymentData);
      console.log("Error al obtener estado de pago (paymentError):", paymentError);

      // Paso 2: Comprobación de la respuesta de la consulta
      if (paymentError) {
        console.error('Error al obtener datos del estado de pago:', paymentError);
        setPopupError('No se pudo verificar la información del estado de pago.');
        setPaymentDataLog({ paymentId: parsedPaymentId, error: paymentError });
        return;
      }

      if (!paymentData || paymentData.length === 0) {
        setPopupError('No se encontró el estado de pago con el ID proporcionado.');
        setPaymentDataLog({ paymentId: parsedPaymentId, error: 'Estado de pago no encontrado' });
        return;
      }

      // Paso 3: Guardamos el resultado de la consulta
      setPaymentDataLog({
        paymentId: parsedPaymentId,
        paymentData: paymentData,
        mandanteEmail: paymentData[0]?.Proyectos?.Mandantes?.ContactEmail
      });

      // Paso 4: Verificación del email
      const mandanteEmail = paymentData[0]?.Proyectos?.Mandantes?.ContactEmail;
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
        .eq('Project', paymentData[0]?.Proyectos.id);

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

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      {/* Header */}
      <div className="bg-white border-b border-gloster-gray/20 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
              alt="Gloster Logo" 
              className="w-8 h-8"
            />
            <h1 className="text-xl font-bold text-slate-800 font-rubik">Acceso al Estado de Pago</h1>
          </div>
        </div>
      </div>

      {/* Volver */}
      <div className="bg-slate-50 py-2">
        <div className="container mx-auto px-6">
          <button 
            onClick={() => navigate('/')}
            className="text-gloster-gray hover:text-slate-800 text-sm font-rubik flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Inicio
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Verificación de Acceso</CardTitle>
              <CardDescription>
                Ingresa tu email para acceder al estado de pago
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  type="email"
                  placeholder="Tu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              {popupError && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                  {popupError}
                </div>
              )}

              <Button 
                onClick={verifyEmailAccess}
                disabled={loading || !email.trim()}
                className="w-full"
              >
                {loading ? 'Verificando...' : 'Verificar Acceso'}
              </Button>

              {paymentDataLog && (
                <div className="text-xs text-gray-500 mt-4">
                  <details>
                    <summary>Información de depuración</summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(paymentDataLog, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmailAccess;
