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
  const [modalData, setModalData] = useState<string | null>(null); // Modal state to display data

  useEffect(() => {
    if (!paymentId) navigate('/');
  }, [paymentId, navigate]);

  const validateEmail = (email: string) =>
    /^[a-zA-Z0-9._%+-]+@[a-zAZ0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

  const verifyEmailAccess = async () => {
    if (!email.trim() || !validateEmail(email)) {
      toast({
        title: "Email requerido o inválido",
        description: "Por favor ingresa un email válido.",
        variant: "destructive",
      });
      return;
    }

    const parsedPaymentId = Number(paymentId);
    if (isNaN(parsedPaymentId)) {
      toast({
        title: "ID de pago inválido",
        description: "El ID de pago proporcionado no es válido.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const logData = []; // Collecting data for modal
    logData.push(`Buscando estado de pago con ID: ${parsedPaymentId}`);  // Debugging log

    try {
      // Obtener estado de pago
      const { data: paymentData, error: paymentError } = await supabase
        .from('Estados de pago')
        .select('Project')
        .eq('id', parsedPaymentId)
        .single();

      logData.push(`Estado de pago obtenido: ${JSON.stringify(paymentData)}`);
      logData.push(`Error al obtener el estado de pago: ${JSON.stringify(paymentError)}`);

      if (paymentError || !paymentData) {
        toast({ title: "Estado de pago no encontrado", description: "El estado de pago no existe.", variant: "destructive" });
        setModalData(logData.join('\n'));  // Set modal data to show it
        return;
      }

      const projectId = paymentData.Project;
      logData.push(`ID del proyecto asociado: ${projectId}`);

      const { data: projectData, error: projectError } = await supabase
        .from('Proyectos')
        .select('Mandantes(ContactEmail, CompanyName)')
        .eq('id', projectId)
        .single();

      logData.push(`Datos del proyecto: ${JSON.stringify(projectData)}`);
      logData.push(`Error al obtener proyecto: ${JSON.stringify(projectError)}`);

      if (projectError || !projectData?.Mandantes?.ContactEmail) {
        toast({ title: "Mandante no encontrado", description: "No se encontró el mandante.", variant: "destructive" });
        setModalData(logData.join('\n'));  // Set modal data to show it
        return;
      }

      const mandanteEmail = projectData.Mandantes.ContactEmail;
      logData.push(`Email del mandante: ${mandanteEmail}`);

      if (email.toLowerCase() !== mandanteEmail.toLowerCase()) {
        toast({
          title: "Acceso denegado",
          description: "El email ingresado no coincide con el mandante autorizado.",
          variant: "destructive",
        });
        setModalData(logData.join('\n'));  // Set modal data to show it
        return;
      }

      // Si todo es válido, guardar en sessionStorage
      sessionStorage.setItem('mandanteAccess', JSON.stringify({
        paymentId: parsedPaymentId, email, token: token || 'verified',
        mandanteCompany: projectData.Mandantes.CompanyName, timestamp: new Date().toISOString()
      }));

      toast({ title: "Acceso verificado", description: "Redirigiendo...", });

      setTimeout(() => navigate(`/submission-view?paymentId=${parsedPaymentId}`), 1000);
    } catch (error) {
      toast({ title: "Error de verificación", description: "No se pudo verificar el acceso.", variant: "destructive" });
      logData.push(`Error general: ${error.message}`);
      setModalData(logData.join('\n'));  // Set modal data to show it
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-rubik flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-gloster-gray/20">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gloster-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-gloster-gray" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800 font-rubik">Verificación de Acceso</CardTitle>
          <CardDescription className="font-rubik">Ingresa tu email para acceder al estado de pago</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-slate-700 font-rubik">Email del Mandante</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gloster-gray" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && verifyEmailAccess()}
                  placeholder="mandante@empresa.com"
                  className="pl-10 font-rubik"
                  disabled={loading}
                />
              </div>
            </div>
            <Button onClick={verifyEmailAccess} disabled={loading || !email.trim()} className="w-full bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik">
              {loading ? 'Verificando...' : 'Verificar Acceso'}
            </Button>
            <div className="text-center">
              <Button onClick={() => navigate('/')} variant="ghost" className="text-gloster-gray hover:text-slate-800 font-rubik">Volver al Inicio</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal to display the log data */}
      {modalData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="font-bold text-lg mb-4">Detalles de Verificación</h3>
            <pre className="text-sm overflow-auto max-h-60">{modalData}</pre>
            <Button onClick={() => setModalData(null)} className="mt-4 w-full bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik">
              Cerrar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailAccess;
