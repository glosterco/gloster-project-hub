
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, FileText, CheckCircle, Building, User, Mail, Download, Eye, Printer, Linkedin } from 'lucide-react';
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
    contractor?: string;
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
  console.log('EmailTemplate props:', { paymentState, project, documents });

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
      {/* Header superior con logo Gloster */}
      <div className="bg-gloster-yellow p-4 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <img 
            src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
            alt="Gloster Logo" 
            className="w-8 h-8"
          />
          <span className="text-2xl font-bold text-slate-800 font-rubik">Gloster</span>
        </div>
      </div>

      {/* Header con información del contratista */}
      <div className="bg-gloster-white border-b-2 border-gloster-gray/20 p-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gloster-gray/20 rounded-lg flex items-center justify-center">
            <Building className="h-8 w-8 text-gloster-gray" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-800 font-rubik">
              {project.contractor || "Contractor No Disponible"}
            </h1>
            <p className="text-gloster-gray font-rubik">Contratista General</p>
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
                <p className="text-gloster-gray text-sm font-rubik">Mandante</p>
                <p className="font-semibold text-slate-800 font-rubik">{project.client}</p>
              </div>
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Contratista</p>
                <p className="font-semibold text-slate-800 font-rubik">{project.contractor || "No disponible"}</p>
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
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2 font-rubik text-slate-800">
                <FileText className="h-5 w-5 text-gloster-gray" />
                <span>Documentos Adjuntos ({uploadedDocuments.length})</span>
              </CardTitle>
              <Button variant="outline" size="sm" className="font-rubik">
                <Download className="h-4 w-4 mr-2" />
                Descargar Todo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {uploadedDocuments.map((doc, index) => (
                <div key={doc.id} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-3 flex-1">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 font-rubik text-sm">{doc.name}</p>
                      <p className="text-gloster-gray text-xs font-rubik">{doc.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 ml-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Printer className="h-3 w-3" />
                    </Button>
                  </div>
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
          />
        </div>

        {/* Información de contacto del contratista */}
        <Card className="bg-slate-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 font-rubik text-slate-800">
              <User className="h-5 w-5 text-gloster-gray" />
              <span>Información del Contratista</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-gloster-gray text-sm font-rubik">Empresa</p>
              <p className="font-semibold text-slate-800 font-rubik">{project.contractor || "No disponible"}</p>
            </div>
            <div>
              <p className="text-gloster-gray text-sm font-rubik">Project Manager</p>
              <p className="font-semibold text-slate-800 font-rubik">{project.projectManager || "No disponible"}</p>
            </div>
            <div>
              <p className="text-gloster-gray text-sm font-rubik">Email de Contacto</p>
              <p className="font-semibold text-slate-800 font-rubik flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gloster-gray" />
                <span>{project.contactEmail || "No disponible"}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gloster-gray/20 text-center">
          <p className="text-gloster-gray text-sm font-rubik mb-2">
            Este estado de pago ha sido generado automáticamente por el sistema Gloster
          </p>
          <p className="text-gloster-gray text-xs font-rubik mb-4">
            Para cualquier consulta, contacte al contratista indicado arriba o al equipo Gloster
          </p>
          <div className="mt-4 flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center space-x-2">
              <img 
                src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
                alt="Gloster Logo" 
                className="w-6 h-6"
              />
              <span className="text-gloster-gray text-sm font-rubik font-semibold">Gloster - Gestión de Proyectos</span>
            </div>
            <div className="flex flex-col items-center space-y-1">
              <p className="text-gloster-gray text-xs font-rubik">soporte.gloster@gmail.com</p>
              <a 
                href="https://www.linkedin.com/company/glostercl/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-1 text-gloster-gray hover:text-slate-800 text-xs"
              >
                <Linkedin className="h-3 w-3" />
                <span>LinkedIn</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailTemplate;
