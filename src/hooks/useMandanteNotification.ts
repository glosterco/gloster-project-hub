
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';

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
}

export const useMandanteNotification = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { sendMandanteNotification } = useEmailNotifications();

  const sendNotificationToMandante = async (data: MandanteNotificationData) => {
    setLoading(true);
    
    try {
      console.log('🚀 Starting mandante notification process:', data);

      // Generate access URL
      const uniqueId = crypto.randomUUID();
      const accessUrl = `${window.location.origin}/email-access?paymentId=${data.paymentId}&token=${uniqueId}`;

      // Prepare notification data
      const notificationData = {
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
      };

      // Send notification using the new edge function
      const result = await sendMandanteNotification(notificationData);
      
      if (result.success) {
        console.log('✅ Mandante notification sent successfully');
        return { success: true };
      } else {
        throw new Error(result.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('❌ Error in mandante notification process:', error);
      toast({
        title: "Error al enviar notificación",
        description: error.message || "Error al procesar la solicitud",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    sendNotificationToMandante,
    loading
  };
};
