import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, ArrowRight, CheckCircle, Building, User, Mail, Phone, MapPin, FileText, Calendar, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Register = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    // Información de la empresa (Paso 1)
    companyName: '',
    companyRut: '',
    specialties: '',
    yearsExperience: '',
    address: '',
    city: '',
    
    // Información del contacto (Paso 2)
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactPosition: '',
    password: '',
    confirmPassword: '',
    
    // Información del proyecto (Paso 4)
    projectName: '',
    projectAddress: '',
    projectDescription: '',
    contractAmount: '',
    startDate: '',
    duration: '',
    
    // Información del mandante (Paso 5)
    clientCompany: '',
    clientContactName: '',
    clientEmail: '',
    clientPhone: '',
    
    // Estados de pago (Paso 6)
    firstPaymentDate: '',
    paymentPeriod: '',
    customPaymentPeriod: '',
    requiredDocuments: [],
    otherDocuments: ''
  });

  const [showCustomSpecialty, setShowCustomSpecialty] = useState(false);
  const [customSpecialtyText, setCustomSpecialtyText] = useState('');
  const [showCustomPaymentPeriod, setShowCustomPaymentPeriod] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSpecialtyChange = (value: string) => {
    if (value === 'otro') {
      setShowCustomSpecialty(true);
      setCustomSpecialtyText('');
    } else {
      setShowCustomSpecialty(false);
      setCustomSpecialtyText('');
      handleInputChange('specialties', value);
    }
  };

  const handleCustomSpecialtyChange = (value: string) => {
    setCustomSpecialtyText(value);
    handleInputChange('specialties', value);
  };

  const handlePaymentPeriodChange = (value: string) => {
    if (value === 'otro') {
      setShowCustomPaymentPeriod(true);
      handleInputChange('customPaymentPeriod', '');
      handleInputChange('paymentPeriod', '');
    } else {
      setShowCustomPaymentPeriod(false);
      handleInputChange('paymentPeriod', value);
      handleInputChange('customPaymentPeriod', '');
    }
  };

  const handleCustomPaymentPeriodChange = (value: string) => {
    handleInputChange('customPaymentPeriod', value);
    handleInputChange('paymentPeriod', value);
  };

  const handleDocumentChange = (document: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      requiredDocuments: checked 
        ? [...prev.requiredDocuments, document]
        : prev.requiredDocuments.filter(doc => doc !== document)
    }));
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+56\s?9\s?\d{8}$/;
    return phoneRegex.test(phone);
  };

  const validateNumber = (value: string) => {
    return /^\d+$/.test(value);
  };

  const handleNextStep = () => {
    if (currentStep === 2) {
      setCurrentStep(4); // Skip step 3 (transition)
    } else if (currentStep < 6) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 4) {
      setCurrentStep(2); // Skip step 3 when going back
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      const dataToSend = {
        ...formData,
        paymentPeriod: formData.customPaymentPeriod || formData.paymentPeriod
      };

      const response = await fetch('https://hook.us2.make.com/bvnog1pu3vyvisfhw96hfsgtf29bib7l', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        toast({
          title: "¡Cuenta creada exitosamente!",
          description: "El equipo de Gloster se contactará contigo para ingresar tu primer proyecto.",
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
        return formData.companyName && formData.companyRut && formData.specialties && 
               formData.yearsExperience && formData.address && formData.city;
      case 2:
        return formData.contactName && formData.contactEmail && validateEmail(formData.contactEmail) && 
               formData.contactPhone && validatePhone(formData.contactPhone) && formData.contactPosition && 
               formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;
      case 4:
        return formData.projectName && formData.projectAddress && formData.projectDescription && 
               formData.contractAmount && validateNumber(formData.contractAmount) && 
               formData.startDate && formData.duration && validateNumber(formData.duration);
      case 5:
        return formData.clientCompany && formData.clientContactName && formData.clientEmail && 
               validateEmail(formData.clientEmail) && formData.clientPhone && validatePhone(formData.clientPhone);
      case 6:
        return formData.firstPaymentDate && 
               (formData.paymentPeriod || formData.customPaymentPeriod) && 
               (formData.requiredDocuments.length > 0 || formData.otherDocuments);
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

            <Select onValueChange={handleSpecialtyChange}>
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

            {showCustomSpecialty && (
              <Input
                placeholder="Especifica tu especialidad"
                value={customSpecialtyText}
                onChange={(e) => handleCustomSpecialtyChange(e.target.value)}
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

            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Dirección"
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
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <User className="h-5 w-5 text-gloster-yellow" />
              <h3 className="text-lg font-semibold text-slate-800 font-rubik">Información de Contacto</h3>
            </div>
            <p className="text-sm text-slate-600 font-rubik mb-4">
              Complete con la información de la persona que va a manejar la cuenta ya que tendrá que iniciar sesión con ese correo
            </p>
            
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
            
            {formData.contactEmail && !validateEmail(formData.contactEmail) && (
              <p className="text-red-500 text-sm font-rubik">Por favor ingresa un email válido</p>
            )}
            
            <Input
              placeholder="Teléfono de contacto: +56 9 xxxxxxxx"
              value={formData.contactPhone}
              onChange={(e) => handleInputChange('contactPhone', e.target.value)}
              className="font-rubik"
            />
            
            {formData.contactPhone && !validatePhone(formData.contactPhone) && (
              <p className="text-red-500 text-sm font-rubik">Por favor ingresa un teléfono válido (+56 9 xxxxxxxx)</p>
            )}
            
            <Input
              placeholder="Cargo en la empresa"
              value={formData.contactPosition}
              onChange={(e) => handleInputChange('contactPosition', e.target.value)}
              className="font-rubik"
            />

            <div className="space-y-3 mt-6">
              <h4 className="text-md font-semibold text-slate-800 font-rubik">Establecer contraseña del usuario</h4>
              
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
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <CheckCircle className="h-6 w-6 text-gloster-yellow" />
              <h3 className="text-xl font-semibold text-slate-800 font-rubik">¡Perfecto! Tu información está lista</h3>
            </div>
            
            <p className="text-slate-600 font-rubik leading-relaxed">
              Ahora necesitamos que nos proporciones la información de tu primer proyecto para crear tu espacio de trabajo personalizado.
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800 font-rubik text-sm">
                <strong>Importante:</strong> Es necesario completar la información del primer proyecto para finalizar la creación de tu cuenta.
              </p>
            </div>
            
            <Button
              onClick={handleNextStep}
              className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik px-8 py-3"
            >
              Ingresar Proyecto
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="h-5 w-5 text-gloster-yellow" />
              <h3 className="text-lg font-semibold text-slate-800 font-rubik">Información del Proyecto</h3>
            </div>
            
            <Input
              placeholder="Nombre del proyecto"
              value={formData.projectName}
              onChange={(e) => handleInputChange('projectName', e.target.value)}
              className="font-rubik"
            />
            
            <Input
              placeholder="Dirección del proyecto"
              value={formData.projectAddress}
              onChange={(e) => handleInputChange('projectAddress', e.target.value)}
              className="font-rubik"
            />
            
            <Input
              placeholder="Breve descripción del proyecto"
              value={formData.projectDescription}
              onChange={(e) => handleInputChange('projectDescription', e.target.value)}
              className="font-rubik"
            />
            
            <Input
              placeholder="Monto del contrato (solo números)"
              value={formData.contractAmount}
              onChange={(e) => handleInputChange('contractAmount', e.target.value)}
              className="font-rubik"
            />
            
            {formData.contractAmount && !validateNumber(formData.contractAmount) && (
              <p className="text-red-500 text-sm font-rubik">Por favor ingresa solo números</p>
            )}

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-700 font-rubik">Fecha de inicio contractual</h4>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="font-rubik"
              />
            </div>
            
            <Input
              placeholder="Duración del proyecto (número de meses)"
              value={formData.duration}
              onChange={(e) => handleInputChange('duration', e.target.value)}
              className="font-rubik"
            />
            
            {formData.duration && !validateNumber(formData.duration) && (
              <p className="text-red-500 text-sm font-rubik">Por favor ingresa solo números (meses)</p>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Building className="h-5 w-5 text-gloster-yellow" />
              <h3 className="text-lg font-semibold text-slate-800 font-rubik">Información del Mandante</h3>
            </div>
            
            <Input
              placeholder="Empresa mandante"
              value={formData.clientCompany}
              onChange={(e) => handleInputChange('clientCompany', e.target.value)}
              className="font-rubik"
            />
            
            <div className="space-y-2">
              <Input
                placeholder="Nombre de contacto"
                value={formData.clientContactName}
                onChange={(e) => handleInputChange('clientContactName', e.target.value)}
                className="font-rubik"
              />
              <p className="text-sm text-slate-500 font-rubik">
                ¿A quién le enviaremos toda la documentación?
              </p>
            </div>
            
            <Input
              type="email"
              placeholder="Email de contacto"
              value={formData.clientEmail}
              onChange={(e) => handleInputChange('clientEmail', e.target.value)}
              className="font-rubik"
            />
            
            {formData.clientEmail && !validateEmail(formData.clientEmail) && (
              <p className="text-red-500 text-sm font-rubik">Por favor ingresa un email válido</p>
            )}
            
            <Input
              placeholder="Teléfono de contacto: +56 9 xxxxxxxx"
              value={formData.clientPhone}
              onChange={(e) => handleInputChange('clientPhone', e.target.value)}
              className="font-rubik"
            />
            
            {formData.clientPhone && !validatePhone(formData.clientPhone) && (
              <p className="text-red-500 text-sm font-rubik">Por favor ingresa un teléfono válido (+56 9 xxxxxxxx)</p>
            )}
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="h-5 w-5 text-gloster-yellow" />
              <h3 className="text-lg font-semibold text-slate-800 font-rubik">Estados de Pago</h3>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-700 font-rubik">Fecha de presentación del primer estado de pago</h4>
              <Input
                type="date"
                value={formData.firstPaymentDate}
                onChange={(e) => handleInputChange('firstPaymentDate', e.target.value)}
                className="font-rubik"
              />
            </div>
            
            <div className="space-y-2">
              <Select onValueChange={handlePaymentPeriodChange}>
                <SelectTrigger className="font-rubik">
                  <SelectValue placeholder="Periodo de caducidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quincenal">Quincenal</SelectItem>
                  <SelectItem value="mensual">Mensual</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-slate-500 font-rubik">
                ¿Cada cuánto se deben presentar los documentos?
              </p>
              
              {showCustomPaymentPeriod && (
                <Input
                  placeholder="Especifica el período"
                  value={formData.customPaymentPeriod}
                  onChange={(e) => handleCustomPaymentPeriodChange(e.target.value)}
                  className="font-rubik"
                />
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700 font-rubik">
                Selecciona la documentación obligatoria para los estados de pago:
              </p>
              
              {[
                'Carátula EEPP (resumen)',
                'Avance del periodo',
                'Certificado de pago de cotizaciones',
                'Certificado F30',
                'Certificado F30-1',
                'Exámenes preocupacionales',
                'Finiquitos',
                'Factura'
              ].map((document) => (
                <div key={document} className="flex items-center space-x-2">
                  <Checkbox
                    id={document}
                    checked={formData.requiredDocuments.includes(document)}
                    onCheckedChange={(checked) => handleDocumentChange(document, checked as boolean)}
                  />
                  <label
                    htmlFor={document}
                    className="text-sm font-rubik text-slate-700 cursor-pointer"
                  >
                    {document}
                  </label>
                </div>
              ))}
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 font-rubik">Otros documentos:</label>
                <Input
                  placeholder="Especifica otros documentos obligatorios"
                  value={formData.otherDocuments}
                  onChange={(e) => handleInputChange('otherDocuments', e.target.value)}
                  className="font-rubik"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getProgressSteps = () => {
    if (currentStep === 3) {
      return (
        <div className="mb-8 flex justify-center">
          <div className="w-1 h-12 bg-gloster-yellow rounded"></div>
        </div>
      );
    }

    const totalSteps = 5;
    const actualStep = currentStep > 3 ? currentStep - 1 : currentStep;

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div key={step} className={`flex items-center ${step < totalSteps ? 'flex-1' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-rubik ${
                step <= actualStep ? 'bg-gloster-yellow text-black' : 'bg-gloster-gray/20 text-gloster-gray'
              }`}>
                {step}
              </div>
              {step < totalSteps && (
                <div className={`flex-1 h-1 mx-2 ${
                  step < actualStep ? 'bg-gloster-yellow' : 'bg-gloster-gray/20'
                }`}></div>
              )}
            </div>
          ))}
        </div>
        <p className="text-center text-gloster-gray text-sm font-rubik">
          Paso {actualStep} de {totalSteps}
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gloster-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
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
          {getProgressSteps()}

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-rubik text-slate-800">
                {currentStep <= 2 ? 'Únete a Gloster' : currentStep === 3 ? 'Información Lista' : 'Información del Proyecto'}
              </CardTitle>
              <CardDescription className="font-rubik">
                {currentStep <= 2 
                  ? 'Completa tu perfil para comenzar a gestionar tus proyectos'
                  : currentStep === 3
                  ? 'Prepárate para ingresar tu primer proyecto'
                  : 'Completa los datos de tu primer proyecto para crear tu espacio de trabajo'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderStep()}
              
              {currentStep !== 3 && (
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
                  
                  {currentStep < 6 ? (
                    <Button
                      onClick={handleNextStep}
                      disabled={!isStepValid()}
                      className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik font-semibold"
                    >
                      Siguiente
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={!isStepValid() || isLoading}
                      className="bg-slate-800 hover:bg-slate-700 text-white font-rubik font-semibold border-2 border-slate-800 hover:text-white focus:text-white active:text-white"
                      style={{ color: 'black' }}
                    >
                      {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;
