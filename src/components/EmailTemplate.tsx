
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Calendar, MapPin, User, Mail, Phone, Building } from 'lucide-react';

interface PaymentState {
  month: string;
  amount: number;
  formattedAmount?: string;
  dueDate: string;
  projectName: string;
  recipient: string;
  currency?: string;
}

interface Project {
  name: string;
  client: string;
  contractor: string;
  location: string;
  projectManager: string;
  contactEmail: string;
  contractorRUT?: string;
  contractorPhone?: string;
  contractorAddress?: string;
}

interface Document {
  id: string;
  name: string;
  description: string;
  uploaded: boolean;
}

interface EmailTemplateProps {
  paymentId?: string;
  paymentState: PaymentState;
  project: Project;
  documents: Document[];
  hideActionButtons?: boolean;
  driveUrl?: string;
}

const EmailTemplate: React.FC<EmailTemplateProps> = ({
  paymentState,
  project,
  documents,
  hideActionButtons = false,
  driveUrl
}) => {
  const formatAmount = () => {
    if (paymentState.formattedAmount) {
      return paymentState.formattedAmount;
    }
    
    if (paymentState.currency === 'UF') {
      return `${paymentState.amount.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UF`;
    } else if (paymentState.currency === 'USD') {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      }).format(paymentState.amount);
    } else {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
      }).format(paymentState.amount);
    }
  };

  const handleDownloadDocument = (documentName: string) => {
    if (driveUrl) {
      window.open(driveUrl, '_blank');
    }
  };

  return (
    <div className="bg-white font-rubik max-w-4xl mx-auto">
      {/* Compact Header */}
      <div className="bg-gloster-yellow px-6 py-4 text-center">
        <div className="flex items-center justify-center mb-2">
          <img 
            src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
            alt="Gloster Logo" 
            className="w-8 h-8 mr-3"
          />
          <h1 className="text-xl font-bold text-slate-800">Estado de Pago</h1>
        </div>
        <div className="flex items-center justify-center text-slate-700">
          <Calendar className="w-4 h-4 mr-2" />
          <p className="text-sm">{paymentState.month}</p>
        </div>
      </div>

      {/* Project Information - Improved Layout */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center mb-4">
          <Building className="w-5 h-5 mr-2 text-gloster-gray" />
          <h2 className="text-lg font-semibold text-slate-800">Información del Proyecto</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start">
              <FileText className="w-4 h-4 mr-3 mt-1 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Proyecto</p>
                <p className="font-medium text-slate-800">{project.name}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Building className="w-4 h-4 mr-3 mt-1 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Cliente</p>
                <p className="font-medium text-slate-800">{project.client}</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start">
              <User className="w-4 h-4 mr-3 mt-1 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Contratista</p>
                <p className="font-medium text-slate-800">{project.contractor}</p>
              </div>
            </div>
            <div className="flex items-start">
              <MapPin className="w-4 h-4 mr-3 mt-1 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Ubicación</p>
                <p className="font-medium text-slate-800">{project.location}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details - Highlighted Section */}
      <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center mb-4">
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-800">Detalle del Estado de Pago</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-blue-500" />
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Período</p>
            <p className="font-semibold text-slate-800">{paymentState.month}</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <div className="w-6 h-6 mx-auto mb-2 text-green-500 text-lg">💰</div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Monto</p>
            <p className="font-bold text-green-600 text-lg">{formatAmount()}</p>
          </div>
          <div className="text-center p-4 bg-white rounded-lg shadow-sm">
            <Calendar className="w-6 h-6 mx-auto mb-2 text-red-500" />
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Vencimiento</p>
            <p className="font-semibold text-slate-800">{paymentState.dueDate}</p>
          </div>
        </div>
      </div>

      {/* Documents Section - Enhanced with Download */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center mb-4">
          <FileText className="w-5 h-5 mr-2 text-purple-600" />
          <h2 className="text-lg font-semibold text-slate-800">Documentación Adjunta</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {documents.filter(doc => doc.uploaded).map((doc) => (
            <div key={doc.id} className="group border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <FileText className="w-4 h-4 mr-2 text-blue-500" />
                    <p className="font-medium text-slate-800 text-sm">{doc.name}</p>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">{doc.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      ✓ Incluido
                    </span>
                    {driveUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadDocument(doc.name)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs px-2 py-1 h-auto"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Descargar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Information - Moved Below Documents */}
      <div className="p-6 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center mb-4">
          <Mail className="w-5 h-5 mr-2 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-800">Información de Contacto</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start">
              <User className="w-4 h-4 mr-3 mt-1 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Responsable del Proyecto</p>
                <p className="font-medium text-slate-800">{project.projectManager}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Mail className="w-4 h-4 mr-3 mt-1 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Email de Contacto</p>
                <p className="font-medium text-slate-800">{project.contactEmail}</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {project.contractorRUT && (
              <div className="flex items-start">
                <FileText className="w-4 h-4 mr-3 mt-1 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">RUT</p>
                  <p className="font-medium text-slate-800">{project.contractorRUT}</p>
                </div>
              </div>
            )}
            {project.contractorPhone && (
              <div className="flex items-start">
                <Phone className="w-4 h-4 mr-3 mt-1 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Teléfono</p>
                  <p className="font-medium text-slate-800">{project.contractorPhone}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        {project.contractorAddress && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-start">
              <MapPin className="w-4 h-4 mr-3 mt-1 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Dirección</p>
                <p className="font-medium text-slate-800">{project.contractorAddress}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Message */}
      <div className="p-6 text-center bg-slate-50">
        <div className="max-w-md mx-auto">
          <p className="text-gray-600 text-sm mb-2">
            Este estado de pago ha sido enviado para su revisión y aprobación.
          </p>
          <div className="flex items-center justify-center text-xs text-gray-500">
            <Mail className="w-4 h-4 mr-1" />
            <span>Para consultas, contactar a {project.contactEmail}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplate;
