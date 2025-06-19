
import { useToast } from '@/hooks/use-toast';

export const useRegistrationValidation = () => {
  const { toast } = useToast();

  const validateCurrentStep = (currentStep: number, formData: any, errors: any) => {
    switch (currentStep) {
      case 1:
        return formData.companyName && formData.rut && formData.specialties.length > 0;
      case 2:
        return formData.contactName && formData.email && formData.phone && 
               formData.password && formData.confirmPassword && 
               !Object.keys(errors).some(key => errors[key]);
      case 4:
        return formData.projectName && formData.projectAddress && 
               formData.contractAmount && formData.startDate && formData.duration;
      case 5:
        return formData.clientCompany && formData.clientContact && 
               formData.clientEmail && formData.clientPhone;
      case 6:
        return formData.firstPaymentDate && formData.paymentPeriod;
      default:
        return true;
    }
  };

  const showValidationError = () => {
    toast({
      title: "Información incompleta",
      description: "Por favor completa todos los campos requeridos",
      variant: "destructive",
    });
  };

  const showSuccessMessage = () => {
    toast({
      title: "¡Registro exitoso!",
      description: "Tu cuenta ha sido creada exitosamente. Revisa tu email para confirmar tu cuenta.",
    });
  };

  const showError = (title: string, description: string) => {
    toast({
      title,
      description,
      variant: "destructive",
    });
  };

  return {
    validateCurrentStep,
    showValidationError,
    showSuccessMessage,
    showError
  };
};
