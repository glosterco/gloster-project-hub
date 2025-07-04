
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar, Save } from 'lucide-react';

interface PaymentInfoSectionProps {
  paymentState: {
    month: string;
    projectName: string;
    status: string;
    amount: number;
    dueDate: string;
    recipient: string;
  };
  shouldShowDriveFiles: boolean;
  editableAmount: string;
  editablePercentage: string;
  isSaving: boolean;
  currency?: string;
  budget?: number;
  onAmountChange: (value: string) => void;
  onPercentageChange: (value: string) => void;
  onSaveAmount: () => void;
  formatCurrency: (amount: number) => string;
}

const PaymentInfoSection: React.FC<PaymentInfoSectionProps> = ({
  paymentState,
  shouldShowDriveFiles,
  editableAmount,
  editablePercentage,
  isSaving,
  currency,
  budget,
  onAmountChange,
  onPercentageChange,
  onSaveAmount,
  formatCurrency,
}) => {
  return (
    <Card className="border-l-4 border-l-gloster-yellow hover:shadow-xl transition-all duration-300 h-full">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <div className="w-12 h-12 bg-gloster-yellow/20 rounded-lg flex items-center justify-center shrink-0">
              <Calendar className="h-6 w-6 text-gloster-gray" />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-xl md:text-2xl mb-2 font-rubik text-slate-800">
                {paymentState.month}
              </CardTitle>
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
            {shouldShowDriveFiles ? (
              <p className="font-bold text-lg md:text-xl text-slate-800 font-rubik break-words">
                {formatCurrency(paymentState.amount)}
              </p>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gloster-gray">{currency || 'CLP'}</span>
                <Input
                  type="number"
                  value={editableAmount}
                  onChange={(e) => onAmountChange(e.target.value)}
                  placeholder="Ingrese monto"
                  className="w-40"
                />
                <Button
                  size="sm"
                  onClick={onSaveAmount}
                  disabled={isSaving}
                  className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black"
                >
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div>
            <p className="text-gloster-gray text-sm font-rubik mb-2">% Avance Financiero</p>
            {shouldShowDriveFiles ? (
              <p className="font-semibold text-slate-800 font-rubik">
                {budget ? 
                  ((paymentState.amount / budget) * 100).toFixed(2) + '%' : 
                  'N/A'
                }
              </p>
            ) : (
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={editablePercentage}
                  onChange={(e) => onPercentageChange(e.target.value)}
                  placeholder="0"
                  className="w-20"
                />
                <span className="text-sm text-gloster-gray">%</span>
              </div>
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

export default PaymentInfoSection;
