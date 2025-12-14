
import React, { useState, useEffect } from 'react';
import { usePaymentApproval } from '@/hooks/usePaymentApproval';
import { usePaymentApprovalStatus } from '@/hooks/usePaymentApprovalStatus';
import { useGoogleDriveIntegration } from '@/hooks/useGoogleDriveIntegration';
import PaymentInfoHeader from '@/components/approval/PaymentInfoHeader';
import ApprovalButtons from '@/components/approval/ApprovalButtons';
import RejectionForm from '@/components/approval/RejectionForm';
import { ApprovalProgressBar } from '@/components/approval/ApprovalProgressBar';
import { ApprovalsList } from '@/components/approval/ApprovalsList';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, FileText, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PaymentApprovalSectionProps {
  paymentId: string;
  payment?: any;
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
  const [justApproved, setJustApproved] = useState(false);
  const [justRejected, setJustRejected] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | undefined>(undefined);
  
  const { toast } = useToast();
  const { uploadDocumentsToDrive } = useGoogleDriveIntegration();
  
  // Get current user email from session OR authenticated user
  useEffect(() => {
    const getEmail = async () => {
      // First check session storage (email-based access)
      const mandanteAccess = sessionStorage.getItem('mandanteAccess');
      if (mandanteAccess) {
        const data = JSON.parse(mandanteAccess);
        if (data.email) {
          setCurrentUserEmail(data.email);
          return;
        }
      }
      
      // Then check authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setCurrentUserEmail(user.email);
        // Also store in session for the approval hooks
        sessionStorage.setItem('mandanteAccess', JSON.stringify({
          email: user.email,
          name: user.user_metadata?.full_name || user.email,
          userType: 'mandante',
          hasFullAccess: true,
          isLimitedAccess: false
        }));
      }
    };
    getEmail();
  }, []);
  
  // Fetch approval status
  const { status: approvalStatus, refetch: refetchApprovalStatus } = usePaymentApprovalStatus(
    paymentId ? parseInt(paymentId) : null,
    currentUserEmail
  );
  
  console.log('🏗️ PaymentApprovalSection rendering with:', { paymentId, hasPaymentData: !!payment, approvalStatus, justApproved });
  
  const { loading, handleApprove, handleReject } = usePaymentApproval({
    paymentId,
    payment,
    onStatusChange: () => {
      refetchApprovalStatus();
      onStatusChange?.();
    }
  });

  // Verificar si el pago ya fue procesado (solo Aprobado o Rechazado son finales)
  const isProcessed = payment?.Status === 'Aprobado' || payment?.Status === 'Rechazado';
  const currentStatus = payment?.Status;
  const statusNotes = payment?.Notes;
  
  // Check if current user can approve - use local state OR server state
  const hasUserApproved = justApproved || approvalStatus?.currentUserApproval?.approval_status === 'Aprobado';
  const hasUserRejected = justRejected || approvalStatus?.currentUserApproval?.approval_status === 'Rechazado';
  // User can only approve if they haven't already and the server says they can
  const canUserApprove = !hasUserApproved && !hasUserRejected && (approvalStatus?.canUserApprove ?? false);

  const onApprove = () => {
    console.log('✅ PaymentApprovalSection onApprove clicked - showing file upload');
    setShowApprovalForm(true);
  };

  const onConfirmApprove = async () => {
    console.log('🚀 onConfirmApprove INICIANDO');
    
    if (!payment) {
      toast({
        title: "Error",
        description: "No se pudo cargar el estado de pago. Recarga la página.",
        variant: "destructive"
      });
      return;
    }
    
    if (!payment.projectData) {
      toast({
        title: "Error",
        description: "No se pudo cargar los datos del proyecto. Recarga la página.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      await handleApprove();
      
      // Mark as approved immediately for UI
      setJustApproved(true);
      
      // Upload mandante files if any
      if (mandanteFiles.length > 0) {
        const uploadedFilesMap: { [key: string]: string[] } = {};
        const fileObjectsMap: { [key: string]: File[] } = {};
        const documentStatusMap: { [key: string]: boolean } = {};
        
        mandanteFiles.forEach((file, index) => {
          const docKey = `mandante_doc_${index}`;
          uploadedFilesMap[docKey] = [file.name + ' - mandante'];
          fileObjectsMap[docKey] = [file];
          documentStatusMap[docKey] = true;
        });
        
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
      
      // Wait for DB to commit, then refresh approval status
      await new Promise(resolve => setTimeout(resolve, 500));
      await refetchApprovalStatus();
      
      setShowApprovalForm(false);
      setMandanteFiles([]);
      setUploadedFileNames([]);
    } catch (error: any) {
      console.error('❌ ERROR en onConfirmApprove:', error);
      toast({
        title: "Error en aprobación",
        description: error?.message || "Error al procesar la aprobación",
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
    setShowRejectionForm(true);
  };

  const onConfirmReject = async () => {
    try {
      await handleReject(rejectionReason);
      setJustRejected(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      await refetchApprovalStatus();
      setShowRejectionForm(false);
      setRejectionReason('');
    } catch (error) {
      console.error('❌ Error in onConfirmReject:', error);
    }
  };

  const onCancel = () => {
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

      {/* Approval Progress - Always show when there's approval config */}
      {approvalStatus && (
        <div className="mb-6 space-y-4">
          <ApprovalProgressBar
            totalRequired={approvalStatus.totalRequired}
            totalApproved={justApproved ? approvalStatus.totalApproved + 1 : approvalStatus.totalApproved}
            totalRejected={justRejected ? approvalStatus.totalRejected + 1 : approvalStatus.totalRejected}
            isFullyApproved={approvalStatus.isFullyApproved}
            hasRejection={approvalStatus.hasRejection || justRejected}
          />
          <ApprovalsList
            approvals={approvalStatus.approvals}
            pendingApprovers={approvalStatus.pendingApprovers}
          />
        </div>
      )}

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
          {/* Show message if user already approved but payment needs more approvals */}
          {hasUserApproved && (
            <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <p className="text-green-800 font-medium">
                  Has registrado tu aprobación exitosamente
                </p>
              </div>
              <p className="text-green-700 text-sm mt-1">
                Esperando aprobaciones adicionales de otros responsables.
              </p>
            </div>
          )}
          
          {/* Show message if user already rejected */}
          {hasUserRejected && (
            <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
              <div className="flex items-center gap-2">
                <X className="h-5 w-5 text-red-600" />
                <p className="text-red-800 font-medium">
                  Has rechazado este estado de pago
                </p>
              </div>
            </div>
          )}
          
          {/* Show message if it's not user's turn (order matters) */}
          {!hasUserApproved && !hasUserRejected && approvalStatus?.canUserApprove === false && approvalStatus?.pendingApprovers?.some(
            p => p.email.toLowerCase() === currentUserEmail?.toLowerCase()
          ) && (
            <div className="mb-4 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-lg">
              <p className="text-amber-800 text-sm">
                Aún no es tu turno de aprobar. Se requiere aprobación previa de otros usuarios.
              </p>
            </div>
          )}
          
          {/* Only show buttons/forms if user hasn't acted yet */}
          {!hasUserApproved && !hasUserRejected && (
            <>
              {!showRejectionForm && !showApprovalForm ? (
                canUserApprove ? (
                  <ApprovalButtons
                    loading={loading}
                    onApprove={onApprove}
                    onReject={onReject}
                  />
                ) : (
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-muted-foreground">
                      No tienes permisos para aprobar este estado de pago.
                    </p>
                  </div>
                )
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
        </>
      )}
    </div>
  );
};

export default PaymentApprovalSection;
