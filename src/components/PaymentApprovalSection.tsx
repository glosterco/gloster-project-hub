
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react';
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
      console.log('🟢 Approving payment:', paymentId);

      // Update payment status
      const { error: updateError } = await supabase
        .from('Estados de pago')
        .update({ Status: 'Aprobado' })
        .eq('id', paymentId);

      if (updateError) {
        console.error('Error updating payment status:', updateError);
        throw updateError;
      }

      // Get payment and contractor details for notification
      const { data: paymentData, error: fetchError } = await supabase
        .from('Estados de pago')
        .select(`
          *,
          projectData:Proyectos!Project (
            Name,
            Owner:Mandantes!Owner (
              CompanyName
            ),
            Contratista:Contratistas!Contratista (
              CompanyName,
              ContactName,
              ContactEmail
            )
          )
        `)
        .eq('id', paymentId)
        .single();

      if (fetchError) {
        console.error('Error fetching payment data:', fetchError);
        throw fetchError;
      }

      // Send notification to contractor
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

        await sendContractorNotification(contractorNotificationData);
      }

      toast({
        title: "Estado de pago aprobado",
        description: "El estado de pago ha sido aprobado exitosamente y se ha notificado al contratista.",
      });

      onStatusChange?.();
    } catch (error) {
      console.error('Error approving payment:', error);
      toast({
        title: "Error al aprobar",
        description: "Hubo un problema al aprobar el estado de pago.",
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
      console.log('🔴 Rejecting payment:', paymentId, 'Reason:', rejectionReason);

      // Update payment status with rejection reason
      const { error: updateError } = await supabase
        .from('Estados de pago')
        .update({ 
          Status: 'Rechazado',
          Notes: rejectionReason
        })
        .eq('id', paymentId);

      if (updateError) {
        console.error('Error updating payment status:', updateError);
        throw updateError;
      }

      // Get payment and contractor details for notification
      const { data: paymentData, error: fetchError } = await supabase
        .from('Estados de pago')
        .select(`
          *,
          projectData:Proyectos!Project (
            Name,
            Owner:Mandantes!Owner (
              CompanyName
            ),
            Contratista:Contratistas!Contratista (
              CompanyName,
              ContactName,
              ContactEmail
            )
          )
        `)
        .eq('id', paymentId)
        .single();

      if (fetchError) {
        console.error('Error fetching payment data:', fetchError);
        throw fetchError;
      }

      // Send notification to contractor
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

        await sendContractorNotification(contractorNotificationData);
      }

      toast({
        title: "Estado de pago rechazado",
        description: "El estado de pago ha sido rechazado y se ha notificado al contratista.",
      });

      setShowRejectionForm(false);
      setRejectionReason('');
      onStatusChange?.();
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast({
        title: "Error al rechazar",
        description: "Hubo un problema al rechazar el estado de pago.",
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
            <CheckCircle className="h-4 w-4 mr-2" />
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
              <XCircle className="h-4 w-4 mr-2" />
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
