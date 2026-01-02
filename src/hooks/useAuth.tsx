import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signUp: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true); // Start as true - loading until session is checked
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false); // Auth state resolved
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false); // Session check complete
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    setLoading(true);
    try {
      const redirectUrl = `https://gloster-project-hub.lovable.app/`;
      
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

  const resetPassword = async (email: string) => {
    setLoading(true);
    try {
      const redirectUrl = `https://gloster-project-hub.lovable.app/`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl
      });

      if (error) {
        console.error('Password reset error:', error);
        toast({
          title: "Error al enviar email de recuperación",
          description: error.message || "No se pudo enviar el email de recuperación",
          variant: "destructive"
        });
        return { error };
      }

      toast({
        title: "Email enviado",
        description: "Revisa tu correo para restablecer tu contraseña",
      });
      return { error: null };
    } catch (error: any) {
      console.error('Unexpected password reset error:', error);
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error inesperado. Intenta nuevamente.",
        variant: "destructive"
      });
      return { error };
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

  const value = {
    user,
    session,
    signUp,
    signIn,
    signOut,
    resetPassword,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
