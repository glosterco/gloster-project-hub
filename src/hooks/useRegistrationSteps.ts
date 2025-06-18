
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RegistrationStepsProps {
  formData: any;
  errors: {[key: string]: string};
}

export const useRegistrationSteps = ({ formData, errors }: RegistrationStepsProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [contratistaLoading, setContratistaLoading] = useState(false);
  const [mandanteLoading, setMandanteLoading] = useState(false);
  const { toast } = useToast();
  const totalSteps = 6;

  const handleNext = async () => {
    // Validate current step before proceeding
    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) {
      toast({
        title: "Datos incompletos",
        description: "Por favor corrige los errores antes de continuar",
        variant: "destructive"
      });
      return;
    }

    if (currentStep === 2) {
      // Save contractor data after step 2 (contact info)
      setContratistaLoading(true);
      try {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (authError) throw authError;

        if (authData.user) {
          const { error: contratistaError } = await supabase
            .from('Contratistas')
            .insert([
              {
                CompanyName: formData.companyName,
                RUT: formData.rut,
                Specialization: formData.specialties === 'Otro' ? formData.customSpecialty : formData.specialties,
                Experience: formData.experience,
                Adress: formData.address,
                City: formData.city,
                ContactName: formData.contactName,
                ContactEmail: formData.email,
                ContactPhone: parseInt(formData.phone.replace('+56', '')),
                Status: true,
                auth_user_id: authData.user.id
              }
            ]);

          if (contratistaError) throw contratistaError;
        }
        
        setCurrentStep(currentStep + 1);
      } catch (error: any) {
        toast({
          title: "Error al crear contratista",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setContratistaLoading(false);
      }
    } else if (currentStep === 5) {
      // Save mandante data after step 5 (client info)
      setMandanteLoading(true);
      try {
        const { data: mandanteData, error: mandanteError } = await supabase
          .from('Mandantes')
          .insert([
            {
              CompanyName: formData.clientCompany,
              ContactName: formData.clientContact,
              ContactEmail: formData.clientEmail,
              ContactPhone: parseInt(formData.clientPhone.replace('+56', '')),
              Status: true
            }
          ])
          .select()
          .single();

        if (mandanteError) throw mandanteError;

        // Store mandante ID for project creation
        formData.mandanteId = mandanteData.id;
        
        setCurrentStep(currentStep + 1);
      } catch (error: any) {
        toast({
          title: "Error al crear mandante",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setMandanteLoading(false);
      }
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setContratistaLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado');

      // Get contractor data
      const { data: contractorData } = await supabase
        .from('Contratistas')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!contractorData) throw new Error('Contratista no encontrado');

      // Calculate end date
      const startDate = formData.startDate;
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + parseInt(formData.duration));

      // Create project
      const { data: projectData, error: projectError } = await supabase
        .from('Proyectos')
        .insert([
          {
            Name: formData.projectName,
            Description: formData.projectDescription,
            Location: formData.projectAddress,
            Budget: parseInt(formData.contractAmount),
            Currency: formData.contractCurrency,
            StartDate: formData.startDate.toISOString().split('T')[0],
            Duration: parseInt(formData.duration),
            Contratista: contractorData.id,
            Owner: formData.mandanteId,
            FirstPayment: formData.firstPaymentDate?.toISOString().split('T')[0],
            ExpiryRate: formData.paymentPeriod === 'Otro' ? parseInt(formData.customPeriod) : parseInt(formData.paymentPeriod),
            Requierment: formData.requiredDocuments,
            Status: true
          }
        ])
        .select()
        .single();

      if (projectError) throw projectError;

      // Create payment states based on payment period
      const paymentPeriod = formData.paymentPeriod === 'Otro' ? parseInt(formData.customPeriod) : parseInt(formData.paymentPeriod);
      const paymentStates = [];
      const startPaymentDate = formData.firstPaymentDate || startDate;
      
      for (let i = 0; i < Math.ceil(parseInt(formData.duration) / paymentPeriod); i++) {
        const paymentDate = new Date(startPaymentDate);
        paymentDate.setMonth(paymentDate.getMonth() + (i * paymentPeriod));
        
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
          "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        
        paymentStates.push({
          Name: `EP${i + 1}`,
          Mes: monthNames[paymentDate.getMonth()],
          Año: paymentDate.getFullYear(),
          ExpiryDate: paymentDate.toISOString().split('T')[0],
          Project: projectData.id,
          Status: 'Pendiente',
          Completion: false,
          Total: Math.round(parseInt(formData.contractAmount) / Math.ceil(parseInt(formData.duration) / paymentPeriod))
        });
      }

      const { error: paymentError } = await supabase
        .from('Estados de pago')
        .insert(paymentStates);

      if (paymentError) throw paymentError;

      // Show single success message
      toast({
        title: "¡Registro exitoso!",
        description: "Tu cuenta y proyecto han sido creados correctamente. Serás redirigido al inicio.",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Error al completar registro",
        description: error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setContratistaLoading(false);
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
