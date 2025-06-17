
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Calendar, DollarSign, MapPin, Building, User, Send, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useEmailNotification } from '@/hooks/useEmailNotification';
import { useToast } from '@/hooks/use-toast';

const PaymentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { payment, loading, error } = usePaymentDetail(id || '');
  const { sendPaymentNotification } = useEmailNotification();
  const { toast } = useToast();

  const formatCurrency = (amount: number | null) => {
    if (amount === null) {
      return 'Monto no disponible';
    }
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatProjectBudget = (amount: number, currency: string) => {
    // Convert database currency symbols to proper ISO codes
    const normalizedCurrency = currency === '$' ? 'CLP' : currency;
    
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: normalizedCurrency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleSendEmailNotification = async () => {
    if (!payment || !payment.projectData) {
      toast({
        title: "Error",
        description: "No se pueden cargar los datos del estado de pago",
        variant: "destructive"
      });
      return;
    }

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
        projectManager: payment.projectData.Contratista?.ContactName || '',
        contactEmail: payment.projectData.Contratista?.ContactEmail || ''
      },
      documents: sampleDocuments,
      accessUrl: `${window.location.origin}/email-access?paymentId=${payment.id}`
    };

    await sendPaymentNotification(emailData);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">Cargando detalles del estado de pago...</div>
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
              ID solicitado: {id}
            </p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Volver al Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      {/* Header Section */}
      <div className="bg-white border-b border-gloster-gray/20 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
              alt="Gloster Logo" 
              className="w-8 h-8"
            />
            <h1 className="text-xl font-bold text-slate-800 font-rubik">
              Detalles del Estado de Pago
            </h1>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-slate-50 py-2">
        <div className="container mx-auto px-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-gloster-gray hover:text-slate-800 text-sm font-rubik flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Payment Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 font-rubik text-slate-800">
                <FileText className="h-5 w-5 text-gloster-gray" />
                <span>Información del Estado de Pago</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Nombre</p>
                <p className="font-semibold text-slate-800 font-rubik">{payment.Name}</p>
              </div>
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Estado</p>
                <Badge className="bg-blue-100 text-blue-800 border-none font-rubik">{payment.Status}</Badge>
              </div>
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Total</p>
                <p className="font-bold text-xl text-slate-800 font-rubik">{formatCurrency(payment.Total)}</p>
              </div>
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Fecha de Vencimiento</p>
                <p className="font-semibold text-slate-800 font-rubik">{formatDate(payment.ExpiryDate)}</p>
              </div>
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Completado</p>
                <p className="font-semibold text-slate-800 font-rubik">{payment.Completion ? 'Sí' : 'No'}</p>
              </div>
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Mes/Año</p>
                <p className="font-semibold text-slate-800 font-rubik">{payment.Mes} / {payment.Año}</p>
              </div>
            </CardContent>
          </Card>

          {/* Project Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 font-rubik text-slate-800">
                <Building className="h-5 w-5 text-gloster-gray" />
                <span>Información del Proyecto</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Nombre del Proyecto</p>
                <p className="font-semibold text-slate-800 font-rubik">{payment.projectData.Name}</p>
              </div>
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Descripción</p>
                <p className="font-semibold text-slate-800 font-rubik">{payment.projectData.Description}</p>
              </div>
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Ubicación</p>
                <p className="font-semibold text-slate-800 font-rubik">{payment.projectData.Location}</p>
              </div>
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Presupuesto</p>
                <p className="font-semibold text-slate-800 font-rubik">
                  {formatProjectBudget(payment.projectData.Budget, payment.projectData.Currency)}
                </p>
              </div>
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Fecha de Inicio</p>
                <p className="font-semibold text-slate-800 font-rubik">{formatDate(payment.projectData.StartDate)}</p>
              </div>
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Duración (meses)</p>
                <p className="font-semibold text-slate-800 font-rubik">{payment.projectData.Duration}</p>
              </div>
            </CardContent>
          </Card>

          {/* Contractor Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 font-rubik text-slate-800">
                <User className="h-5 w-5 text-gloster-gray" />
                <span>Información del Contratista</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Empresa</p>
                <p className="font-semibold text-slate-800 font-rubik">{payment.projectData.Contratista?.CompanyName || 'No disponible'}</p>
              </div>
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Contacto</p>
                <p className="font-semibold text-slate-800 font-rubik">{payment.projectData.Contratista?.ContactName || 'No disponible'}</p>
              </div>
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Email</p>
                <a href={`mailto:${payment.projectData.Contratista?.ContactEmail}`} className="font-semibold text-blue-600 hover:text-blue-800 font-rubik">
                  {payment.projectData.Contratista?.ContactEmail || 'No disponible'}
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Owner Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 font-rubik text-slate-800">
                <User className="h-5 w-5 text-gloster-gray" />
                <span>Información del Mandante</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Empresa</p>
                <p className="font-semibold text-slate-800 font-rubik">{payment.projectData.Owner?.CompanyName || 'No disponible'}</p>
              </div>
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Contacto</p>
                <p className="font-semibold text-slate-800 font-rubik">{payment.projectData.Owner?.ContactName || 'No disponible'}</p>
              </div>
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Email</p>
                <a href={`mailto:${payment.projectData.Owner?.ContactEmail}`} className="font-semibold text-blue-600 hover:text-blue-800 font-rubik">
                  {payment.projectData.Owner?.ContactEmail || 'No disponible'}
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle className="font-rubik text-slate-800">Acciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => navigate(`/email-preview?paymentId=${payment?.id}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-rubik"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Vista Previa del Email
                </Button>
                <Button
                  onClick={handleSendEmailNotification}
                  className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Notificación por Email
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetail;
