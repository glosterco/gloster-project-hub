import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CCNotificationData {
  paymentId: string;
  contractorEmail?: string;
  contractorName?: string;
  contractorCompany?: string;
  mandanteCompany?: string;
  proyecto?: string;
  mes?: string;
  año?: number;
  amount?: number;
  dueDate?: string;
  currency?: string;
}

export const useCCNotification = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendCCNotification = async (data: CCNotificationData) => {
    setLoading(true);
    
    try {
      console.log('🔄 Sending CC notification...', data);

      const { data: result, error } = await supabase.functions.invoke('send-cc-copy', {
        body: data
      });

      if (error) {
        console.error('Error calling CC function:', error);
        throw new Error(`Error al enviar notificación CC: ${error.message}`);
      }

      if (result?.success) {
        console.log('✅ CC notification sent successfully:', result);
        toast({
          title: "Notificación CC enviada",
          description: `Email enviado exitosamente a ${result.ccEmail}`,
        });
        return { success: true, data: result };
      } else {
        console.log('ℹ️ No CC email configured or other info:', result);
        // Don't show error toast for missing CC email, just log it
        return { success: true, data: result };
      }

    } catch (error) {
      console.error('Error sending CC notification:', error);
      toast({
        title: "Error al enviar CC",
        description: error.message || "Hubo un problema al enviar la notificación CC",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    sendCCNotification,
    loading
  };
};