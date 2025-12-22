import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Contacto {
  id: number;
  proyecto_id: number;
  nombre: string;
  email: string;
  telefono: string | null;
  rol: string;
  especialidad: string | null;
  created_at: string;
}

export const useContactos = (projectId: string) => {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchContactos = async () => {
    if (!projectId) return;
    
    const pid = parseInt(projectId);
    if (Number.isNaN(pid)) {
      console.warn('⚠️ useContactos: projectId inválido:', projectId);
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔎 Fetching contactos for projectId:', pid);
      const { data, error } = await supabase
        .from('contactos' as any)
        .select('*')
        .eq('proyecto_id', pid)
        .order('nombre', { ascending: true });
        
      if (error) {
        console.error('❌ Error fetching contactos:', error);
        return;
      }
      
      console.log('✅ Fetched contactos:', Array.isArray(data) ? data.length : 0);
      setContactos((data as any) || []);
    } catch (error) {
      console.error('❌ CRITICAL ERROR in fetchContactos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addContacto = async (contacto: Omit<Contacto, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('contactos' as any)
        .insert(contacto as any)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Contacto agregado",
        description: "El contacto ha sido agregado correctamente",
      });

      await fetchContactos();
      return data;
    } catch (error) {
      console.error('Error adding contacto:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el contacto",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteContacto = async (contactoId: number) => {
    try {
      const { error } = await supabase
        .from('contactos' as any)
        .delete()
        .eq('id', contactoId);

      if (error) throw error;

      toast({
        title: "Contacto eliminado",
        description: "El contacto ha sido eliminado correctamente",
      });

      await fetchContactos();
    } catch (error) {
      console.error('Error deleting contacto:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el contacto",
        variant: "destructive",
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchContactos();
  }, [projectId]);

  return {
    contactos,
    loading,
    refetch: fetchContactos,
    addContacto,
    deleteContacto
  };
};
