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
  Adicionales: Array<{
    id: number;
    Status: string;
    Titulo: string;
    Monto_presentado: number;
    created_at: string;
  }>;
  RFI: Array<{
    id: number;
    Status: string;
    Titulo: string;
    created_at: string;
  }>;
}

export const useProjectsWithDetailsMandante = (mandanteId?: number) => {
  const [projects, setProjects] = useState<ProjectWithDetailsMandante[]>([]);
  const [mandante, setMandante] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && mandanteId) {
      fetchProjectsWithDetails();
    } else {
      setLoading(false);
    }
  }, [user, mandanteId]);

  const fetchProjectsWithDetails = async () => {
    if (!user || !mandanteId) return;

    try {
      setLoading(true);

      // Obtener el mandante usando el entity_id de user_roles
      const { data: mandanteData, error: mandanteError } = await supabase
        .from('Mandantes')
        .select('*')
        .eq('id', mandanteId)
        .single();

      if (mandanteError || !mandanteData) {
        console.warn('Mandante not found, continuing with mandanteId only:', mandanteId, mandanteError);
        setMandante(null);
      } else {
        setMandante(mandanteData);
      }

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
        .eq('Owner', mandanteId);

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
        console.log('No projects found for mandante:', mandanteId);
        setProjects([]);
        setLoading(false);
        return;
      }

      // Obtener estados de pago, adicionales y RFI para cada proyecto
      const projectsWithDetails = await Promise.all(
        projectsData.map(async (project) => {
          try {
            // Fetch payment states
            const { data: paymentStatesData, error: paymentStatesError } = await supabase
              .from('Estados de pago')
              .select('*')
              .eq('Project', project.id)
              .order('Año', { ascending: true })
              .order('Mes', { ascending: true });

            if (paymentStatesError) {
              console.error('Error fetching payment states for project:', project.id, paymentStatesError);
            }

            // Fetch adicionales
            const { data: adicionalesData, error: adicionalesError } = await supabase
              .from('Adicionales')
              .select('id, Status, Titulo, Monto_presentado, created_at')
              .eq('Proyecto', project.id);

            if (adicionalesError) {
              console.error('Error fetching adicionales for project:', project.id, adicionalesError);
            }

            // Fetch RFI
            const { data: rfiData, error: rfiError } = await supabase
              .from('RFI')
              .select('id, Status, Titulo, created_at')
              .eq('Proyecto', project.id);

            if (rfiError) {
              console.error('Error fetching RFI for project:', project.id, rfiError);
            }

            // Asegurar que al menos un estado sea "Pendiente" SOLO si hay pagos que vencen en 14 días o menos
            const hasAtLeastOnePendiente = paymentStatesData?.some(state => state.Status === 'Pendiente');
            
            if (!hasAtLeastOnePendiente && paymentStatesData && paymentStatesData.length > 0) {
              const today = new Date();
              const eligibleProgramados = paymentStatesData.filter(state => {
                if (state.Status !== 'Programado') return false;
                const expiry = new Date(state.ExpiryDate);
                const daysToExpiry = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
                return expiry >= today && daysToExpiry <= 14;
              });

              if (eligibleProgramados.length > 0) {
                eligibleProgramados.sort((a, b) =>
                  new Date(a.ExpiryDate).getTime() - new Date(b.ExpiryDate).getTime()
                );

                const targetProgramado = eligibleProgramados[0];
                const { error: updateError } = await supabase
                  .from('Estados de pago')
                  .update({ Status: 'Pendiente' })
                  .eq('id', targetProgramado.id);

                if (!updateError) {
                  targetProgramado.Status = 'Pendiente';
                }
              }
            }

            return {
              ...project,
              EstadosPago: paymentStatesData || [],
              Adicionales: adicionalesData || [],
              RFI: rfiData || []
            };
          } catch (error) {
            console.error('Error processing project:', project.id, error);
            return {
              ...project,
              EstadosPago: [],
              Adicionales: [],
              RFI: []
            };
          }
        })
      );

      setProjects(projectsWithDetails);
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