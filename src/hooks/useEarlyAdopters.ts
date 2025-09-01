import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useEarlyAdopters = () => {
  const [isLoading, setIsLoading] = useState(false);

  const submitEmail = async (email: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('early_adopters')
        .insert([{ email }]);

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast({
            title: "Email ya registrado",
            description: "Este email ya está en nuestra lista de contacto.",
            variant: "default",
          });
        } else {
          toast({
            title: "Error",
            description: "Hubo un problema al registrar tu email. Inténtalo de nuevo.",
            variant: "destructive",
          });
        }
        return false;
      }

      toast({
        title: "¡Registro exitoso!",
        description: "Te contactaremos pronto con más información.",
        variant: "default",
      });
      
      return true;
    } catch (error) {
      console.error('Error submitting email:', error);
      toast({
        title: "Error",
        description: "Hubo un problema al registrar tu email. Inténtalo de nuevo.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    submitEmail,
    isLoading,
  };
};