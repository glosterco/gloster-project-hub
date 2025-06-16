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
  const { signUp } = useAuth();

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
    console.log('=== INICIANDO CREACIÓN DE MANDANTE ===');
    const mandanteData = {
      CompanyName: formData.clientCompany,
      ContactName: formData.clientContact,
      ContactEmail: formData.clientEmail,
      ContactPhone: parseInt(formData.clientPhone.replace(/\D/g, '')),
      Status: true
    };

    console.log('Datos del mandante a guardar:', mandanteData);

    const { data, error } = await createMandante(mandanteData);
    
    if (error || !data) {
      console.error('Error al crear mandante:', error);
      return false;
    }

    console.log('Resultado de createMandante:', data);
    if (data && data[0]?.id) {
      setSavedMandanteId(data[0].id);
      console.log('✅ Mandante guardado con ID:', data[0].id);
      return true;
    }
    
    console.error('No se pudo obtener el ID del mandante creado');
    return false;
  };

  const saveProyectoData = async (contratistaId: number, mandanteId: number) => {
    console.log('=== INICIANDO CREACIÓN DE PROYECTO ===');
    console.log('IDs disponibles - Contratista:', contratistaId, 'Mandante:', mandanteId);
    
    if (!contratistaId || !mandanteId) {
      console.error('Faltan IDs necesarios:', { contratistaId, mandanteId });
      toast({
        title: "Error",
        description: "Faltan datos del contratista o mandante",
        variant: "destructive",
      });
      return false;
    }

    const finalPaymentPeriod = formData.paymentPeriod === 'otro' ? formData.customPeriod : formData.paymentPeriod;
    
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
      Owner: mandanteId,
      FirstPayment: formData.firstPaymentDate ? format(formData.firstPaymentDate, 'yyyy-MM-dd') : '',
      ExpiryRate: finalPaymentPeriod,
      Requierment: finalDocuments
    };

    console.log('Datos del proyecto a guardar:', proyectoData);

    const { data, error } = await createProyecto(proyectoData);
    
    if (error || !data) {
      console.error('Error al crear proyecto:', error);
      return false;
    }

    console.log('Resultado de createProyecto:', data);
    if (data && data[0]?.id) {
      setSavedProyectoId(data[0].id);
      console.log('✅ Proyecto guardado con ID:', data[0].id);
      return true;
    }
    
    console.error('No se pudo obtener el ID del proyecto creado');
    return false;
  };

  const saveEstadosPagoData = async (proyectoId: number) => {
    console.log('=== INICIANDO CREACIÓN DE ESTADOS DE PAGO ===');
    console.log('ID del proyecto:', proyectoId);
    
    if (!proyectoId) {
      console.error('Falta el ID del proyecto');
      toast({
        title: "Error",
        description: "Falta el ID del proyecto",
        variant: "destructive",
      });
      return false;
    }

    if (!formData.firstPaymentDate) {
      console.error('Falta la fecha del primer pago');
      toast({
        title: "Error",
        description: "Falta la fecha del primer pago",
        variant: "destructive",
      });
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

    console.log('Parámetros para estados de pago:', {
      proyectoId,
      firstPaymentDate,
      numericExpiryRate,
      duration
    });

    const { data, error } = await createEstadosPago(
      proyectoId,
      firstPaymentDate,
      numericExpiryRate,
      duration
    );
    
    if (error) {
      console.error('Error al crear estados de pago:', error);
      return false;
    }

    console.log('✅ Estados de pago creados exitosamente:', data);
    return true;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return;
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
      return false;
    }

    try {
      console.log('=== INICIANDO PROCESO DE REGISTRO COMPLETO ===');
      
      // Paso 1: Crear usuario en autenticación
      console.log('Paso 1: Creando usuario en Auth...');
      const { data: authData, error: authError } = await signUp(formData.email, formData.password);
      
      if (authError) {
        console.error('Error creating auth user:', authError);
        
        if (authError.message?.includes('ya está registrada') || 
            authError.message?.includes('already registered')) {
          toast({
            title: "Email ya registrado",
            description: authError.message,
            variant: "destructive",
          });
          return false;
        }
        
        toast({
          title: "Error al crear usuario",
          description: authError.message || "No se pudo crear la cuenta de usuario",
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Usuario creado en Auth:', authData?.user?.id);

      // Paso 2: Crear contratista
      console.log('Paso 2: Creando contratista...');
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

      const { data: contratistaResult, error: contratistaError } = await createContratista(
        contratistaData, 
        authData?.user?.id
      );
      
      if (contratistaError || !contratistaResult) {
        console.error('Error al crear contratista:', contratistaError);
        toast({
          title: "Error al crear contratista",
          description: "Hubo un error al crear los datos del contratista.",
          variant: "destructive",
        });
        return false;
      }

      console.log('✅ Contratista creado:', contratistaResult);
      let contratistaId: number;
      if (contratistaResult && contratistaResult[0]?.id) {
        contratistaId = contratistaResult[0].id;
        setSavedContratistaId(contratistaId);
      } else {
        console.error('No se pudo obtener el ID del contratista');
        toast({
          title: "Error",
          description: "No se pudo obtener el ID del contratista",
          variant: "destructive",
        });
        return false;
      }

      // Paso 3: Crear mandante
      console.log('Paso 3: Creando mandante...');
      const mandanteSuccess = await saveMandanteData();
      if (!mandanteSuccess || !savedMandanteId) {
        console.error('Error al crear mandante');
        toast({
          title: "Error al crear mandante",
          description: "No se pudo crear el mandante",
          variant: "destructive",
        });
        return false;
      }
      console.log('✅ Mandante creado con ID:', savedMandanteId);

      // Paso 4: Crear proyecto
      console.log('Paso 4: Creando proyecto...');
      const proyectoSuccess = await saveProyectoData(contratistaId, savedMandanteId);
      if (!proyectoSuccess || !savedProyectoId) {
        console.error('Error al crear proyecto');
        return false;
      }
      console.log('✅ Proyecto creado con ID:', savedProyectoId);

      // Paso 5: Crear estados de pago
      console.log('Paso 5: Creando estados de pago...');
      const estadosPagoSuccess = await saveEstadosPagoData(savedProyectoId);
      if (!estadosPagoSuccess) {
        console.error('Error al crear estados de pago');
        return false;
      }
      console.log('✅ Estados de pago creados');

      // Paso 6: Enviar datos al webhook como respaldo
      console.log('Paso 6: Enviando datos al webhook...');
      // ... keep existing code (webhook logic)
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

      try {
        const response = await fetch('https://hook.us2.make.com/242usgpf93xy3waeagqgsefvi2vhsiyc', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(projectFormData),
        });

        if (response.ok) {
          console.log('✅ Webhook enviado correctamente');
          toast({
            title: "¡Registro exitoso!",
            description: "Tu cuenta ha sido creada. Revisa tu email para confirmar tu cuenta antes de iniciar sesión.",
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
