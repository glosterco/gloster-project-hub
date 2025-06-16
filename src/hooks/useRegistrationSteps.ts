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

  const saveContratistaData = async () => {
    try {
      console.log('=== CREANDO USUARIO EN AUTH ===');
      const { data: authData, error: authError } = await signUp(formData.email, formData.password);
      
      if (authError) {
        console.error('Error creating auth user:', authError);
        return { success: false, error: authError.message };
      }

      if (!authData?.user?.id) {
        return { success: false, error: "No se pudo obtener el ID del usuario creado" };
      }

      console.log('✅ Usuario creado en Auth:', authData.user.id);

      console.log('=== CREANDO CONTRATISTA ===');
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
        authData.user.id
      );
      
      if (contratistaError || !contratistaResult || contratistaResult.length === 0) {
        console.error('Error al crear contratista:', contratistaError);
        return { success: false, error: "Error al crear contratista" };
      }

      const contratistaId = contratistaResult[0].id;
      console.log('✅ Contratista creado con ID:', contratistaId);
      setSavedContratistaId(contratistaId);

      return { success: true, contratistaId };
    } catch (error) {
      console.error('Error inesperado:', error);
      return { success: false, error: "Error inesperado" };
    }
  };

  const saveMandanteData = async () => {
    try {
      console.log('=== CREANDO MANDANTE ===');
      const mandanteData = {
        CompanyName: formData.clientCompany,
        ContactName: formData.clientContact,
        ContactEmail: formData.clientEmail,
        ContactPhone: parseInt(formData.clientPhone.replace(/\D/g, '')),
        Status: true
      };

      const { data: mandanteResult, error: mandanteError } = await createMandante(mandanteData);
      
      if (mandanteError || !mandanteResult || mandanteResult.length === 0) {
        console.error('Error al crear mandante:', mandanteError);
        return { success: false, error: "Error al crear mandante" };
      }

      const mandanteId = mandanteResult[0].id;
      console.log('✅ Mandante creado con ID:', mandanteId);
      setSavedMandanteId(mandanteId);

      return { success: true, mandanteId };
    } catch (error) {
      console.error('Error inesperado:', error);
      return { success: false, error: "Error inesperado" };
    }
  };

  const saveProyectoData = async (contratistaId: number, mandanteId: number) => {
    try {
      console.log('=== CREANDO PROYECTO ===');
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
        Currency: formData.contractCurrency,
        StartDate: formData.startDate ? format(formData.startDate, 'yyyy-MM-dd') : '',
        Duration: parseInt(formData.duration),
        Contratista: contratistaId,
        Owner: mandanteId,
        FirstPayment: formData.firstPaymentDate ? format(formData.firstPaymentDate, 'yyyy-MM-dd') : '',
        ExpiryRate: finalPaymentPeriod,
        Requierment: finalDocuments
      };

      const { data: proyectoResult, error: proyectoError } = await createProyecto(proyectoData);
      
      if (proyectoError || !proyectoResult || proyectoResult.length === 0) {
        console.error('Error al crear proyecto:', proyectoError);
        return { success: false, error: "Error al crear proyecto" };
      }

      const proyectoId = proyectoResult[0].id;
      console.log('✅ Proyecto creado con ID:', proyectoId);
      setSavedProyectoId(proyectoId);

      return { success: true, proyectoId };
    } catch (error) {
      console.error('Error inesperado:', error);
      return { success: false, error: "Error inesperado" };
    }
  };

  const saveEstadosPagoData = async (proyectoId: number) => {
    try {
      console.log('=== CREANDO ESTADOS DE PAGO ===');
      
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

      const { data: estadosPagoResult, error: estadosPagoError } = await createEstadosPago(
        proyectoId,
        firstPaymentDate,
        numericExpiryRate,
        duration
      );
      
      if (estadosPagoError || !estadosPagoResult || estadosPagoResult.length === 0) {
        console.error('Error al crear estados de pago:', estadosPagoError);
        return { success: false, error: "Error al crear estados de pago" };
      }

      console.log('✅ Estados de pago creados exitosamente');
      return { success: true, estadosPagoIds: estadosPagoResult.map(ep => ep.id) };
    } catch (error) {
      console.error('Error inesperado:', error);
      return { success: false, error: "Error inesperado" };
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
      
      // Paso 1 y 2: Crear usuario y contratista
      const contratistaResult = await saveContratistaData();
      if (!contratistaResult.success) {
        toast({
          title: "Error al crear contratista",
          description: contratistaResult.error,
          variant: "destructive",
        });
        return false;
      }

      // Paso 3: Crear mandante
      const mandanteResult = await saveMandanteData();
      if (!mandanteResult.success) {
        toast({
          title: "Error al crear mandante",
          description: mandanteResult.error,
          variant: "destructive",
        });
        return false;
      }

      // Paso 4: Crear proyecto
      const proyectoResult = await saveProyectoData(contratistaResult.contratistaId!, mandanteResult.mandanteId!);
      if (!proyectoResult.success) {
        toast({
          title: "Error al crear proyecto",
          description: proyectoResult.error,
          variant: "destructive",
        });
        return false;
      }

      // Paso 5: Crear estados de pago
      const estadosPagoResult = await saveEstadosPagoData(proyectoResult.proyectoId!);
      if (!estadosPagoResult.success) {
        toast({
          title: "Error al crear estados de pago",
          description: estadosPagoResult.error,
          variant: "destructive",
        });
        return false;
      }

      // Paso 6: Enviar datos al webhook como respaldo
      console.log('=== ENVIANDO DATOS AL WEBHOOK ===');
      
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
        paymentPeriod: formData.paymentPeriod === 'otro' ? formData.customPeriod : formData.paymentPeriod,
        requiredDocuments: Array.isArray(formData.requiredDocuments) ? formData.requiredDocuments : [],
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
    saveContratistaData,
    saveMandanteData,
    saveProyectoData,
    saveEstadosPagoData,
    contratistaLoading: contratistaLoading || mandanteLoading || proyectoLoading || estadosPagoLoading,
    mandanteLoading: mandanteLoading || proyectoLoading || estadosPagoLoading
  };
};
