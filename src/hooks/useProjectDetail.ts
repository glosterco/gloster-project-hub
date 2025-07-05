
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
      console.log('🔒 ABSOLUTE READ-ONLY MODE - NO DATABASE MODIFICATIONS ALLOWED');
      console.log('📊 FETCH START - Project ID:', projectId, 'Time:', new Date().toISOString());
      
      // Get current user - READ ONLY
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('❌ No authenticated user found');
        return;
      }

      // Get contractor data - STRICTLY READ ONLY
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

      // Fetch project details - STRICTLY READ-ONLY
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

      // CRITICAL: Log exact timestamp before any DB operation
      const beforeQueryTime = new Date().toISOString();
      console.log('🕐 CRITICAL TIMESTAMP BEFORE PAYMENT QUERY:', beforeQueryTime);
      
      // ABSOLUTELY NO MODIFICATIONS - PURE SELECT ONLY
      console.log('🔍 EXECUTING PURE SELECT - NO MODIFICATIONS POSSIBLE');
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('Estados de pago')
        .select('id, Name, Status, Total, ExpiryDate, Completion, Mes, "Año"')
        .eq('Project', parseInt(projectId))
        .order('ExpiryDate', { ascending: true });

      const afterQueryTime = new Date().toISOString();
      console.log('🕐 CRITICAL TIMESTAMP AFTER PAYMENT QUERY:', afterQueryTime);

      if (paymentsError) {
        console.error('❌ Error fetching payment states:', paymentsError);
        toast({
          title: "Error al cargar estados de pago",
          description: paymentsError.message,
          variant: "destructive",
        });
        return;
      }

      console.log('✅ RAW PAYMENT DATA FROM DB:', JSON.stringify(paymentsData, null, 2));
      
      // CRITICAL: Verify each payment status exactly as received
      if (paymentsData && Array.isArray(paymentsData)) {
        console.log('🔍 PAYMENT STATUS VERIFICATION:');
        paymentsData.forEach((payment, index) => {
          if (payment && typeof payment === 'object' && 'Name' in payment && 'Status' in payment) {
            console.log(`📋 [${index}] "${payment.Name}" RAW STATUS: "${payment.Status}"`);
            console.log(`📋 [${index}] FULL PAYMENT OBJECT:`, JSON.stringify(payment, null, 2));
          }
        });
      }

      // Create project object with ZERO modifications
      const projectWithDetails: ProjectDetail = {
        ...projectData,
        Contratista: projectData.Contratistas,
        Owner: projectData.Mandantes,
        EstadosPago: paymentsData || []
      };

      // FINAL verification before setState
      console.log('🔍 FINAL PAYMENT VERIFICATION BEFORE setState:');
      projectWithDetails.EstadosPago.forEach((payment, index) => {
        console.log(`📋 [${index}] "${payment.Name}" FINAL STATUS: "${payment.Status}"`);
      });

      setProject(projectWithDetails);
      console.log('✅ Project loaded - ABSOLUTE ZERO DB MODIFICATIONS');
      console.log('🕐 FINAL COMPLETION TIMESTAMP:', new Date().toISOString());
      
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
    console.log('🕐 EFFECT START TIMESTAMP:', new Date().toISOString());
    fetchProjectDetail();
  }, [projectId]);

  return {
    project,
    loading,
    refetch: fetchProjectDetail
  };
};
