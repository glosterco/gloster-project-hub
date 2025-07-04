
import React from 'react';
import { Card } from '@/components/ui/card';
import { Building2, User, Mail, Phone } from 'lucide-react';

interface ContactInfo {
  id: number;
  CompanyName: string;
  ContactName: string;
  ContactEmail: string;
  ContactPhone?: number;
}

interface ContactCardProps {
  title: string;
  contact: ContactInfo;
}

const ContactCard: React.FC<ContactCardProps> = ({ title, contact }) => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <div className="space-y-3">
        <div className="flex items-center">
          <Building2 className="h-5 w-5 text-gloster-gray mr-3" />
          <div>
            <p className="font-medium">Empresa</p>
            <p className="text-slate-600">{contact.CompanyName || 'No disponible'}</p>
          </div>
        </div>
        <div className="flex items-center">
          <User className="h-5 w-5 text-gloster-gray mr-3" />
          <div>
            <p className="font-medium">Contacto</p>
            <p className="text-slate-600">{contact.ContactName || 'No disponible'}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Mail className="h-5 w-5 text-gloster-gray mr-3" />
          <div>
            <p className="font-medium">Email</p>
            <p className="text-slate-600">{contact.ContactEmail || 'No disponible'}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Phone className="h-5 w-5 text-gloster-gray mr-3" />
          <div>
            <p className="font-medium">Teléfono</p>
            <p className="text-slate-600">{contact.ContactPhone || 'No disponible'}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ContactCard;
