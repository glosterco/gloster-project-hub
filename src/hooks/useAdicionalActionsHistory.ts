import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdicionalAction {
  id: string;
  adicional_id: number;
  action_type: 'enviado' | 'pausado' | 'reanudado' | 'aprobado' | 'rechazado';
  action_by_email: string | null;
  action_by_name: string | null;
  notes: string | null;
  created_at: string;
}

export const useAdicionalActionsHistory = (adicionalId: number | null) => {
  const [actions, setActions] = useState<AdicionalAction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchActions = async () => {
    if (!adicionalId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('adicional_actions_history')
        .select('*')
        .eq('adicional_id', adicionalId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setActions((data || []) as AdicionalAction[]);
    } catch (error) {
      console.error('Error fetching adicional actions history:', error);
    } finally {
      setLoading(false);
    }
  };

  const recordAction = async (
    actionType: AdicionalAction['action_type'],
    email: string,
    notes?: string
  ) => {
    if (!adicionalId) return;

    try {
      const { error } = await supabase
        .from('adicional_actions_history')
        .insert({
          adicional_id: adicionalId,
          action_type: actionType,
          action_by_email: email,
          notes: notes || null
        } as any);

      if (error) throw error;
      await fetchActions();
    } catch (error) {
      console.error('Error recording adicional action:', error);
    }
  };

  useEffect(() => {
    fetchActions();
  }, [adicionalId]);

  return { actions, loading, refetch: fetchActions, recordAction };
};

export const getActionLabel = (actionType: AdicionalAction['action_type']): string => {
  const labels: Record<AdicionalAction['action_type'], string> = {
    enviado: 'Enviado',
    pausado: 'Pausado',
    reanudado: 'Reanudado',
    aprobado: 'Aprobado',
    rechazado: 'Rechazado'
  };
  return labels[actionType] || actionType;
};

export const getActionColor = (actionType: AdicionalAction['action_type']): string => {
  const colors: Record<AdicionalAction['action_type'], string> = {
    enviado: 'text-blue-600',
    pausado: 'text-amber-600',
    reanudado: 'text-cyan-600',
    aprobado: 'text-green-600',
    rechazado: 'text-red-600'
  };
  return colors[actionType] || 'text-gray-600';
};

export const getActionBgColor = (actionType: AdicionalAction['action_type']): string => {
  const colors: Record<AdicionalAction['action_type'], string> = {
    enviado: 'bg-blue-50 border-blue-200',
    pausado: 'bg-amber-50 border-amber-200',
    reanudado: 'bg-cyan-50 border-cyan-200',
    aprobado: 'bg-green-50 border-green-200',
    rechazado: 'bg-red-50 border-red-200'
  };
  return colors[actionType] || 'bg-gray-50 border-gray-200';
};
