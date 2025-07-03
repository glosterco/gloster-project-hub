
import React from 'react';

interface PaymentState {
  month: string;
  amount: number;
  formattedAmount?: string; // AGREGANDO FORMATO PERSONALIZADO
  dueDate: string;
  projectName: string;
  recipient: string;
  currency?: string; // AGREGANDO CURRENCY
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
}

const EmailTemplate: React.FC<EmailTemplateProps> = ({
  paymentState,
  project,
  documents,
  hideActionButtons = false
}) => {
  // CORRIGIENDO: Usar el formato personalizado si está disponible, sino formatear según currency
  const formatAmount = () => {
    if (paymentState.formattedAmount) {
      return paymentState.formattedAmount;
    }
    
    // Fallback formatting
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

  return (
    <div className="bg-white font-rubik">
      {/* Header con logo */}
      <div className="bg-gloster-yellow p-6 text-center">
        <img 
          src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
          alt="Gloster Logo" 
          className="w-16 h-16 mx-auto mb-4"
        />
        <h1 className="text-2xl font-bold text-slate-800">Estado de Pago</h1>
        <p className="text-slate-600 mt-2">{paymentState.month}</p>
      </div>

      {/* Información del proyecto */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Información del Proyecto</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Proyecto</p>
            <p className="font-semibold text-slate-800">{project.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Cliente</p>
            <p className="font-semibold text-slate-800">{project.client}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Contratista</p>
            <p className="font-semibold text-slate-800">{project.contractor}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Ubicación</p>
            <p className="font-semibold text-slate-800">{project.location}</p>
          </div>
        </div>
      </div>

      {/* Información del estado de pago */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Detalle del Estado de Pago</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Período</p>
            <p className="font-semibold text-slate-800">{paymentState.month}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Monto</p>
            <p className="font-semibold text-slate-800 text-lg">{formatAmount()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fecha de Vencimiento</p>
            <p className="font-semibold text-slate-800">{paymentState.dueDate}</p>
          </div>
        </div>
      </div>

      {/* Información del contacto */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Información de Contacto</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Responsable del Proyecto</p>
            <p className="font-semibold text-slate-800">{project.projectManager}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email de Contacto</p>
            <p className="font-semibold text-slate-800">{project.contactEmail}</p>
          </div>
          {project.contractorRUT && (
            <div>
              <p className="text-sm text-gray-600">RUT</p>
              <p className="font-semibold text-slate-800">{project.contractorRUT}</p>
            </div>
          )}
          {project.contractorPhone && (
            <div>
              <p className="text-sm text-gray-600">Teléfono</p>
              <p className="font-semibold text-slate-800">{project.contractorPhone}</p>
            </div>
          )}
          {project.contractorAddress && (
            <div className="md:col-span-2">
              <p className="text-sm text-gray-600">Dirección</p>
              <p className="font-semibold text-slate-800">{project.contractorAddress}</p>
            </div>
          )}
        </div>
      </div>

      {/* Documentación adjunta */}
      <div className="p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Documentación Adjunta</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {documents.filter(doc => doc.uploaded).map((doc) => (
            <div key={doc.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <p className="font-medium text-slate-800">{doc.name}</p>
                <p className="text-sm text-gray-600">{doc.description}</p>
              </div>
              <div className="ml-3">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ Incluido
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mensaje final */}
      <div className="p-6 bg-gray-50 text-center">
        <p className="text-gray-600">
          Este estado de pago ha sido enviado para su revisión y aprobación.
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Para cualquier consulta, contactar a {project.contactEmail}
        </p>
      </div>
    </div>
  );
};

export default EmailTemplate;
