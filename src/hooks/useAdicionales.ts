import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Adicional {
  id: number;
  Status: string;
  Proyecto: number;
  Categoria: string | null;
  Especialidad: string | null;
  Titulo: string | null;
  Descripcion: string | null;
  Monto_presentado: number | null;
  Monto_aprobado: number | null;
  Vencimiento: string | null;
  GG: number | null;
  Utilidades: number | null;
  Subtotal: number | null;
  URL: string | null;
  created_at: string;
  approved_by_email: string | null;
  approved_by_name: string | null;
  approved_at: string | null;
  rejection_notes: string | null;
  action_notes: string | null;
  paused_at: string | null;
  paused_days: number | null;
  Correlativo: number | null;
}

// Helper para calcular días transcurridos
export const calculateDaysElapsed = (adicional: Adicional): number => {
  const createdAt = new Date(adicional.created_at);
  const now = new Date();
  
  // Si está aprobado o rechazado, congelar en fecha de acción
  if ((adicional.Status === 'Aprobado' || adicional.Status === 'Rechazado') && adicional.approved_at) {
    const approvedAt = new Date(adicional.approved_at);
    const totalDays = Math.floor((approvedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    // Restar días pausados
    return Math.max(0, totalDays - (adicional.paused_days || 0));
  }
  
  // Si está pausado, no seguir contando desde la pausa
  if (adicional.Status === 'Pausado' && adicional.paused_at) {
    const pausedAt = new Date(adicional.paused_at);
    const daysBeforePause = Math.floor((pausedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, daysBeforePause - (adicional.paused_days || 0));
  }
  
  // Para estados activos (Enviado)
  const totalDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, totalDays - (adicional.paused_days || 0));
};

// Helper para calcular días en pausa
export const calculatePausedDays = (adicional: Adicional): number => {
  if (adicional.Status !== 'Pausado' || !adicional.paused_at) {
    return adicional.paused_days || 0;
  }
  
  const pausedAt = new Date(adicional.paused_at);
  const now = new Date();
  const currentPauseDays = Math.floor((now.getTime() - pausedAt.getTime()) / (1000 * 60 * 60 * 24));
  return (adicional.paused_days || 0) + currentPauseDays;
};

export const useAdicionales = (projectId: string) => {
  const [adicionales, setAdicionales] = useState<Adicional[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAdicionales = async () => {
    if (!projectId) return;
    
    const pid = parseInt(projectId);
    if (Number.isNaN(pid)) {
      console.warn('⚠️ useAdicionales: projectId inválido:', projectId);
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔎 Fetching adicionales for projectId:', pid);
      const { data: adicionalesData, error } = await supabase
        .from('Adicionales' as any)
        .select('*')
        .eq('Proyecto', pid)
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error('❌ Error fetching adicionales:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los adicionales",
          variant: "destructive",
        });
        return;
      }
      
      console.log('✅ Fetched adicionales:', Array.isArray(adicionalesData) ? adicionalesData.length : 0);
      setAdicionales((adicionalesData as any) || []);
    } catch (error) {
      console.error('❌ CRITICAL ERROR in fetchAdicionales:', error);
      toast({
        title: "Error inesperado",
        description: "Hubo un error al cargar los adicionales",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdicionales();
  }, [projectId]);

  return {
    adicionales,
    loading,
    refetch: fetchAdicionales
  };
};
