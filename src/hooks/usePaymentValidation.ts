
import { useState, useEffect } from 'react';
import { DocumentStatus } from './useDocumentUpload';

export const usePaymentValidation = (
  editableAmount: string,
  editablePercentage: string,
  documentStatus: DocumentStatus,
  paymentStatus?: string,
  isAttemptingAction?: boolean
) => {
  const [hasUnsavedFiles, setHasUnsavedFiles] = useState(false);

  const isAmountValid = () => {
    return editableAmount && editableAmount.trim() !== '' && parseFloat(editableAmount) > 0;
  };

  const isProgressValid = () => {
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
