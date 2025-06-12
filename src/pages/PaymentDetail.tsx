
import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, Download, Upload, FileText, ExternalLink, Send, Calendar, DollarSign, HelpCircle, CheckCircle, Clock, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  const [documentStatus, setDocumentStatus] = useState({
    eepp: false,
    planilla: false,
    cotizaciones: false,
    f30: false,
    f30_1: false,
    examenes: false,
    finiquito: false,
    factura: false
  });

  const [uploadedFiles, setUploadedFiles] = useState({
    eepp: [],
    planilla: [],
    cotizaciones: [],
    f30: [],
    f30_1: [],
    examenes: [],
    finiquito: [],
    factura: []
  });

  const [achs_selection, setAchsSelection] = useState('');

  // Datos simulados del estado de pago
  const paymentState = {
    id: parseInt(id || '1'),
    month: "Mayo 2024",
    status: "pendiente",
    amount: 28000000,
    dueDate: "2024-05-30",
    projectName: "Centro Comercial Plaza Norte",
    recipient: "aadelpino97@gmail.com"
  };

  const documents = [
    {
      id: 'eepp',
      name: 'Carátula EEPP',
      description: 'Presentación y resumen del estado de pago',
      downloadUrl: null,
      uploaded: false,
      required: true,
      isUploadOnly: true,
      helpText: 'Este documento debe ser preparado internamente por el contratista y debe incluir un resumen completo del estado de pago, incluyendo avances, montos y documentación adjunta.'
    },
    {
      id: 'planilla',
      name: 'Avance Periódico',
      description: 'Planilla detallada del avance de obras del período',
      downloadUrl: null,
      uploaded: false,
      required: true,
      isUploadOnly: true,
      helpText: 'Documenta el progreso específico de las obras durante el período. Debe incluir fotografías, mediciones y descripción detallada de los trabajos realizados.'
    },
    {
      id: 'cotizaciones',
      name: 'Certificado de Pago de Cotizaciones Previsionales',
      description: 'Certificado de cumplimiento de obligaciones previsionales',
      downloadUrl: 'https://www.previred.com/wPortal/login/login.jsp',
      uploaded: false,
      required: true,
      helpText: 'Ingresa a Previred con tu RUT y clave, dirígete a "Certificados" y descarga el certificado de pago de cotizaciones del período correspondiente.'
    },
    {
      id: 'f30',
      name: 'Certificado F30',
      description: 'Certificado de antecedentes laborales y previsionales',
      downloadUrl: 'https://midt.dirtrab.cl/empleador/certificadosLaboralesPrevisionales',
      uploaded: false,
      required: true,
      helpText: 'Accede al portal de la Dirección del Trabajo, ingresa con tu ClaveÚnica y genera el certificado F30 que acredita el cumplimiento de obligaciones laborales.'
    },
    {
      id: 'f30_1',
      name: 'Certificado F30-1',
      description: 'Certificado de cumplimiento de obligaciones laborales y previsionales',
      downloadUrl: 'https://midt.dirtrab.cl/empleador/certificadosLaboralesPrevisionales',
      uploaded: false,
      required: true,
      helpText: 'Si tienes trabajadores extranjeros, debes generar este certificado adicional desde el mismo portal de la Dirección del Trabajo.'
    },
    {
      id: 'examenes',
      name: 'Exámenes Preocupacionales',
      description: 'Certificado de examenes preventivos para trabajos en faena de cada trabajador que corresponda',
      downloadUrl: null,
      uploaded: false,
      required: true,
      hasDropdown: true,
      allowMultiple: true,
      helpText: 'Selecciona el organismo administrador según la afiliación de tus trabajadores y descarga los certificados de exámenes preocupacionales vigentes.'
    },
    {
      id: 'finiquito',
      name: 'Finiquitos',
      description: 'Finiquitos de trabajadores que terminaron en el período',
      downloadUrl: 'https://midt.dirtrab.cl/empleador/finiquitos',
      uploaded: false,
      required: true,
      allowMultiple: true,
      helpText: 'Solo requerido si hubo trabajadores que terminaron su relación laboral en el período. Genera los finiquitos desde el portal de la Dirección del Trabajo.'
    },
    {
      id: 'factura',
      name: 'Factura',
      description: 'Factura del período correspondiente',
      downloadUrl: 'https://zeusr.sii.cl/AUT2000/InicioAutenticacion/IngresoRutClave.html?https://www1.sii.cl/cgi-bin/Portal001/mipeSelEmpresa.cgi?DESDE_DONDE_URL=OPCION%3D33%26TIPO%3D4',
      uploaded: false,
      required: true,
      helpText: 'Accede al portal del SII con tu RUT y clave, dirígete a "Facturación electrónica" y emite la factura correspondiente al período de trabajo.'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleFileUpload = (documentId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    const doc = documents.find(d => d.id === documentId);
    const allowedTypes = ['application/pdf', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel.sheet.macroEnabled.12', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    const validFiles = Array.from(files).filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Formato no válido",
          description: `El archivo ${file.name} no es un formato válido. Solo se aceptan PDF, CSV, XLSX, XLSM y DOCX.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setDocumentStatus(prev => ({
      ...prev,
      [documentId]: true
    }));

    const fileNames = validFiles.map(file => file.name);
    setUploadedFiles(prev => ({
      ...prev,
      [documentId]: doc?.allowMultiple 
        ? [...prev[documentId], ...fileNames]
        : fileNames
    }));

    toast({
      title: "Documento(s) cargado(s)",
      description: `${validFiles.length} archivo(s) se han cargado exitosamente`,
    });
  };

  const handleDocumentUpload = (documentId: string) => {
    const input = fileInputRefs.current[documentId];
    if (input) {
      input.click();
    }
  };

  const getExamenesUrl = () => {
    switch (achs_selection) {
      case 'achs':
        return 'https://achsvirtual.achs.cl/achs/';
      case 'ist':
        return 'https://evaluacioneslaborales.ist.cl/istreservas/web';
      case 'mutual':
        return 'https://www.mutual.cl/portal/publico/mutual/inicio/cuenta-usuario/inicio-sesion/';
      default:
        return '';
    }
  };

  const handleSendDocuments = () => {
    const requiredDocuments = documents.filter(doc => doc.required);
    const allRequiredUploaded = requiredDocuments.every(doc => documentStatus[doc.id as keyof typeof documentStatus]);
    
    if (!allRequiredUploaded) {
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
      navigate('/project/2');
    }, 2000);
  };

  const handlePreviewEmail = () => {
    navigate('/email-preview');
  };

  const getCompletedDocumentsCount = () => {
    return documents.filter(doc => documentStatus[doc.id as keyof typeof documentStatus]).length;
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50 font-rubik">
        <PageHeader />

        {/* Hidden file inputs */}
        {documents.map(doc => (
          <input
            key={doc.id}
            type="file"
            ref={el => fileInputRefs.current[doc.id] = el}
            onChange={e => handleFileUpload(doc.id, e.target.files)}
            accept=".pdf,.csv,.xlsx,.xlsm,.docx"
            multiple={doc.allowMultiple}
            style={{ display: 'none' }}
          />
        ))}

        {/* Volver al Proyecto - fuera del banner blanco */}
        <div className="bg-slate-50 py-2">
          <div className="container mx-auto px-6">
            <button 
              onClick={() => navigate('/project/2')}
              className="text-gloster-gray hover:text-slate-800 text-sm font-rubik flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Proyecto
            </button>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          {/* Título */}
          <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 font-rubik">Estado de Pago y Documentación</h3>
          
          {/* Banners superiores ajustados */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Payment Info Banner Card - más ancho */}
            <div className="lg:col-span-2">
              <Card className="border-l-4 border-l-gloster-yellow hover:shadow-xl transition-all duration-300 h-full">
                <CardHeader className="pb-4">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="w-12 h-12 bg-gloster-yellow/20 rounded-lg flex items-center justify-center shrink-0">
                        <Calendar className="h-6 w-6 text-gloster-gray" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-xl md:text-2xl mb-2 font-rubik text-slate-800">{paymentState.month}</CardTitle>
                        <CardDescription className="text-gloster-gray font-rubik text-sm md:text-base">
                          {paymentState.projectName}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-gloster-gray/20 text-gloster-gray border-gloster-gray/30 self-start shrink-0">
                      {paymentState.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <p className="text-gloster-gray text-sm font-rubik">Monto del Estado</p>
                      <p className="font-bold text-lg md:text-xl text-slate-800 font-rubik break-words">{formatCurrency(paymentState.amount)}</p>
                    </div>
                    <div>
                      <p className="text-gloster-gray text-sm font-rubik">Fecha de Vencimiento</p>
                      <p className="font-semibold text-slate-800 font-rubik">{paymentState.dueDate}</p>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-1">
                      <p className="text-gloster-gray text-sm font-rubik">Destinatario</p>
                      <p className="font-semibold text-slate-800 font-rubik break-words">{paymentState.recipient}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Summary Card - más compacto */}
            <div className="lg:col-span-1">
              <Card className="border-gloster-gray/20 hover:shadow-xl transition-all duration-300 h-full">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-2 font-rubik text-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-slate-800">Resumen</span>
                  </CardTitle>
                  <CardDescription className="font-rubik text-sm">
                    {getCompletedDocumentsCount()} de {documents.length} documentos cargados
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 mb-4">
                    <p className="text-gloster-gray font-rubik text-xs mb-3">
                      Para procesar este estado de pago, debes obtener cada documento, cargar los archivos y luego enviarlos.
                    </p>
                  </div>
                  <div className="space-y-1 mb-4 max-h-32 md:max-h-40 overflow-y-auto">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between text-xs">
                        <span className="font-rubik text-slate-700 truncate flex-1 pr-2">{doc.name}</span>
                        {documentStatus[doc.id as keyof typeof documentStatus] ? (
                          <CheckCircle className="h-3 w-3 text-green-600 shrink-0" />
                        ) : (
                          <Clock className="h-3 w-3 text-gloster-gray shrink-0" />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={handlePreviewEmail}
                      variant="outline"
                      className="border-gloster-gray/30 hover:bg-gloster-gray/10 font-rubik"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Vista Previa
                    </Button>
                    <Button
                      onClick={handleSendDocuments}
                      disabled={!documents.filter(d => d.required).every(d => documentStatus[d.id as keyof typeof documentStatus])}
                      className="bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-300 font-rubik"
                      size="sm"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Enviar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Documents List - Vertical Layout */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg md:text-xl font-bold text-slate-800 font-rubik">Documentación Requerida</h3>
            
            <div className="space-y-4">
              {documents.map((doc) => (
                <Card 
                  key={doc.id} 
                  className="border-l-4 border-l-gloster-gray/30"
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex items-start space-x-4 flex-1 min-w-0">
                        <Checkbox 
                          checked={documentStatus[doc.id as keyof typeof documentStatus]} 
                          disabled
                          className="mt-1 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-slate-800 font-rubik text-sm md:text-base">{doc.name}</h4>
                            <Tooltip>
                              <TooltipTrigger>
                                <HelpCircle className="h-4 w-4 text-gloster-gray hover:text-slate-800 shrink-0" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="font-rubik text-sm">{doc.helpText}</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          <p className="text-gloster-gray text-sm mb-3 font-rubik">{doc.description}</p>
                          
                          {doc.hasDropdown && (
                            <div className="mb-3">
                              <Select onValueChange={setAchsSelection}>
                                <SelectTrigger className="w-full md:w-64">
                                  <SelectValue placeholder="Selecciona el organismo" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="achs">ACHS</SelectItem>
                                  <SelectItem value="ist">IST</SelectItem>
                                  <SelectItem value="mutual">Mutual</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          
                          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                            {!doc.isUploadOnly && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const url = doc.hasDropdown ? getExamenesUrl() : doc.downloadUrl;
                                  if (url) window.open(url, '_blank');
                                }}
                                disabled={doc.hasDropdown && !achs_selection}
                                className="text-gloster-gray hover:text-slate-800 border-gloster-gray/30 font-rubik w-full sm:w-auto"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Obtener Documentos
                                <ExternalLink className="h-3 w-3 ml-2" />
                              </Button>
                            )}
                            
                            {documentStatus[doc.id as keyof typeof documentStatus] ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-700">
                                ✓ Cargado{doc.allowMultiple ? ' (múltiples)' : ''}
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleDocumentUpload(doc.id)}
                                className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik w-full sm:w-auto"
                              >
                                <Upload className="h-4 w-4 mr-2" />
                                Cargar Documento{doc.allowMultiple ? 's' : ''}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* File Preview Section */}
                      {uploadedFiles[doc.id].length > 0 && (
                        <div className="w-full lg:w-auto lg:ml-4 min-w-0 lg:max-w-xs">
                          <p className="text-gloster-gray text-xs font-rubik mb-2">Archivos cargados:</p>
                          <div className="space-y-1">
                            {uploadedFiles[doc.id].map((fileName, index) => (
                              <div key={index} className="bg-green-50 border border-green-200 rounded px-2 py-1">
                                <p className="text-green-700 text-xs font-rubik truncate" title={fileName}>
                                  {fileName}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Banner de envío al final */}
          <Card className="border-l-4 border-l-green-500 bg-green-50/50">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                    <Send className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 font-rubik mb-1">¿Listo para enviar?</h3>
                    <p className="text-gloster-gray text-sm font-rubik">
                      Una vez que hayas cargado todos los documentos requeridos, puedes enviarlos para su procesamiento.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <Button
                    onClick={handlePreviewEmail}
                    variant="outline"
                    className="border-gloster-gray/30 hover:bg-gloster-gray/10 font-rubik px-6 md:px-8 py-3 w-full sm:w-auto"
                    size="lg"
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    Vista Previa
                  </Button>
                  <Button
                    onClick={handleSendDocuments}
                    disabled={!documents.filter(d => d.required).every(d => documentStatus[d.id as keyof typeof documentStatus])}
                    className="bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-300 font-rubik px-6 md:px-8 py-3 w-full sm:w-auto"
                    size="lg"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    Enviar Documentos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default PaymentDetail;
