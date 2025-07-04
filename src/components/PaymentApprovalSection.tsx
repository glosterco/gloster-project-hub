
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, MessageSquare, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';

interface PaymentApprovalSectionProps {
  paymentId: string;
  paymentState: {
    month: string;
    amount: number;
    formattedAmount?: string;
    projectName: string;
  };
  onStatusChange?: () => void;
}

const PaymentApprovalSection: React.FC<PaymentApprovalSectionProps> = ({
  paymentId,
  paymentState,
  onStatusChange
}) => {
  const [loading, setLoading] = useState(false);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const { toast } = useToast();
  const { sendContractorNotification } = useEmailNotifications();

  const handleApprove = async () => {
    setLoading(true);
    try {
      console.log('🟢 Starting approval process for payment:', paymentId);

      // 1. Actualizar estado en la base de datos
      const { error: updateError } = await supabase
        .from('Estados de pago')
        .update({ 
          Status: 'Aprobado',
          Notes: `Aprobado el ${new Date().toLocaleString('es-CL')}`
        })
        .eq('id', parseInt(paymentId));

      if (updateError) {
        console.error('❌ Error updating payment status:', updateError);
        throw new Error('Error al actualizar el estado del pago');
      }

      console.log('✅ Payment status updated to Aprobado');

      // 2. Obtener datos completos para la notificación
      const { data: paymentData, error: fetchError } = await supabase
        .from('Estados de pago')
        .select(`
          *,
          projectData:Proyectos!Project (
            Name,
            Owner:Mandantes!Owner (
              CompanyName,
              ContactName,
              ContactEmail
            ),
            Contratista:Contratistas!Contratista (
              CompanyName,
              ContactName,
              ContactEmail
            )
          )
        `)
        .eq('id', parseInt(paymentId))
        .single();

      if (fetchError) {
        console.error('❌ Error fetching payment data for notification:', fetchError);
        throw new Error('Error al obtener datos para la notificación');
      }

      console.log('📧 Preparing contractor notification...');

      // 3. Enviar notificación al contratista
      if (paymentData.projectData?.Contratista?.ContactEmail) {
        const contractorNotificationData = {
          paymentId: paymentId,
          contractorEmail: paymentData.projectData.Contratista.ContactEmail,
          contractorName: paymentData.projectData.Contratista.ContactName || 'Contratista',
          contractorCompany: paymentData.projectData.Contratista.CompanyName || '',
          mandanteCompany: paymentData.projectData.Owner?.CompanyName || '',
          proyecto: paymentData.projectData.Name || '',
          mes: paymentData.Mes || '',
          año: paymentData.Año || new Date().getFullYear(),
          amount: paymentData.Total || 0,
          status: 'Aprobado' as const,
          platformUrl: `${window.location.origin}/payment/${paymentId}`,
        };

        console.log('📤 Sending approval notification to contractor:', contractorNotificationData.contractorEmail);
        
        const notificationResult = await sendContractorNotification(contractorNotificationData);
        
        if (!notificationResult.success) {
          console.warn('⚠️ Notification failed but continuing:', notificationResult.error);
          // No fallar todo el proceso si solo falla la notificación
        } else {
          console.log('✅ Contractor notification sent successfully');
        }
      } else {
        console.warn('⚠️ No contractor email found, skipping notification');
      }

      // 4. Mostrar éxito y actualizar UI
      toast({
        title: "Estado de pago aprobado",
        description: "El estado de pago ha sido aprobado exitosamente y se ha notificado al contratista.",
      });

      // 5. Actualizar la UI padre
      onStatusChange?.();
      
      console.log('✅ Approval process completed successfully');

    } catch (error) {
      console.error('❌ Error in approval process:', error);
      toast({
        title: "Error al aprobar",
        description: error.message || "Hubo un problema al aprobar el estado de pago.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Motivo requerido",
        description: "Por favor ingrese el motivo del rechazo.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🔴 Starting rejection process for payment:', paymentId);
      console.log('📝 Rejection reason:', rejectionReason);

      // 1. Actualizar estado y comentarios en la base de datos
      const rejectionNotes = `Rechazado el ${new Date().toLocaleString('es-CL')}: ${rejectionReason}`;
      
      const { error: updateError } = await supabase
        .from('Estados de pago')
        .update({ 
          Status: 'Rechazado',
          Notes: rejectionNotes
        })
        .eq('id', parseInt(paymentId));

      if (updateError) {
        console.error('❌ Error updating payment status:', updateError);
        throw new Error('Error al actualizar el estado del pago');
      }

      console.log('✅ Payment status updated to Rechazado with notes');

      // 2. Obtener datos completos para la notificación
      const { data: paymentData, error: fetchError } = await supabase
        .from('Estados de pago')
        .select(`
          *,
          projectData:Proyectos!Project (
            Name,
            Owner:Mandantes!Owner (
              CompanyName,
              ContactName,
              ContactEmail
            ),
            Contratista:Contratistas!Contratista (
              CompanyName,
              ContactName,
              ContactEmail
            )
          )
        `)
        .eq('id', parseInt(paymentId))
        .single();

      if (fetchError) {
        console.error('❌ Error fetching payment data for notification:', fetchError);
        throw new Error('Error al obtener datos para la notificación');
      }

      console.log('📧 Preparing contractor rejection notification...');

      // 3. Enviar notificación de rechazo al contratista
      if (paymentData.projectData?.Contratista?.ContactEmail) {
        const contractorNotificationData = {
          paymentId: paymentId,
          contractorEmail: paymentData.projectData.Contratista.ContactEmail,
          contractorName: paymentData.projectData.Contratista.ContactName || 'Contratista',
          contractorCompany: paymentData.projectData.Contratista.CompanyName || '',
          mandanteCompany: paymentData.projectData.Owner?.CompanyName || '',
          proyecto: paymentData.projectData.Name || '',
          mes: paymentData.Mes || '',
          año: paymentData.Año || new Date().getFullYear(),
          amount: paymentData.Total || 0,
          status: 'Rechazado' as const,
          rejectionReason: rejectionReason,
          platformUrl: `${window.location.origin}/payment/${paymentId}`,
        };

        console.log('📤 Sending rejection notification to contractor:', contractorNotificationData.contractorEmail);
        
        const notificationResult = await sendContractorNotification(contractorNotificationData);
        
        if (!notificationResult.success) {
          console.warn('⚠️ Notification failed but continuing:', notificationResult.error);
          // No fallar todo el proceso si solo falla la notificación
        } else {
          console.log('✅ Contractor rejection notification sent successfully');
        }
      } else {
        console.warn('⚠️ No contractor email found, skipping notification');
      }

      // 4. Mostrar éxito y limpiar formulario
      toast({
        title: "Estado de pago rechazado",
        description: "El estado de pago ha sido rechazado y se ha notificado al contratista.",
      });

      setShowRejectionForm(false);
      setRejectionReason('');
      
      // 5. Actualizar la UI padre
      onStatusChange?.();
      
      console.log('✅ Rejection process completed successfully');

    } catch (error) {
      console.error('❌ Error in rejection process:', error);
      toast({
        title: "Error al rechazar",
        description: error.message || "Hubo un problema al rechazar el estado de pago.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Revisión del Estado de Pago</h2>
        <p className="text-gray-600">
          Proyecto: <strong>{paymentState.projectName}</strong> | 
          Período: <strong>{paymentState.month}</strong> | 
          Monto: <strong>{paymentState.formattedAmount}</strong>
        </p>
      </div>

      {!showRejectionForm ? (
        <div className="flex space-x-4">
          <Button
            onClick={handleApprove}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {loading ? 'Aprobando...' : 'Aprobar Estado de Pago'}
          </Button>
          
          <Button
            onClick={() => setShowRejectionForm(true)}
            disabled={loading}
            variant="destructive"
            className="flex items-center"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Rechazar Estado de Pago
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="h-4 w-4 inline mr-1" />
              Motivo del rechazo
            </label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Ingrese el motivo del rechazo..."
              className="w-full"
              rows={4}
            />
          </div>
          
          <div className="flex space-x-4">
            <Button
              onClick={handleReject}
              disabled={loading || !rejectionReason.trim()}
              variant="destructive"
              className="flex items-center"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              {loading ? 'Rechazando...' : 'Confirmar Rechazo'}
            </Button>
            
            <Button
              onClick={() => {
                setShowRejectionForm(false);
                setRejectionReason('');
              }}
              disabled={loading}
              variant="outline"
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentApprovalSection;
