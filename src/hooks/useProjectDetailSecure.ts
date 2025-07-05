
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

export const useProjectDetailSecure = (projectId: string) => {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchProjectDetailSecure = async () => {
    if (!projectId) {
      console.log('❌ No projectId provided');
      return;
    }
    
    console.log('🔒 SECURE MODE: Starting fetchProjectDetail for project:', projectId);
    setLoading(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('❌ No authenticated user found');
        return;
      }

      // Get contractor data
      const { data: contractorData, error: contractorError } = await supabase
        .from('Contratistas')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (contractorError) {
        console.error('❌ Error fetching contractor:', contractorError);
        return;
      }

      if (!contractorData) {
        console.log('❌ No contractor found for current user');
        return;
      }

      // Fetch project details
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
        .eq('Contratista', contractorData.id)
        .maybeSingle();

      if (projectError) {
        console.error('❌ Error fetching project:', projectError);
        return;
      }

      if (!projectData) {
        console.log('❌ Project not found or no access');
        return;
      }

      // USAR CONSULTA DIRECTA PERO MUY ESPECÍFICA Y SEGURA
      console.log('🔒 USING SECURE DIRECT QUERY (READ-ONLY)');
      
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('Estados de pago')
        .select('id, Name, Status, Total, ExpiryDate, Completion, Mes, "Año"')
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

      console.log('✅ SECURE MODE: Setting project state');
      setProject(projectWithDetails);
      
    } catch (error) {
      console.error('❌ CRITICAL ERROR in secure fetchProjectDetail:', error);
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
    console.log('🔒 SECURE MODE: useProjectDetail effect triggered for projectId:', projectId);
    
    // Limpiar cualquier subscription previa
    const cleanup = () => {
      // Forzar limpieza de cache del navegador para este proyecto
      if (typeof window !== 'undefined') {
        const cacheKeys = Object.keys(localStorage).filter(key => 
          key.includes('project') || key.includes('payment')
        );
        cacheKeys.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.log('Cache cleanup error:', e);
          }
        });
      }
    };
    
    cleanup();
    fetchProjectDetailSecure();
    
    return cleanup;
  }, [projectId]);

  return {
    project,
    loading,
    refetch: fetchProjectDetailSecure
  };
};
