
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CompanyInfoStepProps {
  companyName: string;
  setCompanyName: (value: string) => void;
  rut: string;
  setRut: (value: string) => void;
  specialties: string;
  setSpecialties: (value: string) => void;
  customSpecialty: string;
  setCustomSpecialty: (value: string) => void;
  experience: string;
  setExperience: (value: string) => void;
  address: string;
  setAddress: (value: string) => void;
  city: string;
  setCity: (value: string) => void;
}

const CompanyInfoStep: React.FC<CompanyInfoStepProps> = ({
  companyName,
  setCompanyName,
  rut,
  setRut,
  specialties,
  setSpecialties,
  customSpecialty,
  setCustomSpecialty,
  experience,
  setExperience,
  address,
  setAddress,
  city,
  setCity,
}) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">Nombre de la Empresa</Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Ingresa el nombre de tu empresa"
            className="font-rubik"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rut">RUT de la Empresa</Label>
          <Input
            id="rut"
            value={rut}
            onChange={(e) => setRut(e.target.value)}
            placeholder="12.345.678-9"
            className="font-rubik"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="specialties">Especialidad Principal</Label>
          <Select value={specialties} onValueChange={setSpecialties}>
            <SelectTrigger className="font-rubik">
              <SelectValue placeholder="Selecciona tu especialidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="construccion-general">Construcción General</SelectItem>
              <SelectItem value="obras-viales">Obras Viales</SelectItem>
              <SelectItem value="instalaciones-electricas">Instalaciones Eléctricas</SelectItem>
              <SelectItem value="instalaciones-sanitarias">Instalaciones Sanitarias</SelectItem>
              <SelectItem value="climatizacion">Climatización</SelectItem>
              <SelectItem value="pinturas">Pinturas</SelectItem>
              <SelectItem value="otra">Otra</SelectItem>
            </SelectContent>
          </Select>
          {specialties === 'otra' && (
            <Input
              value={customSpecialty}
              onChange={(e) => setCustomSpecialty(e.target.value)}
              placeholder="Especifica tu especialidad"
              className="font-rubik mt-2"
            />
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="experience">Años de Experiencia</Label>
          <Select value={experience} onValueChange={setExperience}>
            <SelectTrigger className="font-rubik">
              <SelectValue placeholder="Selecciona años de experiencia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2-5">2-5 años</SelectItem>
              <SelectItem value="5-10">5-10 años</SelectItem>
              <SelectItem value="15+">+15 años</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Dirección de la empresa"
            className="font-rubik"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Ciudad</Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ciudad"
            className="font-rubik"
          />
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoStep;
