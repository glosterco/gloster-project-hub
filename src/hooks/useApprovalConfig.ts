import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Approver {
  id: string;
  config_id: string;
  approver_email: string;
  approver_name: string | null;
  approval_order: number;
  created_at: string;
}

export interface ApprovalConfig {
  id: string;
  project_id: number;
  required_approvals: number;
  approval_order_matters: boolean;
  created_at: string;
  updated_at: string;
  approvers: Approver[];
}

export const useApprovalConfig = (projectId: number | null) => {
  const [config, setConfig] = useState<ApprovalConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchConfig = async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch config
      const { data: configData, error: configError } = await supabase
        .from('project_approval_config')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (configError) {
        if (configError.code === 'PGRST116') {
          // No config exists, create default
          await createDefaultConfig();
          return;
        }
        throw configError;
      }

      // Fetch approvers
      const { data: approversData, error: approversError } = await supabase
        .from('project_approvers')
        .select('*')
        .eq('config_id', configData.id)
        .order('approval_order', { ascending: true });

      if (approversError) throw approversError;

      setConfig({
        ...configData,
        approvers: approversData || []
      });
    } catch (err: any) {
      console.error('Error fetching approval config:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultConfig = async () => {
    if (!projectId) return;

    try {
      const { data: newConfig, error: createError } = await supabase
        .from('project_approval_config')
        .insert({
          project_id: projectId,
          required_approvals: 1,
          approval_order_matters: false
        })
        .select()
        .single();

      if (createError) throw createError;

      setConfig({
        ...newConfig,
        approvers: []
      });
    } catch (err: any) {
      console.error('Error creating default config:', err);
      setError(err.message);
    }
  };

  const updateConfig = async (updates: { required_approvals?: number; approval_order_matters?: boolean }) => {
    if (!config) return;

    try {
      const { error } = await supabase
        .from('project_approval_config')
        .update(updates)
        .eq('id', config.id);

      if (error) throw error;

      setConfig(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: "Configuración actualizada",
        description: "La configuración de aprobación ha sido actualizada."
      });
    } catch (err: any) {
      console.error('Error updating config:', err);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const addApprover = async (email: string, name?: string) => {
    if (!config) return;

    const maxOrder = config.approvers.reduce((max, a) => Math.max(max, a.approval_order), 0);

    try {
      const { data: newApprover, error } = await supabase
        .from('project_approvers')
        .insert({
          config_id: config.id,
          approver_email: email.toLowerCase().trim(),
          approver_name: name || null,
          approval_order: maxOrder + 1
        })
        .select()
        .single();

      if (error) throw error;

      setConfig(prev => prev ? {
        ...prev,
        approvers: [...prev.approvers, newApprover]
      } : null);

      toast({
        title: "Aprobador agregado",
        description: `${email} ha sido agregado como aprobador.`
      });
    } catch (err: any) {
      console.error('Error adding approver:', err);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const removeApprover = async (approverId: string) => {
    if (!config) return;

    try {
      const { error } = await supabase
        .from('project_approvers')
        .delete()
        .eq('id', approverId);

      if (error) throw error;

      setConfig(prev => prev ? {
        ...prev,
        approvers: prev.approvers.filter(a => a.id !== approverId)
      } : null);

      toast({
        title: "Aprobador eliminado",
        description: "El aprobador ha sido eliminado."
      });
    } catch (err: any) {
      console.error('Error removing approver:', err);
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const updateApproverOrder = async (approverId: string, newOrder: number) => {
    if (!config) return;

    try {
      const { error } = await supabase
        .from('project_approvers')
        .update({ approval_order: newOrder })
        .eq('id', approverId);

      if (error) throw error;

      setConfig(prev => prev ? {
        ...prev,
        approvers: prev.approvers.map(a => 
          a.id === approverId ? { ...a, approval_order: newOrder } : a
        ).sort((a, b) => a.approval_order - b.approval_order)
      } : null);
    } catch (err: any) {
      console.error('Error updating approver order:', err);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [projectId]);

  return {
    config,
    loading,
    error,
    refetch: fetchConfig,
    updateConfig,
    addApprover,
    removeApprover,
    updateApproverOrder
  };
};
