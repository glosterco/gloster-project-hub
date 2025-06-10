
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Register = () => {
  const [formData, setFormData] = useState({
    companyName: '',
    rut: '',
    legalRepresentative: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    region: '',
    specialization: '',
    yearsExperience: '',
    previousProjects: '',
    bankName: '',
    accountType: '',
    accountNumber: '',
    password: '',
    confirmPassword: ''
  });
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulamos el registro
    setTimeout(() => {
      toast({
        title: "¡Registro exitoso!",
        description: "Tu perfil ha sido creado. Pronto recibirás confirmación por email.",
      });
      navigate('/');
      setIsLoading(false);
    }, 2000);
  };

  const totalSteps = 4;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gloster-gray via-slate-600 to-gloster-gray">
      {/* Header */}
      <header className="bg-gloster-white p-6 shadow-sm">
        <div className="container mx-auto">
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
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gloster-white font-rubik">Paso {currentStep} de {totalSteps}</span>
              <span className="text-gloster-white font-rubik">{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-gloster-white/20 rounded-full h-2">
              <div 
                className="bg-gloster-yellow h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          <Card className="bg-gloster-white/10 backdrop-blur-lg border-gloster-white/20">
            <CardHeader>
              <CardTitle className="text-2xl text-gloster-white font-rubik">
                {currentStep === 1 && 'Información de la Empresa'}
                {currentStep === 2 && 'Información de Contacto'}
                {currentStep === 3 && 'Experiencia y Especialización'}
                {currentStep === 4 && 'Información Bancaria y Acceso'}
              </CardTitle>
              <CardDescription className="text-gloster-white/80 font-rubik">
                {currentStep === 1 && 'Ingresa los datos básicos de tu empresa'}
                {currentStep === 2 && 'Datos de contacto y ubicación'}
                {currentStep === 3 && 'Tu experiencia en el sector construcción'}
                {currentStep === 4 && 'Información para pagos y creación de cuenta'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Paso 1: Información de la Empresa */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <Input
                        placeholder="Nombre de la empresa"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        className="bg-gloster-white/10 border-gloster-white/20 text-gloster-white placeholder:text-gloster-white/60 font-rubik"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="RUT de la empresa"
                        value={formData.rut}
                        onChange={(e) => handleInputChange('rut', e.target.value)}
                        className="bg-gloster-white/10 border-gloster-white/20 text-gloster-white placeholder:text-gloster-white/60 font-rubik"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Representante legal"
                        value={formData.legalRepresentative}
                        onChange={(e) => handleInputChange('legalRepresentative', e.target.value)}
                        className="bg-gloster-white/10 border-gloster-white/20 text-gloster-white placeholder:text-gloster-white/60 font-rubik"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Paso 2: Información de Contacto */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <Input
                        type="email"
                        placeholder="Email corporativo"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="bg-gloster-white/10 border-gloster-white/20 text-gloster-white placeholder:text-gloster-white/60 font-rubik"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Teléfono"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="bg-gloster-white/10 border-gloster-white/20 text-gloster-white placeholder:text-gloster-white/60 font-rubik"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Dirección"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="bg-gloster-white/10 border-gloster-white/20 text-gloster-white placeholder:text-gloster-white/60 font-rubik"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        placeholder="Ciudad"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="bg-gloster-white/10 border-gloster-white/20 text-gloster-white placeholder:text-gloster-white/60 font-rubik"
                        required
                      />
                      <Select value={formData.region} onValueChange={(value) => handleInputChange('region', value)}>
                        <SelectTrigger className="bg-gloster-white/10 border-gloster-white/20 text-gloster-white font-rubik">
                          <SelectValue placeholder="Región" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="metropolitana">Región Metropolitana</SelectItem>
                          <SelectItem value="valparaiso">Valparaíso</SelectItem>
                          <SelectItem value="biobio">Bío Bío</SelectItem>
                          <SelectItem value="araucania">La Araucanía</SelectItem>
                          <SelectItem value="los-lagos">Los Lagos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Paso 3: Experiencia */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <Select value={formData.specialization} onValueChange={(value) => handleInputChange('specialization', value)}>
                        <SelectTrigger className="bg-gloster-white/10 border-gloster-white/20 text-gloster-white font-rubik">
                          <SelectValue placeholder="Especialización principal" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="electricidad">Instalaciones Eléctricas</SelectItem>
                          <SelectItem value="sanitarias">Instalaciones Sanitarias</SelectItem>
                          <SelectItem value="hvac">Climatización (HVAC)</SelectItem>
                          <SelectItem value="estructura">Estructuras</SelectItem>
                          <SelectItem value="acabados">Acabados</SelectItem>
                          <SelectItem value="obra-gruesa">Obra Gruesa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Select value={formData.yearsExperience} onValueChange={(value) => handleInputChange('yearsExperience', value)}>
                        <SelectTrigger className="bg-gloster-white/10 border-gloster-white/20 text-gloster-white font-rubik">
                          <SelectValue placeholder="Años de experiencia" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-2">1-2 años</SelectItem>
                          <SelectItem value="3-5">3-5 años</SelectItem>
                          <SelectItem value="6-10">6-10 años</SelectItem>
                          <SelectItem value="11-20">11-20 años</SelectItem>
                          <SelectItem value="20+">Más de 20 años</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Input
                        placeholder="Número aproximado de proyectos completados"
                        value={formData.previousProjects}
                        onChange={(e) => handleInputChange('previousProjects', e.target.value)}
                        className="bg-gloster-white/10 border-gloster-white/20 text-gloster-white placeholder:text-gloster-white/60 font-rubik"
                        type="number"
                      />
                    </div>
                  </div>
                )}

                {/* Paso 4: Información Bancaria y Acceso */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div>
                      <Select value={formData.bankName} onValueChange={(value) => handleInputChange('bankName', value)}>
                        <SelectTrigger className="bg-gloster-white/10 border-gloster-white/20 text-gloster-white font-rubik">
                          <SelectValue placeholder="Banco" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chile">Banco de Chile</SelectItem>
                          <SelectItem value="santander">Banco Santander</SelectItem>
                          <SelectItem value="bci">Banco BCI</SelectItem>
                          <SelectItem value="estado">BancoEstado</SelectItem>
                          <SelectItem value="security">Banco Security</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Select value={formData.accountType} onValueChange={(value) => handleInputChange('accountType', value)}>
                        <SelectTrigger className="bg-gloster-white/10 border-gloster-white/20 text-gloster-white font-rubik">
                          <SelectValue placeholder="Tipo de cuenta" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="corriente">Cuenta Corriente</SelectItem>
                          <SelectItem value="vista">Cuenta Vista</SelectItem>
                          <SelectItem value="ahorro">Cuenta de Ahorro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Input
                        placeholder="Número de cuenta"
                        value={formData.accountNumber}
                        onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                        className="bg-gloster-white/10 border-gloster-white/20 text-gloster-white placeholder:text-gloster-white/60 font-rubik"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        type="password"
                        placeholder="Contraseña"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        className="bg-gloster-white/10 border-gloster-white/20 text-gloster-white placeholder:text-gloster-white/60 font-rubik"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        type="password"
                        placeholder="Confirmar contraseña"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        className="bg-gloster-white/10 border-gloster-white/20 text-gloster-white placeholder:text-gloster-white/60 font-rubik"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="flex justify-between">
                  {currentStep > 1 && (
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={handlePrevStep}
                      className="border-gloster-white/20 text-gloster-white hover:bg-gloster-white/10 font-rubik"
                    >
                      Anterior
                    </Button>
                  )}
                  
                  {currentStep < totalSteps ? (
                    <Button 
                      type="button"
                      onClick={handleNextStep}
                      className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-semibold font-rubik ml-auto"
                    >
                      Siguiente
                    </Button>
                  ) : (
                    <Button 
                      type="submit"
                      disabled={isLoading}
                      className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-semibold font-rubik ml-auto"
                    >
                      {isLoading ? 'Registrando...' : 'Crear Cuenta'}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;
