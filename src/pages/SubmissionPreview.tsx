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

  // Function to extract the file ID from Google Drive URL
  const getFileIdFromURL = (url) => {
    const match = url.match(/\/d\/(.*?)\//);
    return match ? match[1] : null;
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
      // Generate direct download link
      const fileId = getFileIdFromURL(payment.URL);
      const downloadLink = `https://drive.google.com/uc?export=download&id=${fileId}`;
      
      // Create a download link element
      const a = document.createElement('a');
      a.href = downloadLink;
      a.download = fileName; // Forcing download
      document.body.appendChild(a);
      a.click(); // Trigger download
      document.body.removeChild(a);

      toast({
        title: "Descarga iniciada",
        description: `Se ha iniciado la descarga de ${fileName}`,
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

  // Handle downloading all files
  const handleDownloadAll = async () => {
    try {
      documentsFromPayment.forEach((doc) => {
        handleDownloadFile(doc.name);
      });

      toast({
        title: "Descargas iniciadas",
        description: "Se han iniciado las descargas de todos los archivos.",
      });
    } catch (error) {
      console.error('Error downloading all files:', error);
      toast({
        title: "Error al descargar",
        description: "Hubo un problema al intentar descargar todos los archivos.",
        variant: "destructive"
      });
    }
  };

  const headerStyle = {
    backgroundColor: '#F1C40F',  // Amarillo más cálido
    padding: '20px 30px',  // Ajuste en grosor
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '2px solid #F39C12',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">Cargando vista previa...</div>
        </div>
      </div>
    );
  }

  if (!payment || !payment.projectData) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-gloster-gray mb-4">
              {error || "Estado de pago no encontrado."}
            </p>
            <p className="text-sm text-gloster-gray mb-4">
              ID solicitado: {paymentId}
            </p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Volver al Inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const emailTemplateData = {
    paymentState: {
      month: `${payment.Mes} ${payment.Año}`,
      amount: payment.Total || 0,
      formattedAmount: formatCurrency(payment.Total || 0),
      dueDate: payment.ExpiryDate,
      projectName: payment.projectData.Name,
      recipient: payment.projectData.Owner?.ContactEmail || '',
      currency: payment.projectData.Currency || 'CLP'
    },
    project: {
      name: payment.projectData.Name,
      client: payment.projectData.Owner?.CompanyName || '',
      contractor: payment.projectData.Contratista?.CompanyName || '',
      location: payment.projectData.Location || '',
      projectManager: payment.projectData.Contratista?.ContactName || '',
      contactEmail: payment.projectData.Contratista?.ContactEmail || '',
      contractorRUT: payment.projectData.Contratista?.RUT || '',
      contractorPhone: payment.projectData.Contratista?.ContactPhone?.toString() || '',
      contractorAddress: payment.projectData.Contratista?.Adress || ''
    },
    documents: documentsFromPayment
  };

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <div className="bg-white border-b border-gloster-gray/20 shadow-sm print:hidden" style={headerStyle}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
                alt="Gloster Logo" 
                className="w-8 h-8"
              />
              <h1 className="text-xl font-bold text-slate-800 font-rubik">Vista previa del Email</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="font-rubik"
              >
                Imprimir
              </Button>
              {payment?.URL && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadFile('Documentos')}
                  className="font-rubik"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Archivos
                </Button>
              )}
              {isProjectUser && (
                <Button
                  size="sm"
                  onClick={handleSendEmail}
                  disabled={isUploading || notificationLoading}
                  className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isUploading || notificationLoading ? 'Enviando...' : 'Enviar Notificación'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 py-2 print:hidden">
        <div className="container mx-auto px-6">
          <button 
            onClick={() => isProjectUser ? navigate(`/payment/${payment.id}`) : navigate('/')}
            className="text-gloster-gray hover:text-slate-800 text-sm font-rubik flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isProjectUser ? 'Volver' : 'Volver al Inicio'}
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden email-template-container">
          <EmailTemplate 
            paymentId={paymentId}
            paymentState={emailTemplateData.paymentState}
            project={emailTemplateData.project}
            documents={emailTemplateData.documents}
            hideActionButtons={true}
            driveUrl={payment?.URL}
          />
        </div>
      </div>

      {/* Botón Descargar Todo */}
      <div className="container mx-auto px-6 py-4 flex justify-end">
        <Button
          size="sm"
          onClick={handleDownloadAll}
          className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
        >
          Descargar Todo
        </Button>
      </div>
    </div>
  );
};

export default SubmissionPreview;
