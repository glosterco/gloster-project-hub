import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useContractorAccessUrl = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Use the production domain consistently
  const getBaseUrl = () => {
    // Always use the production domain for email links
    return 'https://b7846f9a-a454-43f5-8060-670f4c2f860a.lovableproject.com';
  };

  const ensureContractorAccessUrl = async (paymentId: string | number) => {
    setLoading(true);
    
    try {
      // Convert paymentId to number to ensure type compatibility
      const numericPaymentId = typeof paymentId === 'string' ? parseInt(paymentId, 10) : paymentId;
      
      if (isNaN(numericPaymentId)) {
        throw new Error('ID de pago inválido');
      }

      console.log('🔍 Checking existing contractor access URL for payment:', numericPaymentId);

      // Verificar si ya existe un enlace para este pago
      const { data: existingPayment, error: fetchError } = await supabase
        .from('Estados de pago')
        .select('*')
        .eq('id', numericPaymentId)
        .single();

      if (fetchError) {
        console.error('Error fetching existing payment:', fetchError);
        throw new Error('Error al verificar el enlace existente');
      }

      // Si ya existe un enlace válido, reutilizarlo siempre (no regenerar)
      if ((existingPayment as any)?.URLContratista) {
        console.log('✅ Reusing existing contractor access URL:', (existingPayment as any).URLContratista);
        return (existingPayment as any).URLContratista;
      }

      // Si no existe o el dominio cambió, generar uno nuevo
      console.log('🔄 Generating new unique contractor access URL...');
      const uniqueToken = crypto.randomUUID();
      const baseUrl = getBaseUrl();
      const newAccessUrl = `${baseUrl}/email-access?paymentId=${numericPaymentId}&token=${uniqueToken}`;

      // Guardar el nuevo enlace en la base de datos
      const { error: updateError } = await supabase
        .from('Estados de pago')
        .update({ URLContratista: newAccessUrl } as any)
        .eq('id', numericPaymentId);

      if (updateError) {
        console.error('Error updating URLContratista:', updateError);
        throw new Error('Error al guardar el enlace único del contratista');
      }

      console.log('✅ New contractor access URL generated and saved:', newAccessUrl);
      return newAccessUrl;

    } catch (error) {
      console.error('Error in ensureContractorAccessUrl:', error);
      toast({
        title: "Error",
        description: error.message || "Error al generar el enlace de acceso del contratista",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    ensureContractorAccessUrl,
    loading
  };
};