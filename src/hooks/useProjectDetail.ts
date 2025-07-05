
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
    if (!projectId) return;
    
    setLoading(true);
    try {
      console.log('🔍 FETCHING PROJECT DETAIL - STRICTLY READ-ONLY MODE');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('❌ No authenticated user found');
        return;
      }

      // Get contractor data for current user - READ ONLY
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

      console.log('✅ Contractor found:', contractorData.CompanyName);

      // Fetch project details with relationships - STRICTLY READ-ONLY
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

      console.log('✅ Project found:', projectData.Name);

      // Fetch payment states - STRICTLY READ-ONLY, NO MODIFICATIONS EVER
      // Using proper table name with quotes to handle special characters
      console.log('🔍 Fetching payment states - PURE READ-ONLY MODE');
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

      console.log('✅ Payment states fetched (READ-ONLY):', paymentsData?.length || 0, 'records');
      
      // LOG EACH STATUS AS READ FROM DATABASE - NO MODIFICATIONS
      // Add safety check for paymentsData
      if (paymentsData && Array.isArray(paymentsData)) {
        paymentsData.forEach(payment => {
          if (payment && typeof payment === 'object' && 'Name' in payment && 'Status' in payment) {
            console.log(`📋 READ-ONLY: Payment "${payment.Name}" status: "${payment.Status}" (from database)`);
          }
        });
      }

      const projectWithDetails: ProjectDetail = {
        ...projectData,
        Contratista: projectData.Contratistas,
        Owner: projectData.Mandantes,
        EstadosPago: paymentsData || []
      };

      setProject(projectWithDetails);
      console.log('✅ Project detail loaded - ZERO MODIFICATIONS MADE');
      
    } catch (error) {
      console.error('❌ Unexpected error in fetchProjectDetail:', error);
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

  return {
    project,
    loading,
    refetch: fetchProjectDetail
  };
};
