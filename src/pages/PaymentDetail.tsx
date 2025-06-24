
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ArrowLeft, Calendar, Send, CheckCircle, Clock, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useMandanteNotification } from '@/hooks/useMandanteNotification';
import { useGoogleDriveIntegration } from '@/hooks/useGoogleDriveIntegration';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import PageHeader from '@/components/PageHeader';
import DocumentUploadCard from '@/components/DocumentUploadCard';
import { supabase } from '@/integrations/supabase/client';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use real data from database
  const { payment, loading } = usePaymentDetail(id || '');
  const { sendNotificationToMandante, loading: notificationLoading } = useMandanteNotification();
  const { uploadDocumentsToDrive, loading: driveLoading } = useGoogleDriveIntegration();

  // Use the document upload hook
  const {
    documentStatus,
    uploadedFiles,
    fileObjects,
    dragStates,
    fileInputRefs,
    handleFileUpload,
    handleFileRemove,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDocumentUpload,
  } = useDocumentUpload();

  const [achsSelection, setAchsSelection] = useState('');

  // Map database data to match the UI structure
  const paymentState = payment ? {
    id: payment.id,
    month: `${payment.Mes} ${payment.Año}`,
    status: payment.Status || "pendiente",
    amount: payment.Total || 0,
    dueDate: payment.ExpiryDate,
    projectName: payment.projectData?.Name || "",
    contractorName: payment.projectData?.Contratista?.CompanyName || "",
    clientName: payment.projectData?.Owner?.CompanyName || "",
    recipient: payment.projectData?.Owner?.ContactEmail || ""
  } : {
    id: parseInt(id || '1'),
    month: "Cargando...",
    status: "pendiente",
    amount: 0,
    dueDate: "",
    projectName: "Cargando...",
    contractorName: "Cargando...",
    clientName: "Cargando...",
    recipient: ""
  };

  // Document definitions
  const documents = [
    {
      id: 'eepp',
      name: 'Carátula EEPP',
      description: 'Presentación y resumen del estado de pago',
      downloadUrl: null,
      uploaded: false,
      required: payment.projectData?.Requirement.include?('Carátula EEPP'),
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

  const getExamenesUrl = () => {
    switch (achsSelection) {
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

  const generateUniqueURLAndUpdate = async () => {
    if (!payment || !payment.projectData) {
      toast({
        title: "Error",
        description: "No se pueden cargar los datos del estado de pago",
        variant: "destructive"
      });
      return null;
    }

    try {
      const uniqueId = crypto.randomUUID();
      const mandanteUrl = `${window.location.origin}/email-access?paymentId=${payment.id}&token=${uniqueId}`;

      const { error: updateError } = await supabase
        .from('Estados de pago')
        .update({ URLMandante: mandanteUrl })
        .eq('id', payment.id);

      if (updateError) {
        console.error('Error updating URLMandante:', updateError);
        throw new Error('Error al actualizar la URL del mandante');
      }

      return mandanteUrl;
    } catch (error) {
      console.error('Error generating unique URL:', error);
      toast({
        title: "Error",
        description: "Error al generar URL única",
        variant: "destructive"
      });
      return null;
    }
  };

  const handleSendDocuments = async () => {
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

    if (!payment || !payment.projectData) {
      toast({
        title: "Error",
        description: "No se pueden cargar los datos del estado de pago",
        variant: "destructive"
      });
      return;
    }

    console.log('🚀 Starting document upload process...');

    try {
      const uploadResult = await uploadDocumentsToDrive(
        payment.id, 
        uploadedFiles, 
        documentStatus, 
        fileObjects
      );

      if (!uploadResult.success) {
        toast({
          title: "Error al subir documentos",
          description: "No se pudieron subir los documentos a Google Drive",
          variant: "destructive"
        });
        return;
      }

      console.log('✅ Documents uploaded successfully to Google Drive');
    } catch (error) {
      console.error('❌ Error uploading documents:', error);
      toast({
        title: "Error al subir documentos",
        description: "Error al subir documentos a Google Drive",
        variant: "destructive"
      });
      return;
    }

    const mandanteUrl = await generateUniqueURLAndUpdate();
    if (!mandanteUrl) return;

    // Get the payment state data to fetch the URL
    const { data: paymentStateData, error: paymentStateError } = await supabase
      .from('Estados de pago')
      .select('URL')
      .eq('id', payment.id)
      .single();

    if (paymentStateError) {
      console.error('Error fetching payment state URL:', paymentStateError);
      toast({
        title: "Error",
        description: "No se pudo obtener la URL del estado de pago",
        variant: "destructive"
      });
      return;
    }

    const notificationData = {
      paymentId: payment.id.toString(),
      contratista: payment.projectData.Contratista?.ContactName || '',
      mes: payment.Mes || '',
      año: payment.Año || 0,
      proyecto: payment.projectData.Name || '',
      mandanteEmail: payment.projectData.Owner?.ContactEmail || '',
      mandanteCompany: payment.projectData.Owner?.CompanyName || '',
      contractorCompany: payment.projectData.Contratista?.CompanyName || '',
      amount: payment.Total || 0,
      dueDate: payment.ExpiryDate || '',
      driveUrl: paymentStateData.URL || '',
      uploadedDocuments: uploadedFiles
    };

    const result = await sendNotificationToMandante(notificationData);
    
    if (result.success) {
      setTimeout(() => {
        navigate(`/project/${payment?.Project || 2}`);
      }, 2000);
    }
  };

  const handlePreviewEmail = async () => {
    if (!payment) {
      toast({
        title: "Error",
        description: "No se pueden cargar los datos del estado de pago",
        variant: "destructive"
      });
      return;
    }

    await generateUniqueURLAndUpdate();
    navigate(`/submission-preview?paymentId=${payment.id}`);
  };

  const getCompletedDocumentsCount = () => {
    return documents.filter(doc => documentStatus[doc.id as keyof typeof documentStatus]).length;
  };

  if (loading) {
    return (
      <TooltipProvider>
        <div className="min-h-screen bg-slate-50 font-rubik">
          <PageHeader />
          <div className="container mx-auto px-6 py-8">
            <div className="text-center">Cargando estado de pago...</div>
          </div>
        </div>
      </TooltipProvider>
    );
  }

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
            onChange={e => handleFileUpload(doc.id, e.target.files, doc.allowMultiple)}
            accept=".pdf,.csv,.xlsx,.xlsm,.docx"
            multiple={doc.allowMultiple}
            style={{ display: 'none' }}
          />
        ))}

        {/* Volver al Proyecto */}
        <div className="bg-slate-50 py-2">
          <div className="container mx-auto px-6">
            <button 
              onClick={() => navigate(`/project/${payment?.Project || 2}`)}
              className="text-gloster-gray hover:text-slate-800 text-sm font-rubik flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Proyecto
            </button>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 font-rubik">Estado de Pago y Documentación</h3>
          
          {/* Payment Info and Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
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
                    {documents.map((doc) => doc.required ? (
                      <div key={doc.id} className="flex items-center justify-between text-xs">
                        <span className="font-rubik text-slate-700 truncate flex-1 pr-2">{doc.name}</span>
                        {documentStatus[doc.id as keyof typeof documentStatus] ? (
                          <CheckCircle className="h-3 w-3 text-green-600 shrink-0" />
                        ) : (
                          <Clock className="h-3 w-3 text-gloster-gray shrink-0" />
                        )}
                      </div>
                    ): null)}
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
                      disabled={!documents.filter(d => d.required).every(d => documentStatus[d.id as keyof typeof documentStatus]) || notificationLoading}
                      className="bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-300 font-rubik"
                      size="sm"
                    >
                      <Send className="h-4 w-4 mr-1" />
                      {notificationLoading ? 'Enviando...' : 'Enviar'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Documents List */}
          <div className="space-y-4 mb-8">
            <h3 className="text-lg md:text-xl font-bold text-slate-800 font-rubik">Documentación Requerida</h3>
            
            <div className="space-y-4">
              {documents.map((doc) => doc.required ? (
                <DocumentUploadCard
                  key={doc.id}
                  doc={doc}
                  documentStatus={documentStatus[doc.id as keyof typeof documentStatus]}
                  uploadedFiles={uploadedFiles[doc.id as keyof typeof uploadedFiles]}
                  dragState={dragStates[doc.id as keyof typeof dragStates]}
                  achsSelection={achsSelection}
                  setAchsSelection={setAchsSelection}
                  onDragOver={(e) => handleDragOver(e, doc.id)}
                  onDragLeave={(e) => handleDragLeave(e, doc.id)}
                  onDrop={(e) => handleDrop(e, doc.id, doc.allowMultiple)}
                  onDocumentUpload={() => handleDocumentUpload(doc.id)}
                  onFileRemove={(fileIndex) => handleFileRemove(doc.id, fileIndex)}
                  getExamenesUrl={getExamenesUrl}
                />) : null
              )}
            </div>
          </div>

          {/* Send Documents Banner */}
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
                    disabled={!documents.filter(d => d.required).every(d => documentStatus[d.id as keyof typeof documentStatus]) || notificationLoading || driveLoading}
                    className="bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-300 font-rubik px-6 md:px-8 py-3 w-full sm:w-auto"
                    size="lg"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    {notificationLoading || driveLoading ? 'Enviando...' : 'Enviar Email y Documentos'}
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
