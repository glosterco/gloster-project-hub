
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';

const EmailAccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId') || '11';
  const token = searchParams.get('token');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { payment, loading: paymentLoading } = usePaymentDetail(paymentId, false);

  useEffect(() => {
    // Si no hay token en la URL, es acceso inválido
    if (!token) {
      toast({
        title: "Acceso inválido",
        description: "Esta página requiere un enlace válido enviado por email",
        variant: "destructive"
      });
      navigate('/');
    }
  }, [token, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: "Email requerido",
        description: "Por favor ingresa tu email de contacto",
        variant: "destructive"
      });
      return;
    }

    if (!token) {
      toast({
        title: "Acceso inválido",
        description: "Token de acceso no válido",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Verificando email:', email.trim());
      console.log('Payment data:', payment);
      console.log('Owner data:', payment?.projectData?.Owner);
      console.log('Email del mandante en BD:', payment?.projectData?.Owner?.ContactEmail);
      
      // Verificar si el payment y los datos están disponibles
      if (!payment || !payment.projectData || !payment.projectData.Owner) {
        console.log('Datos del payment o mandante no disponibles');
        toast({
          title: "Error de datos",
          description: "No se pudieron cargar los datos del proyecto. Intenta nuevamente.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }
      
      const mandanteEmail = payment.projectData.Owner.ContactEmail;
      const inputEmail = email.toLowerCase().trim();
      
      console.log('Comparando emails:');
      console.log('- Email del mandante (BD):', mandanteEmail);
      console.log('- Email ingresado:', inputEmail);
      console.log('- Son iguales?', mandanteEmail && mandanteEmail.toLowerCase().trim() === inputEmail);
      
      // Verificar si el email coincide con el email del mandante (Owner) en la base de datos
      if (mandanteEmail && mandanteEmail.toLowerCase().trim() === inputEmail) {
        
        // Guardar acceso en sessionStorage con el token para mayor seguridad
        sessionStorage.setItem('mandanteAccess', JSON.stringify({
          email: inputEmail,
          paymentId: paymentId,
          token: token,
          timestamp: new Date().toISOString()
        }));
        
        toast({
          title: "Acceso concedido",
          description: "Serás redirigido a la vista del estado de pago",
        });
        
        // Redirigir a submission-view
        setTimeout(() => {
          navigate(`/submission-view?paymentId=${paymentId}`);
        }, 1000);
      } else {
        console.log('Email no coincide.');
        console.log('Esperado:', mandanteEmail);
        console.log('Recibido:', inputEmail);
        toast({
          title: "Email de contacto incorrecto",
          description: "El email ingresado no coincide con el email de contacto del mandante asociado al proyecto. Verifica tu bandeja de entrada.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error al verificar el acceso:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al verificar el acceso",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (paymentLoading) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik flex items-center justify-center">
        <div className="text-center">Verificando información...</div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik flex items-center justify-center">
        <div className="text-center">Acceso inválido</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      {/* Header */}
      <div className="bg-white border-b border-gloster-gray/20 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
                alt="Gloster Logo" 
                className="w-8 h-8"
              />
              <h1 className="text-xl font-bold text-slate-800 font-rubik">Acceso al Estado de Pago</h1>
            </div>
            
            <Button
              variant="outline"
              onClick={handleGoHome}
              className="font-rubik"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Inicio
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-md mx-auto">
          <Card className="border-gloster-gray/20 shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-gloster-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-gloster-gray" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-800 font-rubik mb-2">
                Verificación de Acceso
              </CardTitle>
              <p className="text-gloster-gray font-rubik">
                Para acceder al estado de pago, ingresa tu email de contacto como mandante
              </p>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2 font-rubik">
                    Email de Contacto del Mandante
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full"
                    disabled={loading}
                  />
                  <p className="text-xs text-gloster-gray mt-2 font-rubik">
                    Ingresa el email de contacto del mandante asociado al proyecto
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik py-3"
                >
                  {loading ? 'Verificando...' : 'Acceder al Estado de Pago'}
                </Button>
              </form>

              {payment && payment.projectData && (
                <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-semibold text-slate-800 font-rubik mb-2">Información del Estado de Pago</h4>
                  <p className="text-sm text-gloster-gray font-rubik">
                    Proyecto: {payment.projectData?.Name}
                  </p>
                  <p className="text-sm text-gloster-gray font-rubik">
                    Período: {payment.Mes} {payment.Año}
                  </p>
                  <p className="text-sm text-gloster-gray font-rubik">
                    Mandante: {payment.projectData?.Owner?.CompanyName}
                  </p>
                  <p className="text-sm text-gloster-gray font-rubik">
                    Email esperado: {payment.projectData?.Owner?.ContactEmail}
                  </p>
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
