
import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ApprovalButtonsProps {
  loading: boolean;
  onApprove: () => void;
  onReject: () => void;
}

const ApprovalButtons: React.FC<ApprovalButtonsProps> = ({
  loading,
  onApprove,
  onReject
}) => {
  return (
    <div className="flex space-x-4">
      <Button
        onClick={onApprove}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 text-white flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <CheckCircle className="h-4 w-4 mr-2" />
        )}
        {loading ? 'Aprobando...' : 'Aprobar Estado de Pago'}
      </Button>
      
      <Button
        onClick={onReject}
        disabled={loading}
        variant="destructive"
        className="flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <XCircle className="h-4 w-4 mr-2" />
        Rechazar Estado de Pago
      </Button>
    </div>
  );
};

export default ApprovalButtons;
