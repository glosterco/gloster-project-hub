
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        console.error('Auth error:', error);
        toast({
          title: "Error de registro",
          description: error.message,
          variant: "destructive",
        });
        return { data: null, error };
      }

      console.log('User registered successfully:', data);
      return { data, error: null };
    } catch (error) {
      console.error('Unexpected auth error:', error);
      toast({
        title: "Error inesperado",
        description: "Hubo un error al registrar el usuario",
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        toast({
          title: "Error de inicio de sesión",
          description: error.message,
          variant: "destructive",
        });
        return { data: null, error };
      }

      console.log('User logged in successfully:', data);
      toast({
        title: "¡Bienvenido!",
        description: "Sesión iniciada exitosamente",
      });
      return { data, error: null };
    } catch (error) {
      console.error('Unexpected login error:', error);
      toast({
        title: "Error inesperado",
        description: "Hubo un error al iniciar sesión",
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Logout error:', error);
        toast({
          title: "Error al cerrar sesión",
          description: error.message,
          variant: "destructive",
        });
        return { error };
      }

      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión exitosamente",
      });
      return { error: null };
    } catch (error) {
      console.error('Unexpected logout error:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  return {
    signUp,
    signIn,
    signOut,
    loading
  };
};
