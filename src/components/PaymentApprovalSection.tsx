
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { usePaymentActions } from '@/hooks/usePaymentActions';

interface PaymentApprovalSectionProps {
  paymentId: string;
  paymentState: {
    month: string;
    amount: number;
    projectName: string;
  };
  disabled?: boolean;
  onStatusChange?: () => void;
}

const PaymentApprovalSection: React.FC<PaymentApprovalSectionProps> = ({ 
  paymentId,
  paymentState, 
  disabled = false,
  onStatusChange
}) => {
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [rejectionComments, setRejectionComments] = useState('');
  const { approvePayment, rejectPayment, loading } = usePaymentActions();

  const handleApprove = async () => {
    if (disabled || loading) return;
    
    console.log('🟢 Aprobando estado de pago:', paymentId);
    const result = await approvePayment(paymentId);
    
    if (result.success) {
      setApprovalStatus('approved');
      if (onStatusChange) onStatusChange();
    }
  };

  const handleReject = () => {
    if (disabled || loading) return;
    setApprovalStatus('rejected');
  };

  const handleSubmitRejection = async () => {
    if (disabled || loading || !rejectionComments.trim()) return;
    
    console.log('🔴 Rechazando estado de pago:', paymentId, 'con comentarios:', rejectionComments);
    const result = await rejectPayment(paymentId, rejectionComments);
    
    if (result.success) {
      if (onStatusChange) onStatusChange();
    }
  };

  if (disabled) {
    return (
      <Card className="border-l-4 border-l-gray-300 bg-gray-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <MessageSquare className="h-6 w-6 text-gray-400" />
            <div>
              <p className="font-semibold text-gray-600 font-rubik">Acciones Deshabilitadas</p>
              <p className="text-gray-500 text-sm font-rubik">
                Las acciones de aprobación están deshabilitadas en esta vista
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (approvalStatus === 'approved') {
    return (
      <Card className="border-l-4 border-l-green-500 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-800 font-rubik">Estado de Pago Aprobado</p>
              <p className="text-green-600 text-sm font-rubik">
                El estado de pago de {paymentState.month} ha sido aprobado exitosamente
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (approvalStatus === 'rejected') {
    return (
      <Card className="border-l-4 border-l-red-500 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 font-rubik text-red-800">
            <XCircle className="h-5 w-5 text-red-600" />
            <span>Estado de Pago Rechazado</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-red-600 text-sm font-rubik">
            Por favor, proporcione los comentarios sobre el rechazo del estado de pago:
          </p>
          <Textarea
            placeholder="Ingrese los motivos del rechazo y las correcciones necesarias..."
            value={rejectionComments}
            onChange={(e) => setRejectionComments(e.target.value)}
            className="min-h-[100px] border-red-200 focus:border-red-400"
          />
          <div className="flex space-x-3">
            <Button
              onClick={handleSubmitRejection}
              variant="destructive"
              disabled={!rejectionComments.trim() || loading}
              className="font-rubik"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              {loading ? 'Enviando...' : 'Enviar Comentarios'}
            </Button>
            <Button
              onClick={() => setApprovalStatus('pending')}
              variant="outline"
              className="font-rubik"
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-gloster-yellow bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 font-rubik text-slate-800">
          <MessageSquare className="h-5 w-5 text-gloster-gray" />
          <span>Aprobación del Estado de Pago</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-gloster-gray font-rubik">
          Como mandante, puede aprobar o rechazar este estado de pago de <strong>{paymentState.month}</strong>
        </p>
        <div className="flex space-x-3">
          <Button
            onClick={handleApprove}
            className="bg-green-600 hover:bg-green-700 text-white font-rubik"
            disabled={loading}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {loading ? 'Aprobando...' : 'Aprobar Estado de Pago'}
          </Button>
          <Button
            onClick={handleReject}
            variant="destructive"
            className="font-rubik"
            disabled={loading}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Rechazar Estado de Pago
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentApprovalSection;
