
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ContactInfoStepProps {
  contactName: string;
  setContactName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  errors: {[key: string]: string};
}

const ContactInfoStep: React.FC<ContactInfoStepProps> = ({
  contactName,
  setContactName,
  email,
  setEmail,
  phone,
  setPhone,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  errors,
}) => {
  const handlePhoneChange = (value: string) => {
    // Remove any non-numeric characters and ensure it starts with 9
    const cleanPhone = value.replace(/\D/g, '');
    const formattedPhone = `+56${cleanPhone}`;
    setPhone(formattedPhone);
  };

  const getDisplayPhone = () => {
    if (phone.startsWith('+56')) {
      return phone.substring(3);
    }
    return phone.replace(/\D/g, '');
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 italic">
        Completa con la información de la persona que va a manejar la cuenta ya que tendrá que iniciar sesión con ese correo
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contactName">Nombre del Contacto</Label>
          <Input
            id="contactName"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            placeholder="Nombre completo"
            className="font-rubik"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="correo@empresa.com"
            className={`font-rubik ${errors.email ? 'border-red-500' : ''}`}
          />
          {errors.email && (
            <p className="text-red-500 text-sm">{errors.email}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Teléfono</Label>
        <div className="flex">
          <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-gray-50 text-gray-600 font-rubik">
            +56
          </div>
          <Input
            id="phone"
            value={getDisplayPhone()}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="9xxxxxxxx"
            className={`font-rubik rounded-l-none ${errors.phone ? 'border-red-500' : ''}`}
            maxLength={9}
          />
        </div>
        {errors.phone && (
          <p className="text-red-500 text-sm">{errors.phone}</p>
        )}
        <p className="text-xs text-gray-500">Ingresa tu número sin el código de país</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Al menos 8 caracteres alfanuméricos"
            className={`font-rubik ${errors.password ? 'border-red-500' : ''}`}
          />
          {errors.password && (
            <p className="text-red-500 text-sm">{errors.password}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirma tu contraseña"
            className={`font-rubik ${errors.confirmPassword ? 'border-red-500' : ''}`}
          />
          {errors.confirmPassword && (
            <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactInfoStep;
