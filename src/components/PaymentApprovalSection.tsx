import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react';

interface PaymentApprovalSectionProps {
  paymentState: {
    month: string;
    amount: number;
    projectName: string;
  };
  disabled?: boolean;
}

const PaymentApprovalSection: React.FC<PaymentApprovalSectionProps> = ({ paymentState, disabled = false }) => {
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [rejectionComments, setRejectionComments] = useState('');

  const handleApprove = () => {
    if (disabled) return;
    setApprovalStatus('approved');
    console.log(`Estado de pago ${paymentState.month} aprobado`);
  };

  const handleReject = () => {
    if (disabled) return;
    setApprovalStatus('rejected');
  };

  const handleSubmitRejection = () => {
    if (disabled) return;
    console.log(`Estado de pago ${paymentState.month} rechazado con comentarios:`, rejectionComments);
    // Aquí se enviarían los comentarios al sistema
  };

  if (disabled) {
    return (
      <Card className="border-l-4 border-l-gray-300 bg-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 font-rubik text-gray-500">
            <MessageSquare className="h-5 w-5 text-gray-400" />
            <span>Acciones del Estado de Pago (Solo vista previa)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 font-rubik text-sm">
            Esta es una vista previa. Las acciones de aprobación están disponibles en la vista de revisión.
          </p>
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
              disabled={!rejectionComments.trim()}
              className="font-rubik"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Enviar Comentarios
            </Button>
            <Button
              onClick={() => setApprovalStatus('pending')}
              variant="outline"
              className="font-rubik"
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
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Aprobar Estado de Pago
          </Button>
          <Button
            onClick={handleReject}
            variant="destructive"
            className="font-rubik"
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
