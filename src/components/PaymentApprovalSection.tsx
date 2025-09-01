
import React, { useState } from 'react';
import { usePaymentApproval } from '@/hooks/usePaymentApproval';
import { useGoogleDriveIntegration } from '@/hooks/useGoogleDriveIntegration';
import PaymentInfoHeader from '@/components/approval/PaymentInfoHeader';
import ApprovalButtons from '@/components/approval/ApprovalButtons';
import RejectionForm from '@/components/approval/RejectionForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, FileText, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PaymentApprovalSectionProps {
  paymentId: string;
  payment?: any; // Agregar payment data para pasarlo al hook
  paymentState: {
    month: string;
    amount: number;
    formattedAmount?: string;
    projectName: string;
  };
  onStatusChange?: () => void;
}

const PaymentApprovalSection: React.FC<PaymentApprovalSectionProps> = ({
  paymentId,
  payment,
  paymentState,
  onStatusChange
}) => {
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [mandanteFiles, setMandanteFiles] = useState<File[]>([]);
  const [uploadedFileNames, setUploadedFileNames] = useState<string[]>([]);
  
  const { toast } = useToast();
  const { uploadDocumentsToDrive } = useGoogleDriveIntegration();
  
  console.log('🏗️ PaymentApprovalSection rendering with:', { paymentId, hasPaymentData: !!payment });
  
  const { loading, handleApprove, handleReject } = usePaymentApproval({
    paymentId,
    payment, // Pasar los datos del payment
    onStatusChange
  });

  // Verificar si el pago ya fue procesado
  const isProcessed = payment?.Status === 'Aprobado' || payment?.Status === 'Rechazado';
  const currentStatus = payment?.Status;
  const statusNotes = payment?.Notes;

  const onApprove = () => {
    console.log('✅ PaymentApprovalSection onApprove clicked - showing file upload');
    setShowApprovalForm(true);
  };

  const onConfirmApprove = async () => {
    console.log('✅ PaymentApprovalSection onConfirmApprove clicked');
    try {
      // First approve the payment
      await handleApprove();
      
      // Upload mandante files if any
      if (mandanteFiles.length > 0) {
        console.log('📤 Uploading mandante files:', mandanteFiles.map(f => f.name));
        
        // Prepare files for upload with correct structure
        const uploadedFilesMap: { [key: string]: string[] } = {};
        const fileObjectsMap: { [key: string]: File[] } = {};
        const documentStatusMap: { [key: string]: boolean } = {};
        
        mandanteFiles.forEach((file, index) => {
          const docKey = `mandante_doc_${index}`;
          uploadedFilesMap[docKey] = [file.name + ' - mandante'];
          fileObjectsMap[docKey] = [file];
          documentStatusMap[docKey] = true;
        });
        
        // Upload to Google Drive
        await uploadDocumentsToDrive(
          parseInt(paymentId),
          uploadedFilesMap,
          documentStatusMap,
          fileObjectsMap
        );
        
        toast({
          title: "Documentos cargados",
          description: "Los documentos del mandante se han cargado exitosamente",
        });
      }
      
      // Force immediate UI update by updating local state
      payment.Status = 'Aprobado';
      setShowApprovalForm(false);
      setMandanteFiles([]);
      setUploadedFileNames([]);
    } catch (error) {
      console.error('❌ Error in onConfirmApprove:', error);
      toast({
        title: "Error",
        description: "Error al procesar la aprobación",
        variant: "destructive"
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const validFiles = Array.from(files).filter(file => {
      const allowedTypes = ['application/pdf', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel.sheet.macroEnabled.12', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Formato no válido",
          description: `El archivo ${file.name} no es un formato válido. Solo se aceptan PDF, CSV, XLSX, XLSM y DOCX.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setMandanteFiles(prev => [...prev, ...validFiles]);
      setUploadedFileNames(prev => [...prev, ...validFiles.map(f => f.name)]);
      
      toast({
        title: "Archivo(s) cargado(s)",
        description: `${validFiles.length} archivo(s) agregado(s) exitosamente`,
      });
    }

    // Clear input
    event.target.value = '';
  };

  const handleFileRemove = (index: number) => {
    setMandanteFiles(prev => prev.filter((_, i) => i !== index));
    setUploadedFileNames(prev => prev.filter((_, i) => i !== index));
    
    toast({
      title: "Archivo eliminado",
      description: "El archivo ha sido eliminado exitosamente",
    });
  };

  const onCancelApproval = () => {
    setShowApprovalForm(false);
    setMandanteFiles([]);
    setUploadedFileNames([]);
  };

  const onReject = () => {
    console.log('❌ PaymentApprovalSection onReject clicked');
    setShowRejectionForm(true);
  };

  const onConfirmReject = async () => {
    console.log('❌ PaymentApprovalSection onConfirmReject clicked with reason:', rejectionReason);
    try {
      await handleReject(rejectionReason);
      setShowRejectionForm(false);
      setRejectionReason('');
      // Force immediate UI update by updating local state
      payment.Status = 'Rechazado';
    } catch (error) {
      console.error('❌ Error in onConfirmReject:', error);
    }
  };

  const onCancel = () => {
    console.log('🚫 PaymentApprovalSection onCancel clicked');
    setShowRejectionForm(false);
    setRejectionReason('');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <PaymentInfoHeader
        projectName={paymentState.projectName}
        month={paymentState.month}
        formattedAmount={paymentState.formattedAmount || ''}
      />

      {isProcessed ? (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg border-l-4 ${
            currentStatus === 'Aprobado' 
              ? 'bg-green-50 border-green-500' 
              : 'bg-red-50 border-red-500'
          }`}>
            <div className="flex items-center">
              <div className={`h-4 w-4 rounded-full mr-3 ${
                currentStatus === 'Aprobado' ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <h3 className={`font-semibold ${
                currentStatus === 'Aprobado' ? 'text-green-800' : 'text-red-800'
              }`}>
                Estado de Pago {currentStatus}
              </h3>
            </div>
            {statusNotes && (
              <p className={`mt-2 text-sm ${
                currentStatus === 'Aprobado' ? 'text-green-700' : 'text-red-700'
              }`}>
                {statusNotes}
              </p>
            )}
          </div>
          <p className="text-sm text-gray-600">
            {currentStatus === 'Aprobado' 
              ? 'El estado de pago ha sido aprobado exitosamente.' 
              : 'El estado de pago ha sido rechazado. El contratista ha sido notificado para realizar las correcciones necesarias.'
            }
          </p>
        </div>
      ) : (
        <>
          {!showRejectionForm && !showApprovalForm ? (
            <ApprovalButtons
              loading={loading}
              onApprove={onApprove}
              onReject={onReject}
            />
          ) : showRejectionForm ? (
            <RejectionForm
              loading={loading}
              rejectionReason={rejectionReason}
              onReasonChange={setRejectionReason}
              onConfirmReject={onConfirmReject}
              onCancel={onCancel}
            />
          ) : (
            <Card className="border border-primary/20 bg-primary/5">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4 text-primary">Documentos Adicionales (Opcional)</h3>
                <p className="text-muted-foreground mb-4">
                  Puedes cargar documentos adicionales necesarios para la aprobación, como documentos firmados u otros relevantes.
                </p>
                
                {/* Upload Area */}
                <div className="border-2 border-dashed border-border rounded-lg p-6 mb-4 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Arrastra archivos aquí o haz clic para seleccionar
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.csv,.xlsx,.xlsm,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="mandante-file-upload"
                  />
                  <Button
                    onClick={() => document.getElementById('mandante-file-upload')?.click()}
                    variant="outline"
                    className="mb-2"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Seleccionar Archivos
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Formatos soportados: PDF, CSV, XLSX, XLSM, DOCX
                  </p>
                </div>

                {/* Uploaded Files */}
                {uploadedFileNames.length > 0 && (
                  <div className="space-y-2 mb-6">
                    <h4 className="font-medium text-sm">Archivos cargados:</h4>
                    {uploadedFileNames.map((fileName, index) => (
                      <div key={index} className="flex items-center justify-between bg-success/10 p-3 rounded-lg border border-success/20">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="text-sm font-medium text-success-foreground">{fileName}</span>
                        </div>
                        <Button
                          onClick={() => handleFileRemove(index)}
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4">
                  <Button
                    onClick={onConfirmApprove}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {loading ? 'Procesando...' : 'Confirmar Aprobación'}
                  </Button>
                  <Button
                    onClick={onCancelApproval}
                    variant="outline"
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default PaymentApprovalSection;
