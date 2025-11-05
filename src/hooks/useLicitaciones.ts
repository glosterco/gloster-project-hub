import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CalendarEvent {
  id?: number;
  fecha: string;
  titulo: string;
  descripcion: string;
  requiereArchivos: boolean;
}

export interface Oferente {
  id?: number;
  email: string;
}

export interface Documento {
  id?: number;
  nombre: string;
  size?: number;
  tipo?: string;
  url?: string;
}

export interface Licitacion {
  id: number;
  nombre: string;
  descripcion: string;
  mensaje_oferentes: string;
  especificaciones: string;
  estado: 'abierta' | 'cerrada' | 'en_evaluacion';
  mandante_id: number;
  created_at: string;
  updated_at: string;
  oferentes?: Oferente[];
  eventos?: CalendarEvent[];
  documentos?: Documento[];
}

export interface NewLicitacion {
  nombre: string;
  descripcion: string;
  mensaje_oferentes: string;
  especificaciones: string;
  oferentes_emails: string[];
  calendario_eventos: CalendarEvent[];
  documentos: Documento[];
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

      // Obtener las licitaciones con sus relaciones
      const { data, error } = await supabase
        .from('Licitaciones')
        .select(`
          *,
          LicitacionOferentes (
            id,
            email
          ),
          LicitacionEventos (
            id,
            fecha,
            titulo,
            descripcion,
            requiere_archivos
          ),
          LicitacionDocumentos (
            id,
            nombre,
            size,
            tipo,
            url
          )
        `)
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

      // Transformar los datos al formato esperado
      const licitacionesData = (data || []).map(item => ({
        id: item.id,
        nombre: item.nombre,
        descripcion: item.descripcion,
        mensaje_oferentes: item.mensaje_oferentes,
        especificaciones: item.especificaciones,
        estado: item.estado as 'abierta' | 'cerrada' | 'en_evaluacion',
        mandante_id: item.mandante_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        oferentes: (item.LicitacionOferentes || []).map((o: any) => ({
          id: o.id,
          email: o.email
        })),
        eventos: (item.LicitacionEventos || []).map((e: any) => ({
          id: e.id,
          fecha: e.fecha,
          titulo: e.titulo,
          descripcion: e.descripcion,
          requiereArchivos: e.requiere_archivos
        })),
        documentos: (item.LicitacionDocumentos || []).map((d: any) => ({
          id: d.id,
          nombre: d.nombre,
          size: d.size,
          tipo: d.tipo,
          url: d.url
        }))
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

      // Crear la licitación principal
      const { data: licitacionData, error: licitacionError } = await supabase
        .from('Licitaciones')
        .insert([{
          nombre: newLicitacion.nombre,
          descripcion: newLicitacion.descripcion,
          mensaje_oferentes: newLicitacion.mensaje_oferentes,
          especificaciones: newLicitacion.especificaciones,
          mandante_id: mandanteId,
          estado: 'abierta'
        }])
        .select()
        .single();

      if (licitacionError || !licitacionData) {
        console.error('Error creating licitacion:', licitacionError);
        toast({
          title: "Error al crear licitación",
          description: licitacionError?.message || "Error desconocido",
          variant: "destructive"
        });
        return null;
      }

      const licitacionId = licitacionData.id;

      // Insertar oferentes
      if (newLicitacion.oferentes_emails.length > 0) {
        const oferentesData = newLicitacion.oferentes_emails.map(email => ({
          licitacion_id: licitacionId,
          email
        }));

        const { error: oferentesError } = await supabase
          .from('LicitacionOferentes')
          .insert(oferentesData);

        if (oferentesError) {
          console.error('Error creating oferentes:', oferentesError);
        }
      }

      // Insertar eventos del calendario
      if (newLicitacion.calendario_eventos.length > 0) {
        const eventosData = newLicitacion.calendario_eventos.map(evento => ({
          licitacion_id: licitacionId,
          fecha: evento.fecha,
          titulo: evento.titulo,
          descripcion: evento.descripcion,
          requiere_archivos: evento.requiereArchivos
        }));

        const { error: eventosError } = await supabase
          .from('LicitacionEventos')
          .insert(eventosData);

        if (eventosError) {
          console.error('Error creating eventos:', eventosError);
        }
      }

      // Insertar documentos
      if (newLicitacion.documentos.length > 0) {
        const documentosData = newLicitacion.documentos.map(doc => ({
          licitacion_id: licitacionId,
          nombre: doc.nombre,
          size: doc.size,
          tipo: doc.tipo,
          url: doc.url
        }));

        const { error: documentosError } = await supabase
          .from('LicitacionDocumentos')
          .insert(documentosData);

        if (documentosError) {
          console.error('Error creating documentos:', documentosError);
        }
      }

      toast({
        title: "Licitación creada",
        description: "La licitación se ha creado exitosamente"
      });

      return licitacionData;
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
