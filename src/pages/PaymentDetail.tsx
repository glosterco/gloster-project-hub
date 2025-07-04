
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { ArrowLeft, Calendar, Send, CheckCircle, Clock, Eye, Save, Download, FileText, Upload, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { useMandanteNotification } from '@/hooks/useMandanteNotification';
import { useGoogleDriveIntegration } from '@/hooks/useGoogleDriveIntegration';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { supabase } from '@/integrations/supabase/client';
import PageHeader from '@/components/PageHeader';
import DocumentUploadCard from '@/components/DocumentUploadCard';
import LoadingModal from '@/components/LoadingModal';

const PaymentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Use real data from database
  const { payment, loading, refetch } = usePaymentDetail(id || '');
  const { sendNotificationToMandante, loading: notificationLoading } = useMandanteNotification();
  const { uploadDocumentsToDrive, loading: driveLoading } = useGoogleDriveIntegration();

  // Use the document upload hook
  const {
    documentStatus,
    uploadedFiles,
    fileObjects,
    dragStates,
    fileInputRefs,
    handleFileUpload,
    handleFileRemove,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDocumentUpload,
  } = useDocumentUpload();

  const [achsSelection, setAchsSelection] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Estados para los campos editables - Initialize with database values
  const [editableAmount, setEditableAmount] = useState('');
  const [editablePercentage, setEditablePercentage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize editable values when payment data loads
  useEffect(() => {
    if (payment) {
      setEditableAmount(payment.Total?.toString() || '');
      
      if (payment.projectData?.Budget && payment.Total) {
        const percentage = ((payment.Total / payment.projectData.Budget) * 100).toFixed(2);
        setEditablePercentage(percentage);
      }
    }
  }, [payment]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-gloster-gray font-rubik">Cargando...</div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (!payment) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-600 font-rubik">Estado de pago no encontrado</div>
          </div>
        </div>
      </div>
    );
  }

  // Required documents configuration
  const documents = [
    { id: 'eepp', name: 'Carátula EEPP', required: true },
    { id: 'planilla', name: 'Avance Periódico', required: true },
    { id: 'cotizaciones', name: 'Certificado de Pago de Cotizaciones Previsionales', required: true },
    { id: 'f30', name: 'Certificado F30', required: true },
    { id: 'f30_1', name: 'Certificado F30-1', required: true },
    { id: 'examenes', name: 'Exámenes Preocupacionales', required: true },
    { id: 'finiquito', name: 'Finiquitos', required: false },
    { id: 'factura', name: 'Factura', required: false }
  ];

  const shouldShowDriveFiles = () => {
    return payment.Status === 'Enviado' || payment.Status === 'Aprobado' || payment.Status === 'Rechazado';
  };

  const areAllRequiredDocumentsUploaded = () => {
    return documents.filter(d => d.required).every(d => documentStatus[d.id]);
  };

  const wereDocumentsUpdated = () => {
    return documents.some(d => uploadedFiles[d.id] && uploadedFiles[d.id].length > 0);
  };

  const savePaymentAmount = async (paymentId: number, amount: string) => {
    try {
      setIsSaving(true);
      console.log('💾 Saving payment amount:', { paymentId, amount });

      const { error } = await supabase
        .from('Estados de pago')
        .update({ Total: parseInt(amount) })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Monto guardado",
        description: "El monto se ha actualizado correctamente",
      });

      refetch();
    } catch (error) {
      console.error('Error saving amount:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el monto",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const savePaymentPercentage = async (paymentId: number, percentage: string) => {
    try {
      setIsSaving(true);
      const numPercentage = parseFloat(percentage);
      const newTotal = payment.projectData?.Budget ? (payment.projectData.Budget * numPercentage) / 100 : 0;

      console.log('💾 Saving payment percentage:', { paymentId, percentage, newTotal });

      const { error } = await supabase
        .from('Estados de pago')
        .update({ 
          Progress: numPercentage,
          Total: Math.round(newTotal)
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Porcentaje guardado",
        description: "El porcentaje y monto se han actualizado correctamente",
      });

      refetch();
    } catch (error) {
      console.error('Error saving percentage:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el porcentaje",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewEmail = async () => {
    console.log('🔄 Auto-uploading documents for preview...');
    
    try {
      setIsUploading(true);

      // First, upload documents to Drive if not already done
      if (!shouldShowDriveFiles() && Object.keys(fileObjects).length > 0) {
        await uploadDocumentsToDrive(payment.id, uploadedFiles, documentStatus, fileObjects);
      }

      // Navigate to email preview with payment ID
      navigate(`/email-preview/${payment.id}`);
    } catch (error) {
      console.error('Error in preview process:', error);
      toast({
        title: "Error",
        description: "No se pudo procesar la vista previa",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendDocuments = async () => {
    try {
      setIsUploading(true);

      // Upload documents to Drive first if not already done
      if (!shouldShowDriveFiles() && Object.keys(fileObjects).length > 0) {
        await uploadDocumentsToDrive(payment.id, uploadedFiles, documentStatus, fileObjects);
      }

      // Wait a moment for Drive URLs to be properly set
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Refetch to get updated URLs
      await refetch();

      // Get the updated payment data
      const updatedPayment = await new Promise(resolve => {
        setTimeout(() => {
          refetch().then(() => resolve(payment));
        }, 1000);
      });

      // Send notification to mandante
      const notificationData = {
        paymentId: payment.id.toString(),
        contratista: payment.projectData?.Contratista?.CompanyName || 'Contratista',
        mes: payment.Mes || '',
        año: payment.Año || new Date().getFullYear(),
        proyecto: payment.projectData?.Name || '',
        mandanteEmail: payment.projectData?.Owner?.ContactEmail || '',
        mandanteCompany: payment.projectData?.Owner?.CompanyName || '',
        contractorCompany: payment.projectData?.Contratista?.CompanyName || '',
        amount: payment.Total || 0,
        dueDate: payment.ExpiryDate || '',
        driveUrl: payment.URL || '',
        uploadedDocuments: Object.keys(documentStatus).filter(key => documentStatus[key])
      };

      const result = await sendNotificationToMandante(notificationData);

      if (result.success) {
        // Update payment status to 'Enviado'
        const { error } = await supabase
          .from('Estados de pago')
          .update({ Status: 'Enviado' })
          .eq('id', payment.id);

        if (error) {
          console.error('Error updating payment status:', error);
        } else {
          toast({
            title: "Documentos enviados",
            description: "Los documentos han sido enviados al mandante exitosamente",
          });
          refetch();
        }
      }
    } catch (error) {
      console.error('Error sending documents:', error);
      toast({
        title: "Error",
        description: "No se pudieron enviar los documentos",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <LoadingModal 
        isOpen={isUploading || driveLoading || notificationLoading} 
        message="Procesando documentos..." 
      />
      
      <PageHeader 
        title="Detalle del Estado de Pago" 
        showBackButton={true}
        onBack={() => navigate(-1)}
      />

      <div className="container mx-auto px-6 py-8">
        <h3 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 font-rubik">Estado de Pago y Documentación</h3>
        
        {/* Payment Info and Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <Card className="border-l-4 border-l-gloster-yellow hover:shadow-xl transition-all duration-300 h-full">
              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div className="w-12 h-12 bg-gloster-yellow/20 rounded-lg flex items-center justify-center shrink-0">
                      <Calendar className="h-6 w-6 text-gloster-gray" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-xl md:text-2xl mb-2 font-rubik text-slate-800">{payment.Name}</CardTitle>
                      <CardDescription className="text-gloster-gray font-rubik text-sm md:text-base">
                        {payment.projectData?.Name} - {payment.Mes} {payment.Año}
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
                    {shouldShowDriveFiles() ? (
                      <p className="font-bold text-lg md:text-xl text-slate-800 font-rubik break-words">
                        {payment.projectData?.Currency || 'CLP'} {payment.Total?.toLocaleString()}
                      </p>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gloster-gray">{payment.projectData?.Currency || 'CLP'}</span>
                        <Input
                          type="number"
                          value={editableAmount}
                          onChange={(e) => setEditableAmount(e.target.value)}
                          placeholder="Ingrese monto"
                          className="w-40"
                        />
                        <Button
                          size="sm"
                          onClick={() => savePaymentAmount(payment.id, editableAmount)}
                          disabled={isSaving}
                          className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-gloster-gray text-sm font-rubik mb-2">% Avance Financiero</p>
                    {shouldShowDriveFiles() ? (
                      <p className="font-semibold text-slate-800 font-rubik">
                        {payment.projectData?.Budget ? 
                          ((payment.Total! / payment.projectData.Budget) * 100).toFixed(2) + '%' : 
                          'N/A'
                        }
                      </p>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          value={editablePercentage}
                          onChange={(e) => {
                            setEditablePercentage(e.target.value);
                            // Auto-calculate amount based on percentage
                            if (payment.projectData?.Budget) {
                              const newAmount = (payment.projectData.Budget * parseFloat(e.target.value || '0')) / 100;
                              setEditableAmount(Math.round(newAmount).toString());
                            }
                          }}
                          placeholder="0"
                          className="w-20"
                        />
                        <span className="text-sm text-gloster-gray">%</span>
                        <Button
                          size="sm"
                          onClick={() => savePaymentPercentage(payment.id, editablePercentage)}
                          disabled={isSaving}
                          className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-gloster-gray text-sm font-rubik">Fecha de Vencimiento</p>
                    <p className="font-semibold text-slate-800 font-rubik">{payment.ExpiryDate}</p>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <p className="text-gloster-gray text-sm font-rubik">Destinatario</p>
                    <p className="font-semibold text-slate-800 font-rubik break-words">
                      {payment.projectData?.Owner?.ContactEmail}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons Card */}
          <div className="lg:col-span-1">
            <Card className="border-gloster-gray/20 hover:shadow-xl transition-all duration-300 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 font-rubik text-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <span className="text-gloster-gray">Vista Previa o Enviar</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-1">
                <div className="space-y-4">
                  <Button
                    onClick={handlePreviewEmail}
                    variant="outline"
                    className="w-full border-gloster-gray/30 hover:bg-gloster-gray/10 font-rubik"
                    size="sm"
                    disabled={isUploading || (!areAllRequiredDocumentsUploaded() && !shouldShowDriveFiles())}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Vista Previa
                  </Button>
                  <Button
                    onClick={handleSendDocuments}
                    disabled={
                      shouldShowDriveFiles() 
                        ? !wereDocumentsUpdated() || isUploading
                        : !documents.filter(d => d.required).every(d => documentStatus[d.id]) || isUploading
                    }
                    className="w-full bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-300 font-rubik"
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isUploading ? 'Enviando...' : 'Enviar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Documents Section */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-slate-800 font-rubik">Documentación Requerida</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documents.map((doc) => (
              <DocumentUploadCard
                key={doc.id}
                documentId={doc.id}
                documentName={doc.name}
                isRequired={doc.required}
                isUploaded={documentStatus[doc.id] || false}
                uploadedFiles={uploadedFiles[doc.id] || []}
                onFileUpload={(files) => handleFileUpload(doc.id, files)}
                onFileRemove={(index) => handleFileRemove(doc.id, index)}
                onDragOver={(e) => handleDragOver(e, doc.id)}
                onDragLeave={(e) => handleDragLeave(e, doc.id)}
                onDrop={(e) => handleDrop(e, doc.id)}
                isDragOver={dragStates[doc.id] || false}
                fileInputRef={fileInputRefs.current[doc.id]}
                showDriveFiles={shouldShowDriveFiles()}
                paymentId={payment.id}
              />
            ))}
          </div>
        </div>

        {/* Project Information */}
        <div className="mt-8">
          <Card className="border-gloster-gray/20">
            <CardHeader>
              <CardTitle className="font-rubik text-lg text-slate-800">Información del Proyecto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-semibold text-slate-800 font-rubik mb-2">Mandante</h5>
                  <p className="text-sm text-gloster-gray">
                    <strong>Empresa:</strong> {payment.projectData?.Owner?.CompanyName}
                  </p>
                  <p className="text-sm text-gloster-gray">
                    <strong>Contacto:</strong> {payment.projectData?.Owner?.ContactName}
                  </p>
                  <p className="text-sm text-gloster-gray">
                    <strong>Email:</strong> {payment.projectData?.Owner?.ContactEmail}
                  </p>
                  <p className="text-sm text-gloster-gray">
                    <strong>Teléfono:</strong> {payment.projectData?.Owner?.ContactPhone}
                  </p>
                </div>
                <div>
                  <h5 className="font-semibold text-slate-800 font-rubik mb-2">Contratista</h5>
                  <p className="text-sm text-gloster-gray">
                    <strong>Empresa:</strong> {payment.projectData?.Contratista?.CompanyName}
                  </p>
                  <p className="text-sm text-gloster-gray">
                    <strong>Contacto:</strong> {payment.projectData?.Contratista?.ContactName}
                  </p>
                  <p className="text-sm text-gloster-gray">
                    <strong>Email:</strong> {payment.projectData?.Contratista?.ContactEmail}
                  </p>
                  <p className="text-sm text-gloster-gray">
                    <strong>RUT:</strong> {payment.projectData?.Contratista?.RUT}
                  </p>
                  <p className="text-sm text-gloster-gray">
                    <strong>Teléfono:</strong> {payment.projectData?.Contratista?.ContactPhone}
                  </p>
                  <p className="text-sm text-gloster-gray">
                    <strong>Dirección:</strong> {payment.projectData?.Contratista?.Adress}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetail;
