
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { usePaymentActions } from '@/hooks/usePaymentActions';

interface PaymentActionButtonsProps {
  paymentId: string;
  isMandante: boolean;
  onActionComplete?: () => void;
}

const PaymentActionButtons = ({ paymentId, isMandante, onActionComplete }: PaymentActionButtonsProps) => {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [comments, setComments] = useState('');
  const { approvePayment, rejectPayment, loading } = usePaymentActions();

  const handleApprove = async () => {
    const result = await approvePayment(paymentId);
    if (result.success && onActionComplete) {
      onActionComplete();
    }
  };

  const handleReject = async () => {
    if (!comments.trim()) {
      return;
    }
    const result = await rejectPayment(paymentId, comments);
    if (result.success) {
      setShowRejectForm(false);
      setComments('');
      if (onActionComplete) {
        onActionComplete();
      }
    }
  };

  if (!isMandante) {
    return null;
  }

  return (
    <Card className="border-gloster-gray/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 font-rubik text-lg">
          <MessageSquare className="h-5 w-5 text-gloster-gray" />
          <span>Acciones del Estado de Pago</span>
        </CardTitle>
        <CardDescription className="font-rubik">
          Como mandante, puedes aprobar o rechazar este estado de pago
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!showRejectForm ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleApprove}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white font-rubik flex-1"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {loading ? 'Procesando...' : 'Aprobar Estado de Pago'}
            </Button>
            <Button
              onClick={() => setShowRejectForm(true)}
              disabled={loading}
              variant="destructive"
              className="font-rubik flex-1"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Rechazar Estado de Pago
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 font-rubik">
                Comentarios de rechazo
              </label>
              <Textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Ingresa los motivos del rechazo..."
                className="min-h-[100px] font-rubik"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleReject}
                disabled={loading || !comments.trim()}
                variant="destructive"
                className="font-rubik flex-1"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {loading ? 'Enviando...' : 'Confirmar Rechazo'}
              </Button>
              <Button
                onClick={() => {
                  setShowRejectForm(false);
                  setComments('');
                }}
                disabled={loading}
                variant="outline"
                className="font-rubik flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaymentActionButtons;
