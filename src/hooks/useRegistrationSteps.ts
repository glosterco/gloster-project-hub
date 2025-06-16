
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useContratistas } from '@/hooks/useContratistas';
import { useMandantes } from '@/hooks/useMandantes';
import { useProyectos } from '@/hooks/useProyectos';
import { useEstadosPago } from '@/hooks/useEstadosPago';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface UseRegistrationStepsProps {
  formData: any;
  errors: {[key: string]: string};
}

export const useRegistrationSteps = ({ formData, errors }: UseRegistrationStepsProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [savedContratistaId, setSavedContratistaId] = useState<number | null>(null);
  const [savedMandanteId, setSavedMandanteId] = useState<number | null>(null);
  const [savedProyectoId, setSavedProyectoId] = useState<number | null>(null);
  const totalSteps = 6;
  const { toast } = useToast();
  const { createContratista, loading: contratistaLoading } = useContratistas();
  const { createMandante, loading: mandanteLoading } = useMandantes();
  const { createProyecto, loading: proyectoLoading } = useProyectos();
  const { createEstadosPago, loading: estadosPagoLoading } = useEstadosPago();
  const { signUp, signIn } = useAuth();

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
    if (data && data.id) {
      setSavedMandanteId(data.id);
    }
    return true;
  };

  const saveProyectoData = async (contratistaId: number) => {
    if (!contratistaId || !savedMandanteId) {
      console.error('Missing contratista or mandante ID');
      toast({
        title: "Error",
        description: "Faltan datos del contratista o mandante",
        variant: "destructive",
      });
      return false;
    }

    const finalPaymentPeriod = formData.paymentPeriod === 'otro' ? formData.customPeriod : formData.paymentPeriod;
    
    // Asegurar que requiredDocuments sea un array válido
    let finalDocuments: string[] = [];
    if (Array.isArray(formData.requiredDocuments)) {
      finalDocuments = [...formData.requiredDocuments];
    }
    if (formData.otherDocuments && formData.otherDocuments.trim()) {
      finalDocuments.push(formData.otherDocuments.trim());
    }

    const proyectoData = {
      Name: formData.projectName,
      Description: formData.projectDescription,
      Location: formData.projectAddress,
      Budget: parseInt(formData.contractAmount),
      StartDate: formData.startDate ? format(formData.startDate, 'yyyy-MM-dd') : '',
      Duration: parseInt(formData.duration),
      Contratista: contratistaId,
      Owner: savedMandanteId,
      FirstPayment: formData.firstPaymentDate ? format(formData.firstPaymentDate, 'yyyy-MM-dd') : '',
      ExpiryRate: finalPaymentPeriod,
      Requierment: finalDocuments // Asegurar que sea un array válido
    };

    console.log('Saving proyecto data:', proyectoData);

    const { data, error } = await createProyecto(proyectoData);
    
    if (error) {
      console.error('Error saving proyecto:', error);
      return false;
    }

    console.log('Proyecto saved successfully:', data);
    if (data && data[0]) {
      setSavedProyectoId(data[0].id);
    }
    return true;
  };

  const saveEstadosPagoData = async () => {
    if (!savedProyectoId) {
      console.error('Missing proyecto ID');
      toast({
        title: "Error",
        description: "Falta el ID del proyecto",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.firstPaymentDate) {
      console.error('Missing first payment date');
      return false;
    }

    const finalPaymentPeriod = formData.paymentPeriod === 'otro' ? formData.customPeriod : formData.paymentPeriod;
    let numericExpiryRate: number;
    if (finalPaymentPeriod === 'mensual') {
      numericExpiryRate = 30;
    } else if (finalPaymentPeriod === 'quincenal') {
      numericExpiryRate = 15;
    } else {
      numericExpiryRate = parseInt(finalPaymentPeriod) || 30;
    }

    const firstPaymentDate = format(formData.firstPaymentDate, 'yyyy-MM-dd');
    const duration = parseInt(formData.duration);

    console.log('Creating estados de pago for proyecto:', savedProyectoId);

    const { data, error } = await createEstadosPago(
      savedProyectoId,
      firstPaymentDate,
      numericExpiryRate,
      duration
    );
    
    if (error) {
      console.error('Error saving estados de pago:', error);
      return false;
    }

    console.log('Estados de pago saved successfully:', data);
    return true;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    // Ya no guardamos el mandante en el paso 5, solo validamos
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

    try {
      // Paso 1: Crear usuario en autenticación (manejar caso donde ya existe)
      const { data: authData, error: authError } = await signUp(formData.email, formData.password);
      
      // Si el usuario ya existe, intentar iniciar sesión directamente
      if (authError && authError.message?.includes('User already registered')) {
        console.log('Usuario ya existe, intentando iniciar sesión...');
        
        const { error: signInError } = await signIn(formData.email, formData.password);
        
        if (signInError) {
          console.error('Error signing in existing user:', signInError);
          toast({
            title: "Error de autenticación",
            description: "El usuario ya existe pero las credenciales no son correctas",
            variant: "destructive",
          });
          return false;
        }
        
        console.log('Usuario existente autenticado correctamente');
      } else if (authError) {
        console.error('Error creating auth user:', authError);
        toast({
          title: "Error al crear usuario",
          description: authError.message || "No se pudo crear la cuenta de usuario",
          variant: "destructive",
        });
        return false;
      } else {
        console.log('Auth user created successfully:', authData);
        
        // Paso 2: Iniciar sesión automáticamente para nuevos usuarios
        const { error: signInError } = await signIn(formData.email, formData.password);
        
        if (signInError) {
          console.error('Error signing in new user:', signInError);
          toast({
            title: "Error al iniciar sesión",
            description: "Usuario creado pero no se pudo iniciar sesión automáticamente",
            variant: "destructive",
          });
          return false;
        }
      }

      // Paso 3: Crear contratista
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

      const { data: contratistaData_result, error: contratistaError } = await createContratista(contratistaData);
      
      if (contratistaError) {
        console.error('Error saving contratista:', contratistaError);
        toast({
          title: "Error al crear cuenta",
          description: "Hubo un error al crear tu cuenta. Por favor intenta de nuevo.",
          variant: "destructive",
        });
        return false;
      }

      console.log('Contratista saved successfully:', contratistaData_result);
      let contratistaId: number;
      if (contratistaData_result && contratistaData_result[0]) {
        contratistaId = contratistaData_result[0].id;
      } else {
        toast({
          title: "Error",
          description: "No se pudo obtener el ID del contratista",
          variant: "destructive",
        });
        return false;
      }

      // Paso 4: Crear mandante (ahora con usuario autenticado)
      const mandanteSuccess = await saveMandanteData();
      if (!mandanteSuccess) {
        return false;
      }

      // Paso 5: Guardar el proyecto en la base de datos
      const proyectoSuccess = await saveProyectoData(contratistaId);
      if (!proyectoSuccess) {
        return false;
      }

      // Paso 6: Crear los estados de pago automáticamente
      const estadosPagoSuccess = await saveEstadosPagoData();
      if (!estadosPagoSuccess) {
        return false;
      }

      // Paso 7: Enviar datos al webhook como respaldo
      const finalPaymentPeriod = formData.paymentPeriod === 'otro' ? formData.customPeriod : formData.paymentPeriod;
      let finalDocuments: string[] = [];
      if (Array.isArray(formData.requiredDocuments)) {
        finalDocuments = [...formData.requiredDocuments];
      }
      if (formData.otherDocuments && formData.otherDocuments.trim()) {
        finalDocuments.push(formData.otherDocuments.trim());
      }

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
            description: "Tu cuenta y proyecto han sido creados correctamente. Revisa tu email para confirmar tu cuenta.",
          });
          
          return true;
        } else {
          throw new Error('Network response was not ok');
        }
        
      } catch (error) {
        console.error('Project registration error:', error);
        toast({
          title: "Registro completado con observaciones",
          description: "Tu cuenta fue creada exitosamente. Revisa tu email para confirmarla.",
        });
        return true;
      }
    } catch (error) {
      console.error('Unexpected error during registration:', error);
      toast({
        title: "Error inesperado",
        description: "Hubo un error durante el registro. Por favor intenta de nuevo.",
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
    contratistaLoading: contratistaLoading || mandanteLoading || proyectoLoading || estadosPagoLoading,
    mandanteLoading: mandanteLoading || proyectoLoading || estadosPagoLoading
  };
};
