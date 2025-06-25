
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

  useEffect(() => {
    if (!paymentId) {
      navigate('/');
      return;
    }
  }, [paymentId, navigate]);

  const validateEmailFormat = (email: string) => {
    // Simple regex to validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
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

    if (!validateEmailFormat(email)) {
      toast({
        title: "Formato de email inválido",
        description: "Por favor ingresa un email válido",
        variant: "destructive"
      });
      return;
    }

    // Extraer y validar el paymentId
    const extractedPaymentId = paymentId;
    console.log("Payment ID extraído:", extractedPaymentId); // Verificar que el paymentId sea '40'

    if (!extractedPaymentId || isNaN(Number(extractedPaymentId))) {
      toast({
        title: "ID de pago inválido",
        description: "El ID de pago proporcionado no es válido o no está presente en la URL.",
        variant: "destructive"
      });
      return;
    }

    const parsedPaymentId = parseInt(extractedPaymentId); // Use parseInt instead of BigInt
    console.log("Payment ID convertido a number:", parsedPaymentId); // Verificar que sea number

    setLoading(true);

    try {
      // Obtener los datos del estado de pago
      const { data: paymentData, error: paymentError } = await supabase
        .from('Estados de pago')
        .select('*')
        .eq('id', parsedPaymentId) // Now using number directly
        .single();

      if (paymentError) {
        console.error('Error fetching payment data:', paymentError);
        toast({
          title: "Error al obtener datos del estado de pago",
          description: `Detalles del error: ${paymentError.message}`,
          variant: "destructive"
        });
        return;
      }

      if (!paymentData) {
        toast({
          title: "Estado de pago no encontrado",
          description: "No se encontró el estado de pago con el ID proporcionado.",
          variant: "destructive"
        });
        return;
      }

      const paymentDataSingle = paymentData;
      console.log('Payment data found:', paymentDataSingle);

      // Obtener la relación del proyecto asociado al estado de pago
      const { data: proyectoData, error: proyectoError } = await supabase
        .from('Proyectos')
        .select(`
          Mandantes!Owner(
            ContactEmail, 
            CompanyName
          )
        `)
        .eq('id', paymentDataSingle.Project)
        .single();

      if (proyectoError) {
        console.error('Error fetching project data:', proyectoError);
        toast({
          title: "Error al obtener datos del proyecto",
          description: `Detalles del error: ${proyectoError.message}`,
          variant: "destructive"
        });
        return;
      }

      if (!proyectoData || !proyectoData.Mandantes?.ContactEmail) {
        toast({
          title: "Mandante no encontrado",
          description: "No se pudo obtener el email del mandante para este proyecto.",
          variant: "destructive"
        });
        return;
      }

      const mandanteEmail = proyectoData.Mandantes.ContactEmail;
      const mandanteCompany = proyectoData.Mandantes.CompanyName;
      console.log('Comparing emails:', { provided: email.toLowerCase(), mandante: mandanteEmail.toLowerCase() });

      // Comparar el email ingresado con el del mandante
      if (email.toLowerCase() !== mandanteEmail.toLowerCase()) {
        toast({
          title: "Acceso denegado",
          description: "El email ingresado no coincide con el mandante autorizado para este proyecto.",
          variant: "destructive"
        });
        return;
      }

      // Si se pasa la verificación, almacenar los datos de acceso
      const accessData = {
        paymentId: parsedPaymentId.toString(), // Store as string
        email: email,
        token: token || 'verified',
        mandanteCompany: mandanteCompany || '', // Store the CompanyName
        timestamp: new Date().toISOString()
      };

      sessionStorage.setItem('mandanteAccess', JSON.stringify(accessData));

      toast({
        title: "Acceso verificado",
        description: "Email verificado correctamente. Redirigiendo...",
      });

      setTimeout(() => {
        navigate(`/submission-view?paymentId=${parsedPaymentId}`);
      }, 1000);

    } catch (error) {
      console.error('Error verifying email access:', error);
      toast({
        title: "Error de verificación",
        description: `No se pudo verificar el acceso. Intenta nuevamente. Detalles: ${error.message}`,
        variant: "destructive"
      });
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
    </div>
  );
};

export default EmailAccess;
