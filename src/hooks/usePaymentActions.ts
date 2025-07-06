
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PaymentDetail } from '@/hooks/usePaymentDetail';

export const usePaymentActions = (
  payment: PaymentDetail | null,
  editableAmount: string,
  editablePercentage: string,
  refetch: () => void
) => {
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const formatCurrency = (amount: number) => {
    if (!payment?.projectData?.Currency) {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
      }).format(amount);
    }

    if (payment.projectData.Currency === 'UF') {
      return `${amount.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UF`;
    } else if (payment.projectData.Currency === 'USD') {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      }).format(amount);
    } else {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
      }).format(amount);
    }
  };

  const handleAmountChange = (value: string, setEditableAmount: (value: string) => void, setEditablePercentage: (value: string) => void) => {
    setEditableAmount(value);
    if (value && payment?.projectData?.Budget) {
      const percentage = (parseFloat(value) / payment.projectData.Budget) * 100;
      setEditablePercentage(percentage.toFixed(2));
    }
  };

  const handlePercentageChange = (value: string, setEditableAmount: (value: string) => void, setEditablePercentage: (value: string) => void) => {
    setEditablePercentage(value);
    if (value && payment?.projectData?.Budget) {
      const amount = (parseFloat(value) / 100) * payment.projectData.Budget;
      setEditableAmount(amount.toString());
    }
  };

  const handleSaveAmount = async () => {
    if (!payment?.id || !editableAmount) return;
    
    setIsSaving(true);
    try {
      const amount = parseFloat(editableAmount);
      const percentage = editablePercentage ? parseFloat(editablePercentage) : 
        (payment?.projectData?.Budget ? (amount / payment.projectData.Budget) * 100 : 0);

      const { error } = await supabase
        .from('Estados de pago')
        .update({ 
          Total: amount,
          Progress: Math.round(percentage)
        })
        .eq('id', payment.id);

      if (error) throw error;

      toast({
        title: "Datos actualizados",
        description: "El monto y porcentaje del estado de pago se han actualizado correctamente",
      });
      
      refetch();
    } catch (error) {
      console.error('Error updating amount and progress:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la información",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNavigation = (targetPath: string, hasUnsavedFiles: boolean) => {
    if (hasUnsavedFiles) {
      const confirmed = window.confirm(
        'Tienes archivos cargados que aún no han sido respaldados y enviados. Si sales de la página se perderá el progreso.\n\nDebes enviar la solicitud o ver la previsualización para que se respalde la información.\n\n¿Estás seguro de que quieres continuar?'
      );
      if (!confirmed) {
        return;
      }
    }
    navigate(targetPath);
  };

  return {
    isSaving,
    formatCurrency,
    handleAmountChange,
    handlePercentageChange,
    handleSaveAmount,
    handleNavigation
  };
};
