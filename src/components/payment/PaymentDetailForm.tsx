
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface PaymentDetailFormProps {
  total: string;
  progress: string;
  onTotalChange: (value: string) => void;
  onProgressChange: (value: string) => void;
  onSave: () => void;
  hasUnsavedChanges: boolean;
  isUpdating: boolean;
}

const PaymentDetailForm: React.FC<PaymentDetailFormProps> = ({
  total,
  progress,
  onTotalChange,
  onProgressChange,
  onSave,
  hasUnsavedChanges,
  isUpdating
}) => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Información del Estado de Pago</h2>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="total">Monto Total *</Label>
          <Input
            id="total"
            type="number"
            value={total}
            onChange={(e) => onTotalChange(e.target.value)}
            placeholder="Ingrese el monto total"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="progress">Progreso (%) *</Label>
          <Input
            id="progress"
            type="number"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => onProgressChange(e.target.value)}
            placeholder="Ingrese el porcentaje de progreso"
            className="mt-1"
          />
        </div>

        <div className="pt-4">
          <Button
            onClick={onSave}
            disabled={!hasUnsavedChanges || isUpdating}
            className="w-full"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default PaymentDetailForm;
