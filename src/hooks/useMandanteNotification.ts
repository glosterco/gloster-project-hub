
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface NotificationData {
  paymentId: string;
  contratista: string;
  mes: string;
  año: number;
  proyecto: string;
  mandanteEmail: string;
  mandanteCompany: string;
  contractorCompany: string;
  amount: number;
  dueDate: string;
}

export const useMandanteNotification = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendNotificationToMandante = async (data: NotificationData) => {
    setLoading(true);
    
    try {
      // Generar URL única para el mandante
      const uniqueId = crypto.randomUUID();
      const mandanteUrl = `${window.location.origin}/email-access?paymentId=${data.paymentId}&token=${uniqueId}`;

      // Actualizar la base de datos con la URL del mandante
      const { error: updateError } = await supabase
        .from('Estados de pago')
        .update({ URLMandante: mandanteUrl })
        .eq('id', parseInt(data.paymentId));

      if (updateError) {
        console.error('Error updating URLMandante:', updateError);
        throw new Error('Error al actualizar la URL del mandante');
      }

      // Preparar datos para el webhook
      const webhookData = {
        contratista: data.contratista,
        mes: data.mes,
        año: data.año,
        proyecto: data.proyecto,
        mandanteEmail: data.mandanteEmail,
        mandanteCompany: data.mandanteCompany,
        contractorCompany: data.contractorCompany,
        URLMandante: mandanteUrl,
        paymentId: data.paymentId,
        amount: data.amount,
        dueDate: data.dueDate,
        timestamp: new Date().toISOString(),
        type: 'mandante_notification'
      };

      console.log('Sending notification to mandante:', webhookData);

      // Enviar al webhook de Make.com
      const response = await fetch('https://hook.us2.make.com/vomlhkl0es487ui7dfphtyv5hdoymbek', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

      if (response.ok) {
        toast({
          title: "Notificación enviada",
          description: `Email enviado exitosamente a ${data.mandanteEmail}`,
        });
        return { success: true };
      } else {
        throw new Error('Network response was not ok');
      }
    } catch (error) {
      console.error('Error sending mandante notification:', error);
      toast({
        title: "Error al enviar",
        description: "Hubo un problema al enviar la notificación. Intenta nuevamente.",
        variant: "destructive"
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    sendNotificationToMandante,
    loading
  };
};
