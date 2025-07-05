
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
      console.log('📊 DEBUG: Starting fetch for project ID:', projectId);
      
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

      // CRITICAL: Log timestamp before DB query
      console.log('🕐 TIMESTAMP BEFORE DB QUERY:', new Date().toISOString());
      
      // Fetch payment states - ABSOLUTELY NO MODIFICATIONS, PURE READ
      console.log('🔍 Fetching payment states - ZERO MODIFICATION MODE');
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('Estados de pago')
        .select('id, Name, Status, Total, ExpiryDate, Completion, Mes, "Año"')
        .eq('Project', parseInt(projectId))
        .order('ExpiryDate', { ascending: true });

      // CRITICAL: Log timestamp after DB query
      console.log('🕐 TIMESTAMP AFTER DB QUERY:', new Date().toISOString());

      if (paymentsError) {
        console.error('❌ Error fetching payment states:', paymentsError);
        toast({
          title: "Error al cargar estados de pago",
          description: paymentsError.message,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Payment states fetched (PURE READ):', paymentsData?.length || 0, 'records');
      
      // CRITICAL: Log each status EXACTLY as received from database
      if (paymentsData && Array.isArray(paymentsData)) {
        console.log('🔍 DETAILED PAYMENT STATUS ANALYSIS:');
        paymentsData.forEach((payment, index) => {
          if (payment && typeof payment === 'object' && 'Name' in payment && 'Status' in payment) {
            console.log(`📋 [${index}] DIRECT FROM DB: Payment "${payment.Name}" status: "${payment.Status}" (RAW VALUE)`);
            console.log(`📋 [${index}] FULL OBJECT:`, JSON.stringify(payment, null, 2));
          }
        });
      }

      // CRITICAL: Create project object WITHOUT any modifications
      const projectWithDetails: ProjectDetail = {
        ...projectData,
        Contratista: projectData.Contratistas,
        Owner: projectData.Mandantes,
        EstadosPago: paymentsData || []
      };

      // CRITICAL: Final verification before setting state
      console.log('🔍 FINAL VERIFICATION - EstadosPago before setState:');
      projectWithDetails.EstadosPago.forEach((payment, index) => {
        console.log(`📋 [${index}] FINAL CHECK: "${payment.Name}" status: "${payment.Status}"`);
      });

      setProject(projectWithDetails);
      console.log('✅ Project detail loaded - ZERO MODIFICATIONS CONFIRMED');
      console.log('🕐 FINAL TIMESTAMP:', new Date().toISOString());
      
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
    console.log('🕐 EFFECT START TIMESTAMP:', new Date().toISOString());
    fetchProjectDetail();
  }, [projectId]);

  return {
    project,
    loading,
    refetch: fetchProjectDetail
  };
};
