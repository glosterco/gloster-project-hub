
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
          URLMandante,
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
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
          <div className="text-center mb-6">
            <img 
              src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
              alt="Gloster Logo" 
              className="w-12 h-12 mx-auto mb-4"
            />
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Verificar Acceso</h1>
            <p className="text-gloster-gray">Ingresa tu email para acceder al estado de pago</p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email del Mandante
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ingresa tu email"
                className="w-full"
              />
            </div>

            {popupError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{popupError}</p>
              </div>
            )}

            <Button
              onClick={verifyEmailAccess}
              disabled={loading}
              className="w-full bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
            >
              {loading ? 'Verificando...' : 'Verificar Acceso'}
            </Button>

            <div className="text-center">
              <button
                onClick={() => navigate('/')}
                className="text-sm text-gloster-gray hover:text-slate-800"
              >
                Volver al inicio
              </button>
            </div>
          </div>

          {/* Debug information */}
          {paymentDataLog && (
            <div className="mt-6 p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-600">
                Debug: {JSON.stringify(paymentDataLog, null, 2)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailAccess;
