
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Send } from 'lucide-react';
import EmailTemplate from '@/components/EmailTemplate';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useMandanteNotification } from '@/hooks/useMandanteNotification';
import { useGoogleDriveIntegration } from '@/hooks/useGoogleDriveIntegration';
import { supabase } from '@/integrations/supabase/client';

const SubmissionPreview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId') || '11';
  const { payment, loading, error } = usePaymentDetail(paymentId, true);
  const { sendNotificationToMandante, loading: notificationLoading } = useMandanteNotification();
  const { uploadDocumentsToDrive, loading: driveLoading } = useGoogleDriveIntegration();
  const { toast } = useToast();
  const [isProjectUser, setIsProjectUser] = useState(false);
  const [userChecked, setUserChecked] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [documentsUploaded, setDocumentsUploaded] = useState(false);

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

  useEffect(() => {
    const checkUser = async () => {
      if (userChecked) return;
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setIsProjectUser(!!user);
        setUserChecked(true);
      } catch (error) {
        console.error('Error checking user:', error);
        setIsProjectUser(false);
        setUserChecked(true);
      }
    };
    
    checkUser();
  }, [userChecked]);

  // Auto-upload documents when preview loads
  useEffect(() => {
    const autoUploadDocuments = async () => {
      if (!payment || !isProjectUser || documentsUploaded || !payment?.URL) return;
      
      console.log('🔄 Auto-uploading documents for preview...');
      setDocumentsUploaded(true);
    };

    if (payment && isProjectUser && !documentsUploaded) {
      autoUploadDocuments();
    }
  }, [payment, isProjectUser, documentsUploaded]);

  const documentsFromPayment = [
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
      name: 'Certificado de Pago de Cotizaciones Previsionales',
      description: 'Certificado de cumplimiento de obligaciones previsionales',
      uploaded: true
    },
    {
      id: 'f30',
      name: 'Certificado F30',
      description: 'Certificado de antecedentes laborales y previsionales',
      uploaded: true
    },
    {
      id: 'f30_1',
      name: 'Certificado F30-1',
      description: 'Certificado de cumplimiento de obligaciones laborales y previsionales',
      uploaded: true
    },
    {
      id: 'factura',
      name: 'Factura',
      description: 'Factura del período correspondiente',
      uploaded: true
    }
  ];

  const handlePrint = () => {
    const printStyles = `
      <style>
        @media print {
          body * { visibility: hidden; }
          .email-template-container, .email-template-container * { visibility: visible; }
          .email-template-container { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            transform: scale(0.65);
            transform-origin: top left;
          }
          .print\\:hidden { display: none !important; }
          @page { margin: 0.3in; size: A4; }
        }
      </style>
    `;
    
    const originalHead = document.head.innerHTML;
    document.head.innerHTML += printStyles;
    
    setTimeout(() => {
      window.print();
      document.head.innerHTML = originalHead;
    }, 100);
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
      // Obtener el archivo directamente desde el enlace de Google Drive
      const response = await fetch(payment.URL);
      
      if (!response.ok) {
        throw new Error('Error al obtener el archivo desde el servidor');
      }

      // Crear un Blob para el archivo
      const fileBlob = await response.blob();
      
      // Crear un objeto URL para el Blob
      const downloadUrl = URL.createObjectURL(fileBlob);

      // Crear un enlace de descarga y simular el clic
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.click();

      // Liberar la URL del Blob después de la descarga
      URL.revokeObjectURL(downloadUrl);

      // Mostrar el toast de éxito
      toast({
        title: "Descarga iniciada",
        description: `Se ha descargado el archivo: ${fileName}`,
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

  const handleSendEmail = async () => {
    if (!payment || !payment.projectData) {
      toast({
        title: "Error",
        description: "No se pueden cargar los datos del estado de pago",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    console.log('🚀 Starting notification process...');

    try {
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
        uploadedDocuments: []
      };

      const result = await sendNotificationToMandante(notificationData);
      
      if (result.success) {
        toast({
          title: "Notificación enviada exitosamente",
          description: "Se ha enviado la notificación al mandante y actualizado el estado",
        });
        
        setTimeout(() => {
          navigate(`/project/${payment?.Project || 2}`);
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Error in notification process:', error);
      toast({
        title: "Error al enviar notificación",
        description: error.message || "Error al procesar la solicitud",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const generateUniqueURLAndUpdate = async () => {
    try {
      // Suponiendo que aquí hay una función para generar una URL única de algún proceso
      const uniqueUrl = `https://example.com/${payment.id}`;
      return uniqueUrl;
    } catch (error) {
      console.error("Error al generar la URL única:", error);
      return null;
    }
  };

  if (loading || !payment) {
    return <div>Cargando...</div>;
  }

  return (
    <div>
      <div className="flex items-center space-x-4">
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="mr-2" /> Volver
        </Button>
        <Button onClick={handleSendEmail} disabled={isUploading || notificationLoading}>
          {isUploading ? 'Enviando...' : 'Enviar Notificación'}
        </Button>
      </div>

      <div className="mt-4">
        {documentsFromPayment.map((doc) => (
          <div key={doc.id} className="flex justify-between items-center py-2">
            <div className="flex-1">
              <strong>{doc.name}</strong> - {doc.description}
            </div>
            <Button
              onClick={() => handleDownloadFile(doc.name)}
              variant="link"
              disabled={isUploading || !doc.uploaded}
              className="flex items-center"
            >
              <Download className="mr-2" /> Descargar
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <EmailTemplate payment={payment} formatCurrency={formatCurrency} />
      </div>
    </div>
  );
};

export default SubmissionPreview;
