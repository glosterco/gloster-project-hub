
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Tooltip, TooltipProvider } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useMandanteNotification } from '@/hooks/useMandanteNotification';
import { useGoogleDriveIntegration } from '@/hooks/useGoogleDriveIntegration';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/PageHeader';
import LoadingModal from '@/components/LoadingModal';
import PaymentInfoSection from '@/components/payment/PaymentInfoSection';
import PaymentSummaryCard from '@/components/payment/PaymentSummaryCard';
import DriveDocumentsSection from '@/components/payment/DriveDocumentsSection';
import DocumentsUploadSection from '@/components/payment/DocumentsUploadSection';
import SendDocumentsBanner from '@/components/payment/SendDocumentsBanner';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { payment, loading, refetch } = usePaymentDetail(id || '');
  const { sendNotificationToMandante } = useMandanteNotification();
  const { uploadDocumentsToDrive } = useGoogleDriveIntegration();

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
  const [editableAmount, setEditableAmount] = useState('');
  const [editablePercentage, setEditablePercentage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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

  const handleAutoSaveBeforePreview = async () => {
    if (editableAmount && payment?.Total?.toString() !== editableAmount) {
      await handleSaveAmount();
    }
  };

  const handleUploadDocumentsBeforePreview = async () => {
    if (!payment || !payment.projectData) {
      toast({
        title: "Error",
        description: "No se pueden cargar los datos del estado de pago",
        variant: "destructive"
      });
      return false;
    }

    const hasDocumentsToUpload = Object.keys(documentStatus).some(docId => documentStatus[docId]);
    
    if (!hasDocumentsToUpload) {
      console.log('No documents to upload for preview');
      return true;
    }

    try {
      console.log('🚀 Uploading documents before preview...');
      
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
      return true;
    } catch (error) {
      console.error('❌ Error uploading documents before preview:', error);
      toast({
        title: "Error al subir documentos",
        description: "No se pudieron subir los documentos al Drive",
        variant: "destructive"
      });
      return false;
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

  const handlePreviewEmail = async () => {
    if (!payment) {
      toast({
        title: "Error",
        description: "No se pueden cargar los datos del estado de pago",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    
    try {
      await handleAutoSaveBeforePreview();
      
      const uploadSuccess = await handleUploadDocumentsBeforePreview();
      if (!uploadSuccess) {
        return;
      }
      
      await generateUniqueURLAndUpdate();
      navigate(`/submission-preview?paymentId=${payment.id}`);
      
    } catch (error) {
      console.error('❌ Error in preview process:', error);
      toast({
        title: "Error",
        description: "Error al preparar la vista previa",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendDocuments = async () => {
    const requiredDocuments = documents.filter(doc => doc.required);
    const allRequiredUploaded = requiredDocuments.every(doc => documentStatus[doc.id]);
    
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

      const mandanteUrl = await generateUniqueURLAndUpdate();
      if (!mandanteUrl) return;

      const { error: statusError } = await supabase
        .from('Estados de pago')
        .update({ Status: 'Enviado' })
        .eq('id', payment.id);

      if (statusError) {
        console.error('Error updating status:', statusError);
        throw new Error('Error al actualizar el estado');
      }

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

  // Map database data
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

  const areAllRequiredDocumentsUploaded = () => {
    const requiredDocuments = documents.filter(doc => doc.required);
    return requiredDocuments.every(doc => documentStatus[doc.id]);
  };

  const getCompletedDocumentsCount = () => {
    return documents.filter(doc => documentStatus[doc.id]).length;
  };

  const shouldShowDriveFiles = () => {
    return payment?.Status === 'Enviado' || payment?.Status === 'Aprobado' || payment?.Status === 'Rechazado';
  };

  const wereDocumentsUpdated = () => {
    return Object.keys(documentStatus).some(docId => documentStatus[docId]);
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
        
        <LoadingModal 
          isOpen={isUploading}
          title="Procesando..."
          description="Subiendo documentos y preparando vista previa..."
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
              <PaymentInfoSection
                paymentState={paymentState}
                shouldShowDriveFiles={shouldShowDriveFiles()}
                editableAmount={editableAmount}
                editablePercentage={editablePercentage}
                isSaving={isSaving}
                currency={payment?.projectData?.Currency}
                budget={payment?.projectData?.Budget}
                onAmountChange={handleAmountChange}
                onPercentageChange={handlePercentageChange}
                onSaveAmount={handleSaveAmount}
                formatCurrency={formatCurrency}
              />
            </div>

            <div className="lg:col-span-1">
              <PaymentSummaryCard
                completedDocumentsCount={getCompletedDocumentsCount()}
                totalDocuments={documents.length}
                documents={documents}
                documentStatus={documentStatus}
                shouldShowDriveFiles={shouldShowDriveFiles()}
                wereDocumentsUpdated={wereDocumentsUpdated()}
                isUploading={isUploading}
                onPreviewEmail={handlePreviewEmail}
                onSendDocuments={handleSendDocuments}
              />
            </div>
          </div>

          {/* Drive Documents Section */}
          {shouldShowDriveFiles() && (
            <DriveDocumentsSection
              documents={documents}
              onDownloadFile={handleDownloadFile}
              onDocumentUpload={handleDocumentUpload}
            />
          )}

          {/* Documents Upload Section */}
          {!shouldShowDriveFiles() && (
            <DocumentsUploadSection
              documents={documents}
              documentStatus={documentStatus}
              uploadedFiles={uploadedFiles}
              dragStates={dragStates}
              achsSelection={achsSelection}
              setAchsSelection={setAchsSelection}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDocumentUpload={handleDocumentUpload}
              onFileRemove={handleFileRemove}
              getExamenesUrl={getExamenesUrl}
            />
          )}

          {/* Send Documents Banner */}
          {!shouldShowDriveFiles() && (
            <SendDocumentsBanner
              isUploading={isUploading}
              allRequiredDocumentsUploaded={areAllRequiredDocumentsUploaded()}
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
