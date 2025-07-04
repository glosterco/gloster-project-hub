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

  // Styling for header adjustment
  const headerStyle = {
    backgroundColor: '#F1C40F',  // Amarillo más cálido
    padding: '20px 30px',  // Ajuste en grosor
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '2px solid #F39C12',
  };

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <div style={headerStyle} className="bg-white border-b border-gloster-gray/20 shadow-sm">
        <div className="flex items-center space-x-3">
          <img 
            src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
            alt="Gloster Logo" 
            className="w-12 h-12"  // Ajuste de tamaño
          />
          <h1 className="text-2xl font-bold text-slate-800">Vista previa del Email</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownloadAll}
          className="font-rubik"
        >
          Descargar Todo
        </Button>
      </div>

      <div className="bg-slate-50 py-2">
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-6">
            <h2 className="text-lg font-semibold text-slate-700">Documentación Adjunta</h2>
          </div>

          {/* Document cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {documentsFromPayment.map((doc) => (
              <div key={doc.id} className="bg-white shadow-sm border border-gray-200 rounded-md p-4">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-slate-700">{doc.name}</h3>
                  <p className="text-sm text-slate-500">{doc.description}</p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadFile(doc.name)}
                  className="mt-4 w-full"
                >
                  Descargar
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionPreview;
