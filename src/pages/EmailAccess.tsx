
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Mail, Lock, HelpCircle, UserPlus, Clock, Info } from 'lucide-react';
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
  const [paymentDataLog, setPaymentDataLog] = useState<any>(null);
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [temporaryCodeLoading, setTemporaryCodeLoading] = useState(false);
  const [isTemporaryAccess, setIsTemporaryAccess] = useState(false);

  useEffect(() => {
    if (!paymentId) {
      navigate('/');
      return;
    }
  }, [paymentId, navigate]);

  const sendTemporaryCode = async () => {
    console.log('🔄 sendTemporaryCode called with email:', email);
    
    if (!email.trim()) {
      toast({
        title: "Email requerido",
        description: "Por favor ingresa tu email para recibir el código temporal",
        variant: "destructive"
      });
      return;
    }

    if (!paymentId) {
      toast({
        title: "Error",
        description: "ID de pago no encontrado",
        variant: "destructive"
      });
      return;
    }

    setTemporaryCodeLoading(true);
    console.log('📧 Enviando código temporal...');

    try {
      const { data, error } = await supabase.functions.invoke('send-temporary-access-code', {
        body: {
          paymentId: paymentId,
          email: email.trim()
        },
      });

      console.log('📧 Response:', { data, error });

      if (error) {
        console.error('Error from function:', error);
        throw error;
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Error al enviar código temporal');
      }

      toast({
        title: "Código enviado",
        description: "Se ha enviado un código temporal a tu email. Úsalo como contraseña para acceder.",
      });

      setIsTemporaryAccess(true);
      setShowAccountDialog(false);
      
      // Limpiar la contraseña para que el usuario ingrese el código
      setPassword('');
      
    } catch (error) {
      console.error('Error sending temporary code:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el código temporal",
        variant: "destructive"
      });
    } finally {
      setTemporaryCodeLoading(false);
    }
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

    if (!password.trim()) {
      toast({
        title: isTemporaryAccess ? "Código temporal requerido" : "Contraseña requerida",
        description: isTemporaryAccess ? "Por favor ingresa el código temporal enviado a tu email" : "Por favor ingresa tu contraseña para verificar el acceso",
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
        .eq('id', parsedPaymentId);

      console.log("paymentData:", paymentData);
      console.log("paymentError:", paymentError);

      if (paymentError) {
        console.error("Error en la consulta de Supabase:", paymentError);
        setPopupError('Error al verificar la información del estado de pago.');
        setPaymentDataLog({ paymentId: parsedPaymentId, error: paymentError });
        return;
      }

      if (!paymentData || paymentData.length === 0) {
        console.log("Estado de pago no encontrado en la base de datos.");
        setPopupError('No se encontró el estado de pago con el ID proporcionado.');
        setPaymentDataLog({ paymentId: parsedPaymentId, error: "Estado de pago no encontrado" });
        return;
      }

      console.log("Estado de pago encontrado:", paymentData[0]);

      // Verificar el email y contraseña del mandante
      const mandanteEmail = paymentData[0]?.Proyectos?.Mandantes?.ContactEmail;
      const mandantePassword = paymentData[0]?.Proyectos?.Mandantes?.Password;

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

      // Verificar contraseña o código temporal
      let passwordValid = false;
      
      if (isTemporaryAccess) {
        // Verificar código temporal
        const { data: tempCodeData, error: tempCodeError } = await supabase
          .from('temporary_access_codes')
          .select('*')
          .eq('payment_id', parsedPaymentId)
          .eq('email', email.toLowerCase())
          .eq('code', password.trim())
          .eq('used', false)
          .gt('expires_at', new Date().toISOString())
          .single();

        console.log('🔍 Temporary code verification:', { 
          paymentId: parsedPaymentId, 
          email: email.toLowerCase(), 
          code: password.trim(),
          found: !!tempCodeData,
          error: tempCodeError 
        });

        if (tempCodeError || !tempCodeData) {
          console.error('❌ Temporary code verification failed:', tempCodeError);
          setPopupError('Código temporal inválido o expirado. Verifica que el código sea correcto y no haya expirado.');
          return;
        }

        // Marcar código como usado
        const { error: updateError } = await supabase
          .from('temporary_access_codes')
          .update({ used: true })
          .eq('id', tempCodeData.id);

        if (updateError) {
          console.error('❌ Error marking code as used:', updateError);
        }

        passwordValid = true;
      } else {
        // Verificar contraseña normal
        if (mandantePassword && password !== mandantePassword) {
          setPopupError('La contraseña ingresada es incorrecta.');
          return;
        }
        passwordValid = true;
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
          mandanteCompany: paymentData[0]?.Proyectos?.Mandantes?.CompanyName || '',
          timestamp: Date.now()
        };

        sessionStorage.setItem('mandanteAccess', JSON.stringify(accessData));

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
            Ingresa tu email y contraseña para acceder al estado de pago
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

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-slate-700 font-rubik">
                {isTemporaryAccess ? 'Código Temporal' : 'Contraseña del Mandante'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gloster-gray" />
                <Input
                  id="password"
                  type={isTemporaryAccess ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Contraseña o código temporal"
                  className="pl-10 font-rubik"
                  disabled={loading}
                  maxLength={isTemporaryAccess ? 6 : undefined}
                />
              </div>
              {isTemporaryAccess && (
                <p className="text-xs text-gloster-gray font-rubik">
                  Usa el código de 6 dígitos enviado a tu email
                </p>
              )}
            </div>
            
            {/* Información sobre código temporal */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Código de acceso temporal</p>
                  <p>Si recibiste un código temporal por email, úsalo como contraseña para acceder y verificarte para aprobar el estado de pago. <strong>Los códigos temporales tienen validez ilimitada.</strong></p>
                </div>
              </div>
            </div>
            
            {/* Mensaje de estado de acceso temporal */}
            {isTemporaryAccess && (
              <div className="bg-gloster-yellow/20 border border-gloster-yellow/40 p-3 rounded-lg mb-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gloster-yellow" />
                  <p className="text-sm font-medium text-slate-700 font-rubik">
                    Código temporal enviado. Ingresa el código de 6 dígitos como contraseña.
                  </p>
                </div>
              </div>
            )}
            
            <Button
              onClick={verifyEmailAccess}
              disabled={loading || !email.trim() || !password.trim()}
              className="w-full bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik font-medium"
            >
              {loading ? 'Verificando...' : 'Verificar Acceso'}
            </Button>
            
            {/* Separador visual */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500 font-rubik">o</span>
              </div>
            </div>
            
            {/* Botón destacado para no tener cuenta */}
            <div className="text-center space-y-3">
              <Dialog open={showAccountDialog} onOpenChange={setShowAccountDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full border-2 border-gloster-yellow bg-gloster-yellow/10 hover:bg-gloster-yellow/20 text-slate-800 font-rubik font-medium transition-all duration-200 py-3"
                  >
                    <HelpCircle className="w-5 h-5 mr-2 text-gloster-yellow" />
                    ¿No tienes cuenta? Obtén acceso aquí
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-rubik text-slate-800">Acceso sin cuenta</DialogTitle>
                    <DialogDescription className="font-rubik text-slate-600">
                      Para revisar el estado de pago sin una cuenta en Gloster, puedes:
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="p-4 border border-slate-200 rounded-lg hover:border-gloster-yellow/40 transition-colors">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-gloster-yellow/20 rounded-full">
                          <UserPlus className="w-5 h-5 text-gloster-yellow" />
                        </div>
                        <h4 className="font-medium font-rubik text-slate-800">Crear una cuenta</h4>
                      </div>
                      <p className="text-sm text-slate-600 font-rubik mb-3">
                        Para obtener una cuenta asociada al proyecto, contacta a nuestro equipo de soporte.
                      </p>
                      <p className="text-sm font-medium text-gloster-gray font-rubik">
                        📧 Email: soporte@gloster.cl
                      </p>
                    </div>
                    
                    <div className="p-4 border-2 border-gloster-yellow/30 bg-gloster-yellow/5 rounded-lg">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="p-2 bg-gloster-yellow/30 rounded-full">
                          <Clock className="w-5 h-5 text-gloster-yellow" />
                        </div>
                        <h4 className="font-medium font-rubik text-slate-800">Acceso temporal</h4>
                      </div>
                      <p className="text-sm text-slate-600 font-rubik mb-4">
                        Recibe un código temporal por email para acceder inmediatamente. El código tiene validez ilimitada.
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        <label className="text-sm font-medium text-slate-700 font-rubik">
                          Email del mandante
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gloster-gray" />
                          <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="mandante@empresa.com"
                            className="pl-10 font-rubik"
                            disabled={temporaryCodeLoading}
                          />
                        </div>
                      </div>
                      
                      <Button
                        onClick={sendTemporaryCode}
                        disabled={temporaryCodeLoading || !email.trim()}
                        className="w-full bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik font-medium"
                      >
                        {temporaryCodeLoading ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                            <span>Enviando...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4" />
                            <span>Enviar código temporal</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                className="text-slate-500 hover:text-slate-700 font-rubik text-sm"
              >
                Volver al Inicio
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pop-up de error o log */}
      {popupError && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-red-600 mb-4">Error de Verificación</h3>
            <p className="text-gray-700 mb-4">{popupError}</p>
            {paymentDataLog && (
              <details className="mb-4">
                <summary className="cursor-pointer text-sm text-gray-500">Ver detalles técnicos</summary>
                <pre className="text-xs bg-gray-100 p-2 mt-2 rounded overflow-auto">
                  {JSON.stringify(paymentDataLog, null, 2)}
                </pre>
              </details>
            )}
            <Button 
              onClick={() => setPopupError(null)}
              className="w-full"
            >
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailAccess;
