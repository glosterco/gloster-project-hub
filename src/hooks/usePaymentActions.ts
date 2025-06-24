
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const usePaymentActions = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const approvePayment = async (paymentId: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('Estados de pago')
        .update({ Status: 'Aprobado' })
        .eq('id', parseInt(paymentId));

      if (error) {
        throw new Error('Error al aprobar el estado de pago');
      }

      // Enviar notificación al contratista
      const webhookData = {
        type: 'payment_approved',
        paymentId,
        timestamp: new Date().toISOString()
      };

      await fetch('https://hook.us2.make.com/vomlhkl0es487ui7dfphtyv5hdoymbek', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

      toast({
        title: "Estado de pago aprobado",
        description: "Se ha notificado al contratista que el estado de pago fue aprobado",
      });

      return { success: true };
    } catch (error) {
      console.error('Error approving payment:', error);
      toast({
        title: "Error",
        description: "No se pudo aprobar el estado de pago",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const rejectPayment = async (paymentId: string, comments: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('Estados de pago')
        .update({ 
          Status: 'Rechazado',
          Notes: comments 
        })
        .eq('id', parseInt(paymentId));

      if (error) {
        throw new Error('Error al rechazar el estado de pago');
      }

      // Enviar notificación al contratista con comentarios
      const webhookData = {
        type: 'payment_rejected',
        paymentId,
        comments,
        timestamp: new Date().toISOString()
      };

      await fetch('https://hook.us2.make.com/vomlhkl0es487ui7dfphtyv5hdoymbek', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      });

      toast({
        title: "Estado de pago rechazado",
        description: "Se ha notificado al contratista con los comentarios ingresados",
      });

      return { success: true };
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({
        title: "Error",
        description: "No se pudo rechazar el estado de pago",
        variant: "destructive"
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    approvePayment,
    rejectPayment,
    loading
  };
};
