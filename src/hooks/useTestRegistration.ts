import { supabase } from '@/integrations/supabase/client';

export const useTestRegistration = () => {
  const testCreateMandante = async () => {
    console.log('Testing mandante creation without auth...');
    
    try {
      const testData = {
        CompanyName: 'Test Company ' + Date.now(),
        ContactName: 'Test Contact',
        ContactEmail: 'test' + Date.now() + '@example.com',
        ContactPhone: 987654321,
        Status: true,
        auth_user_id: null
      };

      console.log('Test data:', testData);

      const { data, error } = await supabase
        .from('Mandantes')
        .insert([testData])
        .select()
        .single();

      if (error) {
        console.error('❌ Test failed:', error);
        return { success: false, error };
      }

      console.log('✅ Test passed:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Unexpected test error:', error);
      return { success: false, error };
    }
  };

  const testCreateContratista = async () => {
    console.log('Testing contratista creation without auth...');
    
    try {
      const testData = {
        CompanyName: 'Test Contractor ' + Date.now(),
        RUT: '12.345.678-9',
        Specialization: 'Test Spec',
        Experience: '1-2 años',
        ContactName: 'Test Contact',
        ContactEmail: 'contractor' + Date.now() + '@example.com',
        ContactPhone: 987654321,
        Status: true,
        auth_user_id: null
      };

      console.log('Test data:', testData);

      const { data, error } = await supabase
        .from('Contratistas')
        .insert([testData])
        .select()
        .single();

      if (error) {
        console.error('❌ Test failed:', error);
        return { success: false, error };
      }

      console.log('✅ Test passed:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ Unexpected test error:', error);
      return { success: false, error };
    }
  };

  return {
    testCreateMandante,
    testCreateContratista
  };
};