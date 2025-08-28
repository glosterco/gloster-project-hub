
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ContratistaData {
  CompanyName: string;
  RUT: string;
  Specialization: string;
  Experience: string;
  ContactName: string;
  ContactEmail: string;
  ContactPhone: number;
  Status?: boolean;
}

export const useContratistas = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createContratista = async (data: ContratistaData, authUserId?: string) => {
    setLoading(true);
    try {
      // Si se proporciona authUserId, usarlo directamente (para registro)
      // Si no, intentar obtener usuario autenticado actual
      let userId = authUserId;
      
      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
        }
      }

      // Para el proceso de registro, continuar incluso sin usuario autenticado
      console.log('Creating contratista with user ID:', userId || 'none (registration)');
      // Crear el registro del contratista
      const contratistaData = {
        CompanyName: data.CompanyName,
        RUT: data.RUT,
        Specialization: data.Specialization,
        Experience: data.Experience,
        ContactName: data.ContactName,
        ContactEmail: data.ContactEmail,
        ContactPhone: data.ContactPhone,
        Status: true,
        auth_user_id: userId || null // Permitir null para registro
      };

      console.log('Inserting contratista data:', contratistaData);
      console.log('💾 Fields being sent to DB:', Object.keys(contratistaData));
      console.log('🔍 DEBUGGING: Exact data structure:', JSON.stringify(contratistaData, null, 2));

      const { data: result, error } = await supabase
        .from('Contratistas')
        .insert([contratistaData])
        .select();

      if (error) {
        console.error('❌ FULL ERROR DETAILS:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        toast({
          title: "Error al crear contratista",
          description: `Error: ${error.message}. Código: ${error.code}`,
          variant: "destructive",
        });
        return { data: null, error };
      }

      console.log('Contratista created successfully:', result);
      toast({
        title: "Contratista creado exitosamente",
        description: "La información del contratista se ha guardado en la base de datos",
      });

      return { data: result, error: null };
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error inesperado",
        description: "Por favor intenta nuevamente",
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const getContratistas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Contratistas')
        .select('*')
        .eq('Status', true);

      if (error) {
        console.error('Error fetching contratistas:', error);
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

  const getContratistaByEmail = async (email: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Contratistas')
        .select('*')
        .eq('ContactEmail', email)
        .eq('Status', true)
        .single();

      if (error) {
        console.error('Error fetching contratista:', error);
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
    createContratista,
    getContratistas,
    getContratistaByEmail,
    loading
  };
};
