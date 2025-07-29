import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMandantes } from '@/hooks/useMandantes';

interface ClientInfoStepProps {
  clientCompany: string;
  setClientCompany: (value: string) => void;
  clientContact: string;
  setClientContact: (value: string) => void;
  clientEmail: string;
  setClientEmail: (value: string) => void;
  clientPhone: string;
  setClientPhone: (value: string) => void;
  errors: {[key: string]: string};
}

const ClientInfoStep: React.FC<ClientInfoStepProps> = ({
  clientCompany,
  setClientCompany,
  clientContact,
  setClientContact,
  clientEmail,
  setClientEmail,
  clientPhone,
  setClientPhone,
  errors,
}) => {
  const { getMandanteByIdOrName } = useMandantes();
  const [isCheckingMandante, setIsCheckingMandante] = useState(false);

  const handleClientPhoneChange = (value: string) => {
    // Remove any non-numeric characters and ensure it starts with 9
    const cleanPhone = value.replace(/\D/g, '');
    const formattedPhone = `+56${cleanPhone}`;
    setClientPhone(formattedPhone);
  };

  const getDisplayClientPhone = () => {
    if (clientPhone.startsWith('+56')) {
      return clientPhone.substring(3);
    }
    return clientPhone.replace(/\D/g, '');
  };

  const handleCompanyChange = async (value: string) => {
    setClientCompany(value);
    
    // Solo buscar si parece un ID o nombre completo
    if (value.length > 2) {
      setIsCheckingMandante(true);
      
      const { data: existingMandante } = await getMandanteByIdOrName(value);
      
      if (existingMandante) {
        // Autocompletar campos con datos del mandante existente
        setClientContact(existingMandante.ContactName || '');
        setClientEmail(existingMandante.ContactEmail || '');
        setClientPhone(existingMandante.ContactPhone ? `+56${existingMandante.ContactPhone}` : '');
      }
      
      setIsCheckingMandante(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="clientCompany">Nombre o ID del Mandante</Label>
        <Input
          id="clientCompany"
          value={clientCompany}
          onChange={(e) => handleCompanyChange(e.target.value)}
          placeholder="Nombre de la empresa o ID del mandante"
          className="font-rubik"
        />
        {isCheckingMandante && (
          <p className="text-xs text-blue-600">Buscando mandante...</p>
        )}
        <p className="text-xs text-gray-500 italic">
          Si ingresas un ID o nombre existente, se autocompletarán los datos de contacto
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="clientContact">Nombre de Contacto</Label>
        <Input
          id="clientContact"
          value={clientContact}
          onChange={(e) => setClientContact(e.target.value)}
          placeholder="Nombre del contacto"
          className="font-rubik"
        />
        <p className="text-xs text-gray-500 italic">
          ¿A quién le enviaremos toda la documentación?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="clientEmail">Email de Contacto</Label>
          <Input
            id="clientEmail"
            type="email"
            value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)}
            placeholder="correo@mandante.com"
            className={`font-rubik ${errors.clientEmail ? 'border-red-500' : ''}`}
          />
          {errors.clientEmail && (
            <p className="text-red-500 text-sm">{errors.clientEmail}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientPhone">Teléfono de Contacto</Label>
          <div className="flex">
            <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-gray-50 text-gray-600 font-rubik">
              +56
            </div>
            <Input
              id="clientPhone"
              value={getDisplayClientPhone()}
              onChange={(e) => handleClientPhoneChange(e.target.value)}
              placeholder="9xxxxxxxx"
              className={`font-rubik rounded-l-none ${errors.clientPhone ? 'border-red-500' : ''}`}
              maxLength={9}
            />
          </div>
          {errors.clientPhone && (
            <p className="text-red-500 text-sm">{errors.clientPhone}</p>
          )}
          <p className="text-xs text-gray-500">Ingresa el número sin el código de país</p>
        </div>
      </div>
    </div>
  );
};

export default ClientInfoStep;