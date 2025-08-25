
import { useState } from 'react';
import { useContratistas } from '@/hooks/useContratistas';
import { useMandantes } from '@/hooks/useMandantes';
import { useRegistrationValidation } from './registration/useRegistrationValidation';
import { useRegistrationProcess } from './registration/useRegistrationProcess';

export const useRegistrationSteps = ({ formData, errors }: any) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  const { loading: contratistaLoading } = useContratistas();
  const { loading: mandanteLoading } = useMandantes();
  const { validateCurrentStep, showValidationError } = useRegistrationValidation();
  const { processRegistration } = useRegistrationProcess();

  const handleNext = async () => {
    if (!validateCurrentStep(currentStep, formData, errors)) {
      showValidationError();
      return;
    }

    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      return await processRegistration(formData);
    } finally {
      // El loading se maneja en processRegistration
    }
  };

  return {
    currentStep,
    totalSteps,
    handleNext,
    handlePrevious,
    handleSubmit,
    contratistaLoading,
    mandanteLoading,
  };
};
