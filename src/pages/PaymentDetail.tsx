
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Calendar, DollarSign, Building2, FileText, Upload, Eye, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { supabase } from '@/integrations/supabase/client';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  
  const { payment, loading, refetch } = usePaymentDetail(id || '');

  // Set initial payment amount when payment data loads
  React.useEffect(() => {
    if (payment && payment.Total && !paymentAmount) {
      setPaymentAmount(payment.Total.toString());
    }
  }, [payment, paymentAmount]);

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

  const getPaymentStatus = () => {
    if (!payment) return 'programado';
    
    const today = new Date();
    const expiryDate = new Date(payment.ExpiryDate);
    
    if (payment.Completion) {
      return 'aprobado';
    }
    
    if (expiryDate > today) {
      return 'programado';
    }
    
    return 'pendiente';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprobado':
        return 'bg-green-100 text-green-700';
      case 'pendiente':
        return 'bg-gloster-yellow/20 text-gloster-gray';
      case 'programado':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setUploadedFiles(Array.from(files));
    }
  };

  const handleAmountUpdate = async () => {
    if (!payment || !paymentAmount) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('Estados de pago')
        .update({ Total: parseInt(paymentAmount) })
        .eq('id', payment.id);

      if (error) {
        console.error('Error updating payment amount:', error);
        toast({
          title: "Error al actualizar monto",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Monto actualizado",
        description: "El monto del estado de pago ha sido actualizado exitosamente",
      });
      
      refetch();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error inesperado",
        description: "Hubo un error al actualizar el monto",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitDocuments = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "Sin documentos",
        description: "Por favor selecciona al menos un documento para subir",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Aquí iría la lógica para subir archivos
      // Por ahora solo simulamos el proceso
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Documentos enviados",
        description: "Los documentos han sido enviados para revisión del mandante",
      });
      
      setUploadedFiles([]);
    } catch (error) {
      toast({
        title: "Error al enviar documentos",
        description: "Hubo un error al enviar los documentos",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePreviewEmail = () => {
    if (!payment) return;
    navigate(`/email-preview/${payment.id}`);
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
            <p className="text-gloster-gray">Estado de pago no encontrado.</p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Volver al Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const status = getPaymentStatus();

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <PageHeader />

      {/* Volver al Dashboard */}
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
        {/* Payment State Banner */}
        <Card className="mb-6 border-l-4 border-l-gloster-gray">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2 font-rubik text-slate-800">
                  {payment.Name}
                </CardTitle>
                <div className="space-y-2">
                  <p className="text-gloster-gray font-rubik">
                    <span className="font-semibold">Proyecto:</span> {payment.projectData?.Name}
                  </p>
                  <p className="text-gloster-gray font-rubik">
                    <span className="font-semibold">Período:</span> {payment.Mes} {payment.Año}
                  </p>
                  <p className="text-gloster-gray font-rubik">
                    <span className="font-semibold">Fecha de vencimiento:</span> {new Date(payment.ExpiryDate).toLocaleDateString('es-CL')}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className={`${getStatusColor(status)} font-rubik`}>
                {status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-gloster-gray" />
                  <div>
                    <p className="text-gloster-gray text-sm font-rubik">Mandante</p>
                    <p className="font-semibold text-slate-800 font-rubik">
                      {payment.projectData?.Owner?.CompanyName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gloster-gray" />
                  <div>
                    <p className="text-gloster-gray text-sm font-rubik">Ubicación</p>
                    <p className="font-semibold text-slate-800 font-rubik">
                      {payment.projectData?.Location}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gloster-gray" />
                  <div>
                    <p className="text-gloster-gray text-sm font-rubik">Monto</p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        className="w-32 font-rubik"
                        disabled={status === 'aprobado'}
                      />
                      {status !== 'aprobado' && (
                        <Button 
                          onClick={handleAmountUpdate}
                          disabled={isSubmitting}
                          size="sm"
                          className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
                        >
                          Actualizar
                        </Button>
                      )}
                    </div>
                    {payment.Total && (
                      <p className="text-sm text-gloster-gray font-rubik">
                        Actual: {formatCurrency(payment.Total, payment.projectData?.Currency || 'CLP')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Document Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-rubik">
                <Upload className="h-5 w-5" />
                Documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {status === 'pendiente' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="documents" className="font-rubik">
                      Subir documentos del estado de pago
                    </Label>
                    <Input
                      id="documents"
                      type="file"
                      multiple
                      onChange={handleFileUpload}
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="font-rubik"
                    />
                  </div>
                  
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium font-rubik">Archivos seleccionados:</p>
                      <ul className="text-sm text-gloster-gray space-y-1">
                        {uploadedFiles.map((file, index) => (
                          <li key={index} className="flex items-center gap-2 font-rubik">
                            <FileText className="h-4 w-4" />
                            {file.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleSubmitDocuments}
                    disabled={isSubmitting || uploadedFiles.length === 0}
                    className="w-full bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-semibold font-rubik"
                  >
                    {isSubmitting ? 'Enviando...' : 'Enviar Documentos'}
                  </Button>
                </>
              )}
              
              {status === 'aprobado' && (
                <div className="text-center py-8">
                  <div className="text-green-600 mb-2">
                    <FileText className="h-12 w-12 mx-auto" />
                  </div>
                  <p className="text-green-600 font-semibold font-rubik">
                    Documentos aprobados
                  </p>
                  <p className="text-gloster-gray text-sm font-rubik">
                    La documentación ha sido revisada y aprobada por el mandante
                  </p>
                </div>
              )}
              
              {status === 'programado' && (
                <div className="text-center py-8">
                  <div className="text-blue-600 mb-2">
                    <Calendar className="h-12 w-12 mx-auto" />
                  </div>
                  <p className="text-blue-600 font-semibold font-rubik">
                    Estado programado
                  </p>
                  <p className="text-gloster-gray text-sm font-rubik">
                    Este estado de pago aún no está disponible para gestionar
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-rubik">
                <Eye className="h-5 w-5" />
                Acciones
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handlePreviewEmail}
                variant="outline"
                className="w-full justify-start font-rubik"
              >
                <Mail className="h-4 w-4 mr-2" />
                Vista previa del email
              </Button>
              
              <Button
                onClick={() => navigate(`/project/${payment.Project}`)}
                variant="outline"
                className="w-full justify-start font-rubik"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Ver proyecto completo
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Project Information */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-rubik">Información del Proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Proyecto</p>
                  <p className="font-medium font-rubik">{payment.projectData?.Name}</p>
                </div>
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Descripción</p>
                  <p className="font-medium font-rubik">{payment.projectData?.Description}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Contacto Mandante</p>
                  <p className="font-medium font-rubik">{payment.projectData?.Owner?.ContactName}</p>
                  <p className="font-medium font-rubik text-sm break-words">
                    {payment.projectData?.Owner?.ContactEmail}
                  </p>
                </div>
                <div>
                  <p className="text-gloster-gray text-sm font-rubik">Presupuesto Total</p>
                  <p className="font-medium font-rubik">
                    {payment.projectData?.Budget ? 
                      formatCurrency(payment.projectData.Budget, payment.projectData?.Currency || 'CLP') : 
                      'No definido'
                    }
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentDetail;
