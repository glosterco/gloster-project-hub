
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, FileText, Upload, CheckCircle2, AlertCircle, Eye, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [documents, setDocuments] = useState([
    {
      id: 'eepp',
      name: 'Carátula EEPP',
      description: 'Presentación y resumen del estado de pago',
      required: true,
      uploaded: true,
      fileName: 'EEPP_Mayo_2024.pdf'
    },
    {
      id: 'planilla',
      name: 'Avance Periódico',
      description: 'Planilla detallada del avance de obras del período',
      required: true,
      uploaded: true,
      fileName: 'Planilla_Avance_Mayo_2024.xlsx'
    },
    {
      id: 'cotizaciones',
      name: 'Certificado de Pago de Cotizaciones',
      description: 'Certificado de cumplimiento previsional',
      required: true,
      uploaded: true,
      fileName: 'Cert_Cotizaciones_Mayo_2024.pdf'
    },
    {
      id: 'f30',
      name: 'Certificado F30',
      description: 'Certificado de antecedentes laborales',
      required: true,
      uploaded: true,
      fileName: 'F30_Mayo_2024.pdf'
    },
    {
      id: 'f30_1',
      name: 'Certificado F30-1',
      description: 'Certificado de obligaciones laborales',
      required: true,
      uploaded: false,
      fileName: ''
    },
    {
      id: 'factura',
      name: 'Factura',
      description: 'Factura del período correspondiente',
      required: true,
      uploaded: true,
      fileName: 'Factura_Mayo_2024.pdf'
    }
  ]);

  const paymentData = {
    id: parseInt(id || '1'),
    month: "Mayo 2024",
    status: "pendiente",
    amount: 28000000,
    dueDate: "2024-05-30",
    project: "Centro Comercial Plaza Norte",
    client: "Inversiones Comerciales Ltda.",
    contractor: "Constructora ABC Ltda."
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleFileUpload = (docId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setDocuments(docs => 
        docs.map(doc => 
          doc.id === docId 
            ? { ...doc, uploaded: true, fileName: file.name }
            : doc
        )
      );
      toast({
        title: "Archivo subido",
        description: `${file.name} se ha subido correctamente`,
      });
    }
  };

  const handleRemoveDocument = (docId: string) => {
    setDocuments(docs => 
      docs.map(doc => 
        doc.id === docId 
          ? { ...doc, uploaded: false, fileName: '' }
          : doc
      )
    );
    toast({
      title: "Archivo eliminado",
      description: "El documento ha sido eliminado",
    });
  };

  const uploadedCount = documents.filter(doc => doc.uploaded).length;
  const totalRequired = documents.filter(doc => doc.required).length;
  const completionPercentage = Math.round((uploadedCount / totalRequired) * 100);
  const allDocumentsUploaded = uploadedCount === totalRequired;

  const handleSubmitPayment = () => {
    if (allDocumentsUploaded) {
      toast({
        title: "Estado de pago enviado",
        description: "Tu documentación ha sido enviada para revisión",
      });
    } else {
      toast({
        title: "Documentación incompleta",
        description: "Por favor sube todos los documentos requeridos",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <PageHeader title="Gloster" />

      {/* Volver - fuera del banner blanco */}
      <div className="bg-slate-50 py-2">
        <div className="container mx-auto px-6">
          <button 
            onClick={() => navigate(-1)}
            className="text-gloster-gray hover:text-slate-800 text-sm font-rubik flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Proyecto
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Payment State Banner */}
        <Card className="mb-6 border-l-4 border-l-gloster-yellow">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2 font-rubik text-slate-800">
                  Estado de Pago - {paymentData.month}
                </CardTitle>
                <CardDescription className="text-gloster-gray text-base font-rubik">
                  {paymentData.project} • {paymentData.client}
                </CardDescription>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="secondary" className="bg-gloster-yellow/20 text-gloster-gray border-gloster-yellow/30 font-rubik">
                  {paymentData.status}
                </Badge>
                <p className="text-2xl font-bold text-slate-800 font-rubik">
                  {formatCurrency(paymentData.amount)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gloster-gray font-rubik">Progreso de documentación</span>
                  <span className="font-medium text-slate-800 font-rubik">{uploadedCount}/{totalRequired} documentos</span>
                </div>
                <Progress value={completionPercentage} className="bg-gloster-gray/20 [&>div]:bg-gloster-yellow" />
              </div>
              <div className="flex justify-between items-center">
                <p className="text-gloster-gray text-sm font-rubik">
                  Fecha límite: {paymentData.dueDate}
                </p>
                <div className="flex items-center space-x-2">
                  {allDocumentsUploaded ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                  )}
                  <span className="text-sm font-medium font-rubik">
                    {allDocumentsUploaded ? 'Documentación completa' : 'Pendiente'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen - con botones lado a lado */}
        <Card className="mb-6 bg-slate-50 border-gloster-gray/20">
          <CardHeader>
            <CardTitle className="font-rubik text-slate-800">Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Contratista</p>
                <p className="font-semibold text-slate-800 font-rubik">{paymentData.contractor}</p>
              </div>
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Mandante</p>
                <p className="font-semibold text-slate-800 font-rubik">{paymentData.client}</p>
              </div>
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Monto Total</p>
                <p className="font-semibold text-slate-800 font-rubik">{formatCurrency(paymentData.amount)}</p>
              </div>
            </div>
            
            {/* Botones lado a lado */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate('/email-preview')}
                variant="outline"
                className="flex-1 border-gloster-gray/30 hover:bg-gloster-gray/10 font-rubik"
              >
                <Eye className="h-4 w-4 mr-2" />
                Vista Previa
              </Button>
              <Button
                onClick={handleSubmitPayment}
                disabled={!allDocumentsUploaded}
                className="flex-1 bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-semibold font-rubik disabled:opacity-50"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Estado de Pago
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Documents Section */}
        <Card className="border-gloster-gray/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 font-rubik text-slate-800">
              <FileText className="h-5 w-5 text-gloster-gray" />
              <span>Documentos Requeridos</span>
            </CardTitle>
            <CardDescription className="font-rubik">
              Sube todos los documentos necesarios para procesar tu estado de pago
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.map((doc) => (
                <div 
                  key={doc.id} 
                  className={`p-4 border rounded-lg transition-all ${
                    doc.uploaded 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gloster-gray/30 bg-white hover:border-gloster-yellow/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        {doc.uploaded ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <div className="w-5 h-5 border-2 border-gloster-gray/30 rounded-full" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-800 font-rubik">{doc.name}</h4>
                          <p className="text-gloster-gray text-sm font-rubik">{doc.description}</p>
                          {doc.uploaded && doc.fileName && (
                            <p className="text-green-600 text-xs font-rubik mt-1">
                              📎 {doc.fileName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {doc.uploaded ? (
                        <>
                          <Button variant="ghost" size="sm" className="text-gloster-gray hover:text-slate-800">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleRemoveDocument(doc.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Eliminar
                          </Button>
                        </>
                      ) : (
                        <div className="relative">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx"
                            onChange={(e) => handleFileUpload(doc.id, e)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <Button size="sm" className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik">
                            <Upload className="h-4 w-4 mr-2" />
                            Subir
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentDetail;
