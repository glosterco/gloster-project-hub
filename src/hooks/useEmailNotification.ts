
import { useToast } from '@/hooks/use-toast';

interface EmailData {
  paymentState: {
    month: string;
    amount: number;
    dueDate: string;
    projectName: string;
    recipient: string;
  };
  project: {
    name: string;
    client: string;
    contractor: string;
    location: string;
    projectManager: string;
    contactEmail: string;
  };
  documents: Array<{
    id: string;
    name: string;
    description: string;
    uploaded: boolean;
  }>;
  accessUrl: string;
}

export const useEmailNotification = () => {
  const { toast } = useToast();

  const sendPaymentNotification = async (emailData: EmailData) => {
    try {
      console.log('Sending payment notification email:', emailData);
      
      const response = await fetch('https://hook.us2.make.com/aojj5wkdzhmre99szykaa1efxwnvn4e6', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...emailData,
          timestamp: new Date().toISOString(),
          emailType: 'payment_notification'
        }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      toast({
        title: "Notificación enviada",
        description: `Email de notificación enviado exitosamente a ${emailData.project.contactEmail}`,
      });

      return { success: true };
    } catch (error) {
      console.error('Error sending email notification:', error);
      toast({
        title: "Error al enviar notificación",
        description: "Hubo un problema al enviar el email. Intenta nuevamente.",
        variant: "destructive"
      });
      return { success: false, error };
    }
  };

  return {
    sendPaymentNotification
  };
};
