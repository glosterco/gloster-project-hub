
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, DollarSign, FileText, CheckCircle, Upload, X, Eye, ArrowUp, ArrowDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Estado para gestionar los documentos
  const [documents, setDocuments] = useState([
    {
      id: 'eepp',
      name: 'Carátula EEPP',
      description: 'Presentación y resumen del estado de pago',
      uploaded: true
    },
    {
      id: 'planilla',
      name: 'Avance Periódico',
      description: 'Planilla detallada del avance de obras del período',
      uploaded: true
    },
    {
      id: 'cotizaciones',
      name: 'Certificado de Pago de Cotizaciones',
      description: 'Certificado de cumplimiento previsional',
      uploaded: true
    },
    {
      id: 'f30',
      name: 'Certificado F30',
      description: 'Certificado de antecedentes laborales',
      uploaded: true
    },
    {
      id: 'f30_1',
      name: 'Certificado F30-1',
      description: 'Certificado de obligaciones laborales',
      uploaded: true
    },
    {
      id: 'factura',
      name: 'Factura',
      description: 'Factura del período correspondiente',
      uploaded: false
    }
  ]);

  // Datos simulados del estado de pago
  const paymentState = {
    id: parseInt(id || '5'),
    month: "Mayo 2024",
    status: "pendiente",
    amount: 28000000,
    dueDate: "2024-05-30",
    projectName: "Centro Comercial Plaza Norte",
    contractorName: "Constructora ABC Ltda.",
    projectManager: "Ana Rodríguez",
    contactEmail: "ana.rodriguez@inversiones.cl"
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleUpload = (documentId: string) => {
    setDocuments(docs => 
      docs.map(doc => 
        doc.id === documentId 
          ? { ...doc, uploaded: true }
          : doc
      )
    );
    
    toast({
      title: "Documento cargado",
      description: "El documento se ha cargado correctamente",
    });
  };

  const handleRemove = (documentId: string) => {
    setDocuments(docs => 
      docs.map(doc => 
        doc.id === documentId 
          ? { ...doc, uploaded: false }
          : doc
      )
    );
    
    toast({
      title: "Documento eliminado",
      description: "El documento se ha eliminado correctamente",
    });
  };

  const handlePreview = () => {
    navigate('/email-preview');
  };

  const handleSubmit = () => {
    const uploadedDocs = documents.filter(doc => doc.uploaded);
    
    if (uploadedDocs.length === documents.length) {
      toast({
        title: "Documentos enviados",
        description: "Todos los documentos han sido enviados correctamente al mandante",
      });
      navigate(`/project/${paymentState.projectName}`);
    } else {
      toast({
        title: "Documentos faltantes",
        description: "Por favor, carga todos los documentos antes de enviar",
        variant: "destructive",
      });
    }
  };

  const uploadedCount = documents.filter(doc => doc.uploaded).length;
  const totalCount = documents.length;
  const allUploaded = uploadedCount === totalCount;

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      {/* Header */}
      <header className="bg-gloster-white border-b border-gloster-gray/20 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
                alt="Gloster Logo" 
                className="w-8 h-8"
              />
              <h1 className="text-xl font-bold text-slate-800 font-rubik">Estado de Pago - {paymentState.month}</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gloster-gray">
                <span className="font-rubik">Constructora ABC Ltda.</span>
              </div>
              <Button variant="ghost" size="sm" className="text-gloster-gray hover:text-slate-800 font-rubik">
                Cerrar sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Volver al Proyecto - fuera del banner blanco */}
      <div className="bg-slate-50 py-2">
        <div className="container mx-auto px-6">
          <button 
            onClick={() => navigate('/project/1')}
            className="text-gloster-gray hover:text-slate-800 text-sm font-rubik flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Proyecto
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Banner de Resumen - Optimizado para móvil */}
        <Card className="mb-8 border-l-4 border-l-gloster-yellow hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-rubik text-slate-800">Resumen del Estado de Pago</CardTitle>
            <CardDescription className="text-gloster-gray font-rubik">
              Gestiona y envía la documentación para el período de {paymentState.month}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Período</p>
                  <p className="font-semibold text-slate-800 font-rubik">{paymentState.month}</p>
                </div>
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Monto</p>
                  <p className="font-bold text-lg md:text-xl text-slate-800 font-rubik">{formatCurrency(paymentState.amount)}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Fecha de Vencimiento</p>
                  <p className="font-semibold text-slate-800 font-rubik">{paymentState.dueDate}</p>
                </div>
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Estado</p>
                  <Badge variant="secondary" className="bg-gloster-yellow/20 text-gloster-gray border-gloster-gray/30 font-rubik">
                    {paymentState.status}
                  </Badge>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Documentos</p>
                  <p className="font-semibold text-slate-800 font-rubik">{uploadedCount}/{totalCount} completados</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handlePreview}
                    variant="outline"
                    size="sm"
                    className="border-gloster-gray/30 hover:bg-gloster-gray/10 font-rubik flex-1"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Vista Previa
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!allUploaded}
                    size="sm"
                    className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik disabled:opacity-50 flex-1"
                  >
                    Enviar Documentos
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información del Estado de Pago - Optimizado para móvil */}
        <Card className="mb-8 border-gloster-gray/20">
          <CardHeader>
            <CardTitle className="font-rubik text-slate-800 flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gloster-gray" />
              <span>Información del Estado de Pago</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-3">
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Proyecto</p>
                  <p className="font-medium text-slate-800 font-rubik">{paymentState.projectName}</p>
                </div>
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Contratista</p>
                  <p className="font-medium text-slate-800 font-rubik">{paymentState.contractorName}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Project Manager</p>
                  <p className="font-medium text-slate-800 font-rubik">{paymentState.projectManager}</p>
                </div>
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Contacto</p>
                  <p className="font-medium text-slate-800 font-rubik break-words">{paymentState.contactEmail}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Documentos */}
        <Card className="border-gloster-gray/20">
          <CardHeader>
            <CardTitle className="font-rubik text-slate-800 flex items-center space-x-2">
              <FileText className="h-5 w-5 text-gloster-gray" />
              <span>Documentos Requeridos ({uploadedCount}/{totalCount})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {documents.map((doc) => (
                <div 
                  key={doc.id} 
                  className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                    doc.uploaded 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200 hover:border-gloster-gray/50'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3 sm:mb-0 flex-1">
                    {doc.uploaded ? (
                      <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-slate-800 font-rubik text-sm">{doc.name}</h4>
                      <p className="text-gloster-gray text-xs font-rubik">{doc.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    {doc.uploaded ? (
                      <Button
                        onClick={() => handleRemove(doc.id)}
                        variant="outline"
                        size="sm"
                        className="border-red-200 text-red-600 hover:bg-red-50 font-rubik"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleUpload(doc.id)}
                        size="sm"
                        className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Cargar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Banner de Envío */}
        {allUploaded && (
          <Card className="mt-8 bg-gradient-to-r from-gloster-yellow/20 to-gloster-yellow/10 border-gloster-yellow/30">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-800 font-rubik mb-2">
                    ¡Documentación Completa!
                  </h3>
                  <p className="text-gloster-gray font-rubik text-sm">
                    Todos los documentos han sido cargados. Puedes enviar el estado de pago al mandante.
                  </p>
                </div>
                <div className="flex gap-3 min-w-fit">
                  <Button
                    onClick={handlePreview}
                    variant="outline"
                    className="border-gloster-gray/30 hover:bg-white font-rubik"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Vista Previa
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
                  >
                    Enviar al Mandante
                    <ArrowUp className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PaymentDetail;
