
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import EmailTemplate from '@/components/EmailTemplate';
import PaymentApprovalSection from '@/components/PaymentApprovalSection';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useDirectDownload } from '@/hooks/useDirectDownload';
import { supabase } from '@/integrations/supabase/client';
import html2pdf from 'html2pdf.js';

const SubmissionView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId') || '11';
  const { payment, loading, error, refetch } = usePaymentDetail(paymentId, true);
  const { downloadFilesDirect, loading: downloadLoading, downloadProgress } = useDirectDownload();
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isMandante, setIsMandante] = useState(false);
  const [accessChecked, setAccessChecked] = useState(false);

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
    const checkAccess = async () => {
      if (!payment || accessChecked) return;
      
      try {
        setCheckingAccess(true);
        console.log('🔍 Checking access for payment:', paymentId);
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user && payment?.projectData) {
          // Verificar si es contratista autenticado
          const { data: contractorData } = await supabase
            .from('Contratistas')
            .select('*')
            .eq('auth_user_id', user.id)
            .maybeSingle();

          if (contractorData && payment.projectData.Contratista?.id === contractorData.id) {
            console.log('✅ Contractor access granted');
            setHasAccess(true);
            setIsMandante(false);
            setAccessChecked(true);
            setCheckingAccess(false);
            return;
          }
        }

        // Verificar acceso del mandante desde sessionStorage
        const mandanteAccess = sessionStorage.getItem('mandanteAccess');
        if (mandanteAccess) {
          try {
            const accessData = JSON.parse(mandanteAccess);
            if (accessData.paymentId === paymentId && accessData.token) {
              console.log('✅ Mandante access granted');
              setHasAccess(true);
              setIsMandante(true);
              setAccessChecked(true);
              setCheckingAccess(false);
              return;
            }
          } catch (parseError) {
            console.error('Error parsing mandanteAccess:', parseError);
          }
        }

        console.log('❌ Access denied, redirecting to email access');
        setAccessChecked(true);
        setCheckingAccess(false);
        navigate(`/email-access?paymentId=${paymentId}`);
      } catch (error) {
        console.error('Error checking access:', error);
        setAccessChecked(true);
        setCheckingAccess(false);
        navigate(`/email-access?paymentId=${paymentId}`);
      }
    };

    if (payment && !accessChecked) {
      checkAccess();
    }
  }, [payment, paymentId, navigate, accessChecked]);

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

  const handleDownloadFiles = async () => {
    if (!payment) {
      toast({
        title: "Error",
        description: "No se encontraron datos del estado de pago",
        variant: "destructive"
      });
      return;
    }

    console.log('🚀 Starting direct file download for payment:', paymentId);
    
    const result = await downloadFilesDirect(paymentId);
    
    if (result.success) {
      console.log(`✅ Successfully downloaded ${result.filesCount} files`);
    } else {
      console.error('❌ Failed to download files:', result.error);
    }
  };

  const handleStatusChange = () => {
    console.log('🔄 Status changed, refreshing payment data...');
    refetch();
  };

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Verificando acceso...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Cargando datos del estado de pago...</span>
          </div>
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
      contractor: payment.projectData.Contratista?.CompanyName || 'No disponible',
      location: payment.projectData.Location || '',
      projectManager: payment.projectData.Contratista?.ContactName || 'No disponible',
      contactEmail: payment.projectData.Contratista?.ContactEmail || 'No disponible',
      contractorRUT: payment.projectData.Contratista?.RUT || 'No disponible',
      contractorPhone: payment.projectData.Contratista?.ContactPhone?.toString() || 'No disponible',
      contractorAddress: payment.projectData.Contratista?.Adress || 'No disponible'
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
              <h1 className="text-xl font-bold text-slate-800 font-rubik">Estado de Pago</h1>
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
                variant="outline"
                size="sm"
                onClick={handleDownloadFiles}
                disabled={downloadLoading}
                className="font-rubik"
              >
                {downloadLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {downloadLoading ? 
                  `Descargando... ${downloadProgress}%` : 
                  'Descargar Archivos'
                }
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden email-template-container">
            <EmailTemplate 
              paymentId={paymentId}
              paymentState={emailTemplateData.paymentState}
              project={emailTemplateData.project}
              documents={emailTemplateData.documents}
            />
          </div>

          {isMandante && (
            <PaymentApprovalSection
              paymentId={paymentId}
              paymentState={emailTemplateData.paymentState}
              onStatusChange={handleStatusChange}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmissionView;
