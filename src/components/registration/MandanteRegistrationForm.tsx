import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMandantes } from '@/hooks/useMandantes';
import { useCreateUserRole } from '@/hooks/useUserRoles';

interface MandanteRegistrationFormProps {
  onBack: () => void;
}

const MandanteRegistrationForm: React.FC<MandanteRegistrationFormProps> = ({ onBack }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createMandante, getMandanteByEmail } = useMandantes();
  const { createUserRole } = useCreateUserRole();
  
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    password: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = 'El nombre de la empresa es requerido';
    }

    if (!formData.contactName.trim()) {
      newErrors.contactName = 'El nombre de contacto es requerido';
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Email inválido';
    }

    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = 'El teléfono es requerido';
    } else if (!/^9\d{8}$/.test(formData.contactPhone)) {
      newErrors.contactPhone = 'Teléfono debe ser 9 dígitos comenzando con 9';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneChange = (value: string) => {
    const cleanPhone = value.replace(/\D/g, '');
    setFormData({ ...formData, contactPhone: cleanPhone });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Verificar si ya existe un mandante con este email
      const { data: existingMandante } = await getMandanteByEmail(formData.contactEmail);
      
      if (existingMandante) {
        // Si existe, crear usuario auth y actualizar el mandante existente
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.contactEmail,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (authError) {
          throw new Error(authError.message);
        }

        if (!authData.user) {
          throw new Error('No se pudo crear el usuario');
        }

        // Actualizar el mandante existente con el auth_user_id
        const { error: updateError } = await supabase
          .from('Mandantes')
          .update({ 
            auth_user_id: authData.user.id,
            CompanyName: formData.companyName,
            ContactName: formData.contactName,
            ContactPhone: parseInt(formData.contactPhone),
            Username: formData.contactEmail, // Agregar email como username
            Password: formData.password, // Agregar password
            Status: true
          })
          .eq('id', existingMandante.id);

        if (updateError) {
          throw new Error('No se pudo actualizar el mandante existente');
        }

        // Asignar rol de mandante
        const roleResult = await createUserRole(authData.user.id, 'mandante', existingMandante.id);
        
        if (!roleResult.success) {
          throw new Error('No se pudo asignar el rol');
        }
      } else {
        // Si no existe, crear usuario auth y nuevo mandante
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.contactEmail,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`
          }
        });

        if (authError) {
          throw new Error(authError.message);
        }

        if (!authData.user) {
          throw new Error('No se pudo crear el usuario');
        }

        // Crear nuevo mandante
        const mandanteData = {
          CompanyName: formData.companyName,
          ContactName: formData.contactName,
          ContactEmail: formData.contactEmail,
          ContactPhone: parseInt(formData.contactPhone),
          Username: formData.contactEmail, // Agregar email como username
          Password: formData.password, // Agregar password
          Status: true,
          auth_user_id: authData.user.id
        };

        const { data: mandanteResult, error: mandanteError } = await createMandante(mandanteData);

        if (mandanteError || !mandanteResult) {
          throw new Error('No se pudo crear el mandante');
        }

        // Asignar rol de mandante
        const roleResult = await createUserRole(authData.user.id, 'mandante', mandanteResult[0].id);
        
        if (!roleResult.success) {
          throw new Error('No se pudo asignar el rol');
        }
      }

      setSuccess(true);
      
      toast({
        title: "Cuenta creada exitosamente",
        description: "Tu cuenta de mandante ha sido creada",
      });

      // Redirigir después de un breve retraso para mostrar el mensaje
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (error: any) {
      console.error('Error creating mandante account:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la cuenta",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-xl font-rubik text-green-700">
              ¡Cuenta Creada Exitosamente!
            </CardTitle>
            <CardDescription className="font-rubik">
              Tu cuenta de mandante ha sido creada correctamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-rubik">
                <strong>Para empezar a asignar obras o proyectos a tu cuenta, ponte en contacto con Gloster.</strong>
              </p>
              <p className="text-sm text-blue-700 mt-2 font-rubik">
                Te ayudaremos a configurar tu cuenta y comenzar a gestionar tus proyectos.
              </p>
            </div>
            <Button 
              onClick={() => navigate('/')}
              className="w-full bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
            >
              Ir al Inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gloster-gray/20 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          >
            <img 
              src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
              alt="Gloster Logo" 
              className="w-8 h-8"
            />
            <h1 className="text-xl font-bold text-slate-800 font-rubik">Gloster</h1>
          </button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-md mx-auto">
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center font-rubik">
                Crear Cuenta de Mandante
              </CardTitle>
              <CardDescription className="text-center font-rubik">
                Complete la información para crear su cuenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nombre de la Empresa</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className={`font-rubik ${errors.companyName ? 'border-red-500' : ''}`}
                  />
                  {errors.companyName && (
                    <p className="text-red-500 text-sm">{errors.companyName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactName">Nombre de Contacto</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className={`font-rubik ${errors.contactName ? 'border-red-500' : ''}`}
                  />
                  {errors.contactName && (
                    <p className="text-red-500 text-sm">{errors.contactName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email de Contacto</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className={`font-rubik ${errors.contactEmail ? 'border-red-500' : ''}`}
                  />
                  {errors.contactEmail && (
                    <p className="text-red-500 text-sm">{errors.contactEmail}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Teléfono de Contacto</Label>
                  <div className="flex">
                    <div className="flex items-center px-3 border border-r-0 rounded-l-md bg-gray-50 text-gray-600 font-rubik">
                      +56
                    </div>
                    <Input
                      id="contactPhone"
                      value={formData.contactPhone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="9xxxxxxxx"
                      className={`font-rubik rounded-l-none ${errors.contactPhone ? 'border-red-500' : ''}`}
                      maxLength={9}
                    />
                  </div>
                  {errors.contactPhone && (
                    <p className="text-red-500 text-sm">{errors.contactPhone}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={`font-rubik ${errors.password ? 'border-red-500' : ''}`}
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className={`font-rubik ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
                  )}
                </div>

                <div className="flex space-x-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onBack}
                    className="font-rubik"
                    disabled={loading}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
                    disabled={loading}
                  >
                    {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MandanteRegistrationForm;