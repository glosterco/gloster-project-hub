
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { addDays, addMonths, format, getMonth, getYear } from 'date-fns';

export const useEstadosPago = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createEstadosPago = async (
    projectId: number,
    firstPaymentDate: string,
    expiryRate: number,
    duration: number
  ) => {
    setLoading(true);
    
    try {
      console.log('Creando estados de pago con parámetros:', { projectId, firstPaymentDate, expiryRate, duration });
      
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

        // Determine status based on expiry date vs today
        let status = 'Programado';
        if (expiryDate < today) {
          status = 'Pendiente';
        } else {
          // Find the closest future date to set as "En Progreso"
          const timeDiff = expiryDate.getTime() - today.getTime();
          if (timeDiff > 0) {
            // This will be handled after creating all payments
            status = 'Programado';
          }
        }

        estadosPago.push({
          Name: `EP${i + 1}`,
          Project: projectId,
          ExpiryDate: format(expiryDate, 'yyyy-MM-dd'),
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
        // Sort by expiry date and set the first one as "En Progreso"
        futurePayments.sort((a, b) => new Date(a.ExpiryDate).getTime() - new Date(b.ExpiryDate).getTime());
        const closestPaymentIndex = estadosPago.findIndex(payment => payment.ExpiryDate === futurePayments[0].ExpiryDate);
        if (closestPaymentIndex !== -1) {
          estadosPago[closestPaymentIndex].Status = 'En Progreso';
        }
      }

      console.log('Estados de pago a insertar:', estadosPago);

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

      console.log('Estados de pago creados exitosamente en BD:', data);

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
