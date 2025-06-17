
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
        
        if (error.message?.includes('User already registered') || 
            error.message?.includes('already registered') ||
            error.message?.includes('already been registered')) {
          toast({
            title: "Error de registro",
            description: "Esta dirección de correo electrónico ya está registrada. Por favor usa otro email o inicia sesión.",
            variant: "destructive"
          });
          return { 
            data: null, 
            error: { 
              ...error, 
              message: 'Esta dirección de correo electrónico ya está registrada. Por favor usa otro email o inicia sesión.' 
            } 
          };
        }
        
        toast({
          title: "Error de registro",
          description: error.message || "Ocurrió un error durante el registro",
          variant: "destructive"
        });
        
        return { data: null, error };
      }

      console.log('User registered successfully:', data);
      toast({
        title: "Registro exitoso",
        description: "Por favor verifica tu email para activar tu cuenta",
      });
      return { data, error: null };
    } catch (error: any) {
      console.error('Unexpected auth error:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error inesperado. Intenta nuevamente.",
        variant: "destructive"
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
        
        if (error.message?.includes('Invalid login credentials') || 
            error.message?.includes('Invalid email or password') ||
            error.message?.includes('invalid_credentials')) {
          toast({
            title: "Credenciales incorrectas",
            description: "Email o contraseña incorrectos. Por favor verifica tus credenciales e intenta nuevamente.",
            variant: "destructive"
          });
          return { 
            data: null, 
            error: { 
              ...error, 
              message: 'Email o contraseña incorrectos. Por favor verifica tus credenciales.' 
            } 
          };
        }

        if (error.message?.includes('Email not confirmed')) {
          toast({
            title: "Email no verificado",
            description: "Por favor verifica tu email antes de iniciar sesión.",
            variant: "destructive"
          });
          return { data: null, error };
        }

        if (error.message?.includes('Too many requests')) {
          toast({
            title: "Demasiados intentos",
            description: "Has hecho demasiados intentos de inicio de sesión. Espera unos minutos antes de intentar nuevamente.",
            variant: "destructive"
          });
          return { data: null, error };
        }
        
        toast({
          title: "Error de inicio de sesión",
          description: error.message || "Ocurrió un error al iniciar sesión",
          variant: "destructive"
        });
        
        return { data: null, error };
      }

      console.log('User logged in successfully:', data);
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido de vuelta",
      });
      return { data, error: null };
    } catch (error: any) {
      console.error('Unexpected login error:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error inesperado. Intenta nuevamente.",
        variant: "destructive"
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
