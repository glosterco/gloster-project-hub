
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/PageHeader';

const EmailAccess = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const paymentId = searchParams.get('paymentId');
  const token = searchParams.get('token');

  useEffect(() => {
    // Si ya hay un token en la URL, verificarlo automáticamente
    if (paymentId && token) {
      verifyTokenAccess();
    }
  }, [paymentId, token]);

  const verifyTokenAccess = async () => {
    try {
      console.log('Verifying token access for payment:', paymentId, 'with token:', token);
      
      // Verificar que el token coincida con el almacenado en la base de datos
      const { data: paymentData, error } = await supabase
        .from('Estados de pago')
        .select('URLMandante')
        .eq('id', parseInt(paymentId || '0'))
        .single();

      if (error || !paymentData) {
        console.error('Error fetching payment data:', error);
        toast({
          title: "Error de acceso",
          description: "No se pudo verificar el enlace de acceso",
          variant: "destructive"
        });
        return;
      }

      // Verificar que el token en la URL coincida con el almacenado
      const storedUrl = paymentData.URLMandante;
      if (storedUrl && storedUrl.includes(token || '')) {
        // Token válido - almacenar acceso y redirigir
        sessionStorage.setItem('mandanteAccess', JSON.stringify({
          paymentId,
          token,
          timestamp: new Date().toISOString()
        }));
        
        console.log('Token verified successfully, redirecting to submission view');
        navigate(`/submission-view?paymentId=${paymentId}`);
      } else {
        toast({
          title: "Enlace inválido",
          description: "El enlace de acceso no es válido o ha expirado",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      toast({
        title: "Error de verificación",
        description: "Hubo un problema al verificar el acceso",
        variant: "destructive"
      });
    }
  };

  const handleEmailVerification = async () => {
    if (!email.trim()) {
      toast({
        title: "Email requerido",
        description: "Por favor ingresa tu email",
        variant: "destructive"
      });
      return;
    }

    if (!paymentId) {
      toast({
        title: "Error",
        description: "ID de estado de pago no encontrado",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      console.log('Verifying email access for payment:', paymentId, 'with email:', email);
      
      // Buscar el estado de pago y verificar que el email coincida con el mandante
      const { data: paymentData, error: paymentError } = await supabase
        .from('Estados de pago')
        .select(`
          *,
          Proyectos!inner (
            *,
            Mandantes!inner (
              ContactEmail,
              CompanyName
            )
          )
        `)
        .eq('id', parseInt(paymentId))
        .single();

      if (paymentError) {
        console.error('Error fetching payment:', paymentError);
        toast({
          title: "Error",
          description: "No se pudo encontrar el estado de pago",
          variant: "destructive"
        });
        return;
      }

      if (!paymentData || !paymentData.Proyectos) {
        toast({
          title: "Error",
          description: "Estado de pago no encontrado",
          variant: "destructive"
        });
        return;
      }

      const mandanteEmail = paymentData.Proyectos.Mandantes?.ContactEmail;
      console.log('Comparing emails:', { inputEmail: email, mandanteEmail });

      if (mandanteEmail && email.toLowerCase().trim() === mandanteEmail.toLowerCase().trim()) {
        // Email válido - almacenar acceso y redirigir
        sessionStorage.setItem('mandanteAccess', JSON.stringify({
          paymentId,
          email,
          timestamp: new Date().toISOString()
        }));
        
        console.log('Email verified successfully, redirecting to submission view');
        toast({
          title: "Acceso verificado",
          description: "Email verificado correctamente",
        });
        
        navigate(`/submission-view?paymentId=${paymentId}`);
      } else {
        toast({
          title: "Email no autorizado",
          description: "El email ingresado no coincide con el mandante de este proyecto",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      toast({
        title: "Error de verificación",
        description: "Hubo un problema al verificar el email",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEmailVerification();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <PageHeader />
      
      <div className="container mx-auto px-6 py-16">
        <div className="max-w-md mx-auto">
          <Card className="border-gloster-gray/20 shadow-lg">
            <CardHeader className="text-center space-y-4">
              <div className="w-16 h-16 bg-gloster-yellow/20 rounded-full flex items-center justify-center mx-auto">
                <Lock className="h-8 w-8 text-gloster-gray" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-800 font-rubik">
                Acceso al Estado de Pago
              </CardTitle>
              <CardDescription className="text-gloster-gray font-rubik">
                {token ? 
                  'Verificando tu acceso automáticamente...' : 
                  'Ingresa tu email para acceder al estado de pago'
                }
              </CardDescription>
            </CardHeader>
            
            {!token && (
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 font-rubik">
                    Email del Mandante
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gloster-gray" />
                    <Input
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
                  onClick={handleEmailVerification}
                  disabled={loading || !email.trim()}
                  className="w-full bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
                  size="lg"
                >
                  {loading ? (
                    'Verificando...'
                  ) : (
                    <>
                      Acceder al Estado de Pago
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
                
                <div className="text-center">
                  <p className="text-xs text-gloster-gray font-rubik">
                    Solo el mandante registrado en el proyecto puede acceder a esta información
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmailAccess;
