
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface PaymentInfoStepProps {
  firstPaymentDate: Date | undefined;
  setFirstPaymentDate: (date: Date | undefined) => void;
  paymentPeriod: string;
  setPaymentPeriod: (value: string) => void;
  customPeriod: string;
  setCustomPeriod: (value: string) => void;
  requiredDocuments: string[];
  setRequiredDocuments: (documents: string[]) => void;
  otherDocuments: string;
  setOtherDocuments: (value: string) => void;
  documentsList: string[];
}

const PaymentInfoStep: React.FC<PaymentInfoStepProps> = ({
  firstPaymentDate,
  setFirstPaymentDate,
  paymentPeriod,
  setPaymentPeriod,
  customPeriod,
  setCustomPeriod,
  requiredDocuments,
  setRequiredDocuments,
  otherDocuments,
  setOtherDocuments,
  documentsList,
}) => {
  const handleDocumentChange = (document: string, checked: boolean) => {
    if (checked) {
      setRequiredDocuments([...requiredDocuments, document]);
    } else {
      setRequiredDocuments(requiredDocuments.filter(doc => doc !== document));
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="firstPaymentDate">Fecha de presentación del primer estado de pago</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal font-rubik",
                !firstPaymentDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {firstPaymentDate ? format(firstPaymentDate, "dd/MM/yyyy") : <span>Selecciona fecha del primer estado de pago</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={firstPaymentDate}
              onSelect={setFirstPaymentDate}
              initialFocus
              className="p-3"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentPeriod">Período de Caducidad</Label>
        <Select value={paymentPeriod} onValueChange={setPaymentPeriod}>
          <SelectTrigger className="font-rubik">
            <SelectValue placeholder="Selecciona la frecuencia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quincenal">Quincenal</SelectItem>
            <SelectItem value="mensual">Mensual</SelectItem>
            <SelectItem value="otro">Otro</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 italic">
          ¿Cada cuánto se deben presentar los documentos?
        </p>
        {paymentPeriod === 'otro' && (
          <Input
            value={customPeriod}
            onChange={(e) => setCustomPeriod(e.target.value)}
            placeholder="Especifica el período"
            className="font-rubik mt-2"
          />
        )}
      </div>

      <div className="space-y-4">
        <Label>Documentación Requerida</Label>
        <div className="space-y-3">
          {documentsList.map((doc) => (
            <div key={doc} className="flex items-center space-x-2">
              <Checkbox
                id={doc}
                checked={requiredDocuments.includes(doc)}
                onCheckedChange={(checked) => handleDocumentChange(doc, checked as boolean)}
              />
              <Label htmlFor={doc} className="text-sm font-rubik">{doc}</Label>
            </div>
          ))}
          <div className="space-y-2">
            <Label htmlFor="otherDocuments">Otros</Label>
            <Input
              id="otherDocuments"
              value={otherDocuments}
              onChange={(e) => setOtherDocuments(e.target.value)}
              placeholder="Especifica otros documentos"
              className="font-rubik"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentInfoStep;
