import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useMandanteNotification } from '@/hooks/useMandanteNotification';
import { useGoogleDriveIntegration } from '@/hooks/useGoogleDriveIntegration';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { useDirectDriveDownload } from '@/hooks/useDirectDriveDownload';
import { useUniqueAccessUrl } from '@/hooks/useUniqueAccessUrl';
import { usePaymentValidation } from '@/hooks/usePaymentValidation';
import { usePaymentActions } from '@/hooks/usePaymentActions';
import { supabase } from '@/integrations/supabase/client';
import { TooltipProvider } from '@/components/ui/tooltip';
import PageHeader from '@/components/PageHeader';
import DocumentUploadCard from '@/components/DocumentUploadCard';
import LoadingModal from '@/components/LoadingModal';
import PaymentInfoCard from '@/components/payment/PaymentInfoCard';
import PaymentSummaryCard from '@/components/payment/PaymentSummaryCard';
import ValidationWarningCard from '@/components/payment/ValidationWarningCard';
import DriveFilesCard from '@/components/payment/DriveFilesCard';
import SendDocumentsBanner from '@/components/payment/SendDocumentsBanner';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use real data from database
  const { payment, loading, refetch } = usePaymentDetail(id || '');
  const { sendNotificationToMandante, loading: notificationLoading } = useMandanteNotification();
  const { uploadDocumentsToDrive, loading: driveLoading } = useGoogleDriveIntegration();
  const { downloadDocument, loading: downloadLoading } = useDirectDriveDownload();

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
  
  // Estados para los campos editables - Initialize with database values
  const [editableAmount, setEditableAmount] = useState('');
  const [editablePercentage, setEditablePercentage] = useState('');

  // Use validation hook
  const {
    isAmountValid,
    isProgressValid,
    areFieldsValidForActions,
    getValidationMessage,
    hasUnsavedFiles
  } = usePaymentValidation(editableAmount, editablePercentage, documentStatus, payment?.Status);

  // Use payment actions hook
  const {
    isSaving,
    formatCurrency,
    handleAmountChange,
    handlePercentageChange,
    handleSaveAmount,
    handleNavigation
  } = usePaymentActions(payment, editableAmount, editablePercentage, refetch);

  // Initialize editable values when payment data loads
  useEffect(() => {
    if (payment) {
      if (payment.Total !== null && payment.Total !== undefined) {
        setEditableAmount(payment.Total.toString());
      }
      
      if (payment.Progress !== null && payment.Progress !== undefined) {
        setEditablePercentage(payment.Progress.toString());
      } else if (payment.Total && payment.projectData?.Budget) {
        const percentage = (payment.Total / payment.projectData.Budget) * 100;
        setEditablePercentage(percentage.toFixed(2));
      }
    }
  }, [payment]);

  // Replace useBeforeUnload with proper useEffect implementation
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedFiles) {
        const message = 'Tienes archivos cargados que aún no han sido respaldados. Si sales de la página se perderá el progreso. ¿Estás seguro de que quieres continuar?';
        event.preventDefault();
        event.returnValue = message;
        return message;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedFiles]);

  const { ensureUniqueAccessUrl } = useUniqueAccessUrl();

  const showFieldValidationAlert = () => {
    toast({
      title: "Campos obligatorios",
      description: getValidationMessage(),
      variant: "destructive"
    });
  };

  // Document definitions
  const allDocuments = [
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

  // Filter documents based on project requirements
  const documents = React.useMemo(() => {
    if (!payment?.projectData?.Requierment || !Array.isArray(payment.projectData.Requierment)) {
      return allDocuments.filter(doc => doc.required);
    }

    const projectRequirements = payment.projectData.Requierment;
    console.log('🔍 Project requirements:', projectRequirements);
    
    return allDocuments.filter(doc => {
      // Always include 'planilla' as it's always required
      if (doc.id === 'planilla') return true;
      
      // Filter based on project requirements
      const isRequiredByProject = projectRequirements.includes(doc.id);
      console.log(`📄 Document "${doc.name}" (${doc.id}): ${isRequiredByProject ? 'INCLUDED' : 'EXCLUDED'}`);
      
      return isRequiredByProject;
    });
  }, [payment?.projectData?.Requierment]);

  console.log('📋 Final filtered documents:', documents.map(d => d.name));

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

  // Auto-guardar antes de vista previa si hay cambios sin guardar
  const handleAutoSaveBeforePreview = async () => {
    if (editableAmount && payment?.Total?.toString() !== editableAmount) {
      await handleSaveAmount();
    }
  };

  // CORRIGIENDO: Función para mostrar archivos del Drive si el status es "Enviado", "Aprobado" o "Rechazado"
  const shouldShowDriveFiles = () => {
    return payment?.Status === 'Enviado' || payment?.Status === 'Aprobado' || payment?.Status === 'Rechazado';
  };

  // Check if documents were updated (for enabling send button in sent states)
  const wereDocumentsUpdated = () => {
    return Object.keys(documentStatus).some(docId => documentStatus[docId as keyof typeof documentStatus]);
  };

  // Get completed documents count
  const getCompletedDocumentsCount = () => {
    return documents.filter(doc => documentStatus[doc.id as keyof typeof documentStatus]).length;
  };

  // Handle direct download from Drive
  const handleDownloadFile = async (fileName: string) => {
    if (!payment?.id) {
      toast({
        title: "Error",
        description: "No se pudo identificar el estado de pago",
        variant: "destructive"
      });
      return;
    }
    
    console.log(`📥 Downloading document: ${fileName} for payment ID: ${payment.id}`);
    await downloadDocument(payment.id.toString(), fileName);
  };

  const handleSendDocuments = async () => {
    // Validate fields before sending
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
    // Validate fields before preview
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

  const isUploadingOrPreviewing = isUploading || isPreviewUploading;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50 font-rubik">
        <PageHeader />
        
        {/* Loading Modal for uploads and preview */}
        <LoadingModal 
          isOpen={isUploadingOrPreviewing}
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
              onClick={() => handleNavigation(`/project/${payment?.Project || 2}`, hasUnsavedFiles)}
              className="text-gloster-gray hover:text-slate-800 text-sm font-rubik flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Proyecto
            </button>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 font-rubik">Estado de Pago y Documentación</h3>
          
          {/* Validation Warning Card - Show when fields are incomplete */}
          {!areFieldsValidForActions() && !shouldShowDriveFiles() && (
            <ValidationWarningCard 
              type="validation"
              message={getValidationMessage()}
            />
          )}

          {/* Unsaved Files Warning Card */}
          {hasUnsavedFiles && (
            <ValidationWarningCard 
              type="unsaved"
              message="Tienes archivos cargados que aún no han sido respaldados. Debes enviar la solicitud o ver la previsualización para respaldar la información."
            />
          )}
          
          {/* Payment Info and Summary Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              {payment && (
                <PaymentInfoCard
                  payment={payment}
                  editableAmount={editableAmount}
                  editablePercentage={editablePercentage}
                  isSaving={isSaving}
                  shouldShowDriveFiles={shouldShowDriveFiles()}
                  isAmountValid={isAmountValid()}
                  isProgressValid={isProgressValid()}
                  onAmountChange={(value) => handleAmountChange(value, setEditableAmount, setEditablePercentage)}
                  onPercentageChange={(value) => handlePercentageChange(value, setEditableAmount, setEditablePercentage)}
                  onSaveAmount={handleSaveAmount}
                  formatCurrency={formatCurrency}
                />
              )}
            </div>

            <div className="lg:col-span-1">
              <PaymentSummaryCard
                documents={documents}
                documentStatus={documentStatus}
                completedDocumentsCount={getCompletedDocumentsCount()}
                areAllRequiredDocumentsUploaded={areAllRequiredDocumentsUploaded()}
                areFieldsValidForActions={areFieldsValidForActions()}
                getValidationMessage={getValidationMessage}
                isUploadingOrPreviewing={isUploadingOrPreviewing}
                onPreviewEmail={handlePreviewEmail}
                onSendDocuments={handleSendDocuments}
              />
            </div>
          </div>

          {/* Mostrar archivos del Drive si el status es "Enviado", "Aprobado" o "Rechazado" */}
          {shouldShowDriveFiles() && (
            <DriveFilesCard
              documents={documents}
              downloadLoading={downloadLoading}
              onDownloadFile={handleDownloadFile}
              onDocumentUpload={handleDocumentUpload}
            />
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
            <SendDocumentsBanner
              areAllRequiredDocumentsUploaded={areAllRequiredDocumentsUploaded()}
              areFieldsValidForActions={areFieldsValidForActions()}
              getValidationMessage={getValidationMessage}
              isUploadingOrPreviewing={isUploadingOrPreviewing}
              isUploading={isUploading}
              isPreviewUploading={isPreviewUploading}
              onPreviewEmail={handlePreviewEmail}
              onSendDocuments={handleSendDocuments}
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default PaymentDetail;
