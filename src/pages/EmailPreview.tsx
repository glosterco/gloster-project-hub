import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Send } from 'lucide-react';
import EmailTemplate from '@/components/EmailTemplate';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import html2pdf from 'html2pdf.js';

const EmailPreview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId') || '11'; // Default to known existing ID
  const { payment, loading, error } = usePaymentDetail(paymentId);
  const { toast } = useToast();

  console.log('EmailPreview - paymentId:', paymentId);
  console.log('EmailPreview - payment data:', payment);
  console.log('EmailPreview - loading:', loading);
  console.log('EmailPreview - error:', error);

  const sampleDocuments = [
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
      name: 'Certificado de Pago de Cotizaciones',
      description: 'Certificado de cumplimiento previsional',
      uploaded: true
    },
    {
      id: 'f30',
      name: 'Certificado F30',
      description: 'Certificado de antecedentes laborales',
      uploaded: true
    },
    {
      id: 'f30_1',
      name: 'Certificado F30-1',
      description: 'Certificado de obligaciones laborales',
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
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      const element = document.querySelector('.email-template-container');
      if (!element) {
        toast({
          title: "Error",
          description: "No se pudo encontrar el contenido a convertir",
          variant: "destructive"
        });
        return;
      }

      const opt = {
        margin: 1,
        filename: `Estado_Pago_${payment?.Mes}_${payment?.Año}_${payment?.projectData?.Name || 'Proyecto'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
      
      toast({
        title: "PDF descargado",
        description: "El estado de pago se ha descargado exitosamente",
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

    const emailData = {
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
        projectManager: payment.projectData.Owner?.ContactName || '',
        contactEmail: payment.projectData.Owner?.ContactEmail || ''
      },
      documents: sampleDocuments,
      timestamp: new Date().toISOString()
    };

    console.log('Sending email with data:', emailData);

    try {
      const response = await fetch('https://hook.us2.make.com/aojj5wkdzhmre99szykaa1efxwnvn4e6', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (response.ok) {
        toast({
          title: "Email enviado",
          description: `Email con vista previa enviado exitosamente a ${payment.projectData.Owner?.ContactEmail}`,
        });
      } else {
        throw new Error('Network response was not ok');
      }
      
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: "Error al enviar",
        description: "Hubo un problema al enviar el email. Intenta nuevamente.",
        variant: "destructive"
      });
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
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Volver al Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Create email data structure for EmailTemplate with real data
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
      projectManager: payment.projectData.Owner?.ContactName || '',
      contactEmail: payment.projectData.Owner?.ContactEmail || ''
    },
    documents: sampleDocuments
  };

  console.log('EmailTemplate data:', emailTemplateData);

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
              <Button
                size="sm"
                onClick={handleSendEmail}
                className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Email con Vista Previa
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Volver */}
      <div className="bg-slate-50 py-2 print:hidden">
        <div className="container mx-auto px-6">
          <button 
            onClick={() => navigate(`/payment/${payment.id}`)}
            className="text-gloster-gray hover:text-slate-800 text-sm font-rubik flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
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

export default EmailPreview;
