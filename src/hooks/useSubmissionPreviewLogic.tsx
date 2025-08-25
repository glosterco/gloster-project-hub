
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
        if (user) {
          setIsProjectUser(true);
        } else {
          const contractorAccess = sessionStorage.getItem('contractorAccess');
          const mandanteAccess = sessionStorage.getItem('mandanteAccess');
          const accessInfo = contractorAccess
            ? JSON.parse(contractorAccess)
            : (mandanteAccess ? JSON.parse(mandanteAccess) : null);

          // Permitir acciones a contratistas con acceso por email
          setIsProjectUser(accessInfo?.userType === 'contratista');
        }
        setUserChecked(true);
      } catch (error) {
        console.error('Error checking user:', error);
        // Fallback: revisar acceso por email
        try {
          const contractorAccess = sessionStorage.getItem('contractorAccess');
          const accessInfo = contractorAccess ? JSON.parse(contractorAccess) : null;
          setIsProjectUser(accessInfo?.userType === 'contratista');
        } catch {}
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

      // Detectar acceso por email del contratista (sin auth_id) y usar función pública
      try {
        const contractorAccess = sessionStorage.getItem('contractorAccess');
        const mandanteAccess = sessionStorage.getItem('mandanteAccess');
        const accessInfo = contractorAccess
          ? JSON.parse(contractorAccess)
          : (mandanteAccess ? JSON.parse(mandanteAccess) : null);
        const accessToken = accessInfo?.accessToken;
        const userType = accessInfo?.userType;

        if (accessToken && userType === 'contratista') {
          const { data: fnData, error: fnError } = await supabase.functions.invoke('update-payment-detail-public', {
            body: {
              paymentId: payment.id,
              token: accessToken,
              amount: payment.Total,
              percentage: Math.round(payment.Progress || 0),
              markAsSent: true
            }
          });
          if (fnError || !fnData?.success) {
            throw fnError || new Error('No se pudo actualizar (función pública)');
          }
        } else {
          // Usuario autenticado: actualizar directamente e incluir cambio de estado si aplica
          const { data: directData, error: updateError } = await supabase
            .from('Estados de pago')
            .update({ 
              Total: payment.Total,
              Progress: payment.Progress,
              Status: 'Enviado'
            })
            .eq('id', payment.id)
            .select('*')
            .maybeSingle();

          if (updateError) throw updateError;
          if (!directData) throw new Error('Sin permisos para actualizar');
        }
      } catch (err) {
        console.warn('⚠️ Error updating payment data before sending:', err);
        toast({
          title: 'Error',
          description: 'No se pudo actualizar el monto o avance',
          variant: 'destructive'
        });
        setIsUploading(false);
        return;
      }

      // Refrescar los datos del payment después de la actualización
      const { data: updatedPayment, error: refreshError } = await supabase
        .from('Estados de pago')
        .select('*')
        .eq('id', payment.id)
        .single();

      if (refreshError) {
        console.warn('⚠️ Error refreshing payment data, continuing with current values:', refreshError);
      }

      // Usar el sistema de enlace único
      const accessUrl = await ensureUniqueAccessUrl(payment.id);
      if (!accessUrl) {
        throw new Error('No se pudo generar el enlace de acceso');
      }

      // Obtener URL del estado de pago con fallback público para acceso por email
      let driveUrl = '' as string;
      const { data: paymentStateData, error: paymentStateError } = await supabase
        .from('Estados de pago')
        .select('URL')
        .eq('id', payment.id)
        .maybeSingle();

      if (paymentStateData?.URL) {
        driveUrl = paymentStateData.URL;
      } else {
        console.warn('⚠️ Could not fetch URL directly, trying public function fallback...', paymentStateError);
        try {
          const contractorAccess = sessionStorage.getItem('contractorAccess');
          const mandanteAccess = sessionStorage.getItem('mandanteAccess');
          const accessInfo = contractorAccess ? JSON.parse(contractorAccess) : (mandanteAccess ? JSON.parse(mandanteAccess) : null);
          const accessToken = accessInfo?.accessToken;
          if (!accessToken) {
            throw new Error('No se encontró token de acceso');
          }
          const { data: publicData, error: publicError } = await supabase.functions.invoke('get-payment-detail-public', {
            body: { paymentId: payment.id, token: accessToken }
          });
          if (publicError) throw publicError;
          if (!publicData?.URL) throw new Error('No se pudo obtener la URL pública');
          driveUrl = publicData.URL;
        } catch (err) {
          console.error('Error fetching payment state URL (public fallback):', err);
          toast({
            title: 'Error',
            description: 'No se pudo obtener la URL del estado de pago',
            variant: 'destructive'
          });
          return;
        }
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
        amount: updatedPayment?.Total ?? payment.Total ?? 0, // Usar el valor actualizado si existe
        dueDate: payment.ExpiryDate || '',
        driveUrl: driveUrl,
        uploadedDocuments: [],
        currency: payment.projectData.Currency || 'CLP',
        accessUrl: accessUrl
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
