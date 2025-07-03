
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const usePaymentActions = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const approvePayment = async (paymentId: string) => {
    setLoading(true);
    try {
      console.log('🟢 Attempting to approve payment:', paymentId);
      
      // CORRIGIENDO: Intentar actualizar con usuario autenticado primero
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user?.id);

      const { error } = await supabase
        .from('Estados de pago')
        .update({ Status: 'Aprobado' })
        .eq('id', parseInt(paymentId));

      if (error) {
        console.error('❌ Error updating payment status:', error);
        throw new Error('Error al aprobar el estado de pago');
      }

      console.log('✅ Payment status updated successfully');

      // Enviar notificación al contratista
      const webhookData = {
        type: 'payment_approved',
        paymentId,
        timestamp: new Date().toISOString()
      };

      try {
        await fetch('https://hook.us2.make.com/vomlhkl0es487ui7dfphtyv5hdoymbek', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData),
        });
        console.log('✅ Notification webhook sent');
      } catch (webhookError) {
        console.error('⚠️ Webhook error (non-critical):', webhookError);
      }

      toast({
        title: "Estado de pago aprobado",
        description: "Se ha notificado al contratista que el estado de pago fue aprobado",
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Error approving payment:', error);
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
      console.log('🔴 Attempting to reject payment:', paymentId, 'with comments:', comments);
      
      // CORRIGIENDO: Intentar actualizar con usuario autenticado primero
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user?.id);

      const { error } = await supabase
        .from('Estados de pago')
        .update({ 
          Status: 'Rechazado',
          Notes: comments 
        })
        .eq('id', parseInt(paymentId));

      if (error) {
        console.error('❌ Error updating payment status:', error);
        throw new Error('Error al rechazar el estado de pago');
      }

      console.log('✅ Payment status and notes updated successfully');

      // Enviar notificación al contratista con comentarios
      const webhookData = {
        type: 'payment_rejected',
        paymentId,
        comments,
        timestamp: new Date().toISOString()
      };

      try {
        await fetch('https://hook.us2.make.com/vomlhkl0es487ui7dfphtyv5hdoymbek', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookData),
        });
        console.log('✅ Rejection notification webhook sent');
      } catch (webhookError) {
        console.error('⚠️ Webhook error (non-critical):', webhookError);
      }

      toast({
        title: "Estado de pago rechazado",
        description: "Se ha notificado al contratista con los comentarios ingresados",
      });

      return { success: true };
    } catch (error) {
      console.error('❌ Error rejecting payment:', error);
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
