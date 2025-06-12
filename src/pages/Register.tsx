
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import CompanyInfoStep from '@/components/registration/CompanyInfoStep';
import ContactInfoStep from '@/components/registration/ContactInfoStep';
import ProjectInfoStep from '@/components/registration/ProjectInfoStep';
import ClientInfoStep from '@/components/registration/ClientInfoStep';
import PaymentInfoStep from '@/components/registration/PaymentInfoStep';
import { validateRut, validateEmail, validatePhone, validatePassword, validateNumber } from '@/components/registration/validationUtils';

const Register = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const navigate = useNavigate();
  const { toast } = useToast();

  // Company Information
  const [companyName, setCompanyName] = useState('');
  const [rut, setRut] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [customSpecialty, setCustomSpecialty] = useState('');
  const [experience, setExperience] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  // Contact Information
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Project Information
  const [projectName, setProjectName] = useState('');
  const [projectAddress, setProjectAddress] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [contractAmount, setContractAmount] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [duration, setDuration] = useState('');

  // Client Information
  const [clientCompany, setClientCompany] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // Payment Information
  const [firstPaymentDate, setFirstPaymentDate] = useState<Date | undefined>(undefined);
  const [paymentPeriod, setPaymentPeriod] = useState('');
  const [customPeriod, setCustomPeriod] = useState('');
  const [requiredDocuments, setRequiredDocuments] = useState<string[]>([]);
  const [otherDocuments, setOtherDocuments] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Required documents list
  const documentsList = [
    'Carátula EEPP (resumen)',
    'Avance del período',
    'Certificado de pago de cotizaciones',
    'Certificado F30',
    'Certificado F30-1',
    'Exámenes preocupacionales',
    'Finiquitos',
    'Factura'
  ];

  // Real-time validation functions
  const validateField = (fieldName: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (fieldName) {
      case 'rut':
        if (value && !validateRut(value)) {
          newErrors.rut = 'RUT inválido';
        } else {
          delete newErrors.rut;
        }
        break;
      case 'email':
      case 'clientEmail':
        if (value && !validateEmail(value)) {
          newErrors[fieldName] = 'Email inválido';
        } else {
          delete newErrors[fieldName];
        }
        break;
      case 'phone':
      case 'clientPhone':
        if (value && !validatePhone(value)) {
          newErrors[fieldName] = 'Formato debe ser +569xxxxxxxx';
        } else {
          delete newErrors[fieldName];
        }
        break;
      case 'password':
        if (value && !validatePassword(value)) {
          newErrors.password = 'Mínimo 8 caracteres alfanuméricos';
        } else {
          delete newErrors.password;
        }
        break;
      case 'confirmPassword':
        if (value && value !== password) {
          newErrors.confirmPassword = 'Las contraseñas no coinciden';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
      case 'contractAmount':
      case 'duration':
        if (value && !validateNumber(value)) {
          newErrors[fieldName] = 'Solo números permitidos';
        } else {
          delete newErrors[fieldName];
        }
        break;
    }
    
    setErrors(newErrors);
  };

  // Enhanced setter functions with validation
  const setRutWithValidation = (value: string) => {
    setRut(value);
    validateField('rut', value);
  };

  const setEmailWithValidation = (value: string) => {
    setEmail(value);
    validateField('email', value);
  };

  const setPhoneWithValidation = (value: string) => {
    setPhone(value);
    validateField('phone', value);
  };

  const setPasswordWithValidation = (value: string) => {
    setPassword(value);
    validateField('password', value);
    // Also revalidate confirm password if it exists
    if (confirmPassword) {
      validateField('confirmPassword', confirmPassword);
    }
  };

  const setConfirmPasswordWithValidation = (value: string) => {
    setConfirmPassword(value);
    validateField('confirmPassword', value);
  };

  const setClientEmailWithValidation = (value: string) => {
    setClientEmail(value);
    validateField('clientEmail', value);
  };

  const setClientPhoneWithValidation = (value: string) => {
    setClientPhone(value);
    validateField('clientPhone', value);
  };

  const setContractAmountWithValidation = (value: string) => {
    setContractAmount(value);
    validateField('contractAmount', value);
  };

  const setDurationWithValidation = (value: string) => {
    setDuration(value);
    validateField('duration', value);
  };

  const handleNext = () => {
    // Validation for step 1
    if (currentStep === 1) {
      if (!companyName || !rut || !specialties || !experience || !address || !city) {
        toast({
          title: "Campos requeridos",
          description: "Por favor completa todos los campos",
          variant: "destructive",
        });
        return;
      }
      if (errors.rut) {
        toast({
          title: "RUT inválido",
          description: "Por favor corrige el RUT antes de continuar",
          variant: "destructive",
        });
        return;
      }
    }

    // Validation for step 2
    if (currentStep === 2) {
      if (!contactName || !email || !phone || !password || !confirmPassword) {
        toast({
          title: "Campos requeridos",
          description: "Por favor completa todos los campos",
          variant: "destructive",
        });
        return;
      }
      if (errors.email || errors.phone || errors.password || errors.confirmPassword) {
        toast({
          title: "Errores en los campos",
          description: "Por favor corrige los errores antes de continuar",
          variant: "destructive",
        });
        return;
      }
    }

    // Validation for step 3
    if (currentStep === 3) {
      if (!projectName || !projectAddress || !projectDescription || !contractAmount || !startDate || !duration) {
        toast({
          title: "Campos requeridos",
          description: "Por favor completa todos los campos del proyecto",
          variant: "destructive",
        });
        return;
      }
      if (errors.contractAmount || errors.duration) {
        toast({
          title: "Errores en campos numéricos",
          description: "Por favor corrige los errores antes de continuar",
          variant: "destructive",
        });
        return;
      }
    }

    // Validation for step 4
    if (currentStep === 4) {
      if (!clientCompany || !clientContact || !clientEmail || !clientPhone) {
        toast({
          title: "Campos requeridos",
          description: "Por favor completa todos los campos del mandante",
          variant: "destructive",
        });
        return;
      }
      if (errors.clientEmail || errors.clientPhone) {
        toast({
          title: "Errores en los campos",
          description: "Por favor corrige los errores antes de continuar",
          variant: "destructive",
        });
        return;
      }
    }

    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!firstPaymentDate || !paymentPeriod) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos de estados de pago",
        variant: "destructive",
      });
      return;
    }

    const finalSpecialties = specialties === 'otra' ? customSpecialty : specialties;
    const finalPaymentPeriod = paymentPeriod === 'otro' ? customPeriod : paymentPeriod;
    const finalDocuments = otherDocuments ? [...requiredDocuments, otherDocuments] : requiredDocuments;

    const formData = {
      companyName,
      rut,
      specialties: finalSpecialties,
      experience,
      address,
      city,
      contactName,
      email,
      phone,
      password,
      projectName,
      projectAddress,
      projectDescription,
      contractAmount,
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : '',
      duration,
      clientCompany,
      clientContact,
      clientEmail,
      clientPhone,
      firstPaymentDate: firstPaymentDate ? format(firstPaymentDate, 'yyyy-MM-dd') : '',
      paymentPeriod: finalPaymentPeriod,
      requiredDocuments: finalDocuments
    };

    console.log('Sending form data:', formData);

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
          description: "Tu cuenta ha sido creada correctamente",
        });
        
        // Navigate to dashboard after a short delay
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        throw new Error('Network response was not ok');
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Error en el registro",
        description: "Por favor intenta nuevamente",
        variant: "destructive",
      });
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Información de la Empresa';
      case 2: return 'Información de Contacto';
      case 3: return 'Información del Proyecto';
      case 4: return 'Información del Mandante';
      case 5: return 'Estados de Pago';
      default: return '';
    }
  };

  const renderProgressBar = () => {
    return (
      <div className="w-full mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Paso {currentStep} de {totalSteps}</span>
          <span className="text-sm text-gray-600">{Math.round((currentStep / totalSteps) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gloster-yellow h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CompanyInfoStep
            companyName={companyName}
            setCompanyName={setCompanyName}
            rut={rut}
            setRut={setRutWithValidation}
            specialties={specialties}
            setSpecialties={setSpecialties}
            customSpecialty={customSpecialty}
            setCustomSpecialty={setCustomSpecialty}
            experience={experience}
            setExperience={setExperience}
            address={address}
            setAddress={setAddress}
            city={city}
            setCity={setCity}
            errors={errors}
          />
        );

      case 2:
        return (
          <ContactInfoStep
            contactName={contactName}
            setContactName={setContactName}
            email={email}
            setEmail={setEmailWithValidation}
            phone={phone}
            setPhone={setPhoneWithValidation}
            password={password}
            setPassword={setPasswordWithValidation}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPasswordWithValidation}
            errors={errors}
          />
        );

      case 3:
        return (
          <ProjectInfoStep
            projectName={projectName}
            setProjectName={setProjectName}
            projectAddress={projectAddress}
            setProjectAddress={setProjectAddress}
            projectDescription={projectDescription}
            setProjectDescription={setProjectDescription}
            contractAmount={contractAmount}
            setContractAmount={setContractAmountWithValidation}
            startDate={startDate}
            setStartDate={setStartDate}
            duration={duration}
            setDuration={setDurationWithValidation}
            errors={errors}
          />
        );

      case 4:
        return (
          <ClientInfoStep
            clientCompany={clientCompany}
            setClientCompany={setClientCompany}
            clientContact={clientContact}
            setClientContact={setClientContact}
            clientEmail={clientEmail}
            setClientEmail={setClientEmailWithValidation}
            clientPhone={clientPhone}
            setClientPhone={setClientPhoneWithValidation}
            errors={errors}
          />
        );

      case 5:
        return (
          <PaymentInfoStep
            firstPaymentDate={firstPaymentDate}
            setFirstPaymentDate={setFirstPaymentDate}
            paymentPeriod={paymentPeriod}
            setPaymentPeriod={setPaymentPeriod}
            customPeriod={customPeriod}
            setCustomPeriod={setCustomPeriod}
            requiredDocuments={requiredDocuments}
            setRequiredDocuments={setRequiredDocuments}
            otherDocuments={otherDocuments}
            setOtherDocuments={setOtherDocuments}
            documentsList={documentsList}
          />
        );

      default:
        return null;
    }
  };

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
        <div className="max-w-2xl mx-auto">
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl text-center font-rubik">{getStepTitle()}</CardTitle>
              <CardDescription className="text-center font-rubik">
                Completa la información para crear tu cuenta
                <br />
                <span className="text-sm text-gloster-gray">Tiempo estimado: 8-12 minutos</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderProgressBar()}
              {renderStep()}
              
              <div className="flex justify-between pt-6">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    className="font-rubik"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Anterior
                  </Button>
                )}
                
                <div className="ml-auto">
                  {currentStep < totalSteps ? (
                    <Button
                      onClick={handleNext}
                      className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
                    >
                      Continuar
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
                    >
                      Crear Cuenta
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;
