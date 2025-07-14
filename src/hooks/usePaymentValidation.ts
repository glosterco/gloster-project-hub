
import { useState, useEffect } from 'react';
import { DocumentStatus } from './useDocumentUpload';

export const usePaymentValidation = (
  editableAmount: string,
  editablePercentage: string,
  documentStatus: DocumentStatus,
  paymentStatus?: string,
  isAttemptingAction?: boolean,
  originalAmount?: number,
  originalProgress?: number
) => {
  const [hasUnsavedFiles, setHasUnsavedFiles] = useState(false);

  const isAmountValid = () => {
    // Para estado rechazado, usar valor original si no hay edición local
    if (paymentStatus === 'Rechazado') {
      const currentAmount = editableAmount && editableAmount.trim() !== '' ? editableAmount : (originalAmount?.toString() || '');
      return currentAmount && currentAmount.trim() !== '' && parseFloat(currentAmount) > 0;
    }
    return editableAmount && editableAmount.trim() !== '' && parseFloat(editableAmount) > 0;
  };

  const isProgressValid = () => {
    // Para estado rechazado, usar valor original si no hay edición local  
    if (paymentStatus === 'Rechazado') {
      const currentProgress = editablePercentage && editablePercentage.trim() !== '' ? editablePercentage : (originalProgress?.toString() || '');
      return currentProgress && currentProgress.trim() !== '' && parseFloat(currentProgress) >= 0;
    }
    return editablePercentage && editablePercentage.trim() !== '' && parseFloat(editablePercentage) >= 0;
  };

  const areFieldsValidForActions = () => {
    return isAmountValid() && isProgressValid();
  };

  const shouldShowValidationErrors = () => {
    return isAttemptingAction && !areFieldsValidForActions();
  };

  const getValidationMessage = () => {
    if (!isAmountValid() && !isProgressValid()) {
      return "Por favor completa el monto y porcentaje antes de continuar";
    }
    if (!isAmountValid()) {
      return "Por favor completa el monto antes de continuar";
    }
    if (!isProgressValid()) {
      return "Por favor completa el porcentaje antes de continuar";
    }
    return "";
  };

  // Track when files are uploaded but not sent
  useEffect(() => {
    const hasFiles = Object.keys(documentStatus).some(docId => documentStatus[docId as keyof DocumentStatus]);
    const isSentStatus = paymentStatus === 'Enviado' || paymentStatus === 'Aprobado' || paymentStatus === 'Rechazado';
    setHasUnsavedFiles(hasFiles && !isSentStatus);
  }, [documentStatus, paymentStatus]);

  return {
    isAmountValid,
    isProgressValid,
    areFieldsValidForActions,
    getValidationMessage,
    hasUnsavedFiles,
    shouldShowValidationErrors
  };
};
