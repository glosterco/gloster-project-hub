import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface ProjectWithDetailsMandante {
  id: number;
  Name: string;
  Description: string;
  Budget: number;
  Currency: string;
  Location: string;
  Status: boolean;
  StartDate: string;
  Duration: number;
  Contratista: {
    id: number;
    CompanyName: string;
    ContactName: string;
    ContactEmail: string;
    ContactPhone: number;
    RUT: string;
  };
  EstadosPago: Array<{
    id: number;
    Name: string;
    Status: string;
    Total: number;
    ExpiryDate: string;
    Mes: string;
    Año: number;
    Progress: number;
    Completion: boolean;
    Notes: string;
    URL: string;
    URLMandante: string;
  }>;
}

export const useProjectsWithDetailsMandante = () => {
  const [projects, setProjects] = useState<ProjectWithDetailsMandante[]>([]);
  const [mandante, setMandante] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProjectsWithDetails();
    }
  }, [user]);

  const fetchProjectsWithDetails = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Primero obtener el mandante asociado al usuario autenticado
      const { data: mandanteData, error: mandanteError } = await supabase
        .from('Mandantes')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();

      if (mandanteError || !mandanteData) {
        console.error('Error fetching mandante or mandante not found:', mandanteError);
        // No mostrar toast de error, solo manejar silenciosamente
        setLoading(false);
        return;
      }

      setMandante(mandanteData);

      // Obtener proyectos donde este mandante es el owner
      const { data: projectsData, error: projectsError } = await supabase
        .from('Proyectos')
        .select(`
          *,
          Contratista:Contratistas!inner(
            id,
            CompanyName,
            ContactName,
            ContactEmail,
            ContactPhone,
            RUT
          )
        `)
        .eq('Owner', mandanteData.id);

      if (projectsError) {
        console.error('Error fetching projects:', projectsError);
        toast({
          title: "Error",
          description: "No se pudieron cargar los proyectos",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      if (!projectsData || projectsData.length === 0) {
        console.log('No projects found for mandante:', mandanteData.id);
        setProjects([]);
        setLoading(false);
        return;
      }

      // Obtener estados de pago para cada proyecto
      const projectsWithPaymentStates = await Promise.all(
        projectsData.map(async (project) => {
          try {
            const { data: paymentStatesData, error: paymentStatesError } = await supabase
              .from('Estados de pago')
              .select('*')
              .eq('Project', project.id)
              .order('Año', { ascending: true })
              .order('Mes', { ascending: true });

            if (paymentStatesError) {
              console.error('Error fetching payment states for project:', project.id, paymentStatesError);
              return {
                ...project,
                EstadosPago: []
              };
            }

            // Asegurar que al menos un estado sea "Pendiente"
            const hasAtLeastOnePendiente = paymentStatesData?.some(state => state.Status === 'Pendiente');
            
            if (!hasAtLeastOnePendiente && paymentStatesData && paymentStatesData.length > 0) {
              // Actualizar el primer estado programado a pendiente
              const firstProgramado = paymentStatesData.find(state => state.Status === 'Programado');
              if (firstProgramado) {
                const { error: updateError } = await supabase
                  .from('Estados de pago')
                  .update({ Status: 'Pendiente' })
                  .eq('id', firstProgramado.id);

                if (!updateError) {
                  firstProgramado.Status = 'Pendiente';
                }
              }
            }

            return {
              ...project,
              EstadosPago: paymentStatesData || []
            };
          } catch (error) {
            console.error('Error processing project:', project.id, error);
            return {
              ...project,
              EstadosPago: []
            };
          }
        })
      );

      setProjects(projectsWithPaymentStates);
    } catch (error) {
      console.error('Unexpected error fetching projects:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al cargar los proyectos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchProjectsWithDetails();
  };

  return {
    projects,
    mandante,
    loading,
    refetch
  };
};