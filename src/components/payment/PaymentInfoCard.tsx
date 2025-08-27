
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar, Save } from 'lucide-react';
import { PaymentDetail } from '@/hooks/usePaymentDetail';

interface PaymentInfoCardProps {
  payment: PaymentDetail;
  editableAmount: string;
  editablePercentage: string;
  isSaving: boolean;
  shouldShowDriveFiles: boolean;
  isAmountValid: boolean;
  isProgressValid: boolean;
  onAmountChange: (value: string) => void;
  onPercentageChange: (value: string) => void;
  onSaveAmount: () => void;
  formatCurrency: (amount: number) => string;
  shouldShowValidationErrors: boolean;
}

const PaymentInfoCard: React.FC<PaymentInfoCardProps> = ({
  payment,
  editableAmount,
  editablePercentage,
  isSaving,
  shouldShowDriveFiles,
  isAmountValid,
  isProgressValid,
  onAmountChange,
  onPercentageChange,
  onSaveAmount,
  formatCurrency,
  shouldShowValidationErrors
}) => {
  const paymentState = {
    id: payment.id,
    month: `${payment.Mes} ${payment.Año}`,
    status: payment.Status || "pendiente",
    amount: payment.Total || 0,
    dueDate: payment.ExpiryDate,
    projectName: payment.projectData?.Name || "",
    recipient: payment.projectData?.Owner?.ContactEmail || ""
  };

  // Verificar si debe mostrar campos editables basado en el status
  const shouldShowEditableFields = shouldShowDriveFiles && ['Pendiente', 'Rechazado'].includes(payment.Status || '');

  return (
    <Card className="border-l-4 border-l-gloster-yellow hover:shadow-xl transition-all duration-300 h-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-12 h-12 bg-gloster-yellow/20 rounded-lg flex items-center justify-center shrink-0">
              <Calendar className="h-6 w-6 text-gloster-gray" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-xl md:text-2xl mb-2 font-rubik text-slate-800">{paymentState.month}</CardTitle>
              <CardDescription className="text-gloster-gray font-rubik text-sm md:text-base">
                {paymentState.projectName}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-gloster-gray/20 text-gloster-gray border-gloster-gray/30 self-start shrink-0">
            {paymentState.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-gloster-gray text-sm font-rubik mb-2">Monto del Estado</p>
            {shouldShowEditableFields ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gloster-gray">{payment?.projectData?.Currency || 'CLP'}</span>
                <Input
                  type="number"
                  value={editableAmount}
                  onChange={(e) => onAmountChange(e.target.value)}
                  placeholder="Ingrese monto"
                  className={`w-40 ${shouldShowValidationErrors && !isAmountValid ? 'border-orange-500 focus:border-orange-500' : ''}`}
                />
              </div>
            ) : (
              <p className="font-bold text-lg md:text-xl text-slate-800 font-rubik break-words">
                {formatCurrency(paymentState.amount)}
              </p>
            )}
          </div>
          <div>
            <p className="text-gloster-gray text-sm font-rubik mb-2">% Avance Financiero</p>
            {shouldShowEditableFields ? (
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={editablePercentage}
                  onChange={(e) => onPercentageChange(e.target.value)}
                  placeholder="0"
                  className={`w-20 ${shouldShowValidationErrors && !isProgressValid ? 'border-orange-500 focus:border-orange-500' : ''}`}
                />
                <span className="text-sm text-gloster-gray">%</span>
              </div>
            ) : (
              <p className="font-semibold text-slate-800 font-rubik">
                {payment?.projectData?.Budget ? 
                  ((paymentState.amount / payment.projectData.Budget) * 100).toFixed(2) + '%' : 
                  'N/A'
                }
              </p>
            )}
          </div>
          <div>
            <p className="text-gloster-gray text-sm font-rubik">Fecha de Vencimiento</p>
            <p className="font-semibold text-slate-800 font-rubik">{paymentState.dueDate}</p>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <p className="text-gloster-gray text-sm font-rubik">Destinatario</p>
            <p className="font-semibold text-slate-800 font-rubik break-words">{paymentState.recipient}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentInfoCard;
