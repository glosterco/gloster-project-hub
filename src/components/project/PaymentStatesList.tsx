
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/utils/currencyUtils';
import { PaymentState } from '@/hooks/useProjectDetail';

interface PaymentStatesListProps {
  payments: PaymentState[];
  projectCurrency?: string;
}

const PaymentStatesList: React.FC<PaymentStatesListProps> = ({ payments, projectCurrency }) => {
  const navigate = useNavigate();

  const getPaymentStatusBadge = (status: string | null) => {
    const realStatus = status || 'programado';
    
    switch (realStatus.toLowerCase()) {
      case 'aprobado':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aprobado</Badge>;
      case 'rechazado':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rechazado</Badge>;
      case 'enviado':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Enviado</Badge>;
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>;
      case 'programado':
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Programado</Badge>;
    }
  };

  const getActionButton = (payment: PaymentState) => {
    const status = payment.Status?.toLowerCase() || 'programado';
    
    switch (status) {
      case 'programado':
      case 'pendiente':
        return (
          <Button
            size="sm"
            onClick={() => navigate(`/payment/${payment.id}`)}
            className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black"
          >
            <FileText className="h-4 w-4 mr-2" />
            Completar
          </Button>
        );
      case 'enviado':
      case 'aprobado':
      case 'rechazado':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/submission?paymentId=${payment.id}`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalles
          </Button>
        );
      default:
        return (
          <Button
            size="sm"
            onClick={() => navigate(`/payment/${payment.id}`)}
            className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black"
          >
            <FileText className="h-4 w-4 mr-2" />
            Gestionar
          </Button>
        );
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Estados de Pago</h2>
      <div className="space-y-4">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">{payment.Name}</h3>
                {getPaymentStatusBadge(payment.Status)}
              </div>
              <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600">
                <span>{payment.Mes} {payment.Año}</span>
                <span>•</span>
                <span>{formatCurrency(payment.Total || 0, projectCurrency)}</span>
                {payment.ExpiryDate && (
                  <>
                    <span>•</span>
                    <span>Vence: {payment.ExpiryDate}</span>
                  </>
                )}
              </div>
            </div>
            <div className="ml-4">
              {getActionButton(payment)}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default PaymentStatesList;
