
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useContratistas } from '@/hooks/useContratistas';
import { useMandantes } from '@/hooks/useMandantes';
import { useProyectos } from '@/hooks/useProyectos';
import { useEstadosPago } from '@/hooks/useEstadosPago';

export const useRegistrationSteps = ({ formData, errors }: any) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [contratistaId, setContratistaId] = useState<number | null>(null);
  const [mandanteId, setMandanteId] = useState<number | null>(null);
  const totalSteps = 6;
  const { toast } = useToast();

  const { createContratista, loading: contratistaLoading } = useContratistas();
  const { createMandante, loading: mandanteLoading } = useMandantes();
  const { createProyecto } = useProyectos();
  const { createEstadosPago } = useEstadosPago();

  const validateCurrentStep = () => {
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

  const handleNext = async () => {
    if (!validateCurrentStep()) {
      toast({
        title: "Información incompleta",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    if (currentStep === 2) {
      // Create contractor after step 2 WITHOUT authentication
      const contratistaData = {
        CompanyName: formData.companyName,
        RUT: formData.rut,
        Specialization: formData.specialties.includes('Otro') 
          ? formData.customSpecialty 
          : formData.specialties.join(', '),
        Experience: formData.experience,
        Adress: formData.address,
        City: formData.city,
        ContactName: formData.contactName,
        ContactEmail: formData.email,
        ContactPhone: parseInt(formData.phone.replace('+56', '')),
        Username: formData.email,
        Password: formData.password,
        Status: true
      };

      const { data: contratistaResult, error: contratistaError } = await createContratista(contratistaData);
      
      if (contratistaError) {
        toast({
          title: "Error al crear contratista",
          description: contratistaError.message,
          variant: "destructive",
        });
        return;
      }

      if (contratistaResult && contratistaResult.length > 0) {
        setContratistaId(contratistaResult[0].id);
      }
    }

    if (currentStep === 5) {
      // Create mandante after step 5
      const mandanteData = {
        CompanyName: formData.clientCompany,
        ContactName: formData.clientContact,
        ContactEmail: formData.clientEmail,
        ContactPhone: parseInt(formData.clientPhone.replace('+56', '')),
        Status: true
      };

      const { data: mandanteResult, error: mandanteError } = await createMandante(mandanteData);
      
      if (mandanteError) {
        toast({
          title: "Error al crear mandante",
          description: mandanteError.message,
          variant: "destructive",
        });
        return;
      }

      if (mandanteResult && mandanteResult.length > 0) {
        setMandanteId(mandanteResult[0].id);
      }
    }

    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      // Sign up the user FIRST
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        toast({
          title: "Error de autenticación",
          description: authError.message,
          variant: "destructive",
        });
        return false;
      }

      // Only update contractor with auth user ID if we have both
      if (contratistaId && authData.user) {
        const { error: updateError } = await supabase
          .from('Contratistas')
          .update({ auth_user_id: authData.user.id })
          .eq('id', contratistaId);

        if (updateError) {
          console.error('Error updating contractor with auth user ID:', updateError);
        }
      }

      // Create project
      if (contratistaId && mandanteId) {
        const proyectoData = {
          Name: formData.projectName,
          Description: formData.projectDescription,
          Location: formData.projectAddress,
          Budget: parseFloat(formData.contractAmount),
          Currency: formData.contractCurrency,
          StartDate: formData.startDate,
          Duration: parseInt(formData.duration),
          Contratista: contratistaId,
          Owner: mandanteId,
          FirstPayment: formData.firstPaymentDate,
          ExpiryRate: formData.paymentPeriod,
          Requierment: formData.requiredDocuments,
        };

        const { data: projectResult, error: projectError } = await createProyecto(proyectoData);
        
        if (projectError) {
          toast({
            title: "Error al crear proyecto",
            description: projectError.message,
            variant: "destructive",
          });
          return false;
        }

        if (projectResult && projectResult.length > 0) {
          const projectId = projectResult[0].id;
          
          // Create payment states
          const expiryRateNumeric = formData.paymentPeriod === 'mensual' ? 30 : 
                                  formData.paymentPeriod === 'quincenal' ? 15 : 
                                  parseInt(formData.customPeriod) || 30;

          await createEstadosPago(
            projectId,
            formData.firstPaymentDate,
            expiryRateNumeric,
            parseInt(formData.duration)
          );
        }
      }

      // Show single success toast
      toast({
        title: "¡Registro exitoso!",
        description: "Tu cuenta ha sido creada exitosamente. Revisa tu email para confirmar tu cuenta.",
      });

      return true;
    } catch (error) {
      console.error('Error during registration:', error);
      toast({
        title: "Error inesperado",
        description: "Hubo un error durante el registro. Intenta nuevamente.",
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
    mandanteLoading,
  };
};
