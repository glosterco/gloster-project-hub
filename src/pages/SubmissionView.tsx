
import React from 'react';
import { useParams } from 'react-router-dom';
import DynamicPageHeader from '@/components/DynamicPageHeader';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Download, Eye, FileText, Calendar, DollarSign, Building, User, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const SubmissionView = () => {
  const { paymentId } = useParams<{ paymentId: string }>();
  const { payment, loading, error } = usePaymentDetail(paymentId || '');
  const { toast } = useToast();

  if (loading) {
    return <div>Cargando...</div>;
  }

  if (error || !payment) {
    return <div>Error: {error || 'Estado de pago no encontrado'}</div>;
  }

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

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <DynamicPageHeader />

      <div className="container mx-auto px-6 py-8">
        <Card className="mb-8 border-l-4 border-l-blue-500">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div className="w-12 h-12 bg-gloster-yellow/20 rounded-lg flex items-center justify-center shrink-0">
                  <Calendar className="h-6 w-6 text-gloster-gray" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-xl md:text-2xl mb-2 font-rubik text-slate-800">
                    {payment.Mes} {payment.Año}
                  </CardTitle>
                  <CardDescription className="text-gloster-gray font-rubik text-sm md:text-base">
                    {payment.projectData?.Name}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="bg-gloster-gray/20 text-gloster-gray border-gloster-gray/30 self-start shrink-0">
                {payment.Status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2 lg:col-span-1">
                <p className="text-gloster-gray text-sm font-rubik mb-2">Monto del Estado</p>
                <p className="font-bold text-lg md:text-xl text-slate-800 font-rubik break-words">
                  {formatCurrency(payment.Total)}
                </p>
              </div>
              <div>
                <p className="text-gloster-gray text-sm font-rubik">Fecha de Vencimiento</p>
                <p className="font-semibold text-slate-800 font-rubik">{payment.ExpiryDate}</p>
              </div>
              <div className="sm:col-span-2 lg:col-span-1">
                <p className="text-gloster-gray text-sm font-rubik">Destinatario</p>
                <p className="font-semibold text-slate-800 font-rubik break-words">{payment.projectData?.Owner?.ContactEmail}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Detalles del Mandante</CardTitle>
            <CardDescription>Información del mandante asociado al proyecto.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Building className="h-4 w-4 text-gray-500" />
                <span className="font-semibold">Compañía:</span>
                <span>{payment.projectData?.Owner?.CompanyName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-semibold">Contacto:</span>
                <span>{payment.projectData?.Owner?.ContactName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span className="font-semibold">Email:</span>
                <span>{payment.projectData?.Owner?.ContactEmail}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Documentos Adjuntos</CardTitle>
            <CardDescription>Lista de documentos adjuntos al estado de pago.</CardDescription>
          </CardHeader>
          <CardContent>
            {payment.URL && (
              <Button onClick={() => window.open(payment.URL, '_blank')}>
                <FileText className="h-4 w-4 mr-2" />
                Ver Documentos
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubmissionView;
