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

console.log("paymentData:", paymentData);
console.log("paymentError:", paymentError);

if (paymentError) {
  console.error('Error al obtener datos del estado de pago:', paymentError);
  setPopupError('No se pudo verificar la información del estado de pago.');
  return;
}

if (!paymentData) {
  setPopupError('No se encontró el estado de pago con el ID proporcionado.');
  return;
}

const { data: relatedPayments, error: relatedPaymentsError } = await supabase
  .from('Estados de pago')
  .select('id')
  .eq('proyecto_id', paymentData.Proyectos.id);

console.log("relatedPayments:", relatedPayments);
console.log("relatedPaymentsError:", relatedPaymentsError);

if (relatedPaymentsError) {
  console.error("Error al obtener los estados de pago relacionados:", relatedPaymentsError);
  setPopupError('Hubo un error al obtener los estados de pago relacionados.');
  return;
}

if (relatedPayments && relatedPayments.length > 0) {
  const isPaymentValid = relatedPayments.some(payment => payment.id === parsedPaymentId);
  
  if (isPaymentValid) {
    toast({
      title: "Acceso verificado",
      description: "Estado de pago verificado correctamente.",
      variant: "success",
    });
  } else {
    toast({
      title: "Acceso denegado",
      description: "El estado de pago no coincide con los estados de pago encontrados.",
      variant: "destructive",
    });
  }
} else {
  toast({
    title: "No se encontraron estados de pago",
    description: "No se encontraron estados de pago asociados a este proyecto.",
    variant: "destructive",
  });
}
