
import React from 'react';

interface PaymentInfoHeaderProps {
  projectName: string;
  month: string;
  formattedAmount: string;
}

const PaymentInfoHeader: React.FC<PaymentInfoHeaderProps> = ({
  projectName,
  month,
  formattedAmount
}) => {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-slate-800 mb-2">Revisión del Estado de Pago</h2>
      <p className="text-gray-600">
        Proyecto: <strong>{projectName}</strong> | 
        Período: <strong>{month}</strong> | 
        Monto: <strong>{formattedAmount}</strong>
      </p>
    </div>
  );
};

export default PaymentInfoHeader;
