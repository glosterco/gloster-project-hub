import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CalendarEvent {
  fecha: string;
  titulo: string;
  descripcion: string;
  requiereArchivos: boolean;
}

export interface Licitacion {
  id: number;
  nombre: string;
  descripcion: string;
  mensaje_oferentes: string;
  oferentes_emails: string[];
  calendario_eventos: CalendarEvent[];
  especificaciones: string;
  documentos: any[];
  estado: 'abierta' | 'cerrada' | 'en_evaluacion';
  mandante_id: number;
  created_at: string;
  updated_at: string;
}

export interface NewLicitacion {
  nombre: string;
  descripcion: string;
  mensaje_oferentes: string;
  oferentes_emails: string[];
  calendario_eventos: CalendarEvent[];
  especificaciones: string;
  documentos: any[];
}

export const useLicitaciones = () => {
  const { toast } = useToast();
  const [licitaciones, setLicitaciones] = useState<Licitacion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLicitaciones = async () => {
    try {
      setLoading(true);
      
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLicitaciones([]);
        return;
      }

      // Buscar el mandante asociado al usuario
      const { data: mandanteData } = await supabase
        .from('Mandantes')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (!mandanteData) {
        // Intentar buscar en mandante_users
        const { data: mandanteUserData } = await supabase
          .from('mandante_users')
          .select('mandante_id')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (!mandanteUserData) {
          setLicitaciones([]);
          return;
        }
      }

      // Obtener las licitaciones
      const { data, error } = await supabase
        .from('Licitaciones')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching licitaciones:', error);
        toast({
          title: "Error al cargar licitaciones",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      // Convertir los datos al tipo correcto
      const licitacionesData = (data || []).map(item => ({
        ...item,
        oferentes_emails: Array.isArray(item.oferentes_emails) ? item.oferentes_emails as string[] : [],
        calendario_eventos: Array.isArray(item.calendario_eventos) ? item.calendario_eventos as unknown as CalendarEvent[] : [],
        documentos: Array.isArray(item.documentos) ? item.documentos : [],
        estado: item.estado as 'abierta' | 'cerrada' | 'en_evaluacion'
      }));

      setLicitaciones(licitacionesData);
    } catch (error) {
      console.error('Error in fetchLicitaciones:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar las licitaciones",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createLicitacion = async (newLicitacion: NewLicitacion) => {
    try {
      // Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "Debes estar autenticado para crear una licitación",
          variant: "destructive"
        });
        return null;
      }

      // Buscar el mandante asociado al usuario
      const { data: mandanteData } = await supabase
        .from('Mandantes')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      let mandanteId = mandanteData?.id;

      if (!mandanteId) {
        // Intentar buscar en mandante_users
        const { data: mandanteUserData } = await supabase
          .from('mandante_users')
          .select('mandante_id')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        mandanteId = mandanteUserData?.mandante_id;
      }

      if (!mandanteId) {
        toast({
          title: "Error",
          description: "No se encontró el mandante asociado a tu usuario",
          variant: "destructive"
        });
        return null;
      }

      const { data, error } = await supabase
        .from('Licitaciones')
        .insert([{
          nombre: newLicitacion.nombre,
          descripcion: newLicitacion.descripcion,
          mensaje_oferentes: newLicitacion.mensaje_oferentes,
          oferentes_emails: newLicitacion.oferentes_emails as any,
          calendario_eventos: newLicitacion.calendario_eventos as any,
          especificaciones: newLicitacion.especificaciones,
          documentos: newLicitacion.documentos as any,
          mandante_id: mandanteId,
          estado: 'abierta'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating licitacion:', error);
        toast({
          title: "Error al crear licitación",
          description: error.message,
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Licitación creada",
        description: "La licitación se ha creado exitosamente"
      });

      return data;
    } catch (error) {
      console.error('Error in createLicitacion:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al crear la licitación",
        variant: "destructive"
      });
      return null;
    }
  };

  useEffect(() => {
    fetchLicitaciones();
  }, []);

  return {
    licitaciones,
    loading,
    createLicitacion,
    refetch: fetchLicitaciones
  };
};
