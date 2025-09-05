
import React, { useState, useEffect } from 'react';
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
import { DOCUMENT_CATALOG, DocumentDefinition, matchRequirementToDocument, buildOtherIdFromName } from '@/constants/documentsCatalog';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Verificar tipo de acceso desde sessionStorage
  const [accessData, setAccessData] = useState<any>(null);
  const [isLimitedAccess, setIsLimitedAccess] = useState(false);

  useEffect(() => {
    // Verificar acceso de contratista
    const contractorAccess = sessionStorage.getItem('contractorAccess');
    if (contractorAccess) {
      try {
        const accessInfo = JSON.parse(contractorAccess);
        setAccessData(accessInfo);
        
        // Determinar si es acceso limitado (contratista no registrado)
        if (accessInfo.userType === 'contratista' && accessInfo.isRegistered === false) {
          setIsLimitedAccess(true);
        }
      } catch (error) {
        console.error('Error parsing contractorAccess:', error);
      }
    }
    
    // También verificar acceso de mandante
    const mandanteAccess = sessionStorage.getItem('mandanteAccess');
    if (mandanteAccess) {
      try {
        const accessInfo = JSON.parse(mandanteAccess);
        setAccessData(accessInfo);
        setIsLimitedAccess(false); // Mandantes no tienen acceso limitado
      } catch (error) {
        console.error('Error parsing mandanteAccess:', error);
      }
    }
  }, []);

  // Use real data from database
  const { payment, loading, refetch } = usePaymentDetail(id || '');
  const { sendNotificationToMandante, loading: notificationLoading } = useMandanteNotification();
  const { sendCCNotification } = useCCNotification();
  const { uploadDocumentsToDrive, loading: driveLoading } = useGoogleDriveIntegration();
  const { downloadDocument, isDocumentLoading } = useDirectDriveDownload();
  const { handleResubmission, loading: resubmissionLoading } = useContractorResubmission();

  // CORRIGIENDO: Función para mostrar archivos del Drive si el status es "Enviado", "Aprobado" o "Rechazado"
  const shouldShowDriveFiles = () => {
    return payment?.Status === 'Enviado' || payment?.Status === 'Aprobado' || payment?.Status === 'Rechazado';
  };

  const { driveFiles, loading: driveFilesLoading, refetch: refetchDriveFiles } = useDriveFiles(
    payment?.id?.toString() || null, 
    shouldShowDriveFiles()
  );
  const { deleteFileFromDrive, loading: deleteLoading } = useDriveFileManagement();

  // Use the document upload hook with callback para refrescar archivos del Drive
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
  } = useDocumentUpload(refetchDriveFiles, payment?.projectData?.Requierment);

  const [achsSelection, setAchsSelection] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isPreviewUploading, setIsPreviewUploading] = useState(false);
  const [isAttemptingAction, setIsAttemptingAction] = useState(false);
  
  // Estados para los campos editables - Initialize with database values
  const [editableAmount, setEditableAmount] = useState('');
  const [editablePercentage, setEditablePercentage] = useState('');

  // Use validation hook
  const {
    isAmountValid,
    isProgressValid,
    areFieldsValidForActions,
    getValidationMessage,
    hasUnsavedFiles,
    shouldShowValidationErrors
  } = usePaymentValidation(editableAmount, editablePercentage, documentStatus, payment?.Status, isAttemptingAction, payment?.Total, payment?.Progress, payment?.projectData?.Budget);

  // Use payment actions hook
  const {
    isSaving,
    formatCurrency,
    handleAmountChange,
    handlePercentageChange,
    handleSaveAmount,
    saveAmountIfChanged,
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
      required: true,
      isUploadOnly: true,
      helpText: 'Este documento debe ser preparado internamente por el contratista y debe incluir un resumen completo del estado de pago, incluyendo avances, montos y documentación adjunta.'
    },
    {
      id: 'planilla',
      name: 'Avance del período',
      description: 'Planilla detallada del avance de obras del período',
      downloadUrl: null,
      uploaded: false,
      required: true,
      isUploadOnly: true,
      helpText: 'Documenta el progreso específico de las obras durante el período. Debe incluir fotografías, mediciones y descripción detallada de los trabajos realizados.'
    },
    {
      id: 'cotizaciones',
      name: 'Certificado de pago de cotizaciones',
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
      helpText: 'Debes generar este certificado adicional desde el portal de la Dirección del Trabajo.'
    },
    {
      id: 'f29',
      name: 'Certificado F29',
      description: 'Certificado de declaración jurada de impuestos mensuales',
      downloadUrl: 'https://www4.sii.cl/rfiInternet/index.html#rfiSelFormularioPeriodo',
      externalLink: 'https://www4.sii.cl/rfiInternet/index.html#rfiSelFormularioPeriodo',
      uploaded: false,
      required: true,
      helpText: 'Accede al portal del SII con tu RUT y clave para generar el certificado F29 correspondiente al período.',
      showButtonWhen: ['Pendiente', 'Rechazado']
    },
    {
      id: 'libro_remuneraciones',
      name: 'Libro de remuneraciones',
      description: 'Registro de remuneraciones de trabajadores',
      downloadUrl: 'https://midt.dirtrab.cl/empleador/lre',
      externalLink: 'https://midt.dirtrab.cl/empleador/lre',
      uploaded: false,
      required: true,
      helpText: 'Accede al portal de la Dirección del Trabajo para generar el libro de remuneraciones del período.'
    },
    {
      id: 'examenes',
      name: 'Exámenes preocupacionales',
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
      name: 'Finiquito/Anexo Traslado',
      description: 'Documento de finiquito o anexo de traslado de trabajadores (opcional)',
      downloadUrl: 'https://midt.dirtrab.cl/empleador/finiquitos',
      uploaded: false,
      required: false,
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
    },
    {
      id: 'comprobante_cotizaciones',
      name: 'Comprobante de pago de cotizaciones',
      description: 'Comprobante de pago de cotizaciones previsionales',
      downloadUrl: null,
      uploaded: false,
      required: true,
      isUploadOnly: true,
      helpText: 'Documento que acredita el pago de cotizaciones previsionales del período correspondiente.'
    },
    {
      id: 'libro_asistencia',
      name: 'Libro de asistencia',
      description: 'Registro de asistencia de trabajadores',
      downloadUrl: null,
      uploaded: false,
      required: true,
      isUploadOnly: true,
      helpText: 'Libro que registra la asistencia diaria de los trabajadores en la obra.'
    },
    {
      id: 'liquidaciones_sueldo',
      name: 'Liquidaciones de sueldo',
      description: 'Liquidaciones de sueldo de trabajadores',
      downloadUrl: null,
      uploaded: false,
      required: true,
      isUploadOnly: true,
      allowMultiple: true,
      helpText: 'Liquidaciones de sueldo individuales de todos los trabajadores del período.'
    },
    {
      id: 'nomina_trabajadores',
      name: 'Nómina de trabajadores',
      description: 'Nómina completa de trabajadores',
      downloadUrl: null,
      uploaded: false,
      required: true,
      isUploadOnly: true,
      helpText: 'Lista oficial de todos los trabajadores que participaron en el proyecto durante el período.'
    },
    {
      id: 'tgr',
      name: 'TGR',
      description: 'Documento de Tesorería General de la República',
      downloadUrl: null,
      uploaded: false,
      required: true,
      isUploadOnly: true,
      helpText: 'Documento relacionado con obligaciones ante la Tesorería General de la República.'
    }
  ];

  // Filter documents based on project requirements and available files
  const documents = React.useMemo(() => {
    if (!payment?.projectData?.Requierment || !Array.isArray(payment.projectData.Requierment)) {
      return allDocuments.filter(doc => doc.required);
    }

    const projectRequirements = payment.projectData.Requierment;
    console.log('🔍 Project requirements:', projectRequirements);
    
    // Filter predefined documents that match requirements
    const matchedDocuments = allDocuments.filter(doc => {
      const isRequiredByProject = projectRequirements.includes(doc.name);
      console.log(`📄 Document "${doc.name}" (${doc.id}): ${isRequiredByProject ? 'INCLUDED' : 'EXCLUDED'}`);
      return isRequiredByProject;
    });

    // Identify "other" documents that don't match predefined ones
    const predefinedNames = allDocuments.map(doc => doc.name);
    const otherDocuments = projectRequirements
      .filter(req => !predefinedNames.includes(req) && req.trim() && req !== 'Avance del período')
      .sort() // IMPORTANT: Sort to ensure consistent mapping with useGoogleDriveIntegration.ts
      .map((req, index) => {
        // Try to find a matching document from catalog first
        const matchedDoc = matchRequirementToDocument(req);
        if (matchedDoc) {
          console.log(`✅ Matched requirement "${req}" to catalog document "${matchedDoc.name}" (id: ${matchedDoc.id})`);
          return {
            id: matchedDoc.id, // Use the correct catalog ID (e.g., 'comprobante_cotizaciones')
            name: matchedDoc.name,
            description: matchedDoc.description || 'Documento requerido específico del proyecto',
            downloadUrl: null,
            uploaded: false,
            required: true,
            isUploadOnly: true,
            allowMultiple: false,
            helpText: 'Este documento ha sido especificado como requerimiento específico del proyecto.',
            isOtherDocument: false,
            showButtonWhen: ['Pendiente', 'Rechazado']
          };
        }
        
        // If no match found, create as other document with proper ID
        const otherId = buildOtherIdFromName(req);
        console.log(`⚠️ No match found for requirement "${req}", creating other document with id: ${otherId}`);
        return {
          id: otherId, // This will be something like 'other_documento-especial'
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
        };
      });

    console.log('📄 Other documents found:', otherDocuments.map(d => d.name));

    const allRequiredDocs = [...matchedDocuments, ...otherDocuments];

    // NUEVO: Para estados "Enviado" y "Aprobado", solo mostrar documentos que realmente tienen archivos
    if (payment?.Status === 'Enviado' || payment?.Status === 'Aprobado') {
      const documentsWithFiles = allRequiredDocs.filter(doc => {
        // Verificar si hay archivos para este documento
        const hasFilesById = driveFiles[doc.id] && driveFiles[doc.id].length > 0;
        const hasFilesByCategory = Object.entries(driveFiles).some(([category, files]) => {
          if (category === 'mandante_docs' || !files || files.length === 0) return false;
          return files.some(fileName => {
            const baseFileName = fileName.replace(/\.[^/.]+$/, "").toLowerCase(); // quitar extensión
            return baseFileName === doc.name.toLowerCase(); // comparación exacta
          });
        });
        
        return hasFilesById || hasFilesByCategory;
      });
      
      console.log(`📄 Filtered documents for ${payment.Status} status:`, documentsWithFiles.map(d => d.name));
      return documentsWithFiles;
    }

    return allRequiredDocs;
  }, [payment?.projectData?.Requierment, payment?.Status, driveFiles]);

  // Load project requirements on component mount
  useEffect(() => {
    if (payment?.id) {
      console.log('📄 Loading project requirements for payment:', payment.id);
    }
  }, [payment?.id]);

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

  // NEW: Función para verificar si se pueden activar los botones según el estado
  const canActivateButtons = () => {
    // Si el proyecto tiene budget 0 o NULL, permitir activar botones sin restricciones
    if (payment?.projectData?.Budget === 0 || payment?.projectData?.Budget === null || payment?.projectData?.Budget === undefined) {
      return true;
    }
    
    // Para estado "Rechazado": activar si hay al menos un documento cargado
    if (payment?.Status === 'Rechazado') {
      return hasDocumentsToUpload();
    }
    // Para otros estados: requerir todos los documentos
    return areAllRequiredDocumentsUploaded();
  };

  // Auto-guardar antes de vista previa si hay cambios sin guardar
  const handleAutoSaveBeforePreview = async () => {
    const currentAmount = parseFloat(editableAmount) || 0;
    const currentProgress = parseFloat(editablePercentage) || 0;
    const amountChanged = editableAmount.trim() !== '' && currentAmount !== (payment?.Total || 0);
    const progressChanged = editablePercentage.trim() !== '' && currentProgress !== (payment?.Progress || 0);

    if (amountChanged || progressChanged) {
      console.log('💾 Auto-saving before preview...');
      await handleSaveAmount();
      console.log('💾 Auto-save completed, refreshing data...');
      await refetch();
      console.log('💾 Data refreshed for preview');
    }
  };

  // Función para verificar si se pueden cargar documentos (solo para status "Rechazado")
  const canUploadDocuments = () => {
    return payment?.Status === 'Rechazado';
  };

  // Función para manejar reenvío después de rechazo
  const handleResubmissionAfterRejection = async () => {
    if (!payment || !payment.projectData) {
      toast({
        title: "Error",
        description: "No se pueden cargar los datos del estado de pago",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    console.log('🚀 Starting resubmission after rejection...');

    try {
      // Guardar monto y progreso ANTES de reenviar
      console.log('💾 Saving amount and progress before resubmission...');
      await handleSaveAmount();
      await refetch();

      // Subir documentos actualizados
      const uploadResult = await uploadDocumentsToDrive(
        payment.id, 
        uploadedFiles, 
        documentStatus, 
        fileObjects,
        payment.projectData.Requierment || []
      );

      if (!uploadResult.success) {
        throw new Error("Error al subir documentos");
      }

      console.log('✅ Documents uploaded successfully for resubmission');
      
      // IMPORTANTE: Refrescar archivos del Drive después del upload
      await refetchDriveFiles();

      // Usar el sistema de enlace único
      const accessUrl = await ensureUniqueAccessUrl(payment.id);
      if (!accessUrl) {
        throw new Error('No se pudo generar el enlace de acceso');
      }

      // Cambiar status a "Enviado" para permitir nueva revisión
      await handleResubmission(payment.id.toString());

      // Obtener datos actualizados del estado de pago (con fallback público)
      let driveUrl = '' as string;
      const { data: paymentStateData, error: paymentStateError } = await supabase
        .from('Estados de pago')
        .select('URL')
        .eq('id', payment.id)
        .maybeSingle();

      if (paymentStateData?.URL) {
        driveUrl = paymentStateData.URL;
      } else {
        console.warn('⚠️ Could not fetch URL directly, trying public function fallback...', paymentStateError);
        try {
          const contractorAccess = sessionStorage.getItem('contractorAccess');
          const mandanteAccess = sessionStorage.getItem('mandanteAccess');
          const accessInfo = contractorAccess ? JSON.parse(contractorAccess) : (mandanteAccess ? JSON.parse(mandanteAccess) : null);
          const accessToken = accessInfo?.accessToken;
          if (!accessToken) {
            throw new Error('No se encontró token de acceso');
          }
          const { data: publicData, error: publicError } = await supabase.functions.invoke('get-payment-detail-public', {
            body: { paymentId: payment.id, token: accessToken }
          });
          if (publicError) throw publicError;
          if (!publicData?.URL) throw new Error('No se pudo obtener la URL pública');
          driveUrl = publicData.URL;
        } catch (err) {
          console.error('Error fetching payment state URL (public fallback):', err);
          toast({
            title: 'Error',
            description: 'No se pudo obtener la URL del estado de pago',
            variant: 'destructive'
          });
          return;
        }
      }

      // Preparar documentos cargados para notificación
      const uploadedDocuments: string[] = [];
      Object.entries(uploadedFiles).forEach(([docId, files]) => {
        if (files && files.length > 0) {
          files.forEach(file => {
            if (typeof file === 'string') {
              uploadedDocuments.push(file);
            }
          });
        }
      });

      // CRÍTICO: Primero guardar los cambios y ESPERAR a que se complete
      console.log('💾 Guardando cambios antes de enviar email...');
      await handleSaveAmount();
      
      // IMPORTANTE: Esperar un delay para asegurar consistencia de BD
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refrescar los datos del payment después del guardado y delay
      console.log('🔄 Refrescando datos del payment...');
      await refetch();
      
      // Obtener el valor DIRECTAMENTE de la base de datos para asegurar consistencia
      const { data: freshPaymentData, error: freshPaymentError } = await supabase
        .from('Estados de pago')
        .select('Total')
        .eq('id', payment.id)
        .single();
      
      const finalAmount = freshPaymentData?.Total || payment?.Total || 0;
      
      console.log('💰 Monto directo desde BD a enviar en email:', finalAmount, 
                  '(freshPaymentData.Total:', freshPaymentData?.Total, 
                  ', payment.Total:', payment?.Total, ')');
      
      const notificationData = {
        paymentId: payment.id.toString(),
        contratista: payment.projectData.Contratista?.ContactName || '',
        mes: payment.Mes || '',
        año: payment.Año || 0,
        proyecto: payment.projectData.Name || '',
        mandanteEmail: payment.projectData.Owner?.ContactEmail || '',
        mandanteCompany: payment.projectData.Owner?.CompanyName || '',
        contractorCompany: payment.projectData.Contratista?.CompanyName || '',
        amount: finalAmount, // Usar el monto DESPUÉS del guardado
        dueDate: payment.ExpiryDate || '',
         driveUrl: driveUrl,
        uploadedDocuments: uploadedDocuments,
        currency: payment.projectData?.Currency || 'CLP',
        accessUrl: accessUrl
      };

      const result = await sendNotificationToMandante(notificationData);
      
      if (result.success) {
        toast({
          title: "Documentos corregidos y reenviados",
          description: "Las correcciones han sido enviadas al mandante para nueva revisión",
        });
        
        // Refrescar datos para mostrar el nuevo estado
        await refetch();
        
        setTimeout(() => {
          navigate(`/project/${payment?.Project || 2}`);
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Error in resubmission process:', error);
      toast({
        title: "Error al reenviar correcciones",
        description: error.message || "Error al procesar las correcciones",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
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

  // Handle file removal from Drive (only for rejected status)
  const handleDriveFileRemove = async (docId: string, fileIndex: number) => {
    if (!payment?.id) {
      toast({
        title: "Error",
        description: "No se pudo identificar el estado de pago",
        variant: "destructive"
      });
      return;
    }

    if (payment?.Status !== 'Rechazado' && payment?.Status !== 'Pendiente') {
      toast({
        title: "Acción no permitida",
        description: "Solo puedes eliminar archivos cuando el estado de pago está Rechazado o Pendiente",
        variant: "destructive"
      });
      return;
    }

    // Get the filename from uploadedFiles (local) or driveFiles (Drive)
    const localFiles = uploadedFiles[docId];
    const driveFilesList = driveFiles[docId];
    
    // Determine if this is a local file or a Drive file
    let fileName: string;
    let isLocalFile = false;
    
    if (localFiles && localFiles[fileIndex]) {
      // File exists in local uploaded files
      fileName = localFiles[fileIndex];
      isLocalFile = true;
      
      // Check if this local file also exists in Drive by comparing names
      if (driveFilesList && driveFilesList.includes(fileName)) {
        isLocalFile = false; // It's actually in Drive too
      }
    } else if (driveFilesList && driveFilesList[fileIndex]) {
      // File only exists in Drive
      fileName = driveFilesList[fileIndex];
      isLocalFile = false;
    } else {
      console.error(`File not found: docId=${docId}, fileIndex=${fileIndex}`);
      toast({
        title: "Error",
        description: "No se pudo encontrar el archivo a eliminar",
        variant: "destructive"
      });
      return;
    }

    console.log(`🗑️ Removing file: ${fileName} (local: ${isLocalFile})`);

    if (isLocalFile) {
      // Remove only from local state (frontend)
      handleFileRemove(docId, fileName);
      toast({
        title: "Archivo eliminado",
        description: "El archivo se eliminó del frontend exitosamente",
      });
    } else {
      // Remove from Drive
      const success = await deleteFileFromDrive(payment.id.toString(), fileName);
      if (success) {
        // Refresh drive files after successful deletion
        await refetchDriveFiles();
      }
    }
  };

  const handleSendDocuments = async () => {
    setIsAttemptingAction(true);
    // Validate fields before sending
    if (!areFieldsValidForActions()) {
      toast({
        title: "Campos obligatorios",
        description: getValidationMessage(),
        variant: "destructive"
      });
      setIsAttemptingAction(false);
      return;
    }

    // Auto-guardar antes de enviar
    await handleAutoSaveBeforePreview();

    // Usar la lógica de canActivateButtons que considera el estado del pago
    if (!canActivateButtons()) {
      const errorMessage = payment?.Status === 'Rechazado' 
        ? "Por favor, carga al menos un documento antes de enviar"
        : "Por favor, carga todos los documentos requeridos antes de enviar";
      
      toast({
        title: "Documentos incompletos",
        description: errorMessage,
        variant: "destructive"
      });
      setIsAttemptingAction(false);
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
      // CRÍTICO: Guardar monto y progreso ANTES de enviar
      console.log('💾 Saving amount and progress before sending...');
      
      // Verificar si hay cambios en monto o porcentaje y guardarlos
      const currentAmount = parseFloat(editableAmount) || 0;
      const currentProgress = parseFloat(editablePercentage) || 0;
      const amountChanged = editableAmount.trim() !== '' && currentAmount !== (payment.Total || 0);
      const progressChanged = editablePercentage.trim() !== '' && currentProgress !== (payment.Progress || 0);
      
      if (amountChanged || progressChanged) {
        console.log('💾 Changes detected, saving amount and progress...');
        await handleSaveAmount();
        console.log('💾 Amount and progress saved, refreshing data...');
        await refetch();
        console.log('💾 Data refreshed successfully');
      }
      const uploadResult = await uploadDocumentsToDrive(
        payment.id, 
        uploadedFiles, 
        documentStatus, 
        fileObjects,
        payment.projectData.Requierment || []
      );

      if (!uploadResult.success) {
        throw new Error("Error al subir documentos");
      }

      console.log('✅ Documents uploaded successfully');
      
      // IMPORTANTE: Refrescar archivos del Drive después del upload
      await refetchDriveFiles();

      // Usar el sistema de enlace único
      const accessUrl = await ensureUniqueAccessUrl(payment.id);
      if (!accessUrl) {
        throw new Error('No se pudo generar el enlace de acceso');
      }

      // Guardar cualquier cambio en el monto antes de enviar
      await saveAmountIfChanged();

      // Cambiar status a "Enviado" automáticamente (primera vez o reenvío después de correcciones)
      await handleResubmission(payment.id.toString());

      // Esperar un poco para asegurar que la BD esté actualizada
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refrescar datos para obtener el monto actualizado
      await refetch();

      // Get the payment state data to fetch the URL (with public fallback)
      let driveUrl = '' as string;
      const { data: paymentStateData, error: paymentStateError } = await supabase
        .from('Estados de pago')
        .select('URL')
        .eq('id', payment.id)
        .maybeSingle();

      if (paymentStateData?.URL) {
        driveUrl = paymentStateData.URL;
      } else {
        console.warn('⚠️ Could not fetch URL directly, trying public function fallback...', paymentStateError);
        try {
          const contractorAccess = sessionStorage.getItem('contractorAccess');
          const mandanteAccess = sessionStorage.getItem('mandanteAccess');
          const accessInfo = contractorAccess ? JSON.parse(contractorAccess) : (mandanteAccess ? JSON.parse(mandanteAccess) : null);
          const accessToken = accessInfo?.accessToken;
          if (!accessToken) {
            throw new Error('No se encontró token de acceso');
          }
          const { data: publicData, error: publicError } = await supabase.functions.invoke('get-payment-detail-public', {
            body: { paymentId: payment.id, token: accessToken }
          });
          if (publicError) throw publicError;
          if (!publicData?.URL) throw new Error('No se pudo obtener la URL pública');
          driveUrl = publicData.URL;
        } catch (err) {
          console.error('Error fetching payment state URL (public fallback):', err);
          toast({
            title: 'Error',
            description: 'No se pudo obtener la URL del estado de pago',
            variant: 'destructive'
          });
          return;
        }
      }

      // Convert uploadedFiles to string array for the notification
      const uploadedDocuments: string[] = [];
      Object.entries(uploadedFiles).forEach(([docId, files]) => {
        if (files && files.length > 0) {
          files.forEach(file => {
            if (typeof file === 'string') {
              uploadedDocuments.push(file);
            }
          });
        }
      });

      // Obtener el valor DIRECTAMENTE de la base de datos para asegurar consistencia
      const { data: freshPaymentData, error: freshPaymentError } = await supabase
        .from('Estados de pago')
        .select('Total')
        .eq('id', payment.id)
        .single();
      
      const finalAmount = freshPaymentData?.Total || payment?.Total || 0;
      
      console.log('💰 Monto directo desde BD a enviar en email:', finalAmount, 
                  '(freshPaymentData.Total:', freshPaymentData?.Total, 
                  ', payment.Total:', payment?.Total, ')');

      const notificationData = {
        paymentId: payment.id.toString(),
        contratista: payment.projectData.Contratista?.ContactName || '',
        mes: payment.Mes || '',
        año: payment.Año || 0,
        proyecto: payment.projectData.Name || '',
        mandanteEmail: payment.projectData.Owner?.ContactEmail || '',
        mandanteCompany: payment.projectData.Owner?.CompanyName || '',
        contractorCompany: payment.projectData.Contratista?.CompanyName || '',
        amount: finalAmount, // Usar el monto DESPUÉS del guardado y refetch
        dueDate: payment.ExpiryDate || '',
        driveUrl: driveUrl,
        uploadedDocuments: uploadedDocuments,
        currency: payment.projectData?.Currency || 'CLP',
        accessUrl: accessUrl
      };

      const result = await sendNotificationToMandante(notificationData);
      
      if (result.success) {
        // Also send CC notification
        try {
          await sendCCNotification({
            paymentId: payment.id.toString(),
            contractorEmail: payment.projectData.Contratista?.ContactEmail,
            contractorName: payment.projectData.Contratista?.ContactName,
            contractorCompany: payment.projectData.Contratista?.CompanyName,
            mandanteCompany: payment.projectData.Owner?.CompanyName,
            proyecto: payment.projectData.Name,
            mes: payment.Mes,
            año: payment.Año,
            amount: finalAmount,
            dueDate: payment.ExpiryDate,
            currency: payment.projectData?.Currency
          });
        } catch (ccError) {
          console.warn('CC notification failed, but continuing:', ccError);
        }

        toast({
          title: "Documentos enviados exitosamente",
          description: "Los documentos se han subido y se ha notificado al mandante",
        });
        
        setTimeout(() => {
          navigate(`/project/${payment?.Project || 2}`);
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Error in upload process:', error);
      toast({
        title: "Error al enviar documentos",
        description: error.message || "Error al subir documentos",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePreviewEmail = async () => {
    setIsAttemptingAction(true);
    // Validate fields before preview
    if (!areFieldsValidForActions()) {
      toast({
        title: "Campos obligatorios",
        description: getValidationMessage(),
        variant: "destructive"
      });
      setIsAttemptingAction(false);
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
          fileObjects,
          payment.projectData.Requierment || []
        );

        if (!uploadResult.success) {
          throw new Error("Error al subir documentos");
        }

        console.log('✅ Documents uploaded successfully before preview');
        
        toast({
          title: "Documentos subidos",
          description: "Los documentos se han subido correctamente",
        });

      } catch (error) {
        console.error('❌ Error uploading documents for preview:', error);
        toast({
          title: "Error al subir documentos",
          description: error.message || "Error al subir documentos",
          variant: "destructive"
        });
        setIsPreviewUploading(false);
        return;
      } finally {
        setIsPreviewUploading(false);
      }
    }

    // Usar el sistema de enlace único para preview también (ignorar errores en acceso por email)
    try { await ensureUniqueAccessUrl(payment.id); } catch (e) { console.warn('Preview ensure URL skipped:', e); }
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
          description={isPreviewUploading ? "Por favor espera mientras se suben los documentos antes de mostrar la vista previa" : "Por favor espera mientras se procesa la información y se envía la notificación al mandante"}
        />

        {/* Hidden file inputs */}
        {documents.map(doc => (
          <input
            key={doc.id}
            type="file"
            ref={el => fileInputRefs.current[doc.id] = el}
            onChange={e => e.target.files && handleFileUpload(Array.from(e.target.files), doc.id)}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.xlsm,.jpg,.jpeg,.png,.csv"
            multiple={doc.allowMultiple}
            style={{ display: 'none' }}
          />
        ))}

        {/* Volver al Proyecto */}
        <div className="bg-slate-50 py-2">
          <div className="container mx-auto px-6">
            <button 
              onClick={() => {
                // Verificar tipo de acceso para determinar redirección
                if (isLimitedAccess) {
                  // Contratista no registrado: no puede salir de la página de payment
                  toast({
                    title: "Acceso limitado",
                    description: "Solo puedes acceder a esta página de estado de pago y la vista previa",
                    variant: "destructive"
                  });
                  return;
                }
                // Acceso completo: redirigir normalmente
                handleNavigation(`/project/${payment?.Project || 2}`, hasUnsavedFiles);
              }}
              className="text-gloster-gray hover:text-slate-800 text-sm font-rubik flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Proyecto
            </button>
          </div>
        </div>

        <div className="container mx-auto px-6 py-8">
          <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 font-rubik">Estado de Pago y Documentación</h3>
          
          {/* Validation Warning Card - Show only when trying to send/preview without required fields */}

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
                  shouldShowValidationErrors={shouldShowValidationErrors()}
                  onAmountChange={(value) => {
                    handleAmountChange(value, setEditableAmount, setEditablePercentage);
                    setIsAttemptingAction(false);
                  }}
                  onPercentageChange={(value) => {
                    handlePercentageChange(value, setEditableAmount, setEditablePercentage);
                    setIsAttemptingAction(false);
                  }}
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
                areAllRequiredDocumentsUploaded={canActivateButtons()}
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
              isDocumentLoading={isDocumentLoading}
              onDownloadFile={handleDownloadFile}
              onDocumentUpload={handleDocumentUpload}
              paymentStatus={payment?.Status}
              uploadedFiles={driveFiles} // Usar archivos del Drive en lugar de archivos locales
              onFileRemove={handleDriveFileRemove}
              fileObjects={fileObjects} // Pasar archivos cargados localmente para vista previa
            />
          )}

          {/* Documents List - Para todos los casos donde no es "Enviado" o "Aprobado" */}
          {!shouldShowDriveFiles() && (
            <div className="space-y-4 mb-8">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg md:text-xl font-bold text-slate-800 font-rubik">
                  Documentos Cargados
                </h3>
                <p className="text-xs text-slate-500 font-rubik">
                  Tamaño máximo por archivo: 12MB
                </p>
              </div>
              {canUploadDocuments() && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <p className="text-yellow-800 font-rubik text-sm">
                    Tu estado de pago fue rechazado. Puedes cargar las correcciones necesarias y reenviar para nueva revisión.
                  </p>
                </div>
              )}
              
              <div className="space-y-4">
                {documents.map((doc) => (
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
                    paymentStatus={payment?.Status}
                    onDrop={(e) => handleDrop(e, doc.id)}
                    onDocumentUpload={() => handleDocumentUpload(doc.id)}
                    onFileRemove={(fileName) => handleFileRemove(doc.id, fileName)}
                    getExamenesUrl={getExamenesUrl}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Send Documents Banner - Activar cuando se sube al menos un documento para estado Rechazado */}
          {!shouldShowDriveFiles() && (
            (canUploadDocuments() && hasDocumentsToUpload()) || 
            (!canUploadDocuments() && areAllRequiredDocumentsUploaded()) ||
            (shouldShowDriveFiles() && payment?.Status === 'Rechazado' && hasDocumentsToUpload())
          ) && (
            <SendDocumentsBanner
              areAllRequiredDocumentsUploaded={canActivateButtons()}
              areFieldsValidForActions={areFieldsValidForActions()}
              getValidationMessage={getValidationMessage}
              isUploadingOrPreviewing={isUploadingOrPreviewing}
              isUploading={isUploading}
              isPreviewUploading={isPreviewUploading}
              onPreviewEmail={handlePreviewEmail}
              onSendDocuments={canUploadDocuments() ? handleResubmissionAfterRejection : handleSendDocuments}
            />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

export default PaymentDetail;
