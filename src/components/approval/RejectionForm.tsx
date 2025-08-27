
import React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { XCircle, MessageSquare, Loader2 } from 'lucide-react';

interface RejectionFormProps {
  loading: boolean;
  rejectionReason: string;
  onReasonChange: (reason: string) => void;
  onConfirmReject: () => void;
  onCancel: () => void;
}

const RejectionForm: React.FC<RejectionFormProps> = ({
  loading,
  rejectionReason,
  onReasonChange,
  onConfirmReject,
  onCancel
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MessageSquare className="h-4 w-4 inline mr-1" />
          Motivo del rechazo
        </label>
        <Textarea
          value={rejectionReason}
          onChange={(e) => onReasonChange(e.target.value)}
          placeholder="Ingrese el motivo del rechazo..."
          className="w-full"
          rows={4}
        />
      </div>
      
      <div className="flex space-x-4">
        <Button
          onClick={onConfirmReject}
          disabled={loading || !rejectionReason.trim()}
          variant="destructive"
          className="flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <XCircle className="h-4 w-4 mr-2" />
          )}
          {loading ? 'Rechazando...' : 'Confirmar Rechazo'}
        </Button>
        
        <Button
          onClick={onCancel}
          disabled={loading}
          variant="outline"
          className="disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
};

export default RejectionForm;
