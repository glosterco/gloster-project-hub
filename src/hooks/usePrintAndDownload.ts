
import { useToast } from '@/hooks/use-toast';
import html2pdf from 'html2pdf.js';
import { PaymentDetail } from '@/hooks/usePaymentDetail';

export const usePrintAndDownload = (payment: PaymentDetail | null) => {
  const { toast } = useToast();

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

  return {
    handlePrint,
    handleDownloadPDF
  };
};
