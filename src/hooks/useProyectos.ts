
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useGoogleDriveIntegration } from '@/hooks/useGoogleDriveIntegration';

export const useProyectos = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { createProjectWithPaymentFolders } = useGoogleDriveIntegration();

  const createProyecto = async (proyectoData: {
    Name: string;
    Description: string;
    Location: string;
    Budget: number;
    Currency: string;
    StartDate: string;
    Duration: number;
    Contratista: number;
    Owner: number;
    FirstPayment: string;
    ExpiryRate: string;
    Requierment: string[];
  }) => {
    setLoading(true);
    
    try {
      console.log('🚀 Insertando proyecto en BD:', proyectoData);
      
      // Convert payment period to numeric value
      let numericExpiryRate: number;
      if (proyectoData.ExpiryRate === 'mensual') {
        numericExpiryRate = 30;
      } else if (proyectoData.ExpiryRate === 'quincenal') {
        numericExpiryRate = 15;
      } else {
        numericExpiryRate = parseInt(proyectoData.ExpiryRate) || 30;
      }
      
      const { data, error } = await supabase
        .from('Proyectos')
        .insert({
          Name: proyectoData.Name,
          Description: proyectoData.Description,
          Location: proyectoData.Location,
          Budget: proyectoData.Budget,
          Currency: proyectoData.Currency,
          StartDate: proyectoData.StartDate,
          Duration: proyectoData.Duration,
          Contratista: proyectoData.Contratista,
          Owner: proyectoData.Owner,
          FirstPayment: proyectoData.FirstPayment,
          ExpiryRate: numericExpiryRate,
          Requierment: proyectoData.Requierment,
          Status: true
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error en BD al crear proyecto:', error);
        return { data: null, error };
      }

      if (!data) {
        console.error('❌ No se retornó resultado del proyecto');
        return { data: null, error: new Error('No data returned') };
      }

      console.log('✅ Proyecto creado exitosamente en BD:', data);

      // Crear estados de pago primero
      const { data: estadosData, error: estadosError } = await createEstadosPago(
        data.id,
        proyectoData.FirstPayment,
        numericExpiryRate,
        proyectoData.Duration
      );

      if (estadosError) {
        console.error('❌ Error creando estados de pago:', estadosError);
        // El proyecto ya fue creado, así que no falleamos completamente
      }

      // Si hay estados de pago, crear carpetas de Google Drive
      if (estadosData && estadosData.length > 0) {
        try {
          const paymentStates = estadosData.map(estado => ({
            id: estado.id,
            Name: estado.Name,
            Mes: estado.Mes,
            Año: estado.Año
          }));

          const driveResult = await createProjectWithPaymentFolders(
            data.id, 
            data.Name, 
            paymentStates
          );
          
          if (driveResult.success) {
            console.log('✅ Carpetas de Google Drive creadas exitosamente');
            
            // Actualizar proyecto con ID de carpeta principal
            await supabase
              .from('Proyectos')
              .update({ URL: driveResult.projectFolderId })
              .eq('id', data.id);

            // Actualizar estados de pago con IDs de carpetas
            for (const paymentFolder of driveResult.paymentFolders) {
              await supabase
                .from('Estados de pago')
                .update({ URL: paymentFolder.folderId })
                .eq('id', paymentFolder.paymentStateId);
            }
          }
        } catch (driveError) {
          console.warn('⚠️ Error creando carpetas de Google Drive, pero proyecto fue creado:', driveError);
          // No falleamos la operación completa si Google Drive falla
        }
      }

      // Return in array format for consistency
      return { data: [data], error: null };
    } catch (error) {
      console.error('💥 Error inesperado creando proyecto:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Helper function to create payment states (extracted from useEstadosPago)
  const createEstadosPago = async (
    projectId: number,
    firstPaymentDate: string,
    expiryRate: number,
    duration: number
  ) => {
    try {
      console.log('📅 Creando estados de pago:', { projectId, firstPaymentDate, expiryRate, duration });
      
      // Calculate how many payment states to create
      let totalPayments: number;
      if (expiryRate === 15) { // Quincenal
        totalPayments = duration * 2;
      } else { // Mensual (30) or other
        totalPayments = duration;
      }

      const estadosPago = [];
      const baseDate = new Date(firstPaymentDate);
      const today = new Date();

      for (let i = 0; i < totalPayments; i++) {
        let expiryDate: Date;
        
        if (expiryRate === 15) { // Quincenal
          expiryDate = new Date(baseDate.getTime() + (i * 15 * 24 * 60 * 60 * 1000));
        } else { // Mensual
          expiryDate = new Date(baseDate);
          expiryDate.setMonth(baseDate.getMonth() + i);
        }

        // Determine month and year based on expiry date
        const dayOfMonth = expiryDate.getDate();
        let assignedMonth: number;
        let assignedYear: number;

        if (dayOfMonth <= 10 && i > 0) {
          const prevMonth = new Date(expiryDate);
          prevMonth.setMonth(expiryDate.getMonth() - 1);
          assignedMonth = prevMonth.getMonth() + 1;
          assignedYear = prevMonth.getFullYear();
        } else {
          assignedMonth = expiryDate.getMonth() + 1;
          assignedYear = expiryDate.getFullYear();
        }

        const monthNames = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        // Determine status based on expiry date vs today
        let status = 'Programado';
        if (expiryDate < today) {
          status = 'Pendiente';
        }

        estadosPago.push({
          Name: `EP${i + 1}`,
          Project: projectId,
          ExpiryDate: expiryDate.toISOString().split('T')[0],
          Status: status,
          Completion: false,
          Mes: monthNames[assignedMonth - 1],
          Año: assignedYear,
          Total: null,
          URL: null
        });
      }

      // Find the closest future payment to set as "En Progreso"
      const futurePayments = estadosPago.filter(payment => new Date(payment.ExpiryDate) >= today);
      if (futurePayments.length > 0) {
        futurePayments.sort((a, b) => new Date(a.ExpiryDate).getTime() - new Date(b.ExpiryDate).getTime());
        const closestPaymentIndex = estadosPago.findIndex(payment => payment.ExpiryDate === futurePayments[0].ExpiryDate);
        if (closestPaymentIndex !== -1) {
          estadosPago[closestPaymentIndex].Status = 'En Progreso';
        }
      }

      console.log('📝 Estados de pago a insertar:', estadosPago);

      const { data, error } = await supabase
        .from('Estados de pago')
        .insert(estadosPago)
        .select();

      if (error) {
        console.error('❌ Error en BD al crear estados de pago:', error);
        return { data: null, error };
      }

      console.log('✅ Estados de pago creados exitosamente en BD:', data);
      return { data, error: null };
    } catch (error) {
      console.error('💥 Error inesperado creando estados de pago:', error);
      return { data: null, error };
    }
  };

  const getProyectosByContratista = async (contratistaId: number) => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('Proyectos')
        .select('*')
        .eq('Contratista', contratistaId);

      if (error) {
        console.error('Error fetching proyectos:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error fetching proyectos:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    createProyecto,
    getProyectosByContratista,
    loading
  };
};
