
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
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/project/1')}
              className="text-slate-600 hover:text-slate-800"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Proyecto
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Estado de Pago - {paymentState.month}</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Payment Info Banner */}
        <Card className="mb-8 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{paymentState.month}</CardTitle>
                <CardDescription className="text-orange-100">
                  {paymentState.projectName}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {paymentState.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-orange-200 text-sm">Monto del Estado</p>
                <p className="font-bold text-xl">{formatCurrency(paymentState.amount)}</p>
              </div>
              <div>
                <p className="text-orange-200 text-sm">Fecha de Vencimiento</p>
                <p className="font-semibold">{paymentState.dueDate}</p>
              </div>
              <div>
                <p className="text-orange-200 text-sm">Destinatario</p>
                <p className="font-semibold">{paymentState.recipient}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>Instrucciones</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-slate-600">
              <p>Para procesar este estado de pago, debes completar los siguientes pasos:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Descarga cada documento desde los enlaces oficiales proporcionados</li>
                <li>Completa toda la información requerida en cada formulario</li>
                <li>Carga los documentos completados utilizando los botones de carga</li>
                <li>Una vez que todos los documentos estén cargados, presiona "Enviar" para enviarlos al destinatario</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <div className="space-y-4 mb-8">
          <h3 className="text-xl font-bold text-slate-800">Documentación Requerida</h3>
          
          {documents.map((doc) => (
            <Card key={doc.id} className="border-l-4 border-l-orange-500">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <Checkbox 
                      checked={documentStatus[doc.id as keyof typeof documentStatus]} 
                      disabled
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-800 mb-1">{doc.name}</h4>
                      <p className="text-slate-600 text-sm mb-3">{doc.description}</p>
                      
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(doc.downloadUrl, '_blank')}
                          className="text-blue-600 hover:text-blue-700"
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
                            className="bg-orange-500 hover:bg-orange-600 text-white"
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

        {/* Send Button */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-slate-800 mb-1">Enviar Documentación</h4>
                <p className="text-slate-600 text-sm">
                  Una vez que todos los documentos estén cargados, podrás enviarlos al destinatario.
                </p>
              </div>
              <Button
                onClick={handleSendDocuments}
                disabled={!Object.values(documentStatus).every(status => status)}
                className="bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-300"
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
