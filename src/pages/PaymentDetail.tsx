
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Download, Upload, FileText, ExternalLink, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [documentStatus, setDocumentStatus] = useState({
    f30: false,
    f30_1: false,
    finiquito: false,
    planilla: false
  });

  // Datos simulados del estado de pago
  const paymentState = {
    id: parseInt(id || '1'),
    month: "Mayo 2024",
    status: "pendiente",
    amount: 28000000,
    dueDate: "2024-05-30",
    projectName: "Edificio Residencial Las Torres",
    recipient: "ana.rodriguez@delvalle.cl"
  };

  const documents = [
    {
      id: 'f30',
      name: 'Certificado F30',
      description: 'Certificado de cumplimiento de obligaciones previsionales',
      downloadUrl: 'https://www.dt.gob.cl/legislacion/1611/articles-95516_recurso_1.pdf',
      uploaded: false,
      required: true
    },
    {
      id: 'f30_1',
      name: 'Formulario F30-1',
      description: 'Formulario complementario F30-1 para trabajadores extranjeros',
      downloadUrl: 'https://www.dt.gob.cl/legislacion/1611/articles-95516_recurso_2.pdf',
      uploaded: false,
      required: true
    },
    {
      id: 'finiquito',
      name: 'Finiquitos',
      description: 'Finiquitos de trabajadores que terminaron en el período',
      downloadUrl: 'https://www.dt.gob.cl/portal/1628/articles-60141_recurso_1.pdf',
      uploaded: false,
      required: true
    },
    {
      id: 'planilla',
      name: 'Planilla de Avance',
      description: 'Planilla detallada del avance de obras del período',
      downloadUrl: '#',
      uploaded: false,
      required: true
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDocumentUpload = (documentId: string) => {
    // Simular carga de documento
    setDocumentStatus(prev => ({
      ...prev,
      [documentId]: true
    }));
    toast({
      title: "Documento cargado",
      description: "El documento se ha cargado exitosamente",
    });
  };

  const handleSendDocuments = () => {
    const allDocumentsUploaded = Object.values(documentStatus).every(status => status);
    
    if (!allDocumentsUploaded) {
      toast({
        title: "Documentos incompletos",
        description: "Por favor, carga todos los documentos requeridos antes de enviar",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Documentos enviados",
      description: `Documentos enviados exitosamente a ${paymentState.recipient}`,
    });
    
    // Redirigir de vuelta al proyecto después de un delay
    setTimeout(() => {
      navigate('/project/1');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      {/* Header */}
      <header className="bg-gloster-white border-b border-gloster-gray/20 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/project/1')}
              className="text-gloster-gray hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Proyecto
            </Button>
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
                alt="Gloster Logo" 
                className="w-8 h-8"
              />
              <h1 className="text-xl font-bold text-slate-800 font-rubik">Estado de Pago - {paymentState.month}</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Payment Info Banner */}
        <Card className="mb-8 bg-gradient-to-r from-gloster-yellow to-gloster-yellow/80 text-slate-800">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2 font-rubik">{paymentState.month}</CardTitle>
                <CardDescription className="text-slate-700 font-rubik">
                  {paymentState.projectName}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-gloster-white text-gloster-gray">
                {paymentState.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-slate-700 text-sm font-rubik">Monto del Estado</p>
                <p className="font-bold text-xl font-rubik">{formatCurrency(paymentState.amount)}</p>
              </div>
              <div>
                <p className="text-slate-700 text-sm font-rubik">Fecha de Vencimiento</p>
                <p className="font-semibold font-rubik">{paymentState.dueDate}</p>
              </div>
              <div>
                <p className="text-slate-700 text-sm font-rubik">Destinatario</p>
                <p className="font-semibold font-rubik">{paymentState.recipient}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mb-8 border-gloster-gray/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 font-rubik">
              <FileText className="h-5 w-5 text-gloster-gray" />
              <span>Instrucciones</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-gloster-gray">
              <p className="font-rubik">Para procesar este estado de pago, debes completar los siguientes pasos:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4 font-rubik">
                <li>Descarga cada documento desde los enlaces oficiales proporcionados</li>
                <li>Completa toda la información requerida en cada formulario</li>
                <li>Carga los documentos completados utilizando los botones de carga</li>
                <li>Una vez que todos los documentos estén cargados, presiona "Enviar" para enviarlos al destinatario</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Documents List in Mosaic */}
        <div className="space-y-4 mb-8">
          <h3 className="text-xl font-bold text-slate-800 font-rubik">Documentación Requerida</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documents.map((doc, index) => (
              <Card 
                key={doc.id} 
                className={`border-l-4 border-l-gloster-yellow hover:shadow-lg transition-shadow ${
                  index === 0 ? 'md:col-span-2' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <Checkbox 
                        checked={documentStatus[doc.id as keyof typeof documentStatus]} 
                        disabled
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-800 mb-1 font-rubik">{doc.name}</h4>
                        <p className="text-gloster-gray text-sm mb-3 font-rubik">{doc.description}</p>
                        
                        <div className="flex items-center space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(doc.downloadUrl, '_blank')}
                            className="text-gloster-gray hover:text-slate-800 border-gloster-gray/30 font-rubik"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Descargar Formulario
                            <ExternalLink className="h-3 w-3 ml-2" />
                          </Button>
                          
                          {documentStatus[doc.id as keyof typeof documentStatus] ? (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              ✓ Cargado
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleDocumentUpload(doc.id)}
                              className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-slate-800 font-rubik"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Cargar Documento
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Send Button */}
        <Card className="border-gloster-gray/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-800 mb-1 font-rubik">Enviar Documentación</h4>
                <p className="text-gloster-gray text-sm font-rubik">
                  Una vez que todos los documentos estén cargados, podrás enviarlos al destinatario.
                </p>
              </div>
              <Button
                onClick={handleSendDocuments}
                disabled={!Object.values(documentStatus).every(status => status)}
                className="bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-300 font-rubik"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentDetail;
