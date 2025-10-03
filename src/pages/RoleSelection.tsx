import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRoles } from '@/hooks/useUserRoles';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import RoleSelector from '@/components/RoleSelector';

const RoleSelection: React.FC = () => {
  const { user } = useAuth();
  const { roles, isContratista, isMandante, hasMultipleRoles, loading } = useUserRoles();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contratistaName, setContratistaName] = useState<string>('');
  const [mandanteName, setMandanteName] = useState<string>('');

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    if (!loading) {
      if (!isContratista && !isMandante) {
        // Usuario no tiene roles asignados
        toast({
          title: "Sin acceso",
          description: "No tienes roles asignados en el sistema",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      if (!hasMultipleRoles) {
        // Usuario tiene un solo rol, redirigir directamente
        if (isContratista) {
          sessionStorage.setItem('activeRole', 'contratista');
          navigate('/dashboard');
        } else if (isMandante) {
          sessionStorage.setItem('activeRole', 'mandante');
          navigate('/dashboard-mandante');
        }
        return;
      }

      // Usuario tiene múltiples roles, cargar nombres de empresas
      loadCompanyNames();
    }
  }, [user, loading, isContratista, isMandante, hasMultipleRoles, navigate, toast]);

  const loadCompanyNames = async () => {
    try {
      const contratistaRole = roles.find(role => role.role_type === 'contratista');
      const mandanteRole = roles.find(role => role.role_type === 'mandante');

      if (contratistaRole) {
        const { data: contratistaData } = await supabase
          .from('Contratistas')
          .select('CompanyName')
          .eq('id', contratistaRole.entity_id)
          .single();
        
        if (contratistaData) {
          setContratistaName(contratistaData.CompanyName);
        }
      }

      if (mandanteRole) {
        const { data: mandanteData } = await supabase
          .from('Mandantes')
          .select('CompanyName')
          .eq('id', mandanteRole.entity_id)
          .single();
        
        if (mandanteData) {
          setMandanteName(mandanteData.CompanyName);
        }
      }
    } catch (error) {
      console.error('Error loading company names:', error);
    }
  };

  const handleRoleSelection = (role: 'contratista' | 'mandante') => {
    // Guardar el rol seleccionado en sessionStorage
    sessionStorage.setItem('activeRole', role);
    
    if (role === 'contratista') {
      navigate('/dashboard');
    } else {
      navigate('/dashboard-mandante');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando roles...</p>
        </div>
      </div>
    );
  }

  if (!hasMultipleRoles) {
    return null; // Se redirige automáticamente
  }

  return (
    <RoleSelector
      onSelectRole={handleRoleSelection}
      contratistaName={isContratista ? contratistaName : undefined}
      mandanteName={isMandante ? mandanteName : undefined}
    />
  );
};

export default RoleSelection;