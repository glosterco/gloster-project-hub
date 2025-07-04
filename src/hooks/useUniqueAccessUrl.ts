
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useUniqueAccessUrl = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Detectar automáticamente el dominio base
  const getBaseUrl = () => {
    const currentUrl = window.location.origin;
    
    // Para desarrollo local, usar la URL actual
    if (currentUrl.includes('localhost') || currentUrl.includes('127.0.0.1')) {
      return currentUrl;
    }
    
    // Para producción (Lovable o cualquier otro dominio), usar la URL actual
    return currentUrl;
  };

  const ensureUniqueAccessUrl = async (paymentId: string | number) => {
    setLoading(true);
    
    try {
      // Convert paymentId to number to ensure type compatibility
      const numericPaymentId = typeof paymentId === 'string' ? parseInt(paymentId, 10) : paymentId;
      
      if (isNaN(numericPaymentId)) {
        throw new Error('ID de pago inválido');
      }

      console.log('🔍 Checking existing access URL for payment:', numericPaymentId);

      // Verificar si ya existe un enlace para este pago
      const { data: existingPayment, error: fetchError } = await supabase
        .from('Estados de pago')
        .select('URLMandante')
        .eq('id', numericPaymentId)
        .single();

      if (fetchError) {
        console.error('Error fetching existing payment:', fetchError);
        throw new Error('Error al verificar el enlace existente');
      }

      // Si ya existe un enlace válido, verificar si el dominio coincide con el actual
      if (existingPayment?.URLMandante) {
        const currentBaseUrl = getBaseUrl();
        const existingUrl = new URL(existingPayment.URLMandante);
        const currentUrlObj = new URL(currentBaseUrl);
        
        // Si el dominio coincide, reutilizar el enlace existente
        if (existingUrl.origin === currentUrlObj.origin) {
          console.log('✅ Reusing existing access URL:', existingPayment.URLMandante);
          return existingPayment.URLMandante;
        } else {
          console.log('🔄 Domain changed, generating new URL...');
        }
      }

      // Si no existe o el dominio cambió, generar uno nuevo
      console.log('🔄 Generating new unique access URL...');
      const uniqueToken = crypto.randomUUID();
      const baseUrl = getBaseUrl();
      const newAccessUrl = `${baseUrl}/email-access?paymentId=${numericPaymentId}&token=${uniqueToken}`;

      // Guardar el nuevo enlace en la base de datos
      const { error: updateError } = await supabase
        .from('Estados de pago')
        .update({ URLMandante: newAccessUrl })
        .eq('id', numericPaymentId);

      if (updateError) {
        console.error('Error updating URLMandante:', updateError);
        throw new Error('Error al guardar el enlace único');
      }

      console.log('✅ New access URL generated and saved:', newAccessUrl);
      return newAccessUrl;

    } catch (error) {
      console.error('Error in ensureUniqueAccessUrl:', error);
      toast({
        title: "Error",
        description: error.message || "Error al generar el enlace de acceso",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    ensureUniqueAccessUrl,
    loading
  };
};
