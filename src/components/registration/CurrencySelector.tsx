
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CurrencySelectorProps {
  currency: string;
  setCurrency: (value: string) => void;
}

export const CurrencySelector = ({ currency, setCurrency }: CurrencySelectorProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="currency" className="text-sm font-medium text-gloster-gray">
        Moneda del Contrato
      </Label>
      <Select value={currency} onValueChange={setCurrency}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Seleccionar moneda" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="CLP">$ (Pesos Chilenos)</SelectItem>
          <SelectItem value="UF">UF (Unidad de Fomento)</SelectItem>
          <SelectItem value="USD">USD (Dólar Estadounidense)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
