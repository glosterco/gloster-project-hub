import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Send, Calendar, DollarSign, Building, User, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { payment, loading, error } = usePaymentDetail(id || '');

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
            <p className="text-gloster-gray mb-4">Estado de pago no encontrado.</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Volver al Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number, currency: string = 'CLP') => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: currency === 'CLP' ? 'CLP' : 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'aprobado':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rechazado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get project requirements from database
  const getProjectRequiredDocuments = () => {
    // Get requirements from project data - this comes from the Requierment field in Proyectos table
    const projectRequirements = payment.projectData?.Requierment || [];
    
    // Document descriptions mapping
    const documentDescriptions = {
      'Carátula EEPP (resumen)': 'Presentación y resumen del estado de pago',
      'Avance del período': 'Planilla detallada del avance de obras del período',
      'Certificado de pago de cotizaciones': 'Certificado de cumplimiento previsional',
      'Certificado F30': 'Certificado de antecedentes laborales',
      'Certificado F30-1': 'Certificado de obligaciones laborales',
      'Exámenes preocupacionales': 'Certificados médicos requeridos',
      'Finiquitos': 'Documentos de finiquitos laborales',
      'Factura': 'Factura del período correspondiente'
    };

    return projectRequirements.map((reqName: string) => ({
      name: reqName,
      description: documentDescriptions[reqName] || 'Documento requerido para el proyecto',
      uploaded: true // For demo purposes, all are marked as uploaded
    }));
  };

  const requiredDocuments = getProjectRequiredDocuments();

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      {/* Header */}
      <div className="bg-white border-b border-gloster-gray/20 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
                alt="Gloster Logo" 
                className="w-8 h-8"
              />
              <h1 className="text-xl font-bold text-slate-800 font-rubik">
                Estado de Pago - {payment.Name}
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => navigate(`/submission-preview?paymentId=${payment.id}`)}
                className="font-rubik"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver Vista Previa
              </Button>
              <Button
                onClick={() => navigate(`/submission-preview?paymentId=${payment.id}`)}
                className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Email
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="bg-slate-50 py-2">
        <div className="container mx-auto px-6">
          <button 
            onClick={() => navigate(`/project/${payment.projectData?.id}`)}
            className="text-gloster-gray hover:text-slate-800 text-sm font-rubik flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Proyecto
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment State Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-gloster-gray/20 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-slate-800 font-rubik">
                    {payment.Name} - {payment.Mes} {payment.Año}
                  </CardTitle>
                  <Badge className={`${getStatusColor(payment.Status)} font-rubik`}>
                    {payment.Status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gloster-yellow/20 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-gloster-gray" />
                    </div>
                    <div>
                      <p className="text-sm text-gloster-gray font-rubik">Monto Total</p>
                      <p className="text-lg font-semibold text-slate-800 font-rubik">
                        {payment.Total ? formatCurrency(payment.Total, payment.projectData.Currency) : 'No definido'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gloster-yellow/20 rounded-lg flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-gloster-gray" />
                    </div>
                    <div>
                      <p className="text-sm text-gloster-gray font-rubik">Fecha de Vencimiento</p>
                      <p className="text-lg font-semibold text-slate-800 font-rubik">
                        {format(new Date(payment.ExpiryDate), 'dd \'de\' MMMM, yyyy', { locale: es })}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold text-slate-800 font-rubik mb-4">
                    Información del Proyecto
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <Building className="h-5 w-5 text-gloster-gray mt-1" />
                      <div>
                        <p className="text-sm text-gloster-gray font-rubik">Proyecto</p>
                        <p className="font-semibold text-slate-800 font-rubik">
                          {payment.projectData.Name}
                        </p>
                        <p className="text-sm text-gloster-gray font-rubik">
                          {payment.projectData.Location}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <DollarSign className="h-5 w-5 text-gloster-gray mt-1" />
                      <div>
                        <p className="text-sm text-gloster-gray font-rubik">Presupuesto Total</p>
                        <p className="font-semibold text-slate-800 font-rubik">
                          {formatCurrency(payment.projectData.Budget, payment.projectData.Currency)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Requirements */}
            <Card className="border-gloster-gray/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-slate-800 font-rubik">
                  Documentos Requeridos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {requiredDocuments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {requiredDocuments.map((doc, index) => (
                      <div key={index} className="p-4 border border-gloster-gray/20 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-slate-800 font-rubik">{doc.name}</h4>
                          <Badge className="bg-green-100 text-green-800 border-green-200 font-rubik">
                            Subido
                          </Badge>
                        </div>
                        <p className="text-sm text-gloster-gray font-rubik">
                          {doc.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gloster-gray font-rubik text-center py-4">
                    No hay documentos específicos requeridos para este proyecto.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contractor Info */}
            <Card className="border-gloster-gray/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-800 font-rubik">
                  Información del Contratista
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Building className="h-5 w-5 text-gloster-gray mt-1" />
                  <div>
                    <p className="text-sm text-gloster-gray font-rubik">Empresa</p>
                    <p className="font-semibold text-slate-800 font-rubik">
                      {payment.projectData.Contratista?.CompanyName}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-gloster-gray mt-1" />
                  <div>
                    <p className="text-sm text-gloster-gray font-rubik">Contacto</p>
                    <p className="font-semibold text-slate-800 font-rubik">
                      {payment.projectData.Contratista?.ContactName}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-gloster-gray mt-1" />
                  <div>
                    <p className="text-sm text-gloster-gray font-rubik">Email</p>
                    <p className="font-semibold text-slate-800 font-rubik">
                      {payment.projectData.Contratista?.ContactEmail}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Client Info */}
            <Card className="border-gloster-gray/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-slate-800 font-rubik">
                  Información del Mandante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Building className="h-5 w-5 text-gloster-gray mt-1" />
                  <div>
                    <p className="text-sm text-gloster-gray font-rubik">Empresa</p>
                    <p className="font-semibold text-slate-800 font-rubik">
                      {payment.projectData.Owner?.CompanyName}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <User className="h-5 w-5 text-gloster-gray mt-1" />
                  <div>
                    <p className="text-sm text-gloster-gray font-rubik">Contacto</p>
                    <p className="font-semibold text-slate-800 font-rubik">
                      {payment.projectData.Owner?.ContactName}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-gloster-gray mt-1" />
                  <div>
                    <p className="text-sm text-gloster-gray font-rubik">Email</p>
                    <p className="font-semibold text-slate-800 font-rubik">
                      {payment.projectData.Owner?.ContactEmail}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetail;
