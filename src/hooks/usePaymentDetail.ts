
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
    Requierment?: string[];
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

      // Verificar que paymentId sea válido
      const numericPaymentId = parseInt(paymentId);
      if (isNaN(numericPaymentId)) {
        throw new Error('ID de pago inválido');
      }

      // STEP 1: Obtener estado de pago básico primero
      const { data: paymentData, error: paymentError } = await supabase
        .from('Estados de pago')
        .select('*')
        .eq('id', numericPaymentId)
        .maybeSingle();

      if (paymentError || !paymentData) {
        console.warn('⚠️ Direct fetch failed or returned no data. Trying public token-based fetch...');
        try {
          const contractorAccess = sessionStorage.getItem('contractorAccess');
          const mandanteAccess = sessionStorage.getItem('mandanteAccess');
          const accessInfo = contractorAccess
            ? JSON.parse(contractorAccess)
            : (mandanteAccess ? JSON.parse(mandanteAccess) : null);
          const accessToken = accessInfo?.accessToken;

          if (accessToken) {
            const { data: publicData, error: publicError } = await supabase.functions.invoke('get-payment-detail-public', {
              body: { paymentId: numericPaymentId, token: accessToken }
            });

            if (publicError) {
              throw publicError;
            }

            if (publicData) {
              // Respuesta ya viene con projectData
              setPayment(publicData as any);
              setError(null);
              return;
            }
          }
        } catch (fallbackErr) {
          console.error('❌ Public token-based fetch failed:', fallbackErr);
        }

        // Si llegamos aquí, no pudimos obtener datos
        if (paymentError) {
          console.error('❌ Payment fetch error:', paymentError);
          throw paymentError;
        }
        console.log('❌ No payment found for ID:', paymentId);
        setError('Estado de pago no encontrado');
        return;
      }

      console.log('✅ Payment data fetched:', paymentData);

      // STEP 2: Obtener datos del proyecto por separado para evitar RLS issues
      let projectData = null;
      if (paymentData.Project) {
        const { data: project, error: projectError } = await supabase
          .from('Proyectos')
          .select('*')
          .eq('id', paymentData.Project)
          .maybeSingle();

        if (project && !projectError) {
          projectData = project;
          console.log('✅ Project data fetched:', projectData);
        } else {
          console.warn('⚠️ Could not fetch project data:', projectError);
        }
      }

      // STEP 3: Obtener datos del mandante si hay proyecto
      let ownerData = null;
      if (projectData?.Owner) {
        const { data: owner, error: ownerError } = await supabase
          .from('Mandantes')
          .select('*')
          .eq('id', projectData.Owner)
          .maybeSingle();

        if (owner && !ownerError) {
          ownerData = owner;
          console.log('✅ Owner data fetched:', ownerData);
        }
      }

      // STEP 4: Obtener datos del contratista si hay proyecto
      let contratistaData = null;
      if (projectData?.Contratista) {
        const { data: contratista, error: contratistaError } = await supabase
          .from('Contratistas')
          .select('*')
          .eq('id', projectData.Contratista)
          .maybeSingle();

        if (contratista && !contratistaError) {
          contratistaData = contratista;
          console.log('✅ Contratista data fetched:', contratistaData);
        }
      }

      // STEP 5: Construir el objeto completo
      const processedPayment: PaymentDetail = {
        ...paymentData,
        projectData: projectData ? {
          id: projectData.id,
          Name: projectData.Name || '',
          Location: projectData.Location || '',
          Budget: projectData.Budget || undefined,
          Currency: projectData.Currency || undefined,
          Requierment: projectData.Requierment || undefined,
          Owner: ownerData ? {
            id: ownerData.id,
            CompanyName: ownerData.CompanyName || '',
            ContactName: ownerData.ContactName || '',
            ContactEmail: ownerData.ContactEmail || '',
            ContactPhone: ownerData.ContactPhone || undefined
          } : undefined,
          Contratista: contratistaData ? {
            id: contratistaData.id,
            CompanyName: contratistaData.CompanyName || '',
            ContactName: contratistaData.ContactName || '',
            ContactEmail: contratistaData.ContactEmail || '',
            RUT: contratistaData.RUT || '',
            ContactPhone: contratistaData.ContactPhone || undefined
          } : undefined
        } : undefined
      };

      console.log('📊 Processed payment with contractor info:', {
        contractorName: processedPayment.projectData?.Contratista?.CompanyName,
        contactName: processedPayment.projectData?.Contratista?.ContactName,
        contactEmail: processedPayment.projectData?.Contratista?.ContactEmail,
        RUT: processedPayment.projectData?.Contratista?.RUT,
        phone: processedPayment.projectData?.Contratista?.ContactPhone,
        requirements: processedPayment.projectData?.Requierment
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
