
import { supabase } from '@/integrations/supabase/client';
import { useContratistas } from '@/hooks/useContratistas';
import { useMandantes } from '@/hooks/useMandantes';
import { useProyectos } from '@/hooks/useProyectos';
import { useEstadosPago } from '@/hooks/useEstadosPago';
import { useRegistrationData } from './useRegistrationData';
import { useRegistrationValidation } from './useRegistrationValidation';
import { useCreateUserRole } from '@/hooks/useUserRoles';

export const useRegistrationProcess = () => {
  const { createContratista } = useContratistas();
  const { createMandante, getMandanteByIdOrName } = useMandantes();
  const { createProyecto } = useProyectos();
  const { createEstadosPago } = useEstadosPago();
  const { prepareContratistaData, prepareMandanteData, prepareProyectoData, getExpiryRateNumeric } = useRegistrationData();
  const { showError, showSuccessMessage } = useRegistrationValidation();
  const { createUserRole } = useCreateUserRole();

  const authenticateUser = async (email: string, password: string) => {
    console.log('Starting authentication process...');
    
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (authError) {
      console.error('Authentication error:', authError);
      showError("Error de autenticación", authError.message);
      return { success: false };
    }

    if (!authData.user) {
      showError("Error de autenticación", "No se pudo crear el usuario");
      return { success: false };
    }

    console.log('User authenticated successfully:', authData.user.id);
    return { success: true, user: authData.user };
  };

  const createContratistaRecord = async (formData: any, authUserId: string) => {
    console.log('Creating contratista...');
    const contratistaData = prepareContratistaData(formData, authUserId);
    
    const { data: contratistaResult, error: contratistaError } = await createContratista(contratistaData, authUserId);
    
    if (contratistaError) {
      console.error('Error creating contratista:', contratistaError);
      showError("Error al crear contratista", contratistaError.message || "Error desconocido");
      return { success: false };
    }

    if (!contratistaResult || contratistaResult.length === 0) {
      console.error('No contratista result returned');
      showError("Error al crear contratista", "No se pudo crear el contratista");
      return { success: false };
    }

    const contratistaId = contratistaResult[0].id;
    console.log('Contratista created successfully with ID:', contratistaId);
    return { success: true, id: contratistaId };
  };

  const handleMandanteRecord = async (formData: any) => {
    console.log('Processing mandante...');
    
    // Primero verificar si es un ID existente
    const { data: existingMandante } = await getMandanteByIdOrName(formData.clientCompany);
    
    if (existingMandante) {
      console.log('Found existing mandante:', existingMandante.id);
      
      // Verificar si los datos de contacto son diferentes
      const dataChanged = 
        existingMandante.ContactEmail !== formData.clientEmail ||
        existingMandante.ContactPhone !== parseInt(formData.clientPhone.replace('+56', '')) ||
        existingMandante.ContactName !== formData.clientContact;
      
      if (dataChanged) {
        console.log('Contact data changed, creating new mandante with existing company name...');
        // Usar el nombre real de la empresa del mandante existente, no el ID
        const mandanteData = {
          CompanyName: existingMandante.CompanyName, // Usar el nombre real de la empresa
          ContactName: formData.clientContact,
          ContactEmail: formData.clientEmail,
          ContactPhone: parseInt(formData.clientPhone.replace('+56', '')),
          Status: true
        };
        
        const { data: mandanteResult, error: mandanteError } = await createMandante(mandanteData);
        
        if (mandanteError) {
          console.error('Error creating new mandante:', mandanteError);
          showError("Error al crear mandante", mandanteError.message || "Error desconocido");
          return { success: false };
        }

        if (!mandanteResult || mandanteResult.length === 0) {
          console.error('No mandante result returned');
          showError("Error al crear mandante", "No se pudo crear el mandante");
          return { success: false };
        }

        const mandanteId = mandanteResult[0].id;
        console.log('New mandante created successfully with ID:', mandanteId);
        return { success: true, id: mandanteId };
      } else {
        // Usar el mandante existente
        console.log('Using existing mandante with ID:', existingMandante.id);
        return { success: true, id: existingMandante.id };
      }
    } else {
      // Crear nuevo mandante
      console.log('Creating new mandante...');
      const mandanteData = prepareMandanteData(formData);
      
      const { data: mandanteResult, error: mandanteError } = await createMandante(mandanteData);
      
      if (mandanteError) {
        console.error('Error creating mandante:', mandanteError);
        showError("Error al crear mandante", mandanteError.message || "Error desconocido");
        return { success: false };
      }

      if (!mandanteResult || mandanteResult.length === 0) {
        console.error('No mandante result returned');
        showError("Error al crear mandante", "No se pudo crear el mandante");
        return { success: false };
      }

      const mandanteId = mandanteResult[0].id;
      console.log('Mandante created successfully with ID:', mandanteId);
      return { success: true, id: mandanteId };
    }
  };

  const createProyectoRecord = async (formData: any, contratistaId: number, mandanteId: number) => {
    console.log('Creating project...');
    const proyectoData = prepareProyectoData(formData, contratistaId, mandanteId);
    
    const { data: projectResult, error: projectError } = await createProyecto(proyectoData);
    
    if (projectError) {
      console.error('Error creating project:', projectError);
      showError("Error al crear proyecto", projectError.message || "Error desconocido");
      return { success: false };
    }

    if (!projectResult || projectResult.length === 0) {
      console.error('No project result returned');
      showError("Error al crear proyecto", "No se pudo crear el proyecto");
      return { success: false };
    }

    const projectId = projectResult[0].id;
    console.log('Project created successfully with ID:', projectId);
    return { success: true, id: projectId };
  };

  const createPaymentStates = async (formData: any, projectId: number) => {
    console.log('Creating payment states...');
    const expiryRateNumeric = getExpiryRateNumeric(formData);

    await createEstadosPago(
      projectId,
      formData.firstPaymentDate,
      expiryRateNumeric,
      parseInt(formData.duration)
    );
  };

  const processRegistration = async (formData: any) => {
    try {
      // Paso 1: Autenticar usuario
      const authResult = await authenticateUser(formData.email, formData.password);
      if (!authResult.success) return false;

      // Paso 2: Crear contratista
      const contratistaResult = await createContratistaRecord(formData, authResult.user.id);
      if (!contratistaResult.success) return false;

      // Paso 3: Asignar rol de contratista
      console.log('Assigning contratista role...');
      const roleResult = await createUserRole(authResult.user.id, 'contratista', contratistaResult.id);
      if (!roleResult.success) {
        console.error('Error assigning contratista role');
        showError("Error al asignar rol", "No se pudo asignar el rol de contratista");
        return false;
      }

      // Paso 4: Procesar mandante (existente o nuevo)
      const mandanteResult = await handleMandanteRecord(formData);
      if (!mandanteResult.success) return false;

      // Paso 5: Crear proyecto
      const projectResult = await createProyectoRecord(formData, contratistaResult.id, mandanteResult.id);
      if (!projectResult.success) return false;

      // Paso 6: Crear estados de pago
      await createPaymentStates(formData, projectResult.id);

      showSuccessMessage();
      return true;
    } catch (error) {
      console.error('Error during registration:', error);
      showError("Error inesperado", "Hubo un error durante el registro. Intenta nuevamente.");
      return false;
    }
  };

  return {
    processRegistration
  };
};
