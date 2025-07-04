import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, FileText, Calendar, MapPin, User, Mail, Phone, Building } from 'lucide-react';
import { useEmailNotifications } from '@/hooks/useEmailNotifications';
import { useToast } from '@/hooks/use-toast';

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
  paymentId,
  paymentState,
  project,
  documents,
  hideActionButtons = false,
  driveUrl
}) => {
  const { getDriveFiles } = useEmailNotifications();
  const { toast } = useToast();

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

  const handleDownloadDocument = async (documentName: string) => {
    if (!paymentId) {
      toast({
        title: "Error",
        description: "ID de pago no disponible",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await getDriveFiles(paymentId, documentName);
      
      if (result.success && result.files.length > 0) {
        // If multiple files found, download the first one or open drive folder
        const file = result.files[0];
        if (file.downloadUrl) {
          window.open(file.downloadUrl, '_blank');
        } else if (driveUrl) {
          window.open(driveUrl, '_blank');
        }
        
        toast({
          title: "Descarga iniciada",
          description: `Descargando ${documentName}`,
        });
      } else {
        // Fallback to drive folder if specific file not found
        if (driveUrl) {
          window.open(driveUrl, '_blank');
          toast({
            title: "Abriendo carpeta",
            description: "Se ha abierto la carpeta del Drive",
          });
        } else {
          toast({
            title: "Archivo no encontrado",
            description: `No se encontró el archivo ${documentName}`,
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error al descargar",
        description: "No se pudo descargar el documento",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="bg-white font-rubik max-w-4xl mx-auto">
      {/* Header - Gloster logo and name */}
      <div className="bg-gloster-yellow px-4 py-3 text-center">
        <div className="flex items-center justify-center mb-1">
          <img 
            src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
            alt="Gloster Logo" 
            className="w-6 h-6 mr-2"
          />
          <h1 className="text-lg font-bold text-slate-800">Gloster</h1>
        </div>
      </div>

      {/* Payment State: "Estado de pago" with month, year, and contractor */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center mb-3">
          <Building className="w-4 h-4 mr-2 text-gloster-gray" />
          <h2 className="text-base font-semibold text-slate-800">
            Estado de pago {paymentState.month} - {project.contractor}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-start">
              <FileText className="w-3 h-3 mr-2 mt-1 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Proyecto</p>
                <p className="text-sm font-medium text-slate-800">{project.name}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Building className="w-3 h-3 mr-2 mt-1 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Cliente</p>
                <p className="text-sm font-medium text-slate-800">{project.client}</p>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-start">
              <User className="w-3 h-3 mr-2 mt-1 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Contratista</p>
                <p className="text-sm font-medium text-slate-800">{project.contractor}</p>
              </div>
            </div>
            <div className="flex items-start">
              <MapPin className="w-3 h-3 mr-2 mt-1 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Ubicación</p>
                <p className="text-sm font-medium text-slate-800">{project.location}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details */}
      <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center mb-3">
          <Calendar className="w-4 h-4 mr-2 text-blue-600" />
          <h2 className="text-base font-semibold text-slate-800">Detalle del Estado de Pago</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <Calendar className="w-5 h-5 mx-auto mb-1 text-blue-500" />
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Período</p>
            <p className="text-sm font-semibold text-slate-800">{paymentState.month}</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <div className="w-5 h-5 mx-auto mb-1 text-green-500 text-base">💰</div>
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Monto</p>
            <p className="text-sm font-bold text-green-600">{formatAmount()}</p>
          </div>
          <div className="text-center p-3 bg-white rounded-lg shadow-sm">
            <Calendar className="w-5 h-5 mx-auto mb-1 text-red-500" />
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Vencimiento</p>
            <p className="text-sm font-semibold text-slate-800">{paymentState.dueDate}</p>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center mb-3">
          <FileText className="w-4 h-4 mr-2 text-purple-600" />
          <h2 className="text-base font-semibold text-slate-800">Documentación Adjunta</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {documents.filter(doc => doc.uploaded).map((doc) => (
            <div key={doc.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <FileText className="w-3 h-3 mr-2 text-blue-500" />
                    <p className="text-sm font-medium text-slate-800">{doc.name}</p>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{doc.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      ✓ Incluido
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadDocument(doc.name)}
                      className="text-xs px-2 py-1 h-auto"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Descargar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Information */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center mb-3">
          <Mail className="w-4 h-4 mr-2 text-indigo-600" />
          <h2 className="text-base font-semibold text-slate-800">Información de Contacto</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-start">
              <User className="w-3 h-3 mr-2 mt-1 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Responsable del Proyecto</p>
                <p className="text-sm font-medium text-slate-800">{project.projectManager}</p>
              </div>
            </div>
            <div className="flex items-start">
              <Mail className="w-3 h-3 mr-2 mt-1 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Email de Contacto</p>
                <p className="text-sm font-medium text-slate-800">{project.contactEmail}</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {project.contractorRUT && (
              <div className="flex items-start">
                <FileText className="w-3 h-3 mr-2 mt-1 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">RUT</p>
                  <p className="text-sm font-medium text-slate-800">{project.contractorRUT}</p>
                </div>
              </div>
            )}
            {project.contractorPhone && (
              <div className="flex items-start">
                <Phone className="w-3 h-3 mr-2 mt-1 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Teléfono</p>
                  <p className="text-sm font-medium text-slate-800">{project.contractorPhone}</p>
                </div>
              </div>
            )}
          </div>
        </div>
        {project.contractorAddress && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-start">
              <MapPin className="w-3 h-3 mr-2 mt-1 text-gray-500" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Dirección</p>
                <p className="text-sm font-medium text-slate-800">{project.contractorAddress}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Message */}
      <div className="p-4 text-center bg-slate-50">
        <div className="max-w-md mx-auto">
          <p className="text-gray-600 text-sm mb-2">
            Este estado de pago ha sido enviado para su revisión y aprobación.
          </p>
          <div className="flex items-center justify-center text-xs text-gray-500">
            <Mail className="w-3 h-3 mr-1" />
            <span>Para consultas, contactar a {project.contactEmail}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplate;
