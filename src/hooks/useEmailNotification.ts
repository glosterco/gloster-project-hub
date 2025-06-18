
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface EmailNotificationData {
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
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendNotification = async (data: EmailNotificationData) => {
    setLoading(true);
    
    try {
      const emailData = {
        ...data,
        timestamp: new Date().toISOString(),
        type: 'payment_notification'
      };

      console.log('Sending email notification:', emailData);

      const response = await fetch('https://hook.us2.make.com/aojj5wkdzhmre99szykaa1efxwnvn4e6', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (response.ok) {
        toast({
          title: "Notificación enviada",
          description: `Email enviado exitosamente a ${data.paymentState.recipient}`,
        });
        return { success: true };
      } else {
        throw new Error('Network response was not ok');
      }
    } catch (error) {
      console.error('Error sending email notification:', error);
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
    sendNotification,
    loading
  };
};
