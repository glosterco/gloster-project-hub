import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useMoveDocument = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const moveDocument = async (documentId: number, newTipo: string): Promise<boolean> => {
    setLoading(true);
    try {
      // Get current user info
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || 'unknown';
      const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';

      const { data, error } = await supabase.functions.invoke('move-document', {
        body: {
          documentId,
          newTipo,
          movedByEmail: userEmail,
          movedByName: userName
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Documento movido',
          description: `El documento fue movido a "${newTipo}"`,
        });
        return true;
      } else {
        throw new Error(data?.error || 'Error desconocido');
      }
    } catch (error: any) {
      console.error('Error moving document:', error);
      toast({
        title: 'Error',
        description: error.message || 'No se pudo mover el documento',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { moveDocument, loading };
};