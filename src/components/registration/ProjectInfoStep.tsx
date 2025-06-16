
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ProjectInfoStepProps {
  projectName: string;
  setProjectName: (value: string) => void;
  projectAddress: string;
  setProjectAddress: (value: string) => void;
  projectDescription: string;
  setProjectDescription: (value: string) => void;
  contractAmount: string;
  setContractAmount: (value: string) => void;
  contractCurrency: string;
  setContractCurrency: (value: string) => void;
  startDate: Date | undefined;
  setStartDate: (date: Date | undefined) => void;
  duration: string;
  setDuration: (value: string) => void;
  errors: {[key: string]: string};
}

const ProjectInfoStep: React.FC<ProjectInfoStepProps> = ({
  projectName,
  setProjectName,
  projectAddress,
  setProjectAddress,
  projectDescription,
  setProjectDescription,
  contractAmount,
  setContractAmount,
  contractCurrency,
  setContractCurrency,
  startDate,
  setStartDate,
  duration,
  setDuration,
  errors,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="projectName">Nombre del Proyecto</Label>
        <Input
          id="projectName"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Nombre del proyecto"
          className="font-rubik"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="projectAddress">Dirección del Proyecto</Label>
        <Input
          id="projectAddress"
          value={projectAddress}
          onChange={(e) => setProjectAddress(e.target.value)}
          placeholder="Dirección donde se ejecuta el proyecto"
          className="font-rubik"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="projectDescription">Breve Descripción</Label>
        <Textarea
          id="projectDescription"
          value={projectDescription}
          onChange={(e) => setProjectDescription(e.target.value)}
          placeholder="Describe brevemente el proyecto"
          className="font-rubik"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="contractAmount">Monto del Contrato</Label>
          <Input
            id="contractAmount"
            value={contractAmount}
            onChange={(e) => setContractAmount(e.target.value)}
            placeholder="Monto del contrato"
            className={`font-rubik ${errors.contractAmount ? 'border-red-500' : ''}`}
          />
          {errors.contractAmount && (
            <p className="text-red-500 text-sm">{errors.contractAmount}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contractCurrency">Divisa</Label>
          <Select value={contractCurrency} onValueChange={setContractCurrency}>
            <SelectTrigger className="font-rubik">
              <SelectValue placeholder="Divisa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CLP">$ (CLP)</SelectItem>
              <SelectItem value="UF">UF</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration">Duración (meses)</Label>
        <Input
          id="duration"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder="Duración en meses"
          className={`font-rubik ${errors.duration ? 'border-red-500' : ''}`}
        />
        {errors.duration && (
          <p className="text-red-500 text-sm">{errors.duration}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="startDate">Fecha de inicio contractual</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal font-rubik",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(startDate, "dd/MM/yyyy") : <span>Selecciona fecha de inicio</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={setStartDate}
              initialFocus
              className="p-3"
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default ProjectInfoStep;
