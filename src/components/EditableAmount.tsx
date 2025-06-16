
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit, Check, X } from 'lucide-react';

interface EditableAmountProps {
  amount: number | null;
  currency?: string;
  onSave: (newAmount: number) => void;
  disabled?: boolean;
}

export const EditableAmount = ({ amount, currency = 'CLP', onSave, disabled = false }: EditableAmountProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(amount?.toString() || '');

  const formatCurrency = (value: number | null) => {
    if (!value) return 'Sin monto definido';
    
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      }).format(value);
    } else if (currency === 'UF') {
      return `${value.toLocaleString('es-CL')} UF`;
    } else {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
      }).format(value);
    }
  };

  const handleSave = () => {
    const numericValue = parseInt(editValue.replace(/\D/g, ''));
    if (!isNaN(numericValue) && numericValue > 0) {
      onSave(numericValue);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(amount?.toString() || '');
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center space-x-2">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Ingrese el monto"
          className="w-40"
          autoFocus
        />
        <Button size="sm" onClick={handleSave} className="p-1 h-8 w-8">
          <Check className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" onClick={handleCancel} className="p-1 h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <span className="font-semibold text-slate-800 font-rubik">
        {formatCurrency(amount)}
      </span>
      {!disabled && (
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => setIsEditing(true)}
          className="p-1 h-8 w-8 opacity-50 hover:opacity-100"
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
