
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';

const EmailAccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId') || '11';
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { payment, loading: paymentLoading } = usePaymentDetail(paymentId);
  const { toast } = useToast();

  console.log('EmailAccess - paymentId:', paymentId);
  console.log('EmailAccess - payment data:', payment);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Email requerido",
        description: "Por favor ingresa tu dirección de email",
        variant: "destructive"
      });
      return;
    }

    if (!payment || !payment.projectData) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del proyecto",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Validar que el email coincida con el email del contratista
      const contratistaEmail = payment.projectData.Contratista?.ContactEmail;
      
      console.log('Validating email:', email);
      console.log('Contratista email:', contratistaEmail);

      if (email.toLowerCase().trim() !== contratistaEmail?.toLowerCase().trim()) {
        toast({
          title: "Email no autorizado",
          description: "Debes ingresar el email al cual fue enviada la notificación del estado de pago",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Si el email coincide, guardar en sessionStorage y redirigir
      sessionStorage.setItem('emailAccess', email);
      sessionStorage.setItem('paymentAccess', paymentId);
      
      toast({
        title: "Acceso autorizado",
        description: "Email verificado correctamente",
      });

      // Redirigir a email preview
      navigate(`/email-preview?paymentId=${paymentId}`);

    } catch (error) {
      console.error('Error validating email:', error);
      toast({
        title: "Error de validación",
        description: "Hubo un problema al validar el email",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (paymentLoading) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik flex items-center justify-center">
        <div className="text-center">
          <p className="text-gloster-gray">Cargando información del estado de pago...</p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-xl font-bold text-slate-800 font-rubik">Verificación de Acceso</h1>
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
            Volver al inicio
          </button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gloster-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-gloster-gray" />
              </div>
              <CardTitle className="font-rubik text-slate-800">
                Acceso al Estado de Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-800 font-rubik">
                        Para acceder a la vista del estado de pago, debes ingresar el email al cual fue enviada la notificación.
                      </p>
                    </div>
                  </div>
                </div>

                {payment && (
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h3 className="font-semibold text-slate-800 font-rubik mb-2">Estado de Pago:</h3>
                    <p className="text-sm text-gloster-gray font-rubik">
                      {payment.Mes} {payment.Año} - {payment.projectData?.Name}
                    </p>
                  </div>
                )}
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 font-rubik mb-2">
                    Email de contacto
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contratista@empresa.com"
                    className="font-rubik"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
                  disabled={loading}
                >
                  {loading ? 'Verificando...' : 'Acceder al Estado de Pago'}
                </Button>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-200">
                <div className="flex items-center space-x-2 text-sm text-gloster-gray">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-rubik">Acceso seguro y verificado</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmailAccess;
