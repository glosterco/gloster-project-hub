import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { normalizeChatCalendarEvents, normalizeChatItems, normalizePercentNumber, parseOferenteEntries } from '@/utils/licitacionCreation';

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Content = result.split(',')[1];
      if (!base64Content) {
        reject(new Error('Empty base64 content'));
        return;
      }
      resolve(base64Content);
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsDataURL(file);
  });
};

export interface CalendarEvent {
  id?: number;
  fecha: string;
  fechaFin?: string | null;
  titulo: string;
  descripcion: string;
  requiereArchivos: boolean;
  estado?: string;
  esRondaPreguntas?: boolean;
}

export interface Oferente {
  id?: number;
  email: string;
  nombre_empresa?: string | null;
}

export interface Documento {
  id?: number;
  nombre: string;
  size?: number;
  tipo?: string;
  url?: string;
}

export interface LicitacionItem {
  id?: number;
  descripcion: string;
  unidad: string;
  cantidad: number;
  precio_unitario: number;
  precio_total: number;
  orden: number;
  agregado_por_oferente?: boolean;
  oferente_email?: string;
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
  gastos_generales?: number;
  utilidades?: number;
  iva_porcentaje?: number;
  divisa?: string;
  oferentes?: Oferente[];
  eventos?: CalendarEvent[];
  documentos?: Documento[];
  items?: LicitacionItem[];
}

export interface NewLicitacion {
  nombre: string;
  descripcion: string;
  mensaje_oferentes: string;
  especificaciones: string;
  oferentes_emails: string[];
  calendario_eventos: CalendarEvent[];
  documentos: Documento[];
  documentFiles?: File[];
  items?: LicitacionItem[];
  gastos_generales?: number;
  utilidades?: number;
  iva_porcentaje?: number;
  divisa?: string;
}

const getCurrentMandanteId = async (userId: string) => {
  const { data: mandanteData } = await supabase
    .from('Mandantes')
    .select('id')
    .eq('auth_user_id', userId)
    .maybeSingle();

  if (mandanteData?.id) return mandanteData.id;

  const { data: mandanteUserData } = await supabase
    .from('mandante_users')
    .select('mandante_id')
    .eq('auth_user_id', userId)
    .maybeSingle();

  return mandanteUserData?.mandante_id ?? null;
};

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

      const mandanteId = await getCurrentMandanteId(user.id);
      if (!mandanteId) {
        setLicitaciones([]);
        return;
      }

      // Obtener las licitaciones con sus relaciones
      const { data, error } = await supabase
        .from('Licitaciones')
        .select(`
          *,
          LicitacionOferentes (
            id,
            email,
            nombre_empresa
          ),
          LicitacionEventos (
            id,
            fecha,
            fecha_fin,
            titulo,
            descripcion,
            requiere_archivos,
            estado,
            es_ronda_preguntas
          ),
          LicitacionDocumentos (
            id,
            nombre,
            size,
            tipo,
            url
          ),
          LicitacionItems (
            id,
            descripcion,
            unidad,
            cantidad,
            precio_unitario,
            precio_total,
            orden
          )
        `)
        .eq('mandante_id', mandanteId)
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
        gastos_generales: item.gastos_generales,
        utilidades: item.utilidades,
        iva_porcentaje: item.iva_porcentaje,
        divisa: item.divisa || 'CLP',
        oferentes: (item.LicitacionOferentes || []).map((o: any) => ({
          id: o.id,
          email: o.email,
          nombre_empresa: o.nombre_empresa,
        })),
        eventos: (item.LicitacionEventos || []).map((e: any) => ({
          id: e.id,
          fecha: e.fecha,
          fechaFin: e.fecha_fin || null,
          titulo: e.titulo,
          descripcion: e.descripcion,
          requiereArchivos: e.requiere_archivos,
          estado: e.estado,
          esRondaPreguntas: e.es_ronda_preguntas
        })),
        documentos: (item.LicitacionDocumentos || []).map((d: any) => ({
          id: d.id,
          nombre: d.nombre,
          size: d.size,
          tipo: d.tipo,
          url: d.url
        })),
        items: Array.isArray(item.LicitacionItems) ? item.LicitacionItems.map((i: any) => ({
          id: i.id,
          descripcion: i.descripcion,
          unidad: i.unidad,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario,
          precio_total: i.precio_total,
          orden: i.orden
        })) : []
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

      const mandanteId = await getCurrentMandanteId(user.id);

      if (!mandanteId) {
        toast({
          title: "Error",
          description: "No se encontró el mandante asociado a tu usuario",
          variant: "destructive"
        });
        return null;
      }

      const parsedOferentes = parseOferenteEntries(newLicitacion.oferentes_emails);
      const normalizedEventos = normalizeChatCalendarEvents(newLicitacion.calendario_eventos);
      const normalizedItems = normalizeChatItems(newLicitacion.items || []);
      const gastosGenerales = normalizePercentNumber(newLicitacion.gastos_generales, 0);
      const utilidades = normalizePercentNumber(newLicitacion.utilidades, 0);
      const ivaPorcentaje = normalizePercentNumber(newLicitacion.iva_porcentaje, 19);

      // Crear la licitación principal
      const { data: licitacionData, error: licitacionError } = await supabase
        .from('Licitaciones')
        .insert([{
          nombre: newLicitacion.nombre,
          descripcion: newLicitacion.descripcion,
          mensaje_oferentes: newLicitacion.mensaje_oferentes,
          especificaciones: newLicitacion.especificaciones,
          gastos_generales: gastosGenerales,
          utilidades,
          iva_porcentaje: ivaPorcentaje,
          divisa: newLicitacion.divisa || 'CLP',
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
      if (parsedOferentes.length > 0) {
        const oferentesData = parsedOferentes.map(({ email, nombreEmpresa }) => ({
          licitacion_id: licitacionId,
          email,
          nombre_empresa: nombreEmpresa,
        }));

        const { error: oferentesError } = await supabase
          .from('LicitacionOferentes')
          .insert(oferentesData);

        if (oferentesError) {
          console.error('Error creating oferentes:', oferentesError);
        }
      }

      // Insertar eventos del calendario
      if (normalizedEventos.length > 0) {
        const eventosData = normalizedEventos.map(evento => ({
          licitacion_id: licitacionId,
          fecha: evento.fecha,
          fecha_fin: evento.fechaFin || null,
          titulo: evento.titulo,
          descripcion: evento.descripcion,
          requiere_archivos: evento.requiereArchivos,
          es_ronda_preguntas: evento.esRondaPreguntas || false
        }));

        const { data: insertedEventos, error: eventosError } = await supabase
          .from('LicitacionEventos')
          .insert(eventosData)
          .select('id, titulo, fecha, fecha_fin, es_ronda_preguntas');

        if (eventosError) {
          console.error('Error creating eventos:', eventosError);
        } else {
          const rondasData = (insertedEventos || [])
            .filter((evento: any) => evento.es_ronda_preguntas)
            .map((evento: any, index: number) => ({
              licitacion_id: licitacionId,
              evento_id: evento.id,
              numero: index + 1,
              titulo: evento.titulo,
              estado: 'programada',
              fecha_apertura: evento.fecha,
              fecha_cierre: evento.fecha_fin || null,
            }));

          if (rondasData.length > 0) {
            const { error: rondasError } = await supabase
              .from('LicitacionRondas')
              .insert(rondasData);

            if (rondasError) {
              console.error('Error creating rondas:', rondasError);
            }
          }
        }
      }

      // Insertar documentos metadata (sin URL por ahora, se actualizará con Drive)
      if (newLicitacion.documentos.length > 0 && (!newLicitacion.documentFiles || newLicitacion.documentFiles.length === 0)) {
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

      // Upload documents to Google Drive if file objects are provided
      if (newLicitacion.documentFiles && newLicitacion.documentFiles.length > 0) {
        try {
          console.log('📤 Uploading documents to Google Drive...');
          const fileData = [];
          
          for (const file of newLicitacion.documentFiles) {
            const base64Content = await convertFileToBase64(file);
            fileData.push({
              name: file.name,
              content: base64Content,
              mimeType: file.type,
              size: file.size,
            });
          }

          const { data: uploadResult, error: uploadError } = await supabase.functions.invoke('upload-licitacion-documents', {
            body: {
              licitacionId,
              licitacionName: newLicitacion.nombre,
              documents: fileData,
              notifyOferentes: false,
            },
          });

          if (uploadError) {
            console.error('Error uploading documents to Drive:', uploadError);
          } else {
            console.log('✅ Documents uploaded to Drive:', uploadResult);
          }
        } catch (uploadErr) {
          console.error('Error in Drive upload:', uploadErr);
        }
      }

      // Insertar items
      if (normalizedItems.length > 0) {
        const itemsData = normalizedItems.map(item => ({
          licitacion_id: licitacionId,
          descripcion: item.descripcion,
          unidad: item.unidad,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          precio_total: item.precio_total,
          orden: item.orden
        }));

        const { error: itemsError } = await supabase
          .from('LicitacionItems')
          .insert(itemsData);

        if (itemsError) {
          console.error('Error creating items:', itemsError);
        }
      }

      toast({
        title: "Licitación creada",
        description: "La licitación se ha creado exitosamente"
      });

      // Send invitation emails to all oferentes
      if (parsedOferentes.length > 0) {
        try {
          console.log('📧 Sending invitation emails to oferentes...');
          const { data: invResult, error: invError } = await supabase.functions.invoke('send-licitacion-invitation', {
            body: {
              licitacionId,
              type: 'invitacion',
            },
          });
          if (invError) {
            console.error('Error sending invitations:', invError);
          } else {
            console.log('✅ Invitations sent:', invResult);
          }
        } catch (invErr) {
          console.error('Error invoking send-licitacion-invitation:', invErr);
        }
      }

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
