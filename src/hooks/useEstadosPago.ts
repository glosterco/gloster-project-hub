
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
      console.log('Creating estados de pago for project:', projectId);
      
      // Calculate how many payment states to create
      let totalPayments: number;
      if (expiryRate === 15) { // Quincenal
        totalPayments = duration * 2;
      } else { // Mensual (30) or other
        totalPayments = duration;
      }

      const estadosPago = [];
      const baseDate = new Date(firstPaymentDate);

      for (let i = 0; i < totalPayments; i++) {
        let expiryDate: Date;
        
        if (expiryRate === 15) { // Quincenal
          expiryDate = addDays(baseDate, i * 15);
        } else { // Mensual
          expiryDate = addMonths(baseDate, i);
        }

        // Determine month and year based on expiry date
        // If expiry date is in first 10 days, assign to previous month
        const dayOfMonth = expiryDate.getDate();
        let assignedMonth: number;
        let assignedYear: number;

        if (dayOfMonth <= 10 && i > 0) {
          // Assign to previous month
          const prevMonth = addMonths(expiryDate, -1);
          assignedMonth = getMonth(prevMonth) + 1; // getMonth returns 0-11, we need 1-12
          assignedYear = getYear(prevMonth);
        } else {
          assignedMonth = getMonth(expiryDate) + 1;
          assignedYear = getYear(expiryDate);
        }

        // Convert month number to Spanish month name
        const monthNames = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];

        estadosPago.push({
          Name: `EP${i + 1}`,
          Project: projectId,
          ExpiryDate: format(expiryDate, 'yyyy-MM-dd'),
          Status: 'Programado',
          Completion: false,
          Mes: monthNames[assignedMonth - 1],
          Año: assignedYear,
          Total: null, // To be filled later
          URL: null
        });
      }

      console.log('Estados de pago to create:', estadosPago);

      const { data, error } = await supabase
        .from('Estados de pago')
        .insert(estadosPago)
        .select();

      if (error) {
        console.error('Error creating estados de pago:', error);
        toast({
          title: "Error al crear estados de pago",
          description: error.message,
          variant: "destructive",
        });
        return { data: null, error };
      }

      console.log('Estados de pago created successfully:', data);
      toast({
        title: "Estados de pago creados",
        description: `Se crearon ${totalPayments} estados de pago exitosamente`,
      });

      return { data, error: null };
    } catch (error) {
      console.error('Unexpected error creating estados de pago:', error);
      toast({
        title: "Error inesperado",
        description: "Hubo un error al crear los estados de pago",
        variant: "destructive",
      });
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
