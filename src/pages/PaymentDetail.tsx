
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useMandanteNotification } from '@/hooks/useMandanteNotification';
import { useGoogleDriveIntegration } from '@/hooks/useGoogleDriveIntegration';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/PageHeader';
import LoadingModal from '@/components/LoadingModal';
import { PaymentInfoCard } from '@/components/payment/PaymentInfoCard';
import { PaymentActionCard } from '@/components/payment/PaymentActionCard';
import { PaymentDocumentsSection } from '@/components/payment/PaymentDocumentsSection';
import { ProjectInfoCard } from '@/components/payment/ProjectInfoCard';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { payment, loading, refetch } = usePaymentDetail(id || '');
  const { sendNotificationToMandante, loading: notificationLoading } = useMandanteNotification();
  const { uploadDocumentsToDrive, loading: driveLoading } = useGoogleDriveIntegration();

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
  } = useDocumentUpload();

  const [isUploading, setIsUploading] = useState(false);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-gloster-gray font-rubik">Cargando...</div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!payment) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-600 font-rubik">Estado de pago no encontrado</div>
          </div>
        </div>
      </div>
    );
  }

  // Required documents configuration
  const documents = [
    { id: 'eepp', name: 'Carátula EEPP', required: true },
    { id: 'planilla', name: 'Avance Periódico', required: true },
    { id: 'cotizaciones', name: 'Certificado de Pago de Cotizaciones Previsionales', required: true },
    { id: 'f30', name: 'Certificado F30', required: true },
    { id: 'f30_1', name: 'Certificado F30-1', required: true },
    { id: 'examenes', name: 'Exámenes Preocupacionales', required: true },
    { id: 'finiquito', name: 'Finiquitos', required: false },
    { id: 'factura', name: 'Factura', required: false }
  ];

  const shouldShowDriveFiles = () => {
    return payment.Status === 'Enviado' || payment.Status === 'Aprobado' || payment.Status === 'Rechazado';
  };

  const areAllRequiredDocumentsUploaded = () => {
    return documents.filter(d => d.required).every(d => documentStatus[d.id]);
  };

  const wereDocumentsUpdated = () => {
    return documents.some(d => uploadedFiles[d.id] && uploadedFiles[d.id].length > 0);
  };

  const handlePreviewEmail = async () => {
    console.log('🔄 Auto-uploading documents for preview...');
    
    try {
      setIsUploading(true);

      if (!shouldShowDriveFiles() && Object.keys(fileObjects).length > 0) {
        await uploadDocumentsToDrive(payment.id, uploadedFiles, documentStatus, fileObjects);
      }

      navigate(`/email-preview/${payment.id}`);
    } catch (error) {
      console.error('Error in preview process:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la vista previa",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendDocuments = async () => {
    try {
      setIsUploading(true);

      if (!shouldShowDriveFiles() && Object.keys(fileObjects).length > 0) {
        await uploadDocumentsToDrive(payment.id, uploadedFiles, documentStatus, fileObjects);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
      await refetch();

      const notificationData = {
        paymentId: payment.id.toString(),
        contratista: payment.projectData?.Contratista?.CompanyName || 'Contratista',
        mes: payment.Mes || '',
        año: payment.Año || new Date().getFullYear(),
        proyecto: payment.projectData?.Name || '',
        mandanteEmail: payment.projectData?.Owner?.ContactEmail || '',
        mandanteCompany: payment.projectData?.Owner?.CompanyName || '',
        contractorCompany: payment.projectData?.Contratista?.CompanyName || '',
        amount: payment.Total || 0,
        dueDate: payment.ExpiryDate || '',
        driveUrl: payment.URL || '',
        uploadedDocuments: Object.keys(documentStatus).filter(key => documentStatus[key])
      };

      const result = await sendNotificationToMandante(notificationData);

      if (result.success) {
        const { error } = await supabase
          .from('Estados de pago')
          .update({ Status: 'Enviado' })
          .eq('id', payment.id);

        if (error) {
          console.error('Error updating payment status:', error);
        } else {
          toast({
            title: "Documentos enviados",
            description: "Los documentos han sido enviados al mandante exitosamente",
          });
          refetch();
        }
      }
    } catch (error) {
      console.error('Error sending documents:', error);
      toast({
        title: "Error",
        description: "No se pudieron enviar los documentos",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <LoadingModal 
        isOpen={isUploading || driveLoading || notificationLoading}
      />
      
      <PageHeader 
        showBackButton={true}
        onBack={() => navigate(-1)}
      />

      <div className="container mx-auto px-6 py-8">
        <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 font-rubik">Estado de Pago y Documentación</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <PaymentInfoCard 
              payment={payment}
              onRefetch={refetch}
              shouldShowDriveFiles={shouldShowDriveFiles()}
            />
          </div>

          <div className="lg:col-span-1">
            <PaymentActionCard
              onPreviewEmail={handlePreviewEmail}
              onSendDocuments={handleSendDocuments}
              shouldShowDriveFiles={shouldShowDriveFiles()}
              areAllRequiredDocumentsUploaded={areAllRequiredDocumentsUploaded()}
              wereDocumentsUpdated={wereDocumentsUpdated()}
              isUploading={isUploading}
            />
          </div>
        </div>

        <PaymentDocumentsSection
          documents={documents}
          documentStatus={documentStatus}
          uploadedFiles={uploadedFiles}
          onFileUpload={handleFileUpload}
          onFileRemove={handleFileRemove}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          dragStates={dragStates}
          fileInputRefs={fileInputRefs}
          shouldShowDriveFiles={shouldShowDriveFiles()}
          paymentId={payment.id}
        />

        <div className="mt-8">
          <ProjectInfoCard payment={payment} />
        </div>
      </div>
    </div>
  );
};

export default PaymentDetail;
