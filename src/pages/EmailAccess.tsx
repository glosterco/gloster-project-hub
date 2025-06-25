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

  if (!paymentId) {
    toast({
      title: "ID de pago no proporcionado",
      description: "No se proporcionó un ID de pago en la URL.",
      variant: "destructive"
    });
    return;
  }

  setLoading(true);

  try {
    console.log('Verifying email access for:', { paymentId, email, token });

    // Validar si paymentId es un número válido
    const parsedPaymentId = parseInt(paymentId);
    if (isNaN(parsedPaymentId)) {
      toast({
        title: "ID de pago inválido",
        description: "El ID de pago proporcionado no es válido.",
        variant: "destructive"
      });
      return;
    }

    // Obtener datos del estado de pago con información del proyecto y mandante
    const { data: paymentData, error: paymentError } = await supabase
      .from('Estados de pago')
      .select(`
        *,
        Proyectos!inner (
          *,
          Mandantes!inner (*)
        )
      `)
      .eq('id', parsedPaymentId)
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
        description: "El estado de pago solicitado no existe.",
        variant: "destructive"
      });
      return;
    }

    console.log('Payment data found:', paymentData);

    // Verificar que el email coincida con el email del mandante
    const mandanteEmail = paymentData.Proyectos?.Mandantes?.ContactEmail;

    if (!mandanteEmail) {
      toast({
        title: "Error de configuración",
        description: "No se encontró el email del mandante para este proyecto.",
        variant: "destructive"
      });
      return;
    }

    console.log('Comparing emails:', { provided: email.toLowerCase(), mandante: mandanteEmail.toLowerCase() });

    if (email.toLowerCase() !== mandanteEmail.toLowerCase()) {
      toast({
        title: "Acceso denegado",
        description: "El email ingresado no coincide con el mandante autorizado para este proyecto.",
        variant: "destructive"
      });
      return;
    }

    // Si hay token, verificar que coincida con URLMandante
    if (token) {
      const expectedUrl = `${window.location.origin}/email-access?paymentId=${paymentId}&token=${token}`;
      console.log('Checking URL match:', { expected: expectedUrl, stored: paymentData.URLMandante });

      if (paymentData.URLMandante !== expectedUrl) {
        toast({
          title: "Token inválido",
          description: "El enlace de acceso no es válido o ha expirado.",
          variant: "destructive"
        });
        return;
      }
    }

    // Guardar acceso en sessionStorage
    const accessData = {
      paymentId: paymentId,
      email: email,
      token: token || 'verified',
      mandanteCompany: paymentData.Proyectos?.Mandantes?.CompanyName || '',
      timestamp: new Date().toISOString()
    };

    sessionStorage.setItem('mandanteAccess', JSON.stringify(accessData));

    toast({
      title: "Acceso verificado",
      description: "Email verificado correctamente. Redirigiendo...",
    });

    // Redirigir a submission view
    setTimeout(() => {
      navigate(`/submission-view?paymentId=${paymentId}`);
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