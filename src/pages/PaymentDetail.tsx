
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, MapPin, Building2, User, Mail, ArrowLeft, Eye } from 'lucide-react';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PaymentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { payment, loading, error } = usePaymentDetail(id || '');

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-lg">Cargando estado de pago...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-lg text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-lg">Estado de pago no encontrado</div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'En Progreso':
        return 'bg-blue-100 text-blue-800';
      case 'Completado':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number | null, currency: string = 'CLP') => {
    if (amount === null) return 'Pendiente';
    
    // Handle common currency symbols and convert them to proper ISO codes
    let currencyCode = currency;
    if (currency === '$' || currency === 'USD') {
      currencyCode = 'USD';
    } else if (currency === 'CLP' || currency === '₱') {
      currencyCode = 'CLP';
    } else if (currency === '€' || currency === 'EUR') {
      currencyCode = 'EUR';
    }
    
    try {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: currencyCode,
      }).format(amount);
    } catch (error) {
      // Fallback if currency code is still invalid
      console.warn('Invalid currency code:', currency, 'falling back to CLP');
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
      }).format(amount);
    }
  };

  // Get project requirements safely, with fallback to empty array
  const availableDocuments = payment.projectData?.Requierment || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="outline" 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Estado de Pago: {payment.Name}
          </h1>
          <p className="text-gray-600">
            {payment.Mes} {payment.Año}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Estado del Pago</span>
                <Badge className={getStatusColor(payment.Status)}>
                  {payment.Status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Fecha de Vencimiento</p>
                    <p className="font-medium">
                      {format(new Date(payment.ExpiryDate), 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DollarSign className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Monto Total</p>
                    <p className="font-medium">
                      {formatCurrency(payment.Total, payment.projectData?.Currency)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents Section */}
          <Card>
            <CardHeader>
              <CardTitle>Documentos Requeridos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableDocuments.map((doc, index) => (
                  <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{doc}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          Documento requerido para este estado de pago
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        Subir
                      </Button>
                    </div>
                  </div>
                ))}
                {availableDocuments.length === 0 && (
                  <p className="text-gray-500 col-span-2">No hay documentos específicos requeridos.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button 
              onClick={() => navigate(`/submission-preview/${payment.id}`)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Ver Vista Previa
            </Button>
            <Button variant="outline">
              Guardar Borrador
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Info */}
          {payment.projectData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Información del Proyecto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{payment.projectData.Name}</h3>
                  <p className="text-gray-600 text-sm mt-1">{payment.projectData.Description}</p>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{payment.projectData.Location}</span>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500 mb-2">Presupuesto Total</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(payment.projectData.Budget, payment.projectData.Currency)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Contact Info */}
          {payment.projectData?.Owner && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Mandante
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="font-medium">{payment.projectData.Owner.CompanyName}</p>
                  <p className="text-sm text-gray-600">{payment.projectData.Owner.ContactName}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{payment.projectData.Owner.ContactEmail}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentDetail;
