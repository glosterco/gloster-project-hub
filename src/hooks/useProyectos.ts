
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useProyectos = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createProyecto = async (proyectoData: {
    Name: string;
    Description: string;
    Location: string;
    Budget: number;
    StartDate: string;
    Duration: number;
    Contratista: number;
    Owner: number;
    FirstPayment: string;
    ExpiryRate: string;
    Requierment: string[];
  }) => {
    setLoading(true);
    
    try {
      console.log('Creating proyecto with data:', proyectoData);
      
      const { data, error } = await supabase
        .from('Proyectos')
        .insert([{
          Name: proyectoData.Name,
          Description: proyectoData.Description,
          Location: proyectoData.Location,
          Budget: proyectoData.Budget,
          StartDate: proyectoData.StartDate,
          Duration: proyectoData.Duration,
          Contratista: proyectoData.Contratista,
          Owner: proyectoData.Owner,
          FirstPayment: proyectoData.FirstPayment,
          ExpiryRate: proyectoData.ExpiryRate,
          Requierment: proyectoData.Requierment,
          Status: true
        }])
        .select();

      if (error) {
        console.error('Error creating proyecto:', error);
        toast({
          title: "Error al crear proyecto",
          description: error.message,
          variant: "destructive",
        });
        return { data: null, error };
      }

      console.log('Proyecto created successfully:', data);
      toast({
        title: "Proyecto creado",
        description: "El proyecto ha sido creado exitosamente",
      });

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error creating proyecto:', error);
      toast({
        title: "Error inesperado",
        description: "Hubo un error al crear el proyecto",
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const getProyectosByContratista = async (contratistaId: number) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('Proyectos')
        .select('*')
        .eq('Contratista', contratistaId);

      if (error) {
        console.error('Error fetching proyectos:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error fetching proyectos:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    createProyecto,
    getProyectosByContratista,
    loading
  };
};
