
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Send } from 'lucide-react';
import EmailTemplate from '@/components/EmailTemplate';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useMandanteNotification } from '@/hooks/useMandanteNotification';
import { supabase } from '@/integrations/supabase/client';
import html2pdf from 'html2pdf.js';

const SubmissionPreview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId') || '11';
  const { payment, loading, error } = usePaymentDetail(paymentId, false);
  const { sendNotificationToMandante, loading: notificationLoading } = useMandanteNotification();
  const { toast } = useToast();
  const [isProjectUser, setIsProjectUser] = useState(false);

  useEffect(() => {
    // Verificar si el usuario está autenticado para mostrar botón de envío
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsProjectUser(!!user);
    };
    
    checkUser();
  }, []);

  // Crear documentos basados en información real
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

  const handleDownloadPDF = async () => {
    try {
      const element = document.querySelector('.email-template-container') as HTMLElement;
      if (!element) {
        toast({
          title: "Error",
          description: "No se pudo encontrar el contenido a convertir",
          variant: "destructive"
        });
        return;
      }

      const elementHeight = element.scrollHeight;
      const a4Height = 842;
      const availableHeight = a4Height - 60;
      const scale = Math.min(0.6, availableHeight / elementHeight);

      const opt = {
        margin: [0.2, 0.2, 0.2, 0.2],
        filename: `Estado_Pago_${payment?.Mes}_${payment?.Año}_${payment?.projectData?.Name || 'Proyecto'}.pdf`,
        image: { 
          type: 'jpeg', 
          quality: 0.98 
        },
        html2canvas: { 
          scale: 1.2,
          useCORS: true,
          allowTaint: true,
          height: element.scrollHeight,
          width: element.scrollWidth,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: { 
          unit: 'in', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        },
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy']
        }
      };

      const originalStyle = element.style.cssText;
      const originalTransform = element.style.transform;
      
      element.style.transform = `scale(${scale})`;
      element.style.transformOrigin = 'top left';
      element.style.width = `${100 / scale}%`;
      element.style.height = 'auto';

      await new Promise(resolve => setTimeout(resolve, 300));

      await html2pdf().set(opt).from(element).save();
      
      element.style.cssText = originalStyle;
      element.style.transform = originalTransform;
      
      toast({
        title: "PDF descargado",
        description: "El estado de pago se ha descargado exitosamente en una sola página",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error al descargar",
        description: "Hubo un problema al generar el PDF. Intenta nuevamente.",
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

    const notificationData = {
      paymentId: paymentId,
      contratista: payment.projectData.Contratista?.ContactName || '',
      mes: payment.Mes || '',
      año: payment.Año || 0,
      proyecto: payment.projectData.Name || '',
      mandanteEmail: payment.projectData.Owner?.ContactEmail || '',
      mandanteCompany: payment.projectData.Owner?.CompanyName || '',
      contractorCompany: payment.projectData.Contratista?.CompanyName || '',
      amount: payment.Total || 0,
      dueDate: payment.ExpiryDate || ''
    };

    await sendNotificationToMandante(notificationData);
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

  if (error || !payment || !payment.projectData) {
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

  // Crear datos reales para el template
  const emailTemplateData = {
    paymentState: {
      month: `${payment.Mes} ${payment.Año}`,
      amount: payment.Total || 0,
      dueDate: payment.ExpiryDate,
      projectName: payment.projectData.Name,
      recipient: payment.projectData.Owner?.ContactEmail || ''
    },
    project: {
      name: payment.projectData.Name,
      client: payment.projectData.Owner?.CompanyName || '',
      contractor: payment.projectData.Contratista?.CompanyName || '',
      location: payment.projectData.Location || '',
      projectManager: payment.projectData.Contratista?.ContactName || '',
      contactEmail: payment.projectData.Contratista?.ContactEmail || ''
    },
    documents: documentsFromPayment
  };

  console.log('SubmissionPreview data:', emailTemplateData);

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      {/* Header de navegación */}
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
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPDF}
                className="font-rubik"
              >
                <Download className="h-4 w-4 mr-2" />
                Descargar PDF
              </Button>
              {isProjectUser && (
                <Button
                  size="sm"
                  onClick={handleSendEmail}
                  disabled={notificationLoading}
                  className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {notificationLoading ? 'Enviando...' : 'Enviar Notificación'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Volver */}
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

      {/* Contenido de la plantilla */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden email-template-container">
          <EmailTemplate 
            paymentState={emailTemplateData.paymentState}
            project={emailTemplateData.project}
            documents={emailTemplateData.documents}
          />
        </div>
      </div>
    </div>
  );
};

export default SubmissionPreview;
