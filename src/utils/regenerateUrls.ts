import { supabase } from '@/integrations/supabase/client';

export const regenerateAllAccessUrls = async () => {
  try {
    // Always use production domain for consistency
    const baseUrl = 'https://gloster.cl';
    
    console.log('🔄 Starting URL regeneration process for all existing data...');
    
    const { data, error } = await supabase.functions.invoke('regenerate-access-urls', {
      body: { baseUrl }
    });

    if (error) {
      console.error('Error regenerating URLs:', error);
      throw error;
    }

    console.log('✅ URL regeneration completed:', data);
    return data;
  } catch (error) {
    console.error('Failed to regenerate URLs:', error);
    throw error;
  }
};