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
        Proyectos!inner (
          id,
          Mandantes!inner (*)
        )
      `)
      .eq('id', parsedPaymentId); // Eliminar .single() para obtener múltiples filas si es necesario

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
      mandanteEmail: paymentData[0]?.Proyectos?.Mandantes?.ContactEmail // Solo usamos el primer estado de pago si es necesario
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
        variant: "success",
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
