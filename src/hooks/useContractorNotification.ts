import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useContractorAccessUrl } from './useContractorAccessUrl';

export const useContractorNotification = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { ensureContractorAccessUrl } = useContractorAccessUrl();

  const sendContractorPaymentNotification = async (paymentId: string | number, isReminder: boolean = false) => {
    setLoading(true);
    
    try {
      const numericPaymentId = typeof paymentId === 'string' ? parseInt(paymentId, 10) : paymentId;
      
      if (isNaN(numericPaymentId)) {
        throw new Error('ID de pago inválido');
      }

      console.log('🔔 Enviando notificación de pago a contratista:', numericPaymentId);

      // Asegurar que existe la URL del contratista
      const contractorUrl = await ensureContractorAccessUrl(numericPaymentId);
      if (!contractorUrl) {
        throw new Error('No se pudo generar el enlace de acceso del contratista');
      }

      // Obtener datos del estado de pago
      const { data: paymentData, error: paymentError } = await supabase
        .from('Estados de pago')
        .select('"id", "Name", "Año", "Mes", "Total", "ExpiryDate", "Project"')
        .eq('id', numericPaymentId)
        .single();

      if (paymentError) {
        throw new Error('Error al obtener los datos del estado de pago');
      }

      // Obtener datos del proyecto
      const { data: projectData, error: projectError } = await supabase
        .from('Proyectos')
        .select(`
          id,
          "Name",
          "Currency",
          "Contratista",
          "Owner",
          Contratistas!inner (
            "ContactEmail",
            "ContactName",
            "CompanyName"
          ),
          Mandantes!inner (
            "CompanyName"
          )
        `)
        .eq('id', (paymentData as any)?.Project)
        .single();

      if (projectError) {
        console.error('Error fetching project data:', projectError);
        throw new Error('Error al obtener los datos del proyecto');
      }

      if (!paymentData || !projectData) {
        throw new Error('Estado de pago o proyecto no encontrado');
      }

      const contractor = projectData.Contratistas as any;
      const mandante = projectData.Mandantes as any;

      if (!contractor?.ContactEmail) {
        throw new Error('Email del contratista no encontrado');
      }

      // Preparar datos para la edge function
      const notificationData = {
        paymentId: numericPaymentId.toString(),
        contractorEmail: contractor.ContactEmail,
        contractorName: contractor.ContactName || 'Contratista',
        contractorCompany: contractor.CompanyName || 'Empresa',
        mandanteCompany: mandante.CompanyName || 'Mandante',
        proyecto: (projectData as any)?.Name || (paymentData as any)?.Name,
        mes: (paymentData as any)?.Mes || '',
        año: (paymentData as any)?.Año || new Date().getFullYear(),
        amount: (paymentData as any)?.Total || 0,
        dueDate: (paymentData as any)?.ExpiryDate || '',
        currency: (projectData as any)?.Currency || 'CLP',
        urlContratista: contractorUrl,
        isReminder
      };

      console.log('📧 Datos para envío de email:', notificationData);

      // Llamar a la edge function
      const { data, error } = await supabase.functions.invoke('send-contractor-payment', {
        body: notificationData
      });

      if (error) {
        console.error('Error calling edge function:', error);
        throw new Error(`Error al enviar la notificación: ${error.message}`);
      }

      console.log('✅ Notificación enviada exitosamente:', data);

      toast({
        title: "Notificación enviada",
        description: `Se ha enviado la notificación al contratista: ${contractor.ContactEmail}`,
      });

      return { success: true, data };

    } catch (error) {
      console.error('Error in sendContractorPaymentNotification:', error);
      toast({
        title: "Error",
        description: error.message || "Error al enviar la notificación al contratista",
        variant: "destructive"
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    sendContractorPaymentNotification,
    loading
  };
};