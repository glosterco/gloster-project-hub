import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PaymentState {
  id: number;
  Name: string;
  Status: string;
  Total: number | null;
  ExpiryDate: string;
  Completion: boolean;
  Mes: string;
  Año: number;
  URLContratista?: string; // ✅ AGREGADO: Campo crucial para notificaciones
}

export interface ProjectDetail {
  id: number;
  Name: string;
  Description: string;
  Location: string;
  Budget: number;
  Currency?: string;
  StartDate: string;
  Duration: number;
  Status: boolean;
  Contratista: {
    id: number;
    CompanyName: string;
    ContactName: string;
    ContactEmail: string;
  };
  Owner: {
    id: number;
    CompanyName: string;
    ContactName: string;
    ContactEmail: string;
  };
  EstadosPago: PaymentState[];
}

export const useProjectDetailMandante = (projectId: string) => {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchProjectDetailMandante = async () => {
    if (!projectId) {
      console.log('❌ No projectId provided');
      return;
    }
    
    console.log('🔒 MANDANTE MODE: Starting fetchProjectDetail for project:', projectId);
    setLoading(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('❌ No authenticated user found');
        return;
      }

      // Get mandante data - first try by auth_user_id, then by project access
      let mandanteData = null;
      
      // Try to get mandante directly by auth_user_id
      const { data: directMandante, error: directError } = await supabase
        .from('Mandantes')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (directError) {
        console.error('❌ Error fetching direct mandante:', directError);
      } else if (directMandante) {
        mandanteData = directMandante;
        console.log('✅ Found mandante by auth_user_id:', mandanteData.id);
      }

      // If no direct mandante found, try through project relationship
      if (!mandanteData) {
        const { data: projectMandante, error: projectError } = await supabase
          .from('Proyectos')
          .select(`
            Owner,
            Mandantes!Proyectos_Owner_fkey (*)
          `)
          .eq('id', parseInt(projectId))
          .maybeSingle();

        if (projectError) {
          console.error('❌ Error fetching project mandante:', projectError);
        } else if (projectMandante?.Mandantes) {
          mandanteData = projectMandante.Mandantes;
          console.log('✅ Found mandante through project relationship:', mandanteData.id);
        }
      }

      if (!mandanteData) {
        console.log('❌ No mandante found for current user');
        return;
      }

      // Fetch project details (mandante access)
      const { data: projectData, error: projectError } = await supabase
        .from('Proyectos')
        .select(`
          *,
          Contratistas!Proyectos_Contratista_fkey (
            id,
            CompanyName,
            ContactName,
            ContactEmail
          ),
          Mandantes!Proyectos_Owner_fkey (
            id,
            CompanyName,
            ContactName,
            ContactEmail
          )
        `)
        .eq('id', parseInt(projectId))
        .eq('Owner', mandanteData.id)
        .maybeSingle();

      if (projectError) {
        console.error('❌ Error fetching project:', projectError);
        return;
      }

      if (!projectData) {
        console.log('❌ Project not found or no access');
        return;
      }

      // Fetch payment states - ✅ CORREGIDO: Incluir URLContratista
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('Estados de pago')
        .select('id, Name, Status, Total, ExpiryDate, Completion, Mes, "Año", "URLContratista"')
        .eq('Project', parseInt(projectId))
        .order('ExpiryDate', { ascending: true });
          
      if (paymentsError) {
        console.error('❌ Error fetching payments:', paymentsError);
        return;
      }
      
      // Create project object
      const projectWithDetails: ProjectDetail = {
        ...projectData,
        Contratista: projectData.Contratistas,
        Owner: projectData.Mandantes,
        EstadosPago: paymentsData || []
      };

      console.log('✅ MANDANTE MODE: Setting project state');
      setProject(projectWithDetails);
      
    } catch (error) {
      console.error('❌ CRITICAL ERROR in mandante fetchProjectDetail:', error);
      toast({
        title: "Error inesperado",
        description: "Hubo un error al cargar el proyecto",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔒 MANDANTE MODE: useProjectDetail effect triggered for projectId:', projectId);
    fetchProjectDetailMandante();
  }, [projectId]);

  return {
    project,
    loading,
    refetch: fetchProjectDetailMandante
  };
};