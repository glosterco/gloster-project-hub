import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Send } from 'lucide-react';
import EmailTemplate from '@/components/EmailTemplate';

const EmailPreview = () => {
  const navigate = useNavigate();

  // Datos de ejemplo actualizados
  const samplePaymentState = {
    month: "Mayo 2024",
    amount: 28000000,
    dueDate: "2024-05-30",
    projectName: "Centro Comercial Plaza Norte",
    recipient: "aadelpino97@gmail.com"
  };

  const sampleProject = {
    name: "Centro Comercial Plaza Norte",
    client: "Inversiones Comerciales Ltda.",
    contractor: "Constructora ABC Ltda.",
    location: "Las Condes",
    projectManager: "Ana Rodríguez",
    contactEmail: "aadelpino97@gmail.com"
  };

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

  const handleDownloadPDF = () => {
    // Simulación de descarga PDF
    alert('Funcionalidad de descarga PDF estará disponible pronto');
  };

  return (
    <div className="min-h-screen bg-slate-50">
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
                className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Email
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Volver - fuera del banner blanco */}
      <div className="bg-slate-50 py-2 print:hidden">
        <div className="container mx-auto px-6">
          <button 
            onClick={() => navigate('/payment/5')}
            className="text-gloster-gray hover:text-slate-800 text-sm font-rubik flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </button>
        </div>
      </div>

      {/* Contenido de la plantilla */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          <EmailTemplate 
            paymentState={samplePaymentState}
            project={sampleProject}
            documents={sampleDocuments}
          />
        </div>
      </div>
    </div>
  );
};

export default EmailPreview;
