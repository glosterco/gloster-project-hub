
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Send } from 'lucide-react';

interface PaymentDetailActionsProps {
  canPreviewOrSend: boolean;
  onPreview: () => void;
  onSendToMandante: () => void;
}

const PaymentDetailActions: React.FC<PaymentDetailActionsProps> = ({
  canPreviewOrSend,
  onPreview,
  onSendToMandante
}) => {
  return (
    <div className="mt-8 flex space-x-4">
      <Button
        onClick={onPreview}
        disabled={!canPreviewOrSend}
        variant="outline"
        className="flex items-center"
      >
        <Eye className="h-4 w-4 mr-2" />
        Vista Previa
      </Button>
      
      <Button
        onClick={onSendToMandante}
        disabled={!canPreviewOrSend}
        className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black flex items-center"
      >
        <Send className="h-4 w-4 mr-2" />
        Enviar al Mandante
      </Button>
    </div>
  );
};

export default PaymentDetailActions;
