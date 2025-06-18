
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { formatRut } from './validationUtils';

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
  errors: {[key: string]: string};
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
  errors,
}) => {
  const specialtyOptions = [
    'Construcción General',
    'Instalaciones Eléctricas',
    'Instalaciones Sanitarias',
    'Carpintería',
    'Albañilería',
    'Pintura',
    'Techado',
    'Pavimentación',
    'Otro'
  ];

  const experienceOptions = [
    'Menos de 1 año',
    '1-3 años',
    '3-5 años',
    '5-10 años',
    'Más de 10 años'
  ];

  const handleRutChange = (value: string) => {
    const formattedRut = formatRut(value);
    setRut(formattedRut);
  };

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
            onChange={(e) => handleRutChange(e.target.value)}
            placeholder="12345678-9"
            className={`font-rubik ${errors.rut ? 'border-red-500' : ''}`}
            maxLength={10}
          />
          {errors.rut && (
            <p className="text-red-500 text-sm">{errors.rut}</p>
          )}
          <p className="text-xs text-gray-500">Formato: XXXXXXXX-X (sin puntos)</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialties">Especialidad Principal</Label>
        <Select value={specialties} onValueChange={setSpecialties}>
          <SelectTrigger className="font-rubik">
            <SelectValue placeholder="Selecciona tu especialidad principal" />
          </SelectTrigger>
          <SelectContent>
            {specialtyOptions.map((specialty) => (
              <SelectItem key={specialty} value={specialty} className="font-rubik">
                {specialty}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {specialties === 'Otro' && (
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
            <SelectValue placeholder="Selecciona tus años de experiencia" />
          </SelectTrigger>
          <SelectContent>
            {experienceOptions.map((exp) => (
              <SelectItem key={exp} value={exp} className="font-rubik">
                {exp}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
