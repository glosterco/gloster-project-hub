
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, FileText, CheckCircle, Building, User, Mail } from 'lucide-react';

interface EmailTemplateProps {
  paymentState: {
    month: string;
    amount: number;
    dueDate: string;
    projectName: string;
    recipient: string;
  };
  project: {
    name: string;
    client: string;
    location: string;
    projectManager: string;
    contactEmail: string;
  };
  documents: Array<{
    id: string;
    name: string;
    description: string;
    uploaded: boolean;
  }>;
}

const EmailTemplate: React.FC<EmailTemplateProps> = ({ paymentState, project, documents }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const uploadedDocuments = documents.filter(doc => doc.uploaded);

  return (
    <div className="max-w-4xl mx-auto bg-white font-rubik">
      {/* Header con branding Gloster */}
      <div className="bg-gloster-white border-b-4 border-gloster-yellow p-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gloster-yellow rounded-lg flex items-center justify-center">
            <Building className="h-8 w-8 text-gloster-gray" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 font-rubik">Gloster</h1>
            <p className="text-gloster-gray font-rubik">Gestión de Proyectos de Construcción</p>
          </div>
        </div>
        
        <div className="border-t border-gloster-gray/20 pt-6">
          <h2 className="text-2xl font-bold text-slate-800 font-rubik mb-2">
            Estado de Pago - {paymentState.month}
          </h2>
          <p className="text-gloster-gray font-rubik">
            Documentación completa para procesamiento de pago
          </p>
        </div>
      </div>

      {/* Información del proyecto y estado de pago */}
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Información del Estado de Pago */}
          <Card className="border-l-4 border-l-gloster-yellow">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 font-rubik text-slate-800">
                <Calendar className="h-5 w-5 text-gloster-gray" />
                <span>Información del Estado de Pago</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Período</p>
                <p className="font-semibold text-slate-800 font-rubik">{paymentState.month}</p>
              </div>
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Monto</p>
                <p className="font-bold text-xl text-slate-800 font-rubik">{formatCurrency(paymentState.amount)}</p>
              </div>
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Fecha de Vencimiento</p>
                <p className="font-semibold text-slate-800 font-rubik">{paymentState.dueDate}</p>
              </div>
            </CardContent>
          </Card>

          {/* Información del Proyecto */}
          <Card className="border-l-4 border-l-gloster-gray">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 font-rubik text-slate-800">
                <Building className="h-5 w-5 text-gloster-gray" />
                <span>Información del Proyecto</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Proyecto</p>
                <p className="font-semibold text-slate-800 font-rubik">{project.name}</p>
              </div>
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Cliente</p>
                <p className="font-semibold text-slate-800 font-rubik">{project.client}</p>
              </div>
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Ubicación</p>
                <p className="font-semibold text-slate-800 font-rubik">{project.location}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Documentos adjuntos */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 font-rubik text-slate-800">
              <FileText className="h-5 w-5 text-gloster-gray" />
              <span>Documentos Adjuntos ({uploadedDocuments.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uploadedDocuments.map((doc, index) => (
                <div key={doc.id} className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 font-rubik text-sm">{doc.name}</p>
                    <p className="text-gloster-gray text-xs font-rubik">{doc.description}</p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                    Adjunto {index + 1}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Información de contacto */}
        <Card className="bg-slate-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 font-rubik text-slate-800">
              <User className="h-5 w-5 text-gloster-gray" />
              <span>Información de Contacto</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-gloster-gray text-sm font-rubik">Project Manager</p>
              <p className="font-semibold text-slate-800 font-rubik">{project.projectManager}</p>
            </div>
            <div>
              <p className="text-gloster-gray text-sm font-rubik">Email de Contacto</p>
              <p className="font-semibold text-slate-800 font-rubik flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gloster-gray" />
                <span>{project.contactEmail}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gloster-gray/20 text-center">
          <p className="text-gloster-gray text-sm font-rubik mb-2">
            Este estado de pago ha sido generado automáticamente por el sistema Gloster
          </p>
          <p className="text-gloster-gray text-xs font-rubik">
            Para cualquier consulta, contacte al Project Manager indicado arriba
          </p>
          <div className="mt-4 flex items-center justify-center space-x-2">
            <div className="w-6 h-6 bg-gloster-yellow rounded flex items-center justify-center">
              <Building className="h-4 w-4 text-gloster-gray" />
            </div>
            <span className="text-gloster-gray text-sm font-rubik font-semibold">Gloster - Gestión de Proyectos</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplate;
