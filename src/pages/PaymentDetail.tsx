
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useBeforeUnload } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ArrowLeft, Calendar, Send, CheckCircle, Clock, Eye, Save, Download, FileText, Upload, ExternalLink, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useMandanteNotification } from '@/hooks/useMandanteNotification';
import { useGoogleDriveIntegration } from '@/hooks/useGoogleDriveIntegration';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/PageHeader';
import DocumentUploadCard from '@/components/DocumentUploadCard';
import LoadingModal from '@/components/LoadingModal';
import { useUniqueAccessUrl } from '@/hooks/useUniqueAccessUrl';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use real data from database
  const { payment, loading, refetch } = usePaymentDetail(id || '');
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
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewUploading, setIsPreviewUploading] = useState(false);
  
  // CORRIGIENDO: Estados para los campos editables - Initialize with database values
  const [editableAmount, setEditableAmount] = useState('');
  const [editablePercentage, setEditablePercentage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // NEW: State to track if user has unsaved changes
  const [hasUnsavedFiles, setHasUnsavedFiles] = useState(false);

  // CORRIGIENDO: Initialize editable values when payment data loads
  useEffect(() => {
    if (payment) {
      // Set amount if it exists in database and is not null
      if (payment.Total !== null && payment.Total !== undefined) {
        setEditableAmount(payment.Total.toString());
      }
      
      // Set percentage if it exists in database and is not null
      if (payment.Progress !== null && payment.Progress !== undefined) {
        setEditablePercentage(payment.Progress.toString());
      } else if (payment.Total && payment.projectData?.Budget) {
        // Calculate percentage from amount and budget if Progress is null
        const percentage = (payment.Total / payment.projectData.Budget) * 100;
        setEditablePercentage(percentage.toFixed(2));
      }
    }
  }, [payment]);

  // NEW: Track when files are uploaded but not sent
  useEffect(() => {
    const hasFiles = Object.keys(documentStatus).some(docId => documentStatus[docId as keyof typeof documentStatus]);
    const isSentStatus = payment?.Status === 'Enviado' || payment?.Status === 'Aprobado' || payment?.Status === 'Rechazado';
    setHasUnsavedFiles(hasFiles && !isSentStatus);
  }, [documentStatus, payment?.Status]);

  // NEW: Prevent navigation if files are uploaded but not sent
  useBeforeUnload(
    React.useCallback(() => {
      if (hasUnsavedFiles) {
        return 'Tienes archivos cargados que aún no han sido respaldados. Si sales de la página se perderá el progreso. ¿Estás seguro de que quieres continuar?';
      }
    }, [hasUnsavedFiles])
  );

  // NEW: Custom navigation handler with warning
  const handleNavigation = (targetPath: string) => {
    if (hasUnsavedFiles) {
      const confirmed = window.confirm(
        'Tienes archivos cargados que aún no han sido respaldados y enviados. Si sales de la página se perderá el progreso.\n\nDebes enviar la solicitud o ver la previsualización para que se respalde la información.\n\n¿Estás seguro de que quieres continuar?'
      );
      if (!confirmed) {
        return;
      }
    }
    navigate(targetPath);
  };

  const { ensureUniqueAccessUrl } = useUniqueAccessUrl();

  // NEW: Validation functions for Total and Progress
  const isAmountValid = () => {
    return editableAmount && editableAmount.trim() !== '' && parseFloat(editableAmount) > 0;
  };

  const isProgressValid = () => {
    return editablePercentage && editablePercentage.trim() !== '' && parseFloat(editablePercentage) >= 0;
  };

  const areFieldsValidForActions = () => {
    return isAmountValid() && isProgressValid();
  };

  const getValidationMessage = () => {
    if (!isAmountValid() && !isProgressValid()) {
      return "Por favor completa el monto y porcentaje antes de continuar";
    }
    if (!isAmountValid()) {
      return "Por favor completa el monto antes de continuar";
    }
    if (!isProgressValid()) {
      return "Por favor completa el porcentaje antes de continuar";
    }
    return "";
  };

  // NEW: Show validation alert for required fields
  const showFieldValidationAlert = () => {
    toast({
      title: "Campos obligatorios",
      description: getValidationMessage(),
      variant: "destructive"
    });
  };

  // Format currency based on project currency
  const formatCurrency = (amount: number) => {
    if (!payment?.projectData?.Currency) {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
      }).format(amount);
    }

    if (payment.projectData.Currency === 'UF') {
      return `${amount.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UF`;
    } else if (payment.projectData.Currency === 'USD') {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      }).format(amount);
    } else {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
      }).format(amount);
    }
  };

  // Calcular valores automáticamente
  const handleAmountChange = (value: string) => {
    setEditableAmount(value);
    if (value && payment?.projectData?.Budget) {
      const percentage = (parseFloat(value) / payment.projectData.Budget) * 100;
      setEditablePercentage(percentage.toFixed(2));
    }
  };

  const handlePercentageChange = (value: string) => {
    setEditablePercentage(value);
    if (value && payment?.projectData?.Budget) {
      const amount = (parseFloat(value) / 100) * payment.projectData.Budget;
      setEditableAmount(amount.toString());
    }
  };

  // Guardar cambios en la base de datos
  const handleSaveAmount = async () => {
    if (!payment?.id || !editableAmount) return;
    
    setIsSaving(true);
    try {
      const amount = parseFloat(editableAmount);
      const percentage = editablePercentage ? parseFloat(editablePercentage) : 
        (payment?.projectData?.Budget ? (amount / payment.projectData.Budget) * 100 : 0);

      const { error } = await supabase
        .from('Estados de pago')
        .update({ 
          Total: amount,
          Progress: Math.round(percentage)
        })
        .eq('id', payment.id);

      if (error) throw error;

      toast({
        title: "Datos actualizados",
        description: "El monto y porcentaje del estado de pago se han actualizado correctamente",
      });
      
      refetch();
    } catch (error) {
      console.error('Error updating amount and progress:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la información",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // CORRIGIENDO: Auto-guardar antes de vista previa si hay cambios sin guardar
  const handleAutoSaveBeforePreview = async () => {
    if (editableAmount && payment?.Total?.toString() !== editableAmount) {
      await handleSaveAmount();
    }
  };

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
      required: false,
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

  // Función para verificar si todos los documentos requeridos están cargados
  const areAllRequiredDocumentsUploaded = () => {
    const requiredDocuments = documents.filter(doc => doc.required);
    return requiredDocuments.every(doc => documentStatus[doc.id as keyof typeof documentStatus]);
  };

  // Helper function to check if there are documents to upload for preview
  const hasDocumentsToUpload = () => {
    return Object.keys(documentStatus).some(docId => documentStatus[docId as keyof typeof documentStatus]);
  };

  const handleSendDocuments = async () => {
    // NEW: Validate fields before sending
    if (!areFieldsValidForActions()) {
      showFieldValidationAlert();
      return;
    }

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

    setIsUploading(true);
    console.log('🚀 Starting document upload process...');

    try {
      const uploadResult = await uploadDocumentsToDrive(
        payment.id, 
        uploadedFiles, 
        documentStatus, 
        fileObjects
      );

      if (!uploadResult.success) {
        throw new Error("Error al subir documentos a Google Drive");
      }

      console.log('✅ Documents uploaded successfully to Google Drive');

      // Usar el sistema de enlace único
      const accessUrl = await ensureUniqueAccessUrl(payment.id);
      if (!accessUrl) {
        throw new Error('No se pudo generar el enlace de acceso');
      }

      // Cambiar status a "Enviado"
      const { error: statusError } = await supabase
        .from('Estados de pago')
        .update({ Status: 'Enviado' })
        .eq('id', payment.id);

      if (statusError) {
        console.error('Error updating status:', statusError);
        throw new Error('Error al actualizar el estado');
      }

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

      // Convert uploadedFiles to string array for the notification
      const uploadedDocuments: string[] = [];
      Object.entries(uploadedFiles).forEach(([docId, files]) => {
        if (files && files.length > 0) {
          files.forEach(file => {
            if (typeof file === 'string') {
              uploadedDocuments.push(file);
            } else if (file && typeof file === 'object' && 'name' in file) {
              uploadedDocuments.push(file.name);
            }
          });
        }
      });

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
        uploadedDocuments: uploadedDocuments
      };

      const result = await sendNotificationToMandante(notificationData);
      
      if (result.success) {
        toast({
          title: "Documentos enviados exitosamente",
          description: "Los documentos se han subido a Google Drive y se ha enviado la notificación al mandante",
        });
        
        setTimeout(() => {
          navigate(`/project/${payment?.Project || 2}`);
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Error in upload process:', error);
      toast({
        title: "Error al enviar documentos",
        description: error.message || "Error al subir documentos a Google Drive",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePreviewEmail = async () => {
    // NEW: Validate fields before preview
    if (!areFieldsValidForActions()) {
      showFieldValidationAlert();
      return;
    }

    if (!payment) {
      toast({
        title: "Error",
        description: "No se pueden cargar los datos del estado de pago",
        variant: "destructive"
      });
      return;
    }

    // Auto-guardar antes de vista previa
    await handleAutoSaveBeforePreview();
    
    // Check if there are documents to upload
    if (hasDocumentsToUpload()) {
      setIsPreviewUploading(true);
      console.log('🚀 Uploading documents before preview...');

      try {
        const uploadResult = await uploadDocumentsToDrive(
          payment.id, 
          uploadedFiles, 
          documentStatus, 
          fileObjects
        );

        if (!uploadResult.success) {
          throw new Error("Error al subir documentos a Google Drive");
        }

        console.log('✅ Documents uploaded successfully before preview');
        
        toast({
          title: "Documentos subidos",
          description: "Los documentos se han subido correctamente al Drive",
        });

      } catch (error) {
        console.error('❌ Error uploading documents for preview:', error);
        toast({
          title: "Error al subir documentos",
          description: error.message || "Error al subir documentos a Google Drive",
          variant: "destructive"
        });
        setIsPreviewUploading(false);
        return;
      } finally {
        setIsPreviewUploading(false);
      }
    }

    // Usar el sistema de enlace único para preview también
    await ensureUniqueAccessUrl(payment.id);
    navigate(`/submission-preview?paymentId=${payment.id}`);
  };

  const getCompletedDocumentsCount = () => {
    return documents.filter(doc => documentStatus[doc.id as keyof typeof documentStatus]).length;
  };

  // CORRIGIENDO: Función para mostrar archivos del Drive si el status es "Enviado", "Aprobado" o "Rechazado"
  const shouldShowDriveFiles = () => {
    return payment?.Status === 'Enviado' || payment?.Status === 'Aprobado' || payment?.Status === 'Rechazado';
  };

  // CORRIGIENDO: Función para descargar archivos del Drive
  const handleDownloadFile = async (fileName: string) => {
    if (!payment?.URL) {
      toast({
        title: "Error",
        description: "No se encontró la URL del archivo",
        variant: "destructive"
      });
      return;
    }
    
    try {
      window.open(payment.URL, '_blank');
      
      toast({
        title: "Descarga iniciada",
        description: `Se ha abierto la carpeta del Drive para descargar ${fileName}`,
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error al descargar",
        description: "No se pudo acceder al archivo",
        variant: "destructive"
      });
    }
  };

  // CORRIGIENDO: Check if documents were updated (for enabling send button in sent states)
  const wereDocumentsUpdated = () => {
    return Object.keys(documentStatus).some(docId => documentStatus[docId as keyof typeof documentStatus]);
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
        
        {/* Loading Modal for uploads and preview */}
        <LoadingModal 
          isOpen={isUploading || isPreviewUploading}
          title={isPreviewUploading ? "Subiendo documentos para vista previa..." : "Subiendo documentos..."}
          description={isPreviewUploading ? "Por favor espera mientras se suben los documentos al Drive antes de mostrar la vista previa" : "Por favor espera mientras se procesa la información y se envía la notificación al mandante"}
        />

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
              onClick={() => handleNavigation(`/project/${payment?.Project || 2}`)}
              className="text-gloster-gray hover:text-slate-800 text-sm font-rubik flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Proyecto
            </button>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 font-rubik">Estado de Pago y Documentación</h3>
          
          {/* NEW: Validation Warning Card - Show when fields are incomplete */}
          {!areFieldsValidForActions() && !shouldShowDriveFiles() && (
            <Card className="mb-6 border-l-4 border-l-orange-500 bg-orange-50/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-orange-600 shrink-0" />
                  <div>
                    <p className="font-medium text-orange-800 font-rubik">Campos requeridos incompletos</p>
                    <p className="text-sm text-orange-700 font-rubik mt-1">
                      {getValidationMessage()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* NEW: Unsaved Files Warning Card */}
          {hasUnsavedFiles && (
            <Card className="mb-6 border-l-4 border-l-yellow-500 bg-yellow-50/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0" />
                  <div>
                    <p className="font-medium text-yellow-800 font-rubik">Archivos sin respaldar</p>
                    <p className="text-sm text-yellow-700 font-rubik mt-1">
                      Tienes archivos cargados que aún no han sido respaldados. Debes enviar la solicitud o ver la previsualización para respaldar la información.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
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
                    <div className="sm:col-span-2 lg:col-span-1">
                      <p className="text-gloster-gray text-sm font-rubik mb-2">Monto del Estado</p>
                      {shouldShowDriveFiles() ? (
                        <p className="font-bold text-lg md:text-xl text-slate-800 font-rubik break-words">
                          {formatCurrency(paymentState.amount)}
                        </p>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gloster-gray">{payment?.projectData?.Currency || 'CLP'}</span>
                          <Input
                            type="number"
                            value={editableAmount}
                            onChange={(e) => handleAmountChange(e.target.value)}
                            placeholder="Ingrese monto"
                            className={`w-40 ${!isAmountValid() ? 'border-orange-500 focus:border-orange-500' : ''}`}
                          />
                          <Button
                            size="sm"
                            onClick={handleSaveAmount}
                            disabled={isSaving}
                            className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black"
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-gloster-gray text-sm font-rubik mb-2">% Avance Financiero</p>
                      {shouldShowDriveFiles() ? (
                        <p className="font-semibold text-slate-800 font-rubik">
                          {payment?.projectData?.Budget ? 
                            ((paymentState.amount / payment.projectData.Budget) * 100).toFixed(2) + '%' : 
                            'N/A'
                          }
                        </p>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Input
                            type="number"
                            value={editablePercentage}
                            onChange={(e) => handlePercentageChange(e.target.value)}
                            placeholder="0"
                            className={`w-20 ${!isProgressValid() ? 'border-orange-500 focus:border-orange-500' : ''}`}
                          />
                          <span className="text-sm text-gloster-gray">%</span>
                        </div>
                      )}
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
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button
                            onClick={handlePreviewEmail}
                            variant="outline"
                            className="border-gloster-gray/30 hover:bg-gloster-gray/10 font-rubik w-full"
                            size="sm"
                            disabled={isUploading || isPreviewUploading || (!areAllRequiredDocumentsUploaded() && !shouldShowDriveFiles()) || !areFieldsValidForActions()}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Vista Previa
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {!areFieldsValidForActions() && (
                        <TooltipContent>
                          <p>{getValidationMessage()}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button
                            onClick={handleSendDocuments}
                            disabled={
                              shouldShowDriveFiles() 
                                ? !wereDocumentsUpdated() || isUploading || isPreviewUploading || !areFieldsValidForActions()
                                : !documents.filter(d => d.required).every(d => documentStatus[d.id as keyof typeof documentStatus]) || isUploading || isPreviewUploading || !areFieldsValidForActions()
                            }
                            className="bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-300 font-rubik w-full"
                            size="sm"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            {isUploading ? 'Enviando...' : 'Enviar'}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {!areFieldsValidForActions() && (
                        <TooltipContent>
                          <p>{getValidationMessage()}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* CORRIGIENDO: Mostrar archivos del Drive si el status es "Enviado", "Aprobado" o "Rechazado" */}
          {shouldShowDriveFiles() && (
            <Card className="mb-8 border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="font-rubik text-lg text-slate-800">Documentos en Drive</CardTitle>
                <CardDescription className="font-rubik">
                  Los documentos se encuentran almacenados en Google Drive. Puedes actualizar cualquier documento si es necesario.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.filter(doc => doc.required).map((doc) => (
                    <div key={doc.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex flex-col space-y-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-800 font-rubik text-sm">{doc.name}</h4>
                          <p className="text-xs text-gloster-gray font-rubik mt-1">{doc.description}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownloadFile(doc.name)}
                            className="flex-1"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            <span className="text-xs">Descargar</span>
                          </Button>
                          {doc.downloadUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(doc.downloadUrl, '_blank')}
                              className="flex-1"
                            >
                              <ExternalLink className="h-4 w-4 mr-1" />
                              <span className="text-xs">Visitar</span>
                            </Button>
                          )}
                          <Button
                            size="sm"
                            onClick={() => handleDocumentUpload(doc.id)}
                            className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black flex-1"
                          >
                            <Upload className="h-4 w-4 mr-1" />
                            <span className="text-xs">Actualizar</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents List - Solo mostrar si no es "Enviado", "Aprobado" o "Rechazado" */}
          {!shouldShowDriveFiles() && (
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
          )}

          {/* Send Documents Banner - Solo mostrar si no es "Enviado", "Aprobado" o "Rechazado" */}
          {!shouldShowDriveFiles() && (
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
                        Una vez que hayas cargado todos los documentos requeridos y completado el monto y porcentaje, puedes enviarlos para su procesamiento.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button
                            onClick={handlePreviewEmail}
                            variant="outline"
                            className="border-gloster-gray/30 hover:bg-gloster-gray/10 font-rubik px-6 md:px-8 py-3 w-full sm:w-auto"
                            size="lg"
                            disabled={isUploading || isPreviewUploading || !areAllRequiredDocumentsUploaded() || !areFieldsValidForActions()}
                          >
                            <Eye className="h-5 w-5 mr-2" />
                            {isPreviewUploading ? 'Subiendo...' : 'Vista Previa'}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {!areFieldsValidForActions() && (
                        <TooltipContent>
                          <p>{getValidationMessage()}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Button
                            onClick={handleSendDocuments}
                            disabled={!documents.filter(d => d.required).every(d => documentStatus[d.id as keyof typeof documentStatus]) || isUploading || isPreviewUploading || !areFieldsValidForActions()}
                            className="bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-300 font-rubik px-6 md:px-8 py-3 w-full sm:w-auto"
                            size="lg"
                          >
                            <Send className="h-5 w-5 mr-2" />
                            {isUploading ? 'Subiendo...' : 'Enviar Email y Documentos'}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      {!areFieldsValidForActions() && (
                        <TooltipContent>
                          <p>{getValidationMessage()}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default PaymentDetail;
