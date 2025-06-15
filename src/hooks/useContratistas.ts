
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ContratistaData {
  CompanyName: string;
  RUT: string;
  Specialization: string;
  Experience: string;
  Adress: string;
  City: string;
  ContactName: string;
  ContactEmail: string;
  ContactPhone: number;
  Username: string;
  Password: string;
  Status?: boolean;
}

export const useContratistas = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createContratista = async (data: ContratistaData) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from('Contratistas')
        .insert([{
          CompanyName: data.CompanyName,
          RUT: data.RUT,
          Specialization: data.Specialization,
          Experience: data.Experience,
          Adress: data.Adress,
          City: data.City,
          ContactName: data.ContactName,
          ContactEmail: data.ContactEmail,
          ContactPhone: data.ContactPhone,
          Username: data.Username,
          Password: data.Password,
          Status: true
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating contratista:', error);
        toast({
          title: "Error al crear usuario",
          description: error.message,
          variant: "destructive",
        });
        return { data: null, error };
      }

      toast({
        title: "Usuario creado exitosamente",
        description: "La información se ha guardado en la base de datos",
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
