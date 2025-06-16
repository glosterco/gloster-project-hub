
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MandanteData {
  CompanyName: string;
  ContactName: string;
  ContactEmail: string;
  ContactPhone: number;
  Status?: boolean;
}

export const useMandantes = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createMandante = async (data: MandanteData) => {
    setLoading(true);
    try {
      console.log('Insertando mandante en BD:', data);
      
      const { data: result, error } = await supabase
        .from('Mandantes')
        .insert([{
          CompanyName: data.CompanyName,
          ContactName: data.ContactName,
          ContactEmail: data.ContactEmail,
          ContactPhone: data.ContactPhone,
          Status: true
        }])
        .select()
        .single();

      if (error) {
        console.error('Error en BD al crear mandante:', error);
        return { data: null, error };
      }

      if (!result) {
        console.error('No se retornó resultado del mandante');
        return { data: null, error: new Error('No data returned') };
      }

      console.log('Mandante creado exitosamente en BD:', result);

      // Retornar en formato de array para consistencia
      return { data: [result], error: null };
    } catch (error) {
      console.error('Error inesperado creando mandante:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const getMandantes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Mandantes')
        .select('*')
        .eq('Status', true);

      if (error) {
        console.error('Error fetching mandantes:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const getMandanteByEmail = async (email: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Mandantes')
        .select('*')
        .eq('ContactEmail', email)
        .eq('Status', true)
        .single();

      if (error) {
        console.error('Error fetching mandante:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    createMandante,
    getMandantes,
    getMandanteByEmail,
    loading
  };
};
