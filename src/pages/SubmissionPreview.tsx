
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
      <div className="bg-white border-b border-gloster-gray/20 shadow-sm print:hidden">
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
    </div>
  );
};

export default SubmissionPreview;
