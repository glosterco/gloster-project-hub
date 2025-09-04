import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useMandanteNotification } from '@/hooks/useMandanteNotification';
import { useCCNotification } from '@/hooks/useCCNotification';
import { useGoogleDriveIntegration } from '@/hooks/useGoogleDriveIntegration';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { useDirectDriveDownload } from '@/hooks/useDirectDriveDownload';
import { useDriveFiles } from '@/hooks/useDriveFiles';
import { useDriveFileManagement } from '@/hooks/useDriveFileManagement';
import { useUniqueAccessUrl } from '@/hooks/useUniqueAccessUrl';
import { usePaymentValidation } from '@/hooks/usePaymentValidation';
import { usePaymentActions } from '@/hooks/usePaymentActions';
import { useContractorResubmission } from '@/hooks/useContractorResubmission';
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

  // Verificar tipo de acceso desde sessionStorage
  const [accessData, setAccessData] = useState<any>(null);
  const [isLimitedAccess, setIsLimitedAccess] = useState(false);

  useEffect(() => {
    const contractorAccess = sessionStorage.getItem('contractorAccess');
    if (contractorAccess) {
      try {
        const accessInfo = JSON.parse(contractorAccess);
        setAccessData(accessInfo);
        if (accessInfo.userType === 'contratista' && accessInfo.isRegistered === false) {
          setIsLimitedAccess(true);
        }
      } catch (error) {
        console.error('Error parsing contractorAccess:', error);
      }
    }

    const mandanteAccess = sessionStorage.getItem('mandanteAccess');
    if (mandanteAccess) {
      try {
        const accessInfo = JSON.parse(mandanteAccess);
        setAccessData(accessInfo);
        setIsLimitedAccess(false);
      } catch (error) {
        console.error('Error parsing mandanteAccess:', error);
      }
    }
  }, []);

  const { payment, loading, refetch } = usePaymentDetail(id || '');
  const { sendNotificationToMandante, loading: notificationLoading } = useMandanteNotification();
  const { sendCCNotification } = useCCNotification();
  const { uploadDocumentsToDrive, loading: driveLoading } = useGoogleDriveIntegration();
  const { downloadDocument, isDocumentLoading } = useDirectDriveDownload();
  const { handleResubmission, loading: resubmissionLoading } = useContractorResubmission();

  const shouldShowDriveFiles = () => {
    return payment?.Status === 'Enviado' || payment?.Status === 'Aprobado' || payment?.Status === 'Rechazado';
  };

  const { driveFiles, loading: driveFilesLoading, refetch: refetchDriveFiles } = useDriveFiles(
    payment?.id?.toString() || null, 
    shouldShowDriveFiles()
  );
  const { deleteFileFromDrive, loading: deleteLoading } = useDriveFileManagement();

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
  } = useDocumentUpload(refetchDriveFiles);

  const [achsSelection, setAchsSelection] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewUploading, setIsPreviewUploading] = useState(false);
  const [isAttemptingAction, setIsAttemptingAction] = useState(false);
  const [editableAmount, setEditableAmount] = useState('');
  const [editablePercentage, setEditablePercentage] = useState('');

  const {
    isAmountValid,
    isProgressValid,
    areFieldsValidForActions,
    getValidationMessage,
    hasUnsavedFiles,
    shouldShowValidationErrors
  } = usePaymentValidation(editableAmount, editablePercentage, documentStatus, payment?.Status, isAttemptingAction, payment?.Total, payment?.Progress, payment?.projectData?.Budget);

  const {
    isSaving,
    formatCurrency,
    handleAmountChange,
    handlePercentageChange,
    handleSaveAmount,
    saveAmountIfChanged,
    handleNavigation
  } = usePaymentActions(payment, editableAmount, editablePercentage, refetch);

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

  const allDocuments = [
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
    // ... resto de documentos idénticos al original
  ];

  const documents = useMemo(() => {
    if (!payment?.projectData?.Requierment || !Array.isArray(payment.projectData.Requierment)) {
      return allDocuments.filter(doc => doc.required);
    }

    const projectRequirements = payment.projectData.Requierment;
    const matchedDocuments = allDocuments.filter(doc => projectRequirements.includes(doc.name));
    const predefinedNames = allDocuments.map(doc => doc.name);
    const otherDocuments = projectRequirements
      .filter(req => !predefinedNames.includes(req) && req.trim() && req !== 'Avance del período')
      .map((req, index) => ({
        id: `other_${index}`,
        name: req,
        description: 'Documento requerido específico del proyecto',
        downloadUrl: null,
        uploaded: false,
        required: true,
        isUploadOnly: true,
        allowMultiple: false,
        helpText: 'Este documento ha sido especificado como requerimiento específico del proyecto.',
        isOtherDocument: true,
        showButtonWhen: ['Pendiente', 'Rechazado']
      }));

    const allRequiredDocs = [...matchedDocuments, ...otherDocuments];

    // Bloque corregido de filtrado exacto
    const filteredDocuments = useMemo(() => {
      if (!allRequiredDocs || !driveFiles) return [];

      function normalizeName(name: string) {
        return name.trim().toLowerCase().replace(/[\s_]+/g, ' ').replace(/[^\w\s]/g, '');
      }

      if (payment?.Status === 'Enviado' || payment?.Status === 'Aprobado') {
        const documentsWithFiles = allRequiredDocs.filter(doc => {
          const docNameNormalized = normalizeName(doc.name);

          const hasFilesById = driveFiles[doc.id] && driveFiles[doc.id].length > 0;

          const hasFilesByCategory = Object.entries(driveFiles).some(([category, files]) => {
            if (category === 'mandante_docs' || !files || files.length === 0) return false;
            return files.some(fileName => {
              const baseFileName = normalizeName(fileName.replace(/\.[^/.]+$/, ""));
              return baseFileName === docNameNormalized;
            });
          });

          return hasFilesById || hasFilesByCategory;
        });

        return documentsWithFiles;
      }

      return allRequiredDocs;
    }, [payment?.projectData?.Requierment, payment?.Status, driveFiles]);

    return filteredDocuments;
  }, [payment, driveFiles]);

  if (loading) return <LoadingModal />;

  return (
    <div className="container mx-auto p-4">
      <PageHeader
        title="Detalle de Estado de Pago"
        leftIcon={<ArrowLeft />}
        onLeftClick={() => navigate(-1)}
      />
      <PaymentInfoCard payment={payment} editableAmount={editableAmount} editablePercentage={editablePercentage} onAmountChange={handleAmountChange} onPercentageChange={handlePercentageChange} />
      <PaymentSummaryCard payment={payment} />
      {shouldShowValidationErrors && <ValidationWarningCard payment={payment} />}
      {shouldShowDriveFiles() && <DriveFilesCard driveFiles={driveFiles} />}
      <SendDocumentsBanner payment={payment} />
      {documents.map(doc => (
        <DocumentUploadCard
          key={doc.id}
          document={doc}
          onUpload={handleDocumentUpload}
          uploadedFiles={uploadedFiles[doc.id]}
          isUploading={isUploading || isPreviewUploading}
        />
      ))}
    </div>
  );
};

export default PaymentDetail;
