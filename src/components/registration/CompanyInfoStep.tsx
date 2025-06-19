
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CompanyInfoStepProps {
  companyName: string;
  setCompanyName: (value: string) => void;
  rut: string;
  setRut: (value: string) => void;
  specialties: string[];
  setSpecialties: (value: string[]) => void;
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
    'Construcción',
    'Electricidad',
    'Plomería',
    'Pintura',
    'Carpintería',
    'Albañilería',
    'Techado',
    'Otro'
  ];

  const experienceOptions = [
    { value: '0-5', label: '0-5 años' },
    { value: '5-10', label: '5-10 años' },
    { value: '+10', label: 'Más de 10 años' }
  ];

  const formatRut = (value: string) => {
    // Remove any non-alphanumeric characters
    const cleanValue = value.replace(/[^0-9kK]/g, '');
    
    if (cleanValue.length === 0) return '';
    
    // Separate body and verification digit
    const body = cleanValue.slice(0, -1);
    const dv = cleanValue.slice(-1).toUpperCase();
    
    if (body.length === 0) return cleanValue;
    
    // Format body with dots
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `${formattedBody}-${dv}`;
  };

  const handleRutChange = (value: string) => {
    const formatted = formatRut(value);
    setRut(formatted);
  };

  const handleSpecialtyChange = (value: string) => {
    if (value === 'Otro') {
      setSpecialties([value]);
    } else {
      setSpecialties([value]);
      setCustomSpecialty(''); // Clear custom specialty if not "Otro"
    }
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
            placeholder="Ej: Constructora ABC Ltda."
            className="font-rubik"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rut">RUT</Label>
          <Input
            id="rut"
            value={rut}
            onChange={(e) => handleRutChange(e.target.value)}
            placeholder="12.345.678-9"
            className={`font-rubik ${errors.rut ? 'border-red-500' : ''}`}
            maxLength={12}
          />
          {errors.rut && (
            <p className="text-red-500 text-sm">{errors.rut}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="specialties">Especialidad</Label>
        <Select onValueChange={handleSpecialtyChange} value={specialties[0] || ''}>
          <SelectTrigger className="font-rubik">
            <SelectValue placeholder="Selecciona una especialidad" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            {specialtyOptions.map((specialty) => (
              <SelectItem key={specialty} value={specialty} className="font-rubik">
                {specialty}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {specialties.includes('Otro') && (
          <div className="mt-3">
            <Input
              value={customSpecialty}
              onChange={(e) => setCustomSpecialty(e.target.value)}
              placeholder="Especifica tu especialidad"
              className="font-rubik"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="experience">Años de Experiencia</Label>
        <Select onValueChange={setExperience} value={experience}>
          <SelectTrigger className="font-rubik">
            <SelectValue placeholder="Selecciona años de experiencia" />
          </SelectTrigger>
          <SelectContent className="bg-white z-50">
            {experienceOptions.map((option) => (
              <SelectItem key={option.value} value={option.value} className="font-rubik">
                {option.label}
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
            placeholder="Ej: Av. Providencia 1234"
            className="font-rubik"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Ciudad</Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ej: Santiago"
            className="font-rubik"
          />
        </div>
      </div>
    </div>
  );
};

export default CompanyInfoStep;
