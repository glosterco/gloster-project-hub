import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, Eye, Send, Download } from 'lucide-react';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useDirectDriveDownload } from '@/hooks/useDirectDriveDownload';
import DocumentUploadCard from '@/components/DocumentUploadCard';
import LoadingModal from '@/components/LoadingModal';
import { formatCurrency } from '@/utils/currencyUtils';
import { documentsFromPayment } from '@/constants/documentTypes';

const PaymentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { payment, loading, error } = usePaymentDetail(id || '', true);
  const { downloadDocument, loading: downloadLoading } = useDirectDriveDownload();
  const [showUploadModal, setShowUploadModal] = useState(false);

  const handleDownloadDocument = async (documentName: string) => {
    if (!id) return;
    await downloadDocument(id, documentName);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'en progreso':
        return 'bg-blue-100 text-blue-800';
      case 'enviado':
        return 'bg-purple-100 text-purple-800';
      case 'aprobado':
        return 'bg-green-100 text-green-800';
      case 'rechazado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canShowDownloads = (status: string) => {
    const lowercaseStatus = status?.toLowerCase();
    return lowercaseStatus === 'enviado' || lowercaseStatus === 'aprobado' || lowercaseStatus === 'rechazado';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">Cargando detalles del pago...</div>
        </div>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-gloster-gray mb-4">
              {error || "Estado de pago no encontrado."}
            </p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Volver al Inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
                alt="Gloster Logo" 
                className="w-8 h-8"
              />
              <h1 className="text-2xl font-bold text-slate-800 font-rubik">
                Estado de Pago: {payment.Name}
              </h1>
            </div>
            
            <div className="flex items-center space-x-3">
              {payment.Status === 'En Progreso' && (
                <>
                  <Button
                    size="sm"
                    onClick={() => navigate(`/payment/${id}/preview`)}
                    className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Vista Previa
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 py-2">
        <div className="container mx-auto px-6">
          <button 
            onClick={() => navigate(`/project/${payment?.Project || 2}`)}
            className="text-slate-600 hover:text-slate-800 text-sm font-rubik flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Proyecto
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* Información del Estado de Pago */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Información del Estado de Pago
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(payment.Status)}`}>
                {payment.Status}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-slate-600 font-rubik">Período</p>
                <p className="text-lg font-semibold text-slate-800 font-rubik">{payment.Mes} {payment.Año}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-rubik">Monto Total</p>
                <p className="text-lg font-semibold text-slate-800 font-rubik">
                  {formatCurrency(payment.Total, payment.projectData?.Currency)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-rubik">Fecha de Vencimiento</p>
                <p className="text-lg font-semibold text-slate-800 font-rubik">{payment.ExpiryDate}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-rubik">Progreso</p>
                <p className="text-lg font-semibold text-slate-800 font-rubik">{payment.Progress}%</p>
              </div>
            </div>
            {payment.Notes && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm text-slate-600 font-rubik">Notas</p>
                <p className="text-slate-800 font-rubik">{payment.Notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información del Proyecto */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-600 font-rubik">Nombre del Proyecto</p>
                <p className="text-lg font-semibold text-slate-800 font-rubik">{payment.projectData?.Name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-rubik">Ubicación</p>
                <p className="text-lg font-semibold text-slate-800 font-rubik">{payment.projectData?.Location}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-rubik">Cliente</p>
                <p className="text-lg font-semibold text-slate-800 font-rubik">{payment.projectData?.Owner?.CompanyName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 font-rubik">Contratista</p>
                <p className="text-lg font-semibold text-slate-800 font-rubik">{payment.projectData?.Contratista?.CompanyName}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documentos */}
        <Card>
          <CardHeader>
            <CardTitle>Documentos del Estado de Pago</CardTitle>
            <CardDescription>
              {payment.Status === 'En Progreso' 
                ? 'Sube los documentos requeridos para este estado de pago'
                : canShowDownloads(payment.Status)
                ? 'Documentos disponibles para descarga'
                : 'Documentos del estado de pago'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payment.Status === 'En Progreso' && (
              <div className="space-y-4">
                <Button
                  onClick={() => setShowUploadModal(true)}
                  className="w-full bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Documentos
                </Button>
              </div>
            )}

            {canShowDownloads(payment.Status) && (
              <div className="space-y-3">
                {documentsFromPayment.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800 font-rubik">{doc.name}</h4>
                      <p className="text-sm text-slate-600 font-rubik">{doc.description}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadDocument(doc.name)}
                      disabled={downloadLoading}
                      className="font-rubik"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Descargar
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {!['En Progreso'].includes(payment.Status) && !canShowDownloads(payment.Status) && (
              <div className="text-center py-8 text-slate-500">
                <p>Los documentos estarán disponibles cuando el estado de pago sea enviado.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showUploadModal && (
        <LoadingModal isOpen={showUploadModal}>
          <DocumentUploadCard
            paymentId={parseInt(id || '0')}
            onClose={() => setShowUploadModal(false)}
          />
        </LoadingModal>
      )}
    </div>
  );
};

export default PaymentDetail;
