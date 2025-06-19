
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useContratistas } from '@/hooks/useContratistas';
import { useMandantes } from '@/hooks/useMandantes';
import { useProyectos } from '@/hooks/useProyectos';
import { useEstadosPago } from '@/hooks/useEstadosPago';

export const useRegistrationSteps = ({ formData, errors }: any) => {
  const [currentStep, setCurrentStep] = useState(1);
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

    // Solo avanzar al siguiente paso, NO crear nada aquí
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      console.log('Starting registration process...');
      
      // PASO 1: Autenticar al usuario PRIMERO
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) {
        console.error('Authentication error:', authError);
        toast({
          title: "Error de autenticación",
          description: authError.message,
          variant: "destructive",
        });
        return false;
      }

      if (!authData.user) {
        toast({
          title: "Error de autenticación",
          description: "No se pudo crear el usuario",
          variant: "destructive",
        });
        return false;
      }

      console.log('User authenticated successfully:', authData.user.id);

      // PASO 2: Crear el contratista con el usuario autenticado
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
        Status: true,
        auth_user_id: authData.user.id
      };

      console.log('Creating contratista with data:', contratistaData);
      const { data: contratistaResult, error: contratistaError } = await createContratista(contratistaData, authData.user.id);
      
      if (contratistaError) {
        console.error('Error creating contratista:', contratistaError);
        toast({
          title: "Error al crear contratista",
          description: contratistaError.message || "Error desconocido",
          variant: "destructive",
        });
        return false;
      }

      if (!contratistaResult || contratistaResult.length === 0) {
        console.error('No contratista result returned');
        toast({
          title: "Error al crear contratista",
          description: "No se pudo crear el contratista",
          variant: "destructive",
        });
        return false;
      }

      const contratistaId = contratistaResult[0].id;
      console.log('Contratista created successfully with ID:', contratistaId);

      // PASO 3: Crear el mandante (ahora que el usuario está autenticado)
      const mandanteData = {
        CompanyName: formData.clientCompany,
        ContactName: formData.clientContact,
        ContactEmail: formData.clientEmail,
        ContactPhone: parseInt(formData.clientPhone.replace('+56', '')),
        Status: true
      };

      console.log('Creating mandante with data:', mandanteData);
      const { data: mandanteResult, error: mandanteError } = await createMandante(mandanteData);
      
      if (mandanteError) {
        console.error('Error creating mandante:', mandanteError);
        toast({
          title: "Error al crear mandante",
          description: mandanteError.message || "Error desconocido",
          variant: "destructive",
        });
        return false;
      }

      if (!mandanteResult || mandanteResult.length === 0) {
        console.error('No mandante result returned');
        toast({
          title: "Error al crear mandante",
          description: "No se pudo crear el mandante",
          variant: "destructive",
        });
        return false;
      }

      const mandanteId = mandanteResult[0].id;
      console.log('Mandante created successfully with ID:', mandanteId);

      // PASO 4: Crear el proyecto
      const expiryRateString = formData.paymentPeriod === 'mensual' ? '30' : 
                              formData.paymentPeriod === 'quincenal' ? '15' : 
                              formData.customPeriod || '30';

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
        ExpiryRate: expiryRateString,
        Requierment: formData.requiredDocuments,
      };

      console.log('Creating project with data:', proyectoData);
      const { data: projectResult, error: projectError } = await createProyecto(proyectoData);
      
      if (projectError) {
        console.error('Error creating project:', projectError);
        toast({
          title: "Error al crear proyecto",
          description: projectError.message || "Error desconocido",
          variant: "destructive",
        });
        return false;
      }

      if (!projectResult || projectResult.length === 0) {
        console.error('No project result returned');
        toast({
          title: "Error al crear proyecto",
          description: "No se pudo crear el proyecto",
          variant: "destructive",
        });
        return false;
      }

      const projectId = projectResult[0].id;
      console.log('Project created successfully with ID:', projectId);
      
      // PASO 5: Crear estados de pago
      const expiryRateNumeric = formData.paymentPeriod === 'mensual' ? 30 : 
                              formData.paymentPeriod === 'quincenal' ? 15 : 
                              parseInt(formData.customPeriod) || 30;

      console.log('Creating payment states...');
      await createEstadosPago(
        projectId,
        formData.firstPaymentDate,
        expiryRateNumeric,
        parseInt(formData.duration)
      );

      // Mostrar toast de éxito
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
