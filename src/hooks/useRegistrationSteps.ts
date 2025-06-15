
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useContratistas } from '@/hooks/useContratistas';
import { useMandantes } from '@/hooks/useMandantes';
import { format } from 'date-fns';

interface UseRegistrationStepsProps {
  formData: any;
  errors: {[key: string]: string};
}

export const useRegistrationSteps = ({ formData, errors }: UseRegistrationStepsProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;
  const { toast } = useToast();
  const { createContratista, loading: contratistaLoading } = useContratistas();
  const { createMandante, loading: mandanteLoading } = useMandantes();

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.companyName || !formData.rut || !formData.specialties || !formData.experience || !formData.address || !formData.city) {
          toast({
            title: "Campos requeridos",
            description: "Por favor completa todos los campos",
            variant: "destructive",
          });
          return false;
        }
        if (errors.rut) {
          toast({
            title: "RUT inválido",
            description: "Por favor corrige el RUT antes de continuar",
            variant: "destructive",
          });
          return false;
        }
        return true;

      case 2:
        if (!formData.contactName || !formData.email || !formData.phone || !formData.password || !formData.confirmPassword) {
          toast({
            title: "Campos requeridos",
            description: "Por favor completa todos los campos",
            variant: "destructive",
          });
          return false;
        }
        if (errors.email || errors.phone || errors.password || errors.confirmPassword) {
          toast({
            title: "Errores en los campos",
            description: "Por favor corrige los errores antes de continuar",
            variant: "destructive",
          });
          return false;
        }
        return true;

      case 4:
        if (!formData.projectName || !formData.projectAddress || !formData.projectDescription || !formData.contractAmount || !formData.startDate || !formData.duration) {
          toast({
            title: "Campos requeridos",
            description: "Por favor completa todos los campos del proyecto",
            variant: "destructive",
          });
          return false;
        }
        if (errors.contractAmount || errors.duration) {
          toast({
            title: "Errores en campos numéricos",
            description: "Por favor corrige los errores antes de continuar",
            variant: "destructive",
          });
          return false;
        }
        return true;

      case 5:
        if (!formData.clientCompany || !formData.clientContact || !formData.clientEmail || !formData.clientPhone) {
          toast({
            title: "Campos requeridos",
            description: "Por favor completa todos los campos del mandante",
            variant: "destructive",
          });
          return false;
        }
        if (errors.clientEmail || errors.clientPhone) {
          toast({
            title: "Errores en los campos",
            description: "Por favor corrige los errores antes de continuar",
            variant: "destructive",
          });
          return false;
        }
        return true;

      default:
        return true;
    }
  };

  const saveContratistaData = async () => {
    const finalSpecialties = formData.specialties === 'otra' ? formData.customSpecialty : formData.specialties;
    
    const contratistaData = {
      CompanyName: formData.companyName,
      RUT: formData.rut,
      Specialization: finalSpecialties,
      Experience: formData.experience,
      Adress: formData.address,
      City: formData.city,
      ContactName: formData.contactName,
      ContactEmail: formData.email,
      ContactPhone: parseInt(formData.phone.replace(/\D/g, '')),
      Username: formData.email,
      Password: formData.password,
      Status: true
    };

    console.log('Saving contratista data:', contratistaData);

    const { data, error } = await createContratista(contratistaData);
    
    if (error) {
      console.error('Error saving contratista:', error);
      return false;
    }

    console.log('Contratista saved successfully:', data);
    return true;
  };

  const saveMandanteData = async () => {
    const mandanteData = {
      CompanyName: formData.clientCompany,
      ContactName: formData.clientContact,
      ContactEmail: formData.clientEmail,
      ContactPhone: parseInt(formData.clientPhone.replace(/\D/g, '')),
      Status: true
    };

    console.log('Saving mandante data:', mandanteData);

    const { data, error } = await createMandante(mandanteData);
    
    if (error) {
      console.error('Error saving mandante:', error);
      return false;
    }

    console.log('Mandante saved successfully:', data);
    return true;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    // Save data after step 2
    if (currentStep === 2) {
      const success = await saveContratistaData();
      if (!success) return;
    }

    // Save data after step 5
    if (currentStep === 5) {
      const success = await saveMandanteData();
      if (!success) return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!formData.firstPaymentDate || !formData.paymentPeriod) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos de estados de pago",
        variant: "destructive",
      });
      return;
    }

    const finalPaymentPeriod = formData.paymentPeriod === 'otro' ? formData.customPeriod : formData.paymentPeriod;
    const finalDocuments = formData.otherDocuments ? [...formData.requiredDocuments, formData.otherDocuments] : formData.requiredDocuments;

    const projectFormData = {
      projectName: formData.projectName,
      projectAddress: formData.projectAddress,
      projectDescription: formData.projectDescription,
      contractAmount: formData.contractAmount,
      startDate: formData.startDate ? format(formData.startDate, 'yyyy-MM-dd') : '',
      duration: formData.duration,
      clientCompany: formData.clientCompany,
      clientContact: formData.clientContact,
      clientEmail: formData.clientEmail,
      clientPhone: formData.clientPhone,
      firstPaymentDate: formData.firstPaymentDate ? format(formData.firstPaymentDate, 'yyyy-MM-dd') : '',
      paymentPeriod: finalPaymentPeriod,
      requiredDocuments: finalDocuments,
      contractorEmail: formData.email
    };

    console.log('Sending project data to webhook:', projectFormData);

    try {
      const response = await fetch('https://hook.us2.make.com/242usgpf93xy3waeagqgsefvi2vhsiyc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectFormData),
      });

      if (response.ok) {
        toast({
          title: "¡Registro exitoso!",
          description: "Tu cuenta y proyecto han sido creados correctamente",
        });
        
        return true;
      } else {
        throw new Error('Network response was not ok');
      }
      
    } catch (error) {
      console.error('Project registration error:', error);
      toast({
        title: "Error en el registro del proyecto",
        description: "Por favor intenta nuevamente",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    currentStep,
    totalSteps,
    handleNext,
    handlePrevious,
    handleSubmit,
    contratistaLoading,
    mandanteLoading
  };
};
