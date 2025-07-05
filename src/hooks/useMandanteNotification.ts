
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MandanteNotificationData {
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
  driveUrl: string;
  uploadedDocuments: string[];
  currency?: string;
}

export const useMandanteNotification = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendNotificationToMandante = async (data: MandanteNotificationData) => {
    setLoading(true);
    try {
      // Generar URL de acceso único
      const baseUrl = window.location.origin;
      const accessUrl = `${baseUrl}/email-access?paymentId=${data.paymentId}`;

      console.log('🚀 Sending mandante notification with data:', data);

      const notificationPayload = {
        paymentId: data.paymentId,
        contratista: data.contratista,
        mes: data.mes,
        año: data.año,
        proyecto: data.proyecto,
        mandanteEmail: data.mandanteEmail,
        mandanteCompany: data.mandanteCompany,
        contractorCompany: data.contractorCompany,
        amount: data.amount,
        dueDate: data.dueDate,
        accessUrl: accessUrl,
        currency: data.currency
      };

      const { data: result, error } = await supabase.functions.invoke('send-mandante-notification', {
        body: notificationPayload,
      });

      if (error) {
        console.error('Error calling send-mandante-notification:', error);
        throw error;
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to send mandante notification');
      }

      console.log('✅ Mandante notification sent successfully:', result);
      
      toast({
        title: "Notificación enviada",
        description: `Email enviado exitosamente a ${data.mandanteEmail}`,
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending mandante notification:', error);
      toast({
        title: "Error al enviar notificación",
        description: "No se pudo enviar la notificación al mandante",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    sendNotificationToMandante,
    loading,
  };
};
