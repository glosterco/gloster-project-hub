
import React, { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarIcon, Plus, X, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PaymentInfoStepProps {
  firstPaymentDate: Date | undefined;
  setFirstPaymentDate: (date: Date | undefined) => void;
  paymentPeriod: string;
  setPaymentPeriod: (value: string) => void;
  customPeriod: string;
  setCustomPeriod: (value: string) => void;
  requiredDocuments: string[];
  setRequiredDocuments: (documents: string[]) => void;
  otherDocuments: string[];
  setOtherDocuments: (value: string[]) => void;
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
  // Documento obligatorio que no se puede deseleccionar
  const REQUIRED_DOCUMENT = "Avance del período";
  
  // Asegurar que el documento obligatorio esté seleccionado por defecto
  useEffect(() => {
    if (documentsList.includes(REQUIRED_DOCUMENT) && !requiredDocuments.includes(REQUIRED_DOCUMENT)) {
      setRequiredDocuments([...requiredDocuments, REQUIRED_DOCUMENT]);
    }
  }, [documentsList, requiredDocuments, setRequiredDocuments]);

  const handleDocumentChange = (document: string, checked: boolean) => {
    // Si se intenta deseleccionar el documento obligatorio, mostrar mensaje y no permitirlo
    if (!checked && document === REQUIRED_DOCUMENT) {
      toast.error("Documento obligatorio", {
        description: "El avance de proyecto es obligatorio para todos los contratos y no puede ser removido.",
        icon: <AlertCircle className="h-4 w-4" />,
        duration: 4000,
      });
      return;
    }
    
    if (checked) {
      setRequiredDocuments([...requiredDocuments, document]);
    } else {
      setRequiredDocuments(requiredDocuments.filter(doc => doc !== document));
    }
  };

  const handleOtherDocumentChange = (index: number, value: string) => {
    const newOtherDocuments = [...otherDocuments];
    newOtherDocuments[index] = value;
    setOtherDocuments(newOtherDocuments);
  };

  const addOtherDocument = () => {
    setOtherDocuments([...otherDocuments, '']);
  };

  const removeOtherDocument = (index: number) => {
    if (otherDocuments.length > 1) {
      const newOtherDocuments = otherDocuments.filter((_, i) => i !== index);
      setOtherDocuments(newOtherDocuments);
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
          {documentsList.map((doc) => {
            const isRequired = doc === REQUIRED_DOCUMENT;
            const isExternalDoc = doc === 'Libro de remuneraciones';
            
            return (
              <div key={doc} className={cn(
                "flex items-center space-x-2 p-2 rounded-lg",
                isRequired && "bg-primary/5 border border-primary/20"
              )}>
                <Checkbox
                  id={doc}
                  checked={requiredDocuments.includes(doc)}
                  onCheckedChange={(checked) => handleDocumentChange(doc, checked as boolean)}
                  className={isRequired ? "border-primary" : ""}
                />
                <Label 
                  htmlFor={doc} 
                  className={cn(
                    "text-sm font-rubik flex-1",
                    isRequired && "font-medium text-primary"
                  )}
                >
                  {doc}
                  {isRequired && (
                    <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      Obligatorio
                    </span>
                  )}
                  {isExternalDoc && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                      Enlace externo
                    </span>
                  )}
                </Label>
                {isExternalDoc && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const links = {
                        'Libro de remuneraciones': 'https://midt.dirtrab.cl/empleador/lre'
                      };
                      window.open(links[doc as keyof typeof links], '_blank');
                    }}
                    className="text-xs"
                  >
                    Abrir enlace
                  </Button>
                )}
              </div>
            );
          })}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Otros Documentos Requeridos</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOtherDocument}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Agregar
              </Button>
            </div>
            {otherDocuments.map((doc, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={doc}
                  onChange={(e) => handleOtherDocumentChange(index, e.target.value)}
                  placeholder={`Documento requerido ${index + 1}`}
                  className="font-rubik flex-1"
                />
                {otherDocuments.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeOtherDocument(index)}
                    className="flex items-center justify-center w-10 h-10"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentInfoStep;
