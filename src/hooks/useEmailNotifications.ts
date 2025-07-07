
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
  accessUrl: string;
}

interface ContractorNotificationData {
  paymentId: string;
  contractorEmail: string;
  contractorName: string;
  contractorCompany: string;
  mandanteCompany: string;
  proyecto: string;
  mes: string;
  año: number;
  amount: number;
  status: 'Aprobado' | 'Rechazado';
  rejectionReason?: string;
  platformUrl: string;
}

export const useEmailNotifications = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const sendMandanteNotification = async (data: MandanteNotificationData) => {
    setLoading(true);
    try {
      console.log('Sending mandante notification:', data);

      const { data: result, error } = await supabase.functions.invoke('send-mandante-notification', {
        body: data,
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

  const sendContractorNotification = async (data: ContractorNotificationData) => {
    console.log('🚀 sendContractorNotification called with data:', data);
    setLoading(true);
    
    try {
      console.log('📡 Invoking send-contractor-notification edge function...');

      const { data: result, error } = await supabase.functions.invoke('send-contractor-notification', {
        body: data,
      });

      console.log('📡 Edge function response:', { result, error });

      if (error) {
        console.error('❌ Error calling send-contractor-notification:', error);
        throw error;
      }

      if (!result.success) {
        console.error('❌ Edge function returned error:', result.error);
        throw new Error(result.error || 'Failed to send contractor notification');
      }

      console.log('✅ Contractor notification sent successfully:', result);
      
      toast({
        title: "Notificación enviada",
        description: `Email enviado exitosamente a ${data.contractorEmail}`,
      });

      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('❌ Error sending contractor notification:', error);
      toast({
        title: "Error al enviar notificación",
        description: "No se pudo enviar la notificación al contratista",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const getDriveFiles = async (paymentId: string, documentName: string) => {
    try {
      console.log('Getting files:', { paymentId, documentName });

      const { data: result, error } = await supabase.functions.invoke('get-drive-files', {
        body: { paymentId, documentName },
      });

      if (error) {
        console.error('Error calling get-drive-files:', error);
        throw error;
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to get files');
      }

      console.log('✅ files retrieved successfully:', result);
      return { success: true, files: result.files };
    } catch (error) {
      console.error('Error getting files:', error);
      toast({
        title: "Error al obtener archivos",
        description: "No se pudieron obtener los archivos",
        variant: "destructive",
      });
      return { success: false, error: error.message, files: [] };
    }
  };

  return {
    sendMandanteNotification,
    sendContractorNotification,
    getDriveFiles,
    loading,
  };
};
