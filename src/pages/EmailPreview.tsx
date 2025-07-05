
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import EmailTemplate from '@/components/EmailTemplate';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { supabase } from '@/integrations/supabase/client';

const EmailPreview = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('paymentId') || '11';
  const { payment, loading, error } = usePaymentDetail(paymentId);
  const { toast } = useToast();
  const [hasAccess, setHasAccess] = useState(false);
  const [isProjectUser, setIsProjectUser] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Verificar si es usuario del proyecto (autenticado)
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Verificar si el usuario autenticado es el contratista del proyecto
          const { data: contractorData } = await supabase
            .from('Contratistas')
            .select('*')
            .eq('auth_user_id', user.id)
            .maybeSingle();

          if (contractorData && payment?.projectData?.Contratista?.id === contractorData.id) {
            setIsProjectUser(true);
            setHasAccess(true);
            setCheckingAccess(false);
            return;
          }
        }

        // Verificar acceso desde emailAccess (para mandantes)
        const emailAccess = sessionStorage.getItem('emailAccess');
        if (emailAccess) {
          const accessData = JSON.parse(emailAccess);
          if (accessData.paymentId === paymentId) {
            setHasAccess(true);
            setCheckingAccess(false);
            return;
          }
        }

        // Sin acceso, redirigir a página de acceso
        setCheckingAccess(false);
        navigate(`/email-access?paymentId=${paymentId}`);
      } catch (error) {
        console.error('Error checking access:', error);
        setCheckingAccess(false);
        navigate(`/email-access?paymentId=${paymentId}`);
      }
    };

    if (payment) {
      checkAccess();
    }
  }, [payment, paymentId, navigate]);

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

  if (checkingAccess) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">Verificando acceso...</div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return null; // El useEffect ya redirige
  }

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

  // Create email data structure for EmailTemplate with corrected contractor information
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
    documents: sampleDocuments
  };

  console.log('EmailTemplate data:', emailTemplateData);

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      {/* Header de navegación - Sin botones de descarga */}
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
            
            {/* Removed all download buttons */}
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
            hideActionButtons={true}
            driveUrl={payment?.URL}
          />
        </div>
      </div>
    </div>
  );
};

export default EmailPreview;
