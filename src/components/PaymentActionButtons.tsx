
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PaymentActionButtonsProps {
  paymentId: number;
  status: string;
}

const PaymentActionButtons: React.FC<PaymentActionButtonsProps> = ({ paymentId, status }) => {
  const navigate = useNavigate();

  const handleManageDocuments = () => {
    navigate(`/payment/${paymentId}`);
  };

  const handleViewDocuments = () => {
    navigate(`/payment/${paymentId}`);
  };

  // Check if status is one of the completed states
  const isCompleted = status === 'Enviado' || status === 'Aprobado' || status === 'Rechazado';

  return (
    <div className="flex space-x-2">
      {isCompleted ? (
        <Button
          size="sm"
          onClick={handleViewDocuments}
          className="bg-blue-600 hover:bg-blue-700 text-white font-rubik"
        >
          <Eye className="h-4 w-4 mr-1" />
          Ver Documentos
        </Button>
      ) : (
        <Button
          size="sm"
          onClick={handleManageDocuments}
          className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
        >
          <FileText className="h-4 w-4 mr-1" />
          Gestionar Documentos
        </Button>
      )}
    </div>
  );
};

export default PaymentActionButtons;
