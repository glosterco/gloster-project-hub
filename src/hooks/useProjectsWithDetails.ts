
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProjectWithDetails {
  id: number;
  Name: string;
  Description: string;
  Location: string;
  Budget: number;
  StartDate: string;
  Duration: number;
  FirstPayment: string;
  ExpiryRate: number;
  Requierment: string[];
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
  EstadosPago: Array<{
    id: number;
    Name: string;
    Project: number;
    ExpiryDate: string;
    Status: string;
    Completion: boolean;
    Mes: string;
    Año: number;
    Total: number;
  }>;
}

export const useProjectsWithDetails = () => {
  const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [contractor, setContractor] = useState<any>(null);
  const { toast } = useToast();

  const fetchProjectsWithDetails = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found');
        setProjects([]);
        return;
      }

      // Get contractor data for current user - use maybeSingle to handle no results
      const { data: contractorData, error: contractorError } = await supabase
        .from('Contratistas')
        .select('*')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (contractorError) {
        console.error('Error fetching contractor:', contractorError);
        toast({
          title: "Error al cargar datos del contratista",
          description: contractorError.message,
          variant: "destructive",
        });
        return;
      }

      if (!contractorData) {
        console.log('No contractor found for current user');
        setProjects([]);
        setContractor(null);
        return;
      }

      setContractor(contractorData);

      // Fetch projects for this contractor with contractor and owner details
      const { data: projectsData, error: projectsError } = await supabase
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
        .eq('Contratista', contractorData.id)
        .eq('Status', true);

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        toast({
          title: "Error al cargar proyectos",
          description: projectsError.message,
          variant: "destructive",
        });
        return;
      }

      // Fetch payment states for all projects
      const projectIds = projectsData?.map(p => p.id) || [];
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('Estados de pago')
        .select('*')
        .in('Project', projectIds)
        .order('ExpiryDate', { ascending: true });

      if (paymentsError) {
        console.error('Error fetching payment states:', paymentsError);
        toast({
          title: "Error al cargar estados de pago",
          description: paymentsError.message,
          variant: "destructive",
        });
        return;
      }

      // Combine projects with their payment states
      const projectsWithDetails = (projectsData || []).map(project => ({
        ...project,
        Contratista: project.Contratistas,
        Owner: project.Mandantes,
        EstadosPago: paymentsData?.filter(payment => payment.Project === project.id) || []
      }));

      setProjects(projectsWithDetails);
      console.log('Projects with details loaded for contractor:', contractorData.CompanyName, projectsWithDetails);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error inesperado",
        description: "Hubo un error al cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectsWithDetails();
  }, []);

  return {
    projects,
    contractor,
    loading,
    refetch: fetchProjectsWithDetails
  };
};
