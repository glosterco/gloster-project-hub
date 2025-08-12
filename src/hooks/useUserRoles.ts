import { useState, useEffect } from 'react';
import bcrypt from 'bcryptjs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface UserRole {
  id: number;
  auth_user_id: string;
  role_type: 'contratista' | 'mandante';
  entity_id: number;
  created_at: string;
}

interface UserRoleData {
  roles: UserRole[];
  isContratista: boolean;
  isMandante: boolean;
  hasMultipleRoles: boolean;
  contratistaId?: number;
  mandanteId?: number;
  loading: boolean;
}

export const useUserRoles = (): UserRoleData => {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserRoles();
    } else {
      setRoles([]);
      setLoading(false);
    }
  }, [user]);

  const fetchUserRoles = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('auth_user_id', user.id);

      if (error) {
        console.error('Error fetching user roles:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los roles del usuario",
          variant: "destructive"
        });
        return;
      }

      setRoles((data || []) as UserRole[]);
    } catch (error) {
      console.error('Unexpected error fetching user roles:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al cargar los roles",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isContratista = roles.some(role => role.role_type === 'contratista');
  const isMandante = roles.some(role => role.role_type === 'mandante');
  const hasMultipleRoles = isContratista && isMandante;
  
  const contratistaRole = roles.find(role => role.role_type === 'contratista');
  const mandanteRole = roles.find(role => role.role_type === 'mandante');

  return {
    roles,
    isContratista,
    isMandante,
    hasMultipleRoles,
    contratistaId: contratistaRole?.entity_id,
    mandanteId: mandanteRole?.entity_id,
    loading
  };
};

export const useCreateUserRole = () => {
  const { toast } = useToast();

  const createUserRole = async (
    authUserId: string,
    roleType: 'contratista' | 'mandante',
    entityId: number,
    credentials?: { username?: string; password?: string }
  ) => {
    try {
      let password_hash: string | undefined = undefined;
      if (credentials?.password) {
        // Hash on client to avoid storing plaintext
        password_hash = await bcrypt.hash(credentials.password, 10);
      }

      const insertPayload: any = {
        auth_user_id: authUserId,
        role_type: roleType,
        entity_id: entityId,
      };
      if (credentials?.username) insertPayload.local_username = credentials.username;
      if (password_hash) insertPayload.password_hash = password_hash;

      const { error } = await supabase
        .from('user_roles')
        .insert(insertPayload);


      if (error) {
        console.error('Error creating user role:', error);
        toast({
          title: "Error",
          description: "No se pudo crear el rol del usuario",
          variant: "destructive"
        });
        return { success: false, error };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error creating user role:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al crear el rol",
        variant: "destructive"
      });
      return { success: false, error };
    }
  };

  return { createUserRole };
};