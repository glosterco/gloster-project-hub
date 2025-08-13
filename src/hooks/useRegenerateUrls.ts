import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useRegenerateUrls = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const regenerateAllUrls = async () => {
    setLoading(true);
    
    try {
      const baseUrl = window.location.origin;
      
      console.log('🔄 Regenerating all access URLs with base URL:', baseUrl);
      
      const { data, error } = await supabase.functions.invoke('regenerate-access-urls', {
        body: { baseUrl }
      });

      if (error) {
        console.error('Error calling regenerate function:', error);
        throw new Error(error.message || 'Error al regenerar URLs');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'No se pudieron regenerar las URLs');
      }

      console.log('✅ URLs regenerated successfully:', data);
      
      toast({
        title: "URLs Regeneradas",
        description: `${data.successCount} URLs actualizadas correctamente`,
        variant: "default"
      });

      return true;

    } catch (error) {
      console.error('Error in regenerateAllUrls:', error);
      toast({
        title: "Error",
        description: error.message || "Error al regenerar las URLs de acceso",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    regenerateAllUrls,
    loading
  };
};