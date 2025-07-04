import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Send } from 'lucide-react';
import EmailTemplate from '@/components/EmailTemplate';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useMandanteNotification } from '@/hooks/useMandanteNotification';
import { supabase } from '@/integrations/supabase/client';

const SubmissionPreview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId') || '11';
  const { payment, loading, error } = usePaymentDetail(paymentId, true);
  const { sendNotificationToMandante, loading: notificationLoading } = useMandanteNotification();
  const { toast } = useToast();
  const [isProjectUser, setIsProjectUser] = useState(false);
  const [userChecked, setUserChecked] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [documentsUploaded, setDocumentsUploaded] = useState(false);

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'UF') {
      return `${amount.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UF`;
    } else if (currency === 'USD') {
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

  // Function to call backend API to get the file (mocked)
  const getFileFromBackend = async (fileName: string) => {
    try {
      // Make the request to the backend
      const response = await fetch(`/api/get-drive-files?fileName=${fileName}`);
      if (!response.ok) throw new Error('No se pudo obtener el archivo');
      const data = await response.json();

      return data.fileUrl;
    } catch (error) {
      console.error('Error getting file from backend:', error);
      toast({
        title: "Error al obtener archivo",
        description: "Hubo un problema al obtener el archivo.",
        variant: "destructive",
      });
    }
  };

  // Function to handle downloading each file
  const handleDownloadFile = async (fileName: string) => {
    try {
      const fileUrl = await getFileFromBackend(fileName);
      if (!fileUrl) return;

      // Create a temporary anchor tag to trigger the download
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
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
      for (const doc of documentsFromPayment) {
        await handleDownloadFile(doc.name);
      }

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

  // Function to print the page
  const handlePrint = () => {
    window.print();
  };

  // Function to handle sending email or notification
  const handleSendEmail = async () => {
    try {
      // Simulating email sending or notification logic here
      toast({
        title: "Enviando notificación...",
        description: "La notificación está siendo procesada.",
      });

      // Simulate a delay
      setTimeout(() => {
        toast({
          title: "Notificación Enviada",
          description: "La notificación se ha enviado exitosamente.",
        });
      }, 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un problema al enviar la notificación.",
        variant: "destructive",
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
    paymentId,
    amount: payment.amount,
    projectName: payment.projectData.name,
    recipient: payment.projectData.owner?.name || 'Cliente',
    dueDate: payment.dueDate,
  };

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <div className="container mx-auto px-6 py-8">
        <div style={headerStyle}>
          <div>
            <h1 className="text-xl text-white">Vista Previa de Documento</h1>
          </div>
          <div>
            <Button
              onClick={handleDownloadAll}
              className="bg-blue-500 text-white"
              icon={<Download />}
            >
              Descargar Todo
            </Button>
          </div>
        </div>
        
        {/* The rest of your page content... */}
      </div>
    </div>
  );
};

export default SubmissionPreview;
