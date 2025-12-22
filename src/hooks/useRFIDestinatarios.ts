import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Contacto } from './useContactos';

export interface RFIDestinatario {
  id: number;
  rfi_id: number;
  contacto_id: number;
  enviado_at: string;
  respondido: boolean;
  contacto?: Contacto;
}

export const useRFIDestinatarios = (rfiId: number | null) => {
  const [destinatarios, setDestinatarios] = useState<RFIDestinatario[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDestinatarios = async () => {
    if (!rfiId) return;
    
    setLoading(true);
    
    try {
      console.log('🔎 Fetching destinatarios for rfiId:', rfiId);
      const { data, error } = await supabase
        .from('rfi_destinatarios' as any)
        .select(`
          *,
          contacto:contactos(*)
        `)
        .eq('rfi_id', rfiId);
        
      if (error) {
        console.error('❌ Error fetching destinatarios:', error);
        return;
      }
      
      console.log('✅ Fetched destinatarios:', Array.isArray(data) ? data.length : 0);
      setDestinatarios((data as any) || []);
    } catch (error) {
      console.error('❌ CRITICAL ERROR in fetchDestinatarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const addDestinatarios = async (rfiId: number, contactoIds: number[]) => {
    try {
      const inserts = contactoIds.map(contacto_id => ({
        rfi_id: rfiId,
        contacto_id
      }));

      const { error } = await supabase
        .from('rfi_destinatarios' as any)
        .insert(inserts as any);

      if (error) throw error;

      toast({
        title: "RFI reenviado",
        description: `Se reenvió el RFI a ${contactoIds.length} especialista(s)`,
      });

      await fetchDestinatarios();
    } catch (error) {
      console.error('Error adding destinatarios:', error);
      toast({
        title: "Error",
        description: "No se pudo reenviar el RFI",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchDestinatarios();
  }, [rfiId]);

  return {
    destinatarios,
    loading,
    refetch: fetchDestinatarios,
    addDestinatarios
  };
};
