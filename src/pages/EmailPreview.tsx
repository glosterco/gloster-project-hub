
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Mail, Calendar, DollarSign, Building2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';

const EmailPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <PageHeader />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">Cargando vista previa...</div>
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
            <p className="text-gloster-gray">Estado de pago no encontrado.</p>
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
      <PageHeader />

      {/* Navigation */}
      <div className="bg-slate-50 py-2">
        <div className="container mx-auto px-6">
          <button 
            onClick={() => navigate(`/payment/${payment.id}`)}
            className="text-gloster-gray hover:text-slate-800 text-sm font-rubik flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Estado de Pago
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2 font-rubik flex items-center gap-2">
            <Mail className="h-8 w-8 text-gloster-yellow" />
            Vista Previa del Email
          </h1>
          <p className="text-gloster-gray font-rubik">
            Estado de pago: {payment.Name} - {payment.Mes} {payment.Año}
          </p>
        </div>

        {/* Email Preview */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="bg-gloster-yellow/10 border-b">
            <CardTitle className="text-lg font-rubik">
              Notificación de Estado de Pago - {payment.projectData?.Name}
            </CardTitle>
            <div className="text-sm text-gloster-gray space-y-1">
              <p><strong>Para:</strong> {payment.projectData?.Owner?.ContactEmail}</p>
              <p><strong>De:</strong> {payment.projectData?.Contratista?.ContactEmail}</p>
              <p><strong>Asunto:</strong> Estado de Pago {payment.Name} - {payment.Mes} {payment.Año}</p>
            </div>
          </CardHeader>
          
          <CardContent className="p-8 bg-white">
            <div className="space-y-6">
              {/* Greeting */}
              <div>
                <p className="font-rubik">
                  Estimado/a {payment.projectData?.Owner?.ContactName},
                </p>
              </div>

              {/* Introduction */}
              <div>
                <p className="font-rubik">
                  Nos complace informarle sobre el estado de pago correspondiente al período de{' '}
                  <strong>{payment.Mes} {payment.Año}</strong> del proyecto{' '}
                  <strong>{payment.projectData?.Name}</strong>.
                </p>
              </div>

              {/* Payment Details */}
              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-lg font-rubik text-slate-800">
                    Detalles del Estado de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-gloster-gray" />
                      <div>
                        <p className="text-sm text-gloster-gray font-rubik">Proyecto</p>
                        <p className="font-semibold font-rubik">{payment.projectData?.Name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-gloster-gray" />
                      <div>
                        <p className="text-sm text-gloster-gray font-rubik">Período</p>
                        <p className="font-semibold font-rubik">{payment.Mes} {payment.Año}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-gloster-gray" />
                      <div>
                        <p className="text-sm text-gloster-gray font-rubik">Monto</p>
                        <p className="font-semibold font-rubik">
                          {payment.Total ? 
                            formatCurrency(payment.Total, payment.projectData?.Currency || 'CLP') : 
                            'Por definir'
                          }
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-gloster-gray" />
                      <div>
                        <p className="text-sm text-gloster-gray font-rubik">Fecha de Vencimiento</p>
                        <p className="font-semibold font-rubik">
                          {new Date(payment.ExpiryDate).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Project Information */}
              <div>
                <h3 className="text-lg font-semibold mb-3 font-rubik">Información del Proyecto</h3>
                <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                  <p className="font-rubik">
                    <strong>Descripción:</strong> {payment.projectData?.Description}
                  </p>
                  <p className="font-rubik">
                    <strong>Ubicación:</strong> {payment.projectData?.Location}
                  </p>
                  <p className="font-rubik">
                    <strong>Contratista:</strong> {payment.projectData?.Contratista?.CompanyName}
                  </p>
                </div>
              </div>

              {/* Documents Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3 font-rubik">Documentación</h3>
                <p className="font-rubik">
                  Se adjuntan los documentos correspondientes al estado de pago para su revisión y aprobación.
                  Por favor, revise la documentación y confirme su aprobación a través de la plataforma.
                </p>
              </div>

              {/* Contact Information */}
              <div className="bg-gloster-yellow/10 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 font-rubik">Información de Contacto</h3>
                <div className="space-y-2">
                  <p className="font-rubik">
                    <strong>Empresa:</strong> {payment.projectData?.Contratista?.CompanyName}
                  </p>
                  <p className="font-rubik">
                    <strong>Contacto:</strong> {payment.projectData?.Contratista?.ContactName}
                  </p>
                  <p className="font-rubik">
                    <strong>Email:</strong> {payment.projectData?.Contratista?.ContactEmail}
                  </p>
                </div>
              </div>

              {/* Closing */}
              <div>
                <p className="font-rubik">
                  Agradecemos su atención y quedamos a la espera de su confirmación.
                </p>
                <p className="font-rubik mt-4">
                  Atentamente,<br />
                  <strong>{payment.projectData?.Contratista?.CompanyName}</strong>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-4 mt-6">
          <Button
            onClick={() => navigate(`/payment/${payment.id}`)}
            variant="outline"
            className="font-rubik"
          >
            Volver al Estado de Pago
          </Button>
          <Button
            onClick={() => window.print()}
            className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
          >
            Imprimir Email
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmailPreview;
