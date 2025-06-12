
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ClientInfoStepProps {
  clientCompany: string;
  setClientCompany: (value: string) => void;
  clientContact: string;
  setClientContact: (value: string) => void;
  clientEmail: string;
  setClientEmail: (value: string) => void;
  clientPhone: string;
  setClientPhone: (value: string) => void;
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
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="clientCompany">Empresa Mandante</Label>
        <Input
          id="clientCompany"
          value={clientCompany}
          onChange={(e) => setClientCompany(e.target.value)}
          placeholder="Nombre de la empresa mandante"
          className="font-rubik"
        />
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
            className="font-rubik"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientPhone">Teléfono de Contacto</Label>
          <Input
            id="clientPhone"
            value={clientPhone}
            onChange={(e) => setClientPhone(e.target.value)}
            placeholder="+569xxxxxxxx"
            className="font-rubik"
          />
        </div>
      </div>
    </div>
  );
};

export default ClientInfoStep;
