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

    try {
      const { data, error } = await createMandante(mandanteData);
      
      console.log('Resultado completo de createMandante:', { data, error });
      
      if (error) {
        console.error('Error específico al crear mandante:', error);
        return { success: false, mandanteId: null };
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        console.error('No se retornaron datos válidos del mandante');
        return { success: false, mandanteId: null };
      }

      const mandanteId = data[0].id;
      console.log('✅ Mandante creado exitosamente con ID:', mandanteId);
      setSavedMandanteId(mandanteId);
      return { success: true, mandanteId };

    } catch (error) {
      console.error('Error inesperado al crear mandante:', error);
      return { success: false, mandanteId: null };
    }
  };

  const saveProyectoData = async (contratistaId: number, mandanteId: number) => {
    console.log('=== INICIANDO CREACIÓN DE PROYECTO ===');
    console.log('IDs disponibles - Contratista:', contratistaId, 'Mandante:', mandanteId);
    
    if (!contratistaId || !mandanteId) {
      console.error('Faltan IDs necesarios:', { contratistaId, mandanteId });
      return { success: false, proyectoId: null };
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

    try {
      const { data, error } = await createProyecto(proyectoData);
      
      console.log('Resultado completo de createProyecto:', { data, error });
      
      if (error) {
        console.error('Error específico al crear proyecto:', error);
        return { success: false, proyectoId: null };
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        console.error('No se retornaron datos válidos del proyecto');
        return { success: false, proyectoId: null };
      }

      const proyectoId = data[0].id;
      console.log('✅ Proyecto creado exitosamente con ID:', proyectoId);
      setSavedProyectoId(proyectoId);
      return { success: true, proyectoId };

    } catch (error) {
      console.error('Error inesperado al crear proyecto:', error);
      return { success: false, proyectoId: null };
    }
  };

  const saveEstadosPagoData = async (proyectoId: number) => {
    console.log('=== INICIANDO CREACIÓN DE ESTADOS DE PAGO ===');
    console.log('ID del proyecto:', proyectoId);
    
    if (!proyectoId) {
      console.error('Falta el ID del proyecto');
      return { success: false };
    }

    if (!formData.firstPaymentDate) {
      console.error('Falta la fecha del primer pago');
      return { success: false };
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

    try {
      const { data, error } = await createEstadosPago(
        proyectoId,
        firstPaymentDate,
        numericExpiryRate,
        duration
      );
      
      console.log('Resultado completo de createEstadosPago:', { data, error });
      
      if (error) {
        console.error('Error específico al crear estados de pago:', error);
        return { success: false };
      }

      console.log('✅ Estados de pago creados exitosamente');
      return { success: true };

    } catch (error) {
      console.error('Error inesperado al crear estados de pago:', error);
      return { success: false };
    }
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
      const mandanteResult = await saveMandanteData();
      if (!mandanteResult.success || !mandanteResult.mandanteId) {
        toast({
          title: "Error al crear mandante",
          description: "No se pudo crear el mandante",
          variant: "destructive",
        });
        return false;
      }
      console.log('✅ Mandante creado con ID:', mandanteResult.mandanteId);

      // Paso 4: Crear proyecto
      console.log('Paso 4: Creando proyecto...');
      const proyectoResult = await saveProyectoData(contratistaId, mandanteResult.mandanteId);
      if (!proyectoResult.success || !proyectoResult.proyectoId) {
        toast({
          title: "Error al crear proyecto",
          description: "No se pudo crear el proyecto",
          variant: "destructive",
        });
        return false;
      }
      console.log('✅ Proyecto creado con ID:', proyectoResult.proyectoId);

      // Paso 5: Crear estados de pago
      console.log('Paso 5: Creando estados de pago...');
      const estadosPagoResult = await saveEstadosPagoData(proyectoResult.proyectoId);
      if (!estadosPagoResult.success) {
        toast({
          title: "Error al crear estados de pago",
          description: "No se pudieron crear los estados de pago",
          variant: "destructive",
        });
        return false;
      }
      console.log('✅ Estados de pago creados exitosamente');

      // Paso 6: Enviar datos al webhook como respaldo
      console.log('Paso 6: Enviando datos al webhook...');
      
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
        } else {
          console.log('⚠️ Webhook falló, pero los datos se guardaron en BD');
        }
        
      } catch (error) {
        console.log('⚠️ Error en webhook, pero los datos se guardaron en BD:', error);
      }

      // Éxito total
      toast({
        title: "¡Registro exitoso!",
        description: "Tu cuenta ha sido creada exitosamente. Revisa tu email para confirmar tu cuenta antes de iniciar sesión.",
      });
      
      return true;

    } catch (error) {
      console.error('Error inesperado durante el registro:', error);
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
