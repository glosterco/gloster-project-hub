
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PaymentDetail {
  id: number;
  Name: string;
  Mes: string;
  Año: number;
  Total: number;
  Progress: number;
  Status: string;
  ExpiryDate: string;
  Project: number;
  URL?: string;
  URLMandante?: string;
  Notes?: string;
  projectData?: {
    id: number;
    Name: string;
    Location: string;
    Budget?: number;
    Currency?: string;
    Owner?: {
      id: number;
      CompanyName: string;
      ContactName: string;
      ContactEmail: string;
      ContactPhone?: number;
    };
    Contratista?: {
      id: number;
      CompanyName: string;
      ContactName: string;
      ContactEmail: string;
      RUT?: string;
      ContactPhone?: number;
      Adress?: string;
    };
  };
}

export const usePaymentDetail = (paymentId: string, shouldRefetch = true) => {
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPaymentDetail = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching payment detail for ID:', paymentId);

      const { data: paymentData, error: paymentError } = await supabase
        .from('Estados de pago')
        .select(`
          *,
          projectData:Proyectos!Project (
            id,
            Name,
            Location,
            Budget,
            Currency,
            Owner:Mandantes!Owner (
              id,
              CompanyName,
              ContactName,
              ContactEmail,
              ContactPhone
            ),
            Contratista:Contratistas!Contratista (
              id,
              CompanyName,
              ContactName,
              ContactEmail,
              RUT,
              ContactPhone,
              Adress
            )
          )
        `)
        .eq('id', parseInt(paymentId))
        .maybeSingle();

      if (paymentError) {
        console.error('❌ Payment fetch error:', paymentError);
        throw paymentError;
      }

      if (!paymentData) {
        console.log('❌ No payment found for ID:', paymentId);
        setError('Estado de pago no encontrado');
        return;
      }

      console.log('✅ Payment data fetched successfully:', paymentData);
      
      // Ensure projectData is properly structured
      const processedPayment: PaymentDetail = {
        ...paymentData,
        projectData: paymentData.projectData ? {
          id: paymentData.projectData.id,
          Name: paymentData.projectData.Name || '',
          Location: paymentData.projectData.Location || '',
          Budget: paymentData.projectData.Budget || undefined,
          Currency: paymentData.projectData.Currency || undefined,
          Owner: paymentData.projectData.Owner ? {
            id: paymentData.projectData.Owner.id,
            CompanyName: paymentData.projectData.Owner.CompanyName || '',
            ContactName: paymentData.projectData.Owner.ContactName || '',
            ContactEmail: paymentData.projectData.Owner.ContactEmail || '',
            ContactPhone: paymentData.projectData.Owner.ContactPhone || undefined
          } : undefined,
          Contratista: paymentData.projectData.Contratista ? {
            id: paymentData.projectData.Contratista.id,
            CompanyName: paymentData.projectData.Contratista.CompanyName || '',
            ContactName: paymentData.projectData.Contratista.ContactName || '',
            ContactEmail: paymentData.projectData.Contratista.ContactEmail || '',
            RUT: paymentData.projectData.Contratista.RUT || '',
            ContactPhone: paymentData.projectData.Contratista.ContactPhone || undefined,
            Adress: paymentData.projectData.Contratista.Adress || ''
          } : undefined
        } : undefined
      };

      console.log('📊 Processed payment with contractor info:', {
        contractorName: processedPayment.projectData?.Contratista?.CompanyName,
        contactName: processedPayment.projectData?.Contratista?.ContactName,
        contactEmail: processedPayment.projectData?.Contratista?.ContactEmail,
        RUT: processedPayment.projectData?.Contratista?.RUT,
        phone: processedPayment.projectData?.Contratista?.ContactPhone,
        address: processedPayment.projectData?.Contratista?.Adress
      });

      setPayment(processedPayment);
      setError(null);
    } catch (err) {
      console.error('❌ Error fetching payment detail:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast({
        title: "Error",
        description: "No se pudo cargar el detalle del estado de pago",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    fetchPaymentDetail();
  };

  useEffect(() => {
    if (shouldRefetch) {
      fetchPaymentDetail();
    }
  }, [paymentId, shouldRefetch]);

  return { payment, loading, error, refetch };
};
