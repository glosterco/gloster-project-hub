
import { useState, useEffect } from 'react';

export const usePaymentValidation = (
  editableAmount: string,
  editablePercentage: string,
  documentStatus: Record<string, boolean>,
  paymentStatus?: string
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
    const hasFiles = Object.keys(documentStatus).some(docId => documentStatus[docId as keyof typeof documentStatus]);
    const isSentStatus = paymentStatus === 'Enviado' || paymentStatus === 'Aprobado' || paymentStatus === 'Rechazado';
    setHasUnsavedFiles(hasFiles && !isSentStatus);
  }, [documentStatus, paymentStatus]);

  return {
    isAmountValid,
    isProgressValid,
    areFieldsValidForActions,
    getValidationMessage,
    hasUnsavedFiles
  };
};
