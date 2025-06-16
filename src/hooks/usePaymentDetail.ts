
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
  projectData?: {
    id: number;
    Name: string;
    Description: string;
    Location: string;
    Budget: number;
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
  };
}

export const usePaymentDetail = (paymentId: string) => {
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchPaymentDetail = async () => {
    if (!paymentId) return;
    
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found');
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
        return;
      }

      if (!contractorData) {
        console.log('No contractor found for current user');
        toast({
          title: "Acceso denegado",
          description: "No tienes un perfil de contratista válido",
          variant: "destructive",
        });
        return;
      }

      // Fetch payment state with project details
      const { data: paymentData, error: paymentError } = await supabase
        .from('Estados de pago')
        .select(`
          *,
          Proyectos (
            id,
            Name,
            Description,
            Location,
            Budget,
            Contratistas (
              id,
              CompanyName,
              ContactName,
              ContactEmail
            ),
            Mandantes (
              id,
              CompanyName,
              ContactName,
              ContactEmail
            )
          )
        `)
        .eq('id', parseInt(paymentId))
        .maybeSingle();

      if (paymentError) {
        console.error('Error fetching payment:', paymentError);
        toast({
          title: "Error al cargar estado de pago",
          description: paymentError.message,
          variant: "destructive",
        });
        return;
      }

      if (!paymentData) {
        toast({
          title: "Estado de pago no encontrado",
          description: "No se encontró el estado de pago solicitado",
          variant: "destructive",
        });
        return;
      }

      // Verify that this payment belongs to a project of the current contractor
      if (paymentData.Proyectos?.Contratistas?.id !== contractorData.id) {
        toast({
          title: "Acceso denegado",
          description: "No tienes acceso a este estado de pago",
          variant: "destructive",
        });
        return;
      }

      const paymentWithDetails = {
        ...paymentData,
        projectData: {
          ...paymentData.Proyectos,
          Contratista: paymentData.Proyectos.Contratistas,
          Owner: paymentData.Proyectos.Mandantes
        }
      };

      setPayment(paymentWithDetails);
      console.log('Payment detail loaded:', paymentWithDetails);
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error inesperado",
        description: "Hubo un error al cargar el estado de pago",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentDetail();
  }, [paymentId]);

  return {
    payment,
    loading,
    refetch: fetchPaymentDetail
  };
};
