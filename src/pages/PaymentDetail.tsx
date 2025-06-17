
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Calendar, FileText, CheckCircle, Clock, DollarSign, Building, MapPin, User, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { payment, loading } = usePaymentDetail(id || '');

  const formatCurrency = (amount: number, currency: string = 'CLP') => {
    const currencyMap: { [key: string]: Intl.NumberFormatOptions } = {
      'CLP': { style: 'currency' as const, currency: 'CLP', minimumFractionDigits: 0 },
      'USD': { style: 'currency' as const, currency: 'USD', minimumFractionDigits: 0 },
      'UF': { style: 'decimal' as const, minimumFractionDigits: 2 }
    };

    const config = currencyMap[currency] || currencyMap.CLP;
    
    if (currency === 'UF') {
      return `UF ${new Intl.NumberFormat('es-CL', config).format(amount)}`;
    }
    
    return new Intl.NumberFormat('es-CL', config).format(amount);
  };

  const getStatusInfo = () => {
    if (!payment) return { text: 'Cargando...', color: 'bg-gray-100 text-gray-700', icon: Clock };
    
    const today = new Date();
    const expiryDate = new Date(payment.ExpiryDate);
    
    if (payment.Completion) {
      return { text: 'Aprobado', color: 'bg-green-100 text-green-700', icon: CheckCircle };
    }
    
    if (expiryDate > today) {
      return { text: 'Programado', color: 'bg-blue-100 text-blue-700', icon: Clock };
    }
    
    return { text: 'Pendiente', color: 'bg-gloster-yellow/20 text-gloster-gray', icon: Clock };
  };

  const handlePreviewEmail = () => {
    if (!payment) {
      toast({
        title: "Error",
        description: "No se puede generar la vista previa sin datos del estado de pago",
        variant: "destructive"
      });
      return;
    }
    navigate(`/email-preview?paymentId=${payment.id}`);
  };

  const handleViewInDrive = () => {
    if (!payment?.URL) {
      toast({
        title: "Carpeta no disponible",
        description: "Este estado de pago no tiene una carpeta de Google Drive asociada",
        variant: "destructive"
      });
      return;
    }
    window.open(`https://drive.google.com/drive/folders/${payment.URL}`, '_blank');
  };

  // Documentos requeridos basados en los requerimientos del proyecto
  const getRequiredDocuments = () => {
    if (!payment?.projectData?.Requierment) {
      return [
        { id: 'eepp', name: 'Carátula EEPP', description: 'Presentación y resumen del estado de pago', required: true },
        { id: 'planilla', name: 'Avance Periódico', description: 'Planilla detallada del avance de obras del período', required: true },
        { id: 'factura', name: 'Factura', description: 'Factura del período correspondiente', required: true }
      ];
    }

    const requirements = payment.projectData.Requierment;
    const documents = [];

    // Mapear requerimientos a documentos
    if (requirements.includes('EEPP') || requirements.includes('Carátula EEPP')) {
      documents.push({ id: 'eepp', name: 'Carátula EEPP', description: 'Presentación y resumen del estado de pago', required: true });
    }
    if (requirements.includes('Planilla') || requirements.includes('Avance Periódico')) {
      documents.push({ id: 'planilla', name: 'Avance Periódico', description: 'Planilla detallada del avance de obras del período', required: true });
    }
    if (requirements.includes('Cotizaciones') || requirements.includes('Certificado de Pago de Cotizaciones')) {
      documents.push({ id: 'cotizaciones', name: 'Certificado de Pago de Cotizaciones', description: 'Certificado de cumplimiento previsional', required: true });
    }
    if (requirements.includes('F30')) {
      documents.push({ id: 'f30', name: 'Certificado F30', description: 'Certificado de antecedentes laborales', required: true });
    }
    if (requirements.includes('F30-1')) {
      documents.push({ id: 'f30_1', name: 'Certificado F30-1', description: 'Certificado de obligaciones laborales', required: true });
    }
    if (requirements.includes('Factura')) {
      documents.push({ id: 'factura', name: 'Factura', description: 'Factura del período correspondiente', required: true });
    }

    // Si no hay documentos específicos, agregar los básicos
    if (documents.length === 0) {
      documents.push(
        { id: 'eepp', name: 'Carátula EEPP', description: 'Presentación y resumen del estado de pago', required: true },
        { id: 'planilla', name: 'Avance Periódico', description: 'Planilla detallada del avance de obras del período', required: true },
        { id: 'factura', name: 'Factura', description: 'Factura del período correspondiente', required: true }
      );
    }

    return documents;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <PageHeader />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">Cargando estado de pago...</div>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <PageHeader />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-gloster-gray">Estado de pago no encontrado o no tienes acceso a él.</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Volver al Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;
  const requiredDocuments = getRequiredDocuments();

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <PageHeader />

      {/* Navegación */}
      <div className="bg-slate-50 py-2">
        <div className="container mx-auto px-6">
          <button 
            onClick={() => navigate(`/project/${payment.Project}`)}
            className="text-gloster-gray hover:text-slate-800 text-sm font-rubik flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Proyecto
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Header del Estado de Pago */}
        <Card className="mb-6 border-l-4 border-l-gloster-gray hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-4">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <StatusIcon className="h-6 w-6 text-gloster-gray" />
                  <CardTitle className="text-2xl font-rubik text-slate-800">{payment.Name}</CardTitle>
                </div>
                <CardDescription className="text-gloster-gray text-base font-rubik">
                  {payment.Mes} {payment.Año} - {payment.projectData?.Name}
                </CardDescription>
              </div>
              <Badge variant="secondary" className={`${statusInfo.color} font-rubik self-start`}>
                {statusInfo.text}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <DollarSign className="h-5 w-5 text-gloster-gray" />
                  <div>
                    <p className="text-gloster-gray text-sm font-rubik">Monto Total</p>
                    <p className="font-semibold text-slate-800 font-rubik">
                      {payment.Total ? formatCurrency(payment.Total, payment.projectData?.Currency || 'CLP') : 'Sin monto definido'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gloster-gray" />
                  <div>
                    <p className="text-gloster-gray text-sm font-rubik">Fecha de Vencimiento</p>
                    <p className="font-semibold text-slate-800 font-rubik">
                      {new Date(payment.ExpiryDate).toLocaleDateString('es-CL')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-gloster-gray" />
                  <div>
                    <p className="text-gloster-gray text-sm font-rubik">Destinatario</p>
                    <p className="font-semibold text-slate-800 font-rubik">{payment.projectData?.Owner?.ContactName}</p>
                    <p className="text-sm text-gloster-gray font-rubik">{payment.projectData?.Owner?.ContactEmail}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Building className="h-5 w-5 text-gloster-gray" />
                  <div>
                    <p className="text-gloster-gray text-sm font-rubik">Empresa Mandante</p>
                    <p className="font-semibold text-slate-800 font-rubik">{payment.projectData?.Owner?.CompanyName}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información del Proyecto */}
        <Card className="mb-6 border-gloster-gray/20">
          <CardHeader>
            <CardTitle className="font-rubik text-slate-800 flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Información del Proyecto
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Nombre del Proyecto</p>
                  <p className="font-medium font-rubik">{payment.projectData?.Name}</p>
                </div>
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Descripción</p>
                  <p className="font-medium font-rubik">{payment.projectData?.Description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gloster-gray" />
                  <div>
                    <p className="text-gloster-gray text-sm font-rubik">Ubicación</p>
                    <p className="font-medium font-rubik">{payment.projectData?.Location}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Presupuesto Total</p>
                  <p className="font-medium font-rubik">
                    {payment.projectData?.Budget ? formatCurrency(payment.projectData.Budget, payment.projectData.Currency || 'CLP') : 'No definido'}
                  </p>
                </div>
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Contratista</p>
                  <p className="font-medium font-rubik">{payment.projectData?.Contratista?.CompanyName}</p>
                </div>
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Duración</p>
                  <p className="font-medium font-rubik">{payment.projectData?.Duration} días</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documentación Requerida */}
        <Card className="mb-6 border-gloster-gray/20">
          <CardHeader>
            <CardTitle className="font-rubik text-slate-800 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Documentación Requerida
            </CardTitle>
            <CardDescription className="font-rubik">
              Documentos necesarios para este estado de pago
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {requiredDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-8 h-8 bg-gloster-yellow/20 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="h-4 w-4 text-gloster-gray" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800 font-rubik text-sm">{doc.name}</h4>
                    <p className="text-gloster-gray text-xs font-rubik">{doc.description}</p>
                  </div>
                  {doc.required && (
                    <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                      Requerido
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handlePreviewEmail}
            className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-semibold font-rubik flex-1"
          >
            <Mail className="h-4 w-4 mr-2" />
            Vista Previa del Email
          </Button>
          
          {payment.URL && (
            <Button
              variant="outline"
              onClick={handleViewInDrive}
              className="border-gloster-gray/30 hover:bg-gloster-gray/10 font-rubik flex-1"
            >
              <FileText className="h-4 w-4 mr-2" />
              Ver en Google Drive
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={() => navigate(`/project/${payment.Project}`)}
            className="border-gloster-gray/30 hover:bg-gloster-gray/10 font-rubik flex-1"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Proyecto
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetail;
