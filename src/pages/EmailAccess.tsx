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
  const [stateIds, setStateIds] = useState<number[]>([]);  // Lista de IDs de estados de pago encontrados
  const [showPopup, setShowPopup] = useState(false);  // Control de visibilidad del popup
  const [popupError, setPopupError] = useState<string>('');  // Mensaje de error para el popup

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
    setPopupError('');  // Resetear el error en el popup

    try {
      const parsedPaymentId = Number(paymentId?.trim());
      if (isNaN(parsedPaymentId)) {
        toast({
          title: "ID de pago inválido",
          description: "El ID de pago proporcionado no es válido.",
          variant: "destructive",
        });
        return;
      }

      // Mostrar la ventana emergente con la información de los IDs de los estados de pago relacionados
      setShowPopup(true);

      // Realizando consulta para obtener el estado de pago con el ID proporcionado
      const { data: paymentData, error: paymentError } = await supabase
        .from('Estados de pago')
        .select(`
          id,
          Proyectos!inner (
            id,
            Mandantes!inner (*)
          )
        `)
        .eq('id', parsedPaymentId)
        .single();

      if (paymentError) {
        console.error('Error al obtener datos del estado de pago:', paymentError);
        setPopupError('No se pudo verificar la información del estado de pago.');
        return;
      }

      if (!paymentData) {
        setPopupError('No se encontró el estado de pago con el ID proporcionado.');
        return;
      }

      // Mostrar el estado de pago encontrado
      console.log('Estado de pago encontrado:', paymentData);

      // Realizar una nueva consulta para obtener los ID de los estados de pago asociados al proyecto
      const { data: relatedPayments, error: relatedPaymentsError } = await supabase
        .from('Estados de pago')
        .select('id')
        .eq('proyecto_id', paymentData.Proyectos.id);  // Usar el ID del proyecto para obtener los estados de pago relacionados

      if (relatedPaymentsError) {
        console.error('Error al obtener otros estados de pago relacionados:', relatedPaymentsError);
        setPopupError('Hubo un error al obtener los estados de pago relacionados.');
        return;
      }

      // Si existen estados de pago relacionados, guardamos los IDs en el estado
      if (relatedPayments && relatedPayments.length > 0) {
        setStateIds(relatedPayments.map(payment => payment.id));  // Establecer los IDs de los estados de pago relacionados
      } else {
        setPopupError('No se encontraron estados de pago relacionados con el proyecto.');
      }

      // Ahora, comprobar si el ID del estado de pago proporcionado se encuentra en los estados relacionados
      if (stateIds.includes(parsedPaymentId)) {
        toast({
          title: "Acceso verificado",
          description: "Estado de pago verificado correctamente.",
          variant: "success",
        });
      } else {
        setPopupError('El estado de pago no coincide con los estados de pago encontrados.');
      }

    } catch (error) {
      console.error('Error de verificación:', error);
      setPopupError('Ocurrió un error durante la verificación.');
    } finally {
      setLoading(false);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
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

      {/* Ventana emergente con la lista de IDs */}
      {showPopup && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-lg max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">Estado de pago a buscar: {paymentId}</h2>
            <p>Se están comparando los siguientes estados de pago:</p>
            <ul className="list-disc pl-5">
              {stateIds.length > 0 ? (
                stateIds.map(id => (
                  <li key={id}>ID Estado de Pago: {id}</li>
                ))
              ) : (
                <li>No se encontraron estados de pago relacionados</li>
              )}
            </ul>
            <p className="text-red-500 mt-4">{popupError}</p> {/* Mostrar el error en el popup */}
            <div className="mt-4">
              <Button onClick={closePopup} variant="ghost" className="w-full">Cerrar</Button>
