import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Licitacion } from '@/hooks/useLicitaciones';

export interface Ronda {
  id: number;
  licitacion_id: number;
  numero: number;
  titulo: string;
  estado: string;
  fecha_apertura: string;
  fecha_cierre: string | null;
  created_at: string;
}

export interface Pregunta {
  id: number;
  licitacion_id: number;
  ronda_id: number;
  oferente_email: string;
  pregunta: string;
  especialidad: string | null;
  grupo_similar_id: number | null;
  respuesta: string | null;
  respuesta_ia: string | null;
  respuesta_ia_fuentes: any;
  respondida: boolean;
  publicada: boolean;
  respondida_por: string | null;
  enviada: boolean;
  created_at: string;
}

export interface Oferta {
  id: number;
  licitacion_id: number;
  oferente_email: string;
  oferente_nombre: string | null;
  oferente_empresa: string | null;
  estado: string;
  gastos_generales: number | null;
  utilidades: number | null;
  total: number | null;
  notas: string | null;
  created_at: string;
  items: OfertaItem[];
}

export interface OfertaItem {
  id: number;
  oferta_id: number;
  item_referencia_id: number | null;
  descripcion: string;
  unidad: string | null;
  cantidad: number | null;
  precio_unitario: number | null;
  precio_total: number | null;
  orden: number;
}

export interface OferenteDetail {
  id: number;
  email: string;
  aceptada: boolean;
  aceptada_at: string | null;
  aceptada_por_nombre: string | null;
  archivo_aceptacion_url: string | null;
  archivo_aceptacion_nombre: string | null;
  nombre_empresa: string | null;
  itemizado_enviado: boolean;
  itemizado_enviado_at: string | null;
}

export const useLicitacionDetail = (licitacionId: number | null) => {
  const { toast } = useToast();
  const [licitacion, setLicitacion] = useState<Licitacion | null>(null);
  const [rondas, setRondas] = useState<Ronda[]>([]);
  const [preguntas, setPreguntas] = useState<Pregunta[]>([]);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [oferentesDetail, setOferentesDetail] = useState<OferenteDetail[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLicitacion = useCallback(async () => {
    if (!licitacionId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Licitaciones')
        .select(`
          *,
          LicitacionOferentes(id, email, aceptada, aceptada_at, aceptada_por_nombre, archivo_aceptacion_url, archivo_aceptacion_nombre, nombre_empresa, itemizado_enviado, itemizado_enviado_at),
          LicitacionEventos(id, fecha, titulo, descripcion, requiere_archivos, estado, es_ronda_preguntas),
          LicitacionDocumentos(id, nombre, size, tipo, url),
          LicitacionItems(id, descripcion, unidad, cantidad, precio_unitario, precio_total, orden, agregado_por_oferente, oferente_email)
        `)
        .eq('id', licitacionId)
        .single();

      if (error) throw error;

      const oferentesData = (data.LicitacionOferentes || []) as any[];
      setOferentesDetail(oferentesData);

      setLicitacion({
        id: data.id,
        nombre: data.nombre,
        descripcion: data.descripcion,
        mensaje_oferentes: data.mensaje_oferentes,
        especificaciones: data.especificaciones,
        estado: data.estado as any,
        mandante_id: data.mandante_id,
        created_at: data.created_at,
        updated_at: data.updated_at,
        gastos_generales: data.gastos_generales,
        iva_porcentaje: data.iva_porcentaje,
        oferentes: oferentesData.map((o: any) => ({ id: o.id, email: o.email })),
        eventos: (data.LicitacionEventos || []).map((e: any) => ({
          id: e.id, fecha: e.fecha, titulo: e.titulo,
          descripcion: e.descripcion, requiereArchivos: e.requiere_archivos,
          estado: e.estado, esRondaPreguntas: e.es_ronda_preguntas
        })),
        documentos: (data.LicitacionDocumentos || []).map((d: any) => ({
          id: d.id, nombre: d.nombre, size: d.size, tipo: d.tipo, url: d.url
        })),
        items: (data.LicitacionItems || []).map((i: any) => ({
          id: i.id, descripcion: i.descripcion, unidad: i.unidad,
          cantidad: i.cantidad, precio_unitario: i.precio_unitario,
          precio_total: i.precio_total, orden: i.orden,
          agregado_por_oferente: i.agregado_por_oferente,
          oferente_email: i.oferente_email
        }))
      });

      // Fetch rondas
      const { data: rondasData } = await supabase
        .from('LicitacionRondas')
        .select('*')
        .eq('licitacion_id', licitacionId)
        .order('numero');
      setRondas(rondasData || []);

      // Fetch preguntas (only sent ones for mandante view)
      const { data: preguntasData } = await supabase
        .from('LicitacionPreguntas')
        .select('*')
        .eq('licitacion_id', licitacionId)
        .order('created_at');
      setPreguntas(preguntasData || []);

      // Fetch ofertas with items
      const { data: ofertasData } = await supabase
        .from('LicitacionOfertas')
        .select(`*, LicitacionOfertaItems(*)`)
        .eq('licitacion_id', licitacionId);

      setOfertas((ofertasData || []).map((o: any) => ({
        ...o,
        items: (o.LicitacionOfertaItems || []).sort((a: any, b: any) => a.orden - b.orden)
      })));
    } catch (error: any) {
      console.error('Error fetching licitacion detail:', error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [licitacionId, toast]);

  const createRonda = async (titulo: string) => {
    if (!licitacionId) return;
    const nextNum = rondas.length + 1;
    const { error } = await supabase.from('LicitacionRondas').insert({
      licitacion_id: licitacionId,
      numero: nextNum,
      titulo
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Ronda creada" });
      fetchLicitacion();
    }
  };

  const closeRonda = async (rondaId: number) => {
    const { error } = await supabase.from('LicitacionRondas')
      .update({ estado: 'cerrada', fecha_cierre: new Date().toISOString() })
      .eq('id', rondaId);
    if (!error) fetchLicitacion();
  };

  const openRonda = async (rondaId: number) => {
    const { error } = await supabase.from('LicitacionRondas')
      .update({ estado: 'abierta', fecha_cierre: null })
      .eq('id', rondaId);
    if (!error) fetchLicitacion();
  };

  const answerPregunta = async (preguntaId: number, respuesta: string) => {
    const { error } = await supabase.from('LicitacionPreguntas')
      .update({ respuesta, respondida: true, updated_at: new Date().toISOString() })
      .eq('id', preguntaId);
    if (!error) fetchLicitacion();
  };

  const publishPreguntas = async (preguntaIds: number[]) => {
    const { error } = await supabase.from('LicitacionPreguntas')
      .update({ publicada: true })
      .in('id', preguntaIds);
    if (!error) {
      toast({ title: "Respuestas publicadas" });
      fetchLicitacion();
    }
  };

  const updateEvento = async (eventoId: number, updates: { titulo?: string; fecha?: string; descripcion?: string }) => {
    const { error } = await supabase.from('LicitacionEventos')
      .update(updates)
      .eq('id', eventoId);
    if (!error) {
      toast({ title: "Evento actualizado" });
      fetchLicitacion();
    } else {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const completeEvento = async (eventoId: number) => {
    const { error } = await supabase.from('LicitacionEventos')
      .update({ estado: 'completado' })
      .eq('id', eventoId);
    if (!error) {
      toast({ title: "Evento finalizado" });
      fetchLicitacion();
    }
  };

  useEffect(() => {
    fetchLicitacion();
  }, [fetchLicitacion]);

  return {
    licitacion,
    rondas,
    preguntas,
    ofertas,
    oferentesDetail,
    loading,
    refetch: fetchLicitacion,
    createRonda,
    closeRonda,
    openRonda,
    answerPregunta,
    publishPreguntas,
    updateEvento,
    completeEvento
  };
};
