
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

export const useProjectDetail = (projectId: string) => {
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchProjectDetail = async () => {
    if (!projectId) {
      console.log('❌ No projectId provided');
      return;
    }
    
    console.log('🚀 STARTING fetchProjectDetail for project:', projectId);
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
        toast({
          title: "Acceso denegado",
          description: "No tienes un perfil de contratista válido",
          variant: "destructive",
        });
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
        toast({
          title: "Error al cargar proyecto",
          description: projectError.message,
          variant: "destructive",
        });
        return;
      }

      if (!projectData) {
        console.log('❌ Project not found or no access');
        toast({
          title: "Proyecto no encontrado",
          description: "No se encontró el proyecto o no tienes acceso a él",
          variant: "destructive",
        });
        return;
      }

      // ONLY READ payment states - NO UPDATES OR CALLS TO FUNCTIONS
      console.log('🔍 FETCHING PAYMENT STATES - READ-ONLY');
      
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('Estados de pago')
        .select('id, Name, Status, Total, ExpiryDate, Completion, Mes, "Año"')
        .eq('Project', parseInt(projectId))
        .order('ExpiryDate', { ascending: true });

      if (paymentsError) {
        console.error('❌ Error fetching payment states:', paymentsError);
        toast({
          title: "Error al cargar estados de pago",
          description: paymentsError.message,
          variant: "destructive",
        });
        return;
      }

      console.log('📊 RAW PAYMENT DATA:', paymentsData);

      // Create project object
      const projectWithDetails: ProjectDetail = {
        ...projectData,
        Contratista: projectData.Contratistas,
        Owner: projectData.Mandantes,
        EstadosPago: paymentsData || []
      };

      console.log('✅ Setting project state');
      setProject(projectWithDetails);
      
    } catch (error) {
      console.error('❌ CRITICAL ERROR in fetchProjectDetail:', error);
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
    console.log('🔄 useProjectDetail effect triggered for projectId:', projectId);
    fetchProjectDetail();
  }, [projectId]);

  // REMOVED REAL-TIME SUBSCRIPTION TO PREVENT UNWANTED UPDATES
  // Real-time monitoring was causing potential loops and unwanted calls

  return {
    project,
    loading,
    refetch: fetchProjectDetail
  };
};
