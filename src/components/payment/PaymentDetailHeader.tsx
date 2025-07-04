
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { PaymentDetail } from '@/hooks/usePaymentDetail';

interface PaymentDetailHeaderProps {
  payment: PaymentDetail;
  onBackClick: () => void;
}

const PaymentDetailHeader: React.FC<PaymentDetailHeaderProps> = ({
  payment,
  onBackClick
}) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'aprobado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rechazado':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'enviado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'programado':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="mb-6">
      <Button
        variant="ghost"
        onClick={onBackClick}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver al Proyecto
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 font-rubik">
            {payment.Name}
          </h1>
          <p className="text-slate-600 mt-2">
            {payment.Mes} {payment.Año} • Vencimiento: {payment.ExpiryDate}
          </p>
        </div>
        <div className={`px-4 py-2 rounded-full border font-medium ${getStatusColor(payment.Status || 'programado')}`}>
          {payment.Status || 'Programado'}
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailHeader;
