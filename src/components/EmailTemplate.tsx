import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, MapPin, User, Mail, Phone, Building, FileText, CheckCircle, Clock } from 'lucide-react';
import PaymentApprovalSection from './PaymentApprovalSection';

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
    contractor: string;
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
  hideActionButtons?: boolean;
}

const EmailTemplate: React.FC<EmailTemplateProps> = ({ paymentState, project, documents, hideActionButtons = false }) => {
  console.log('EmailTemplate props:', { paymentState, project, documents, hideActionButtons });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No especificada';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 font-rubik">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center items-center mb-4">
          <img 
            src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
            alt="Gloster Logo" 
            className="w-12 h-12 mr-3"
          />
          <h1 className="text-3xl font-bold text-slate-800">Estado de Pago</h1>
        </div>
        <p className="text-lg text-gloster-gray">
          Período: <span className="font-semibold">{paymentState.month}</span>
        </p>
      </div>

      {/* Información del estado de pago */}
      <Card className="mb-6 border-gloster-gray/20">
        <CardHeader className="bg-gloster-yellow/10">
          <CardTitle className="flex items-center space-x-2 text-slate-800 font-rubik">
            <DollarSign className="h-5 w-5" />
            <span>Resumen del Estado de Pago</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <DollarSign className="h-8 w-8 text-gloster-gray mx-auto mb-2" />
              <p className="text-sm text-gloster-gray font-medium">Monto Total</p>
              <p className="text-xl font-bold text-slate-800">{formatCurrency(paymentState.amount)}</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <Calendar className="h-8 w-8 text-gloster-gray mx-auto mb-2" />
              <p className="text-sm text-gloster-gray font-medium">Fecha de Vencimiento</p>
              <p className="text-lg font-semibold text-slate-800">{formatDate(paymentState.dueDate)}</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <Building className="h-8 w-8 text-gloster-gray mx-auto mb-2" />
              <p className="text-sm text-gloster-gray font-medium">Proyecto</p>
              <p className="text-lg font-semibold text-slate-800">{paymentState.projectName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información del proyecto */}
      <Card className="mb-6 border-gloster-gray/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-slate-800 font-rubik">
            <Building className="h-5 w-5" />
            <span>Información del Proyecto</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-gloster-gray" />
                <span className="text-sm font-medium text-gloster-gray">Cliente:</span>
                <span className="text-sm text-slate-800">{project.client}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gloster-gray" />
                <span className="text-sm font-medium text-gloster-gray">Contratista:</span>
                <span className="text-sm text-slate-800">{project.contractor}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gloster-gray" />
                <span className="text-sm font-medium text-gloster-gray">Ubicación:</span>
                <span className="text-sm text-slate-800">{project.location}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gloster-gray" />
                <span className="text-sm font-medium text-gloster-gray">Jefe de Proyecto:</span>
                <span className="text-sm text-slate-800">{project.projectManager}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gloster-gray" />
                <span className="text-sm font-medium text-gloster-gray">Email:</span>
                <span className="text-sm text-slate-800">{project.contactEmail}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documentos presentados */}
      <Card className="mb-6 border-gloster-gray/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-slate-800 font-rubik">
            <FileText className="h-5 w-5" />
            <span>Documentos Presentados</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {doc.uploaded ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 text-sm">{doc.name}</p>
                    <p className="text-xs text-gloster-gray">{doc.description}</p>
                  </div>
                </div>
                <Badge 
                  variant={doc.uploaded ? "default" : "secondary"}
                  className={doc.uploaded ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}
                >
                  {doc.uploaded ? "Presentado" : "Pendiente"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sección de Aprobación del Estado de Pago */}
      <div className="mb-8">
        <PaymentApprovalSection 
          paymentState={{
            month: paymentState.month,
            amount: paymentState.amount,
            projectName: paymentState.projectName
          }}
          disabled={hideActionButtons}
        />
      </div>

      {/* Información de contacto del contratista */}
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-lg font-rubik text-slate-800">Información de Contacto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-gloster-gray" />
              <span className="text-sm font-medium text-gloster-gray">Empresa:</span>
              <span className="text-sm text-slate-800">{project.contractor}</span>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gloster-gray" />
              <span className="text-sm font-medium text-gloster-gray">Responsable:</span>
              <span className="text-sm text-slate-800">{project.projectManager}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gloster-gray" />
              <span className="text-sm font-medium text-gloster-gray">Email:</span>
              <span className="text-sm text-slate-800">{project.contactEmail}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center mt-8 pt-6 border-t border-gloster-gray/20">
        <p className="text-xs text-gloster-gray">
          Este documento ha sido generado automáticamente por el sistema de gestión de proyectos.
        </p>
        <p className="text-xs text-gloster-gray mt-1">
          Para consultas, contacte al responsable del proyecto.
        </p>
      </div>
    </div>
  );
};

export default EmailTemplate;
