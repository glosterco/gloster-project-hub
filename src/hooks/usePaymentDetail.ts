
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PaymentDetail {
  id: number;
  Name: string;
  Status: string;
  Total: number | null;
  ExpiryDate: string;
  Completion: boolean;
  Mes: string;
  Año: number;
  Project: number;
  Progress: number | null;
  projectData?: {
    id: number;
    Name: string;
    Description: string;
    Location: string;
    Budget: number;
    Currency: string;
    StartDate: string;
    Duration: number;
    Requierment?: string[] | null;
    Contratista: {
      id: number;
      CompanyName: string;
      ContactName: string;
      ContactEmail: string;
      RUT: string;
      ContactPhone: number;
      Adress: string;
    };
    Owner: {
      id: number;
      CompanyName: string;
      ContactName: string;
      ContactEmail: string;
    };
  };
}

export const usePaymentDetail = (paymentId: string, requireAuth: boolean = true) => {
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPaymentDetail = async () => {
    if (!paymentId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching payment detail for ID:', paymentId);
      
      if (requireAuth) {
        // Get current user only if auth is required
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          console.log('No authenticated user found');
          setError('Usuario no autenticado');
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
          setError('Error al obtener datos del contratista');
          return;
        }

        if (!contractorData) {
          console.log('No contractor found for current user');
          setError('No tienes un perfil de contratista válido');
          return;
        }

        // First fetch the payment state
        const { data: paymentData, error: paymentError } = await supabase
          .from('Estados de pago')
          .select('*')
          .eq('id', parseInt(paymentId))
          .maybeSingle();

        if (paymentError) {
          console.error('Error fetching payment:', paymentError);
          setError('Error al cargar estado de pago');
          return;
        }

        if (!paymentData) {
          console.log('Payment not found for ID:', paymentId);
          setError('Estado de pago no encontrado');
          return;
        }

        console.log('Payment data found:', paymentData);

        // Now fetch the project details with complete contractor information
        const { data: projectData, error: projectError } = await supabase
          .from('Proyectos')
          .select(`
            *,
            Contratistas!Proyectos_Contratista_fkey (
              id,
              CompanyName,
              ContactName,
              ContactEmail,
              RUT,
              ContactPhone,
              Adress
            ),
            Mandantes!Proyectos_Owner_fkey (
              id,
              CompanyName,
              ContactName,
              ContactEmail
            )
          `)
          .eq('id', paymentData.Project)
          .maybeSingle();

        if (projectError) {
          console.error('Error fetching project:', projectError);
          setError('Error al cargar proyecto');
          return;
        }

        if (!projectData) {
          setError('Proyecto no encontrado');
          return;
        }

        // Verify that this payment belongs to a project of the current contractor
        if (projectData.Contratistas?.id !== contractorData.id) {
          setError('No tienes acceso a este estado de pago');
          return;
        }

        const paymentWithDetails = {
          ...paymentData,
          projectData: {
            ...projectData,
            Contratista: projectData.Contratistas,
            Owner: projectData.Mandantes
          }
        };

        setPayment(paymentWithDetails);
        console.log('Payment detail loaded successfully:', paymentWithDetails);
      } else {
        // No auth required - just fetch the data
        // First fetch the payment state
        const { data: paymentData, error: paymentError } = await supabase
          .from('Estados de pago')
          .select('*')
          .eq('id', parseInt(paymentId))
          .maybeSingle();

        if (paymentError) {
          console.error('Error fetching payment:', paymentError);
          setError('Error al cargar estado de pago');
          return;
        }

        if (!paymentData) {
          console.log('Payment not found for ID:', paymentId);
          setError('Estado de pago no encontrado');
          return;
        }

        console.log('Payment data found:', paymentData);

        // Now fetch the project details with complete contractor information
        const { data: projectData, error: projectError } = await supabase
          .from('Proyectos')
          .select(`
            *,
            Contratistas!Proyectos_Contratista_fkey (
              id,
              CompanyName,
              ContactName,
              ContactEmail,
              RUT,
              ContactPhone,
              Adress
            ),
            Mandantes!Proyectos_Owner_fkey (
              id,
              CompanyName,
              ContactName,
              ContactEmail
            )
          `)
          .eq('id', paymentData.Project)
          .maybeSingle();

        if (projectError) {
          console.error('Error fetching project:', projectError);
          setError('Error al cargar proyecto');
          return;
        }

        if (!projectData) {
          setError('Proyecto no encontrado');
          return;
        }

        const paymentWithDetails = {
          ...paymentData,
          projectData: {
            ...projectData,
            Contratista: projectData.Contratistas,
            Owner: projectData.Mandantes
          }
        };

        setPayment(paymentWithDetails);
        console.log('Payment detail loaded successfully:', paymentWithDetails);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setError('Error inesperado al cargar el estado de pago');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentDetail();
  }, [paymentId, requireAuth]);

  return {
    payment,
    loading,
    error,
    refetch: fetchPaymentDetail
  };
};
