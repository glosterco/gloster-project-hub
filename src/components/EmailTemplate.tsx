
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  description: string;
  uploaded: boolean;
  onDownload?: () => void;
}

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

interface EmailTemplateProps {
  paymentId?: string;
  paymentState: PaymentState;
  project: Project;
  documents: Document[];
  hideActionButtons?: boolean;
  driveUrl?: string;
}

const EmailTemplate: React.FC<EmailTemplateProps> = ({
  paymentId,
  paymentState,
  project,
  documents,
  hideActionButtons = false,
  driveUrl
}) => {
  const formatCurrency = (amount: number, currency?: string) => {
    if (currency === 'UF') {
      return `${amount.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UF`;
    } else if (currency === 'USD') {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      }).format(amount);
    } else {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
      }).format(amount);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 font-rubik">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <img 
            src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
            alt="Gloster Logo" 
            className="w-12 h-12 mr-3"
          />
          <h1 className="text-2xl font-bold text-slate-800">Estado de Pago</h1>
        </div>
      </div>

      {/* Información principal del estado de pago */}
      <div className="bg-slate-50 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Información del Estado de Pago</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-slate-600">Período:</span>
            <p className="font-medium text-slate-800">{paymentState.month}</p>
          </div>
          <div>
            <span className="text-sm text-slate-600">Monto:</span>
            <p className="font-medium text-slate-800">
              {paymentState.formattedAmount || formatCurrency(paymentState.amount, paymentState.currency)}
            </p>
          </div>
          <div>
            <span className="text-sm text-slate-600">Fecha de vencimiento:</span>
            <p className="font-medium text-slate-800">{paymentState.dueDate}</p>
          </div>
          <div>
            <span className="text-sm text-slate-600">Proyecto:</span>
            <p className="font-medium text-slate-800">{paymentState.projectName}</p>
          </div>
        </div>
      </div>

      {/* Información del proyecto */}
      <div className="bg-slate-50 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Información del Proyecto</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm text-slate-600">Cliente:</span>
            <p className="font-medium text-slate-800">{project.client}</p>
          </div>
          <div>
            <span className="text-sm text-slate-600">Contratista:</span>
            <p className="font-medium text-slate-800">{project.contractor}</p>
          </div>
          <div>
            <span className="text-sm text-slate-600">Ubicación:</span>
            <p className="font-medium text-slate-800">{project.location}</p>
          </div>
          <div>
            <span className="text-sm text-slate-600">Jefe de Proyecto:</span>
            <p className="font-medium text-slate-800">{project.projectManager}</p>
          </div>
          {project.contractorRUT && (
            <div>
              <span className="text-sm text-slate-600">RUT Contratista:</span>
              <p className="font-medium text-slate-800">{project.contractorRUT}</p>
            </div>
          )}
          {project.contractorPhone && (
            <div>
              <span className="text-sm text-slate-600">Teléfono:</span>
              <p className="font-medium text-slate-800">{project.contractorPhone}</p>
            </div>
          )}
          {project.contractorAddress && (
            <div className="md:col-span-2">
              <span className="text-sm text-slate-600">Dirección:</span>
              <p className="font-medium text-slate-800">{project.contractorAddress}</p>
            </div>
          )}
        </div>
      </div>

      {/* Documentos */}
      <div className="bg-slate-50 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-4">Documentos</h2>
        <div className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
              <div className="flex-1">
                <h4 className="font-medium text-slate-800">{doc.name}</h4>
                <p className="text-sm text-slate-600">{doc.description}</p>
              </div>
              <div className="flex items-center">
                {doc.uploaded && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mr-3">
                    Subido
                  </span>
                )}
                {!hideActionButtons && doc.uploaded && doc.onDownload && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={doc.onDownload}
                    className="ml-2"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Descargar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-slate-600 mt-8">
        <p>Este es un email automático generado por el sistema de gestión de estados de pago.</p>
        <p className="mt-2">Para cualquier consulta, contacte a: {project.contactEmail}</p>
      </div>
    </div>
  );
};

export default EmailTemplate;
