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
    const currency = payment?.projectData?.Currency || 'CLP';
    if (currency === 'UF') {
      return `${amount.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UF`;
    }
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleAmountChange = (
    value: string,
    setEditableAmount: (value: string) => void,
    setEditablePercentage: (value: string) => void
  ) => {
    setEditableAmount(value);
    if (value && payment?.projectData?.Budget) {
      const percentage = (parseFloat(value) / payment.projectData.Budget) * 100;
      setEditablePercentage(percentage.toFixed(2));
    }
  };

  const handlePercentageChange = (
    value: string,
    setEditableAmount: (value: string) => void,
    setEditablePercentage: (value: string) => void
  ) => {
    setEditablePercentage(value);
    if (value && payment?.projectData?.Budget) {
      const amount = (parseFloat(value) / 100) * payment.projectData.Budget;
      setEditableAmount(amount.toString());
    }
  };

  // ✅ Nuevo: guarda si el valor editable es distinto al actual
  const saveAmountIfChanged = async () => {
    if (!payment?.id || !editableAmount) return;

    const amount = parseFloat(editableAmount);
    const percentage = editablePercentage
      ? parseFloat(editablePercentage)
      : (payment.projectData?.Budget ? (amount / payment.projectData.Budget) * 100 : 0);

    const alreadySaved =
      Math.round(amount) === Math.round(payment.amount) &&
      Math.round(percentage) === Math.round(payment.percentage || 0);

    if (alreadySaved) {
      return; // no hay cambios, no actualiza
    }

    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('Estados de pago')
        .update({
          Total: amount,
          Progress: Math.round(percentage)
        })
        .eq('id', payment.id);

      if (error) throw error;

      toast({
        title: "Cambios guardados",
        description: "El monto ha sido actualizado correctamente antes de enviar.",
      });

      refetch();
    } catch (error) {
      console.error("❌ Error al guardar el monto automáticamente:", error);
      toast({
        title: "Error al guardar",
        description: "Hubo un problema al actualizar el monto antes de enviar.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAmount = async () => {
    if (!payment?.id || !editableAmount) return;

    const amount = parseFloat(editableAmount);
    const percentage = editablePercentage
      ? parseFloat(editablePercentage)
      : (payment?.projectData?.Budget ? (amount / payment.projectData.Budget) * 100 : 0);

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from('Estados de pago')
        .update({
          Total: amount,
          Progress: Math.round(percentage)
        })
        .eq('id', payment.id)
        .select('*')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Sin permisos para actualizar");

      toast({
        title: "Datos actualizados",
        description: "El monto y porcentaje del estado de pago se han actualizado correctamente",
      });
      refetch();
    } catch (error) {
      console.error("Error actualizando monto:", error);
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
        'Tienes archivos cargados que aún no han sido respaldados. Si sales, se perderán.\n\n¿Continuar?'
      );
      if (!confirmed) return;
    }
    navigate(targetPath);
  };

  return {
    isSaving,
    formatCurrency,
    handleAmountChange,
    handlePercentageChange,
    handleSaveAmount,
    saveAmountIfChanged, // <- usa esto antes de invocar la función que envía el correo
    handleNavigation
  };
};
