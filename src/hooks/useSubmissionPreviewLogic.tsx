
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useMandanteNotification } from '@/hooks/useMandanteNotification';
import { useUniqueAccessUrl } from '@/hooks/useUniqueAccessUrl';
import { supabase } from '@/integrations/supabase/client';
import { PaymentDetail } from '@/hooks/usePaymentDetail';

export const useSubmissionPreviewLogic = (payment: PaymentDetail | null) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sendNotificationToMandante, loading: notificationLoading } = useMandanteNotification();
  const { ensureUniqueAccessUrl } = useUniqueAccessUrl();
  
  const [isProjectUser, setIsProjectUser] = useState(false);
  const [userChecked, setUserChecked] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [documentsUploaded, setDocumentsUploaded] = useState(false);
  const [notificationSent, setNotificationSent] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      if (userChecked) return;
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsProjectUser(!!user);
        setUserChecked(true);
      } catch (error) {
        console.error('Error checking user:', error);
        setIsProjectUser(false);
        setUserChecked(true);
      }
    };
    
    checkUser();
  }, [userChecked]);

  // Auto-upload documents when preview loads
  useEffect(() => {
    const autoUploadDocuments = async () => {
      if (!payment || !isProjectUser || documentsUploaded || !payment?.URL) return;
      
      console.log('🔄 Auto-uploading documents for preview...');
      setDocumentsUploaded(true);
    };

    if (payment && isProjectUser && !documentsUploaded) {
      autoUploadDocuments();
    }
  }, [payment, isProjectUser, documentsUploaded]);

  const handleSendEmail = async () => {
    if (!payment || !payment.projectData) {
      toast({
        title: "Error",
        description: "No se pueden cargar los datos del estado de pago",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    console.log('🚀 Starting notification process...');

    try {
      // CRÍTICO: Actualizar PRIMERO el Total y Progress en la base de datos antes de enviar
      console.log('💾 Updating payment amount and progress with current values:', { Total: payment.Total, Progress: payment.Progress });
      
      // Asegurar que usamos los valores actuales del payment
      const { error: updateError } = await supabase
        .from('Estados de pago')
        .update({ 
          Total: payment.Total,
          Progress: payment.Progress,
          Status: 'Enviado'
        })
        .eq('id', payment.id);

      if (updateError) {
        console.error('❌ Error updating payment data:', updateError);
        throw new Error('Error al actualizar los datos del estado de pago');
      }

      // Refrescar los datos del payment después de la actualización
      const { data: updatedPayment, error: refreshError } = await supabase
        .from('Estados de pago')
        .select('*')
        .eq('id', payment.id)
        .single();

      if (refreshError) {
        console.error('❌ Error refreshing payment data:', refreshError);
        throw new Error('Error al refrescar los datos del estado de pago');
      }

      // Usar el sistema de enlace único
      const accessUrl = await ensureUniqueAccessUrl(payment.id);
      if (!accessUrl) {
        throw new Error('No se pudo generar el enlace de acceso');
      }

      const { data: paymentStateData, error: paymentStateError } = await supabase
        .from('Estados de pago')
        .select('URL')
        .eq('id', payment.id)
        .single();

      if (paymentStateError) {
        console.error('Error fetching payment state URL:', paymentStateError);
        toast({
          title: "Error",
          description: "No se pudo obtener la URL del estado de pago",
          variant: "destructive"
        });
        return;
      }

      const notificationData = {
        paymentId: payment.id.toString(),
        contratista: payment.projectData.Contratista?.ContactName || '',
        mes: payment.Mes || '',
        año: payment.Año || 0,
        proyecto: payment.projectData.Name || '',
        mandanteEmail: payment.projectData.Owner?.ContactEmail || '',
        mandanteCompany: payment.projectData.Owner?.CompanyName || '',
        contractorCompany: payment.projectData.Contratista?.CompanyName || '',
        amount: updatedPayment.Total || payment.Total || 0, // Usar el valor actualizado
        dueDate: payment.ExpiryDate || '',
        driveUrl: paymentStateData.URL || '',
        uploadedDocuments: [],
        currency: payment.projectData.Currency || 'CLP'
      };

      const result = await sendNotificationToMandante(notificationData);
      
      if (result.success) {
        setNotificationSent(true);
        toast({
          title: "Notificación enviada exitosamente",
          description: "Se ha enviado la notificación al mandante y actualizado el estado",
        });
        
        setTimeout(() => {
          navigate(`/project/${payment?.Project || 2}`);
        }, 2000);
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast({
        title: "Error",
        description: error.message || "Error al procesar la solicitud",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return {
    isProjectUser,
    userChecked,
    isUploading,
    notificationSent,
    notificationLoading,
    handleSendEmail
  };
};
