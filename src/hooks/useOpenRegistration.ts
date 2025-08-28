import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useOpenRegistration = () => {
  const { toast } = useToast();

  const createMandanteWithoutAuth = async (mandanteData: any) => {
    try {
      console.log('Creating mandante without authentication:', mandanteData);
      
      const { data, error } = await supabase
        .from('Mandantes')
        .insert([{
          CompanyName: mandanteData.CompanyName,
          ContactName: mandanteData.ContactName,
          ContactEmail: mandanteData.ContactEmail,
          ContactPhone: mandanteData.ContactPhone,
          Status: true,
          auth_user_id: null // Permitir registro sin autenticación
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating mandante:', error);
        return { success: false, error };
      }

      console.log('Mandante created successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error:', error);
      return { success: false, error };
    }
  };

  const createContratistaWithoutAuth = async (contratistaData: any) => {
    try {
      console.log('Creating contratista without authentication:', contratistaData);
      
      const { data, error } = await supabase
        .from('Contratistas')
        .insert([{
          CompanyName: contratistaData.CompanyName,
          RUT: contratistaData.RUT,
          Specialization: contratistaData.Specialization,
          Experience: contratistaData.Experience,
          ContactName: contratistaData.ContactName,
          ContactEmail: contratistaData.ContactEmail,
          ContactPhone: contratistaData.ContactPhone,
          Status: true,
          auth_user_id: null // Permitir registro sin autenticación
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating contratista:', error);
        return { success: false, error };
      }

      console.log('Contratista created successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error:', error);
      return { success: false, error };
    }
  };

  const createProjectWithoutAuth = async (projectData: any) => {
    try {
      console.log('Creating project without authentication:', projectData);
      
      const { data, error } = await supabase
        .from('Proyectos')
        .insert([projectData])
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        return { success: false, error };
      }

      console.log('Project created successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error:', error);
      return { success: false, error };
    }
  };

  const createPaymentStatesWithoutAuth = async (paymentStates: any[]) => {
    try {
      console.log('Creating payment states without authentication:', paymentStates);
      
      const { data, error } = await supabase
        .from('Estados de pago')
        .insert(paymentStates)
        .select();

      if (error) {
        console.error('Error creating payment states:', error);
        return { success: false, error };
      }

      console.log('Payment states created successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error:', error);
      return { success: false, error };
    }
  };

  const createUserRoleWithoutAuth = async (roleData: any) => {
    try {
      console.log('Creating user role without authentication:', roleData);
      
      const { data, error } = await supabase
        .from('user_roles')
        .insert([roleData])
        .select()
        .single();

      if (error) {
        console.error('Error creating user role:', error);
        return { success: false, error };
      }

      console.log('User role created successfully:', data);
      return { success: true, data };
    } catch (error) {
      console.error('Unexpected error:', error);
      return { success: false, error };
    }
  };

  return {
    createMandanteWithoutAuth,
    createContratistaWithoutAuth,
    createProjectWithoutAuth,
    createPaymentStatesWithoutAuth,
    createUserRoleWithoutAuth
  };
};