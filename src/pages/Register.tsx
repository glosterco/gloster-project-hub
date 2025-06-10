import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, CheckCircle, Building, User, Mail, Phone, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Register = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    // Información de la empresa
    companyName: '',
    companyRut: '',
    companySize: '',
    
    // Información del contacto
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactPosition: '',
    
    // Información de ubicación
    address: '',
    city: '',
    region: '',
    
    // Información de especialidad
    specialties: '',
    customSpecialty: '',
    yearsExperience: '',
    
    // Credenciales
    password: '',
    confirmPassword: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('https://hook.us2.make.com/bvnog1pu3vyvisfhw96hfsgtf29bib7l', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "¡Registro exitoso!",
          description: "Tu cuenta ha sido creada. El equipo de Gloster se pondrá en contacto contigo pronto.",
        });
        navigate('/');
      } else {
        throw new Error('Error en el registro');
      }
    } catch (error) {
      toast({
        title: "Error en el registro",
        description: "Hubo un problema al crear tu cuenta. Por favor intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.companyName && formData.companyRut && formData.companySize;
      case 2:
        return formData.contactName && formData.contactEmail && formData.contactPhone && formData.contactPosition;
      case 3:
        return formData.address && formData.city && formData.region;
      case 4:
        const specialtyValid = formData.specialties && (formData.specialties !== 'otro' || formData.customSpecialty);
        return specialtyValid && formData.yearsExperience && formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Building className="h-5 w-5 text-gloster-yellow" />
              <h3 className="text-lg font-semibold text-slate-800 font-rubik">Información de la Empresa</h3>
            </div>
            
            <Input
              placeholder="Nombre de la empresa"
              value={formData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              className="font-rubik"
            />
            
            <Input
              placeholder="RUT de la empresa"
              value={formData.companyRut}
              onChange={(e) => handleInputChange('companyRut', e.target.value)}
              className="font-rubik"
            />
            
            <Select onValueChange={(value) => handleInputChange('companySize', value)}>
              <SelectTrigger className="font-rubik">
                <SelectValue placeholder="Tamaño de la empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-5">1-5 empleados</SelectItem>
                <SelectItem value="6-20">6-20 empleados</SelectItem>
                <SelectItem value="21-50">21-50 empleados</SelectItem>
                <SelectItem value="51-100">51-100 empleados</SelectItem>
                <SelectItem value="100+">Más de 100 empleados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <User className="h-5 w-5 text-gloster-yellow" />
              <h3 className="text-lg font-semibold text-slate-800 font-rubik">Información de Contacto</h3>
            </div>
            
            <Input
              placeholder="Nombre completo del contacto"
              value={formData.contactName}
              onChange={(e) => handleInputChange('contactName', e.target.value)}
              className="font-rubik"
            />
            
            <Input
              type="email"
              placeholder="Email de contacto"
              value={formData.contactEmail}
              onChange={(e) => handleInputChange('contactEmail', e.target.value)}
              className="font-rubik"
            />
            
            <Input
              placeholder="Teléfono de contacto"
              value={formData.contactPhone}
              onChange={(e) => handleInputChange('contactPhone', e.target.value)}
              className="font-rubik"
            />
            
            <Input
              placeholder="Cargo en la empresa"
              value={formData.contactPosition}
              onChange={(e) => handleInputChange('contactPosition', e.target.value)}
              className="font-rubik"
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <MapPin className="h-5 w-5 text-gloster-yellow" />
              <h3 className="text-lg font-semibold text-slate-800 font-rubik">Ubicación</h3>
            </div>
            
            <Input
              placeholder="Dirección completa"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="font-rubik"
            />
            
            <Input
              placeholder="Ciudad"
              value={formData.city}
              onChange={(e) => handleInputChange('city', e.target.value)}
              className="font-rubik"
            />
            
            <Select onValueChange={(value) => handleInputChange('region', value)}>
              <SelectTrigger className="font-rubik">
                <SelectValue placeholder="Región" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="metropolitana">Región Metropolitana</SelectItem>
                <SelectItem value="valparaiso">Valparaíso</SelectItem>
                <SelectItem value="biobio">Biobío</SelectItem>
                <SelectItem value="araucania">La Araucanía</SelectItem>
                <SelectItem value="los-lagos">Los Lagos</SelectItem>
                <SelectItem value="otra">Otra región</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <CheckCircle className="h-5 w-5 text-gloster-yellow" />
              <h3 className="text-lg font-semibold text-slate-800 font-rubik">Especialidad y Credenciales</h3>
            </div>
            
            <Select onValueChange={(value) => handleInputChange('specialties', value)}>
              <SelectTrigger className="font-rubik">
                <SelectValue placeholder="Especialidad principal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="obras-civiles">Obras Civiles</SelectItem>
                <SelectItem value="instalaciones-electricas">Instalaciones Eléctricas</SelectItem>
                <SelectItem value="instalaciones-sanitarias">Instalaciones Sanitarias</SelectItem>
                <SelectItem value="climatizacion">Climatización</SelectItem>
                <SelectItem value="acabados">Acabados</SelectItem>
                <SelectItem value="estructuras">Estructuras</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>

            {formData.specialties === 'otro' && (
              <Input
                placeholder="Especifica tu especialidad"
                value={formData.customSpecialty}
                onChange={(e) => handleInputChange('customSpecialty', e.target.value)}
                className="font-rubik"
              />
            )}
            
            <Select onValueChange={(value) => handleInputChange('yearsExperience', value)}>
              <SelectTrigger className="font-rubik">
                <SelectValue placeholder="Años de experiencia" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-3">1-3 años</SelectItem>
                <SelectItem value="4-7">4-7 años</SelectItem>
                <SelectItem value="8-15">8-15 años</SelectItem>
                <SelectItem value="15+">Más de 15 años</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              type="password"
              placeholder="Contraseña"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="font-rubik"
            />
            
            <Input
              type="password"
              placeholder="Confirmar contraseña"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="font-rubik"
            />
            
            {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <p className="text-red-500 text-sm font-rubik">Las contraseñas no coinciden</p>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gloster-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
              alt="Gloster Logo" 
              className="w-8 h-8"
            />
            <h1 className="text-xl font-bold text-slate-800 font-rubik">Registro de Contratista</h1>
          </div>
          
          <button 
            onClick={() => navigate('/')}
            className="text-gloster-gray hover:text-slate-800 text-sm font-rubik flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </button>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className={`flex items-center ${step < 4 ? 'flex-1' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-rubik ${
                    step <= currentStep ? 'bg-gloster-yellow text-black' : 'bg-gloster-gray/20 text-gloster-gray'
                  }`}>
                    {step}
                  </div>
                  {step < 4 && (
                    <div className={`flex-1 h-1 mx-2 ${
                      step < currentStep ? 'bg-gloster-yellow' : 'bg-gloster-gray/20'
                    }`}></div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-center text-gloster-gray text-sm font-rubik">
              Paso {currentStep} de 4
            </p>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-rubik text-slate-800">
                Únete a Gloster
              </CardTitle>
              <CardDescription className="font-rubik">
                Completa tu perfil para comenzar a gestionar tus proyectos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderStep()}
              
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={currentStep === 1}
                  className="font-rubik"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Anterior
                </Button>
                
                {currentStep < 4 ? (
                  <Button
                    onClick={handleNextStep}
                    disabled={!isStepValid()}
                    className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
                  >
                    Siguiente
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={!isStepValid() || isLoading}
                    className="bg-green-600 hover:bg-green-700 text-white font-rubik"
                  >
                    {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;
