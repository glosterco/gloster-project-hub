
import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { CurrencySelector } from './CurrencySelector';

interface ProjectInfoStepProps {
  projectName: string;
  setProjectName: (value: string) => void;
  projectAddress: string;
  setProjectAddress: (value: string) => void;
  projectDescription: string;
  setProjectDescription: (value: string) => void;
  contractAmount: string;
  setContractAmount: (value: string) => void;
  currency: string;
  setCurrency: (value: string) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  duration: string;
  setDuration: (value: string) => void;
  errors: {[key: string]: string};
}

const ProjectInfoStep = ({ 
  projectName, 
  setProjectName, 
  projectAddress, 
  setProjectAddress, 
  projectDescription, 
  setProjectDescription, 
  contractAmount, 
  setContractAmount,
  currency,
  setCurrency,
  startDate, 
  setStartDate, 
  duration, 
  setDuration, 
  errors 
}: ProjectInfoStepProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="projectName" className="text-sm font-medium text-gloster-gray">
          Nombre del Proyecto *
        </Label>
        <Input
          id="projectName"
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Ej: Construcción Edificio Las Condes"
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="projectAddress" className="text-sm font-medium text-gloster-gray">
          Dirección del Proyecto *
        </Label>
        <Input
          id="projectAddress"
          type="text"
          value={projectAddress}
          onChange={(e) => setProjectAddress(e.target.value)}
          placeholder="Ej: Av. Las Condes 123, Las Condes, Santiago"
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="projectDescription" className="text-sm font-medium text-gloster-gray">
          Descripción del Proyecto *
        </Label>
        <Textarea
          id="projectDescription"
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          placeholder="Describe brevemente el proyecto, tipo de construcción, características principales..."
          className="w-full min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contractAmount" className="text-sm font-medium text-gloster-gray">
            Monto del Contrato *
          </Label>
          <Input
            id="contractAmount"
            type="text"
            value={contractAmount}
            onChange={(e) => setContractAmount(e.target.value)}
            placeholder="Ej: 150000000"
            className={`w-full ${errors.contractAmount ? 'border-red-500' : ''}`}
          />
          {errors.contractAmount && (
            <p className="text-red-500 text-xs">{errors.contractAmount}</p>
          )}
        </div>

        <CurrencySelector currency={currency} setCurrency={setCurrency} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gloster-gray">
            Fecha de Inicio *
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP", { locale: es }) : "Seleccionar fecha"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                locale={es}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration" className="text-sm font-medium text-gloster-gray">
            Duración (días) *
          </Label>
          <Input
            id="duration"
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Ej: 365"
            className={`w-full ${errors.duration ? 'border-red-500' : ''}`}
          />
          {errors.duration && (
            <p className="text-red-500 text-xs">{errors.duration}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectInfoStep;
