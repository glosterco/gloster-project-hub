
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { addDays, addMonths, format, getMonth, getYear } from 'date-fns';
import { useGoogleDriveIntegration } from '@/hooks/useGoogleDriveIntegration';

export const useEstadosPago = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { createPaymentStateFolder } = useGoogleDriveIntegration();

  const createEstadosPago = async (
    projectId: number,
    firstPaymentDate: string,
    expiryRate: number,
    duration: number
  ) => {
    setLoading(true);
    
    try {
      console.log('Creando estados de pago con parámetros:', { projectId, firstPaymentDate, expiryRate, duration });
      
      // IMPORTANTE: Verificar primero si ya existen estados de pago para este proyecto
      const { data: existingStates, error: checkError } = await supabase
        .from('Estados de pago')
        .select('id, Name')
        .eq('Project', projectId);

      if (checkError) {
        console.error('Error checking existing payment states:', checkError);
        throw new Error('Error al verificar estados de pago existentes');
      }

      if (existingStates && existingStates.length > 0) {
        console.log('Estados de pago ya existen para este proyecto:', existingStates);
        toast({
          title: "Estados de pago ya existen",
          description: "Este proyecto ya tiene estados de pago creados.",
          variant: "destructive"
        });
        return { data: existingStates, error: null };
      }

      // Get project data to access Google Drive folder ID
      const { data: projectData, error: projectError } = await supabase
        .from('Proyectos')
        .select('URL, Name')
        .eq('id', projectId)
        .single();

      if (projectError) {
        console.error('Error fetching project data:', projectError);
      }

      const projectGoogleDriveFolderId = projectData?.URL;
      
      // Calculate how many payment states to create
      let totalPayments: number;
      if (expiryRate === 15) { // Quincenal
        totalPayments = duration * 2;
      } else { // Mensual (30) or other
        totalPayments = duration;
      }

      console.log('Total de pagos a crear:', totalPayments);

      const estadosPago = [];
      const baseDate = new Date(firstPaymentDate);
      const today = new Date();

      for (let i = 0; i < totalPayments; i++) {
        let expiryDate: Date;
        
        if (expiryRate === 15) { // Quincenal
          expiryDate = addDays(baseDate, i * 15);
        } else { // Mensual
          expiryDate = addMonths(baseDate, i);
        }

        // Determine month and year based on expiry date
        const dayOfMonth = expiryDate.getDate();
        let assignedMonth: number;
        let assignedYear: number;

        if (dayOfMonth <= 10 && i > 0) {
          const prevMonth = addMonths(expiryDate, -1);
          assignedMonth = getMonth(prevMonth) + 1;
          assignedYear = getYear(prevMonth);
        } else {
          assignedMonth = getMonth(expiryDate) + 1;
          assignedYear = getYear(expiryDate);
        }

        const monthNames = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        // CAMBIO CRÍTICO: Estados iniciales más conservadores, sin recálculo automático
        // Solo definir el estado inicial basado en fecha, pero NO sobrescribir estados existentes
        let initialStatus = 'Programado';
        if (expiryDate < today) {
          initialStatus = 'Pendiente';
        }

        estadosPago.push({
          Name: `EP${i + 1}`,
          Project: projectId,
          ExpiryDate: format(expiryDate, 'yyyy-MM-dd'),
          Status: initialStatus, // Solo asignar estado inicial, nunca recalcular
          Completion: false,
          Mes: monthNames[assignedMonth - 1],
          Año: assignedYear,
          Total: null,
          URL: null
        });
      }

      // CAMBIO: Solo establecer "En Progreso" al estado más próximo al momento de CREACIÓN
      // NO cuando se navega por la aplicación
      // Filtrar pagos futuros que estén "Programado" y a menos de 14 días para vencimiento
      const futureProgramadoPayments = estadosPago.filter(payment => {
        const expiry = new Date(payment.ExpiryDate);
        const daysToExpiry = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
        return expiry >= today && payment.Status === 'Programado' && daysToExpiry <= 14;
      });
      
      if (futureProgramadoPayments.length > 0) {
        // Ordenar para obtener el pago más próximo dentro del rango de 14 días
        futureProgramadoPayments.sort((a, b) => new Date(a.ExpiryDate).getTime() - new Date(b.ExpiryDate).getTime());
      
        const closestPayment = futureProgramadoPayments[0];
        const closestPaymentIndex = estadosPago.findIndex(payment => payment.ExpiryDate === closestPayment.ExpiryDate);
      
        if (closestPaymentIndex !== -1) {
          estadosPago[closestPaymentIndex].Status = 'En Progreso';
        }
      }

      console.log('Estados de pago a insertar (SOLO CREACIÓN INICIAL):', estadosPago);

      const { data, error } = await supabase
        .from('Estados de pago')
        .insert(estadosPago)
        .select();

      if (error) {
        console.error('Error en BD al crear estados de pago:', error);
        return { data: null, error };
      }

      if (!data || data.length === 0) {
        console.error('No se retornaron datos de estados de pago');
        return { data: null, error: new Error('No data returned') };
      }

      console.log('Estados de pago creados exitosamente en BD (SOLO CREACIÓN INICIAL):', data);

      // Create Google Drive folders for each payment state if project has Google Drive integration
      if (projectGoogleDriveFolderId) {
        try {
          for (const estado of data) {
            const driveResult = await createPaymentStateFolder(
              estado.Name,
              estado.Mes,
              estado.Año,
              projectGoogleDriveFolderId
            );
            
            if (driveResult.success) {
              // Update the payment state with the Google Drive folder ID
              await supabase
                .from('Estados de pago')
                .update({URL: `https://drive.google.com/drive/u/2/folders/${driveResult.folderId}`})
                .eq('id', estado.id);
            }
          }
          console.log('Google Drive folders created for payment states');
        } catch (driveError) {
          console.warn('Failed to create some Google Drive folders for payment states:', driveError);
          // Don't fail the entire operation if Google Drive fails
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error inesperado creando estados de pago:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    createEstadosPago,
    loading
  };
};
