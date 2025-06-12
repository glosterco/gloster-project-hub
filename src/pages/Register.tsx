
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, ArrowRight, Check, Calendar as CalendarIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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

  const validateRut = (rut: string) => {
    // Remove dots and dashes
    const cleanRut = rut.replace(/[.-]/g, '');
    
    // Check format: should be 8-9 digits + 1 verification digit (number or K)
    if (!/^\d{8,9}[0-9Kk]$/.test(cleanRut)) {
      return false;
    }

    // Extract body and verification digit
    const body = cleanRut.slice(0, -1);
    const verificationDigit = cleanRut.slice(-1).toUpperCase();

    // Calculate verification digit
    let sum = 0;
    let multiplier = 2;

    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    const remainder = sum % 11;
    let expectedDigit;

    if (remainder === 0) {
      expectedDigit = '0';
    } else if (remainder === 1) {
      expectedDigit = 'K';
    } else {
      expectedDigit = (11 - remainder).toString();
    }

    return verificationDigit === expectedDigit;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    const phoneRegex = /^\+569\d{8}$/;
    return phoneRegex.test(phone);
  };

  const validatePassword = (password: string) => {
    return password.length >= 8 && /^[a-zA-Z0-9]+$/.test(password);
  };

  const validateNumber = (value: string) => {
    return /^\d+$/.test(value);
  };

  const handleDocumentChange = (document: string, checked: boolean) => {
    if (checked) {
      setRequiredDocuments([...requiredDocuments, document]);
    } else {
      setRequiredDocuments(requiredDocuments.filter(doc => doc !== document));
    }
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
      if (!validateRut(rut)) {
        toast({
          title: "RUT inválido",
          description: "Por favor ingresa un RUT válido",
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
      if (!validateEmail(email)) {
        toast({
          title: "Email inválido",
          description: "Por favor ingresa un email válido",
          variant: "destructive",
        });
        return;
      }
      if (!validatePhone(phone)) {
        toast({
          title: "Teléfono inválido",
          description: "El formato debe ser +569xxxxxxxx",
          variant: "destructive",
        });
        return;
      }
      if (!validatePassword(password)) {
        toast({
          title: "Contraseña inválida",
          description: "La contraseña debe tener al menos 8 caracteres alfanuméricos",
          variant: "destructive",
        });
        return;
      }
      if (password !== confirmPassword) {
        toast({
          title: "Error en contraseñas",
          description: "Las contraseñas no coinciden",
          variant: "destructive",
        });
        return;
      }
    }

    // Validation for step 3 (project info)
    if (currentStep === 3) {
      if (!projectName || !projectAddress || !projectDescription || !contractAmount || !startDate || !duration) {
        toast({
          title: "Campos requeridos",
          description: "Por favor completa todos los campos del proyecto",
          variant: "destructive",
        });
        return;
      }
      if (!validateNumber(contractAmount) || !validateNumber(duration)) {
        toast({
          title: "Error en campos numéricos",
          description: "El monto del contrato y duración deben ser solo números",
          variant: "destructive",
        });
        return;
      }
    }

    // Validation for step 4 (client info)
    if (currentStep === 4) {
      if (!clientCompany || !clientContact || !clientEmail || !clientPhone) {
        toast({
          title: "Campos requeridos",
          description: "Por favor completa todos los campos del mandante",
          variant: "destructive",
        });
        return;
      }
      if (!validateEmail(clientEmail)) {
        toast({
          title: "Email inválido",
          description: "Por favor ingresa un email válido",
          variant: "destructive",
        });
        return;
      }
      if (!validatePhone(clientPhone)) {
        toast({
          title: "Teléfono inválido",
          description: "El formato debe ser +569xxxxxxxx",
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
      const response = await fetch('https://hook.us2.make.com/your-webhook-url', {
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
        navigate('/dashboard');
      } else {
        throw new Error('Error en el registro');
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nombre de la Empresa</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ingresa el nombre de tu empresa"
                  className="font-rubik"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rut">RUT de la Empresa</Label>
                <Input
                  id="rut"
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  placeholder="12.345.678-9"
                  className="font-rubik"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="specialties">Especialidad Principal</Label>
                <Select value={specialties} onValueChange={setSpecialties}>
                  <SelectTrigger className="font-rubik">
                    <SelectValue placeholder="Selecciona tu especialidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="construccion-general">Construcción General</SelectItem>
                    <SelectItem value="obras-viales">Obras Viales</SelectItem>
                    <SelectItem value="instalaciones-electricas">Instalaciones Eléctricas</SelectItem>
                    <SelectItem value="instalaciones-sanitarias">Instalaciones Sanitarias</SelectItem>
                    <SelectItem value="climatizacion">Climatización</SelectItem>
                    <SelectItem value="pinturas">Pinturas</SelectItem>
                    <SelectItem value="otra">Otra</SelectItem>
                  </SelectContent>
                </Select>
                {specialties === 'otra' && (
                  <Input
                    value={customSpecialty}
                    onChange={(e) => setCustomSpecialty(e.target.value)}
                    placeholder="Especifica tu especialidad"
                    className="font-rubik mt-2"
                  />
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="experience">Años de Experiencia</Label>
                <Select value={experience} onValueChange={setExperience}>
                  <SelectTrigger className="font-rubik">
                    <SelectValue placeholder="Selecciona años de experiencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2-5">2-5 años</SelectItem>
                    <SelectItem value="5-10">5-10 años</SelectItem>
                    <SelectItem value="15+">+15 años</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Dirección de la empresa"
                  className="font-rubik"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ciudad"
                  className="font-rubik"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <p className="text-sm text-gray-600 italic">
              Completa con la información de la persona que va a manejar la cuenta ya que tendrá que iniciar sesión con ese correo
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Nombre del Contacto</Label>
                <Input
                  id="contactName"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="Nombre completo"
                  className="font-rubik"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@empresa.com"
                  className="font-rubik"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+569xxxxxxxx"
                className="font-rubik"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Al menos 8 caracteres alfanuméricos"
                  className="font-rubik"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirma tu contraseña"
                  className="font-rubik"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="projectName">Nombre del Proyecto</Label>
              <Input
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Nombre del proyecto"
                className="font-rubik"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectAddress">Dirección del Proyecto</Label>
              <Input
                id="projectAddress"
                value={projectAddress}
                onChange={(e) => setProjectAddress(e.target.value)}
                placeholder="Dirección donde se ejecuta el proyecto"
                className="font-rubik"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectDescription">Breve Descripción</Label>
              <Textarea
                id="projectDescription"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                placeholder="Describe brevemente el proyecto"
                className="font-rubik"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contractAmount">Monto del Contrato</Label>
                <Input
                  id="contractAmount"
                  value={contractAmount}
                  onChange={(e) => setContractAmount(e.target.value)}
                  placeholder="Monto en UF"
                  className="font-rubik"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duración (meses)</Label>
                <Input
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Duración en meses"
                  className="font-rubik"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de inicio contractual</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal font-rubik",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy") : <span>Selecciona fecha de inicio</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="p-3"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="clientCompany">Empresa Mandante</Label>
              <Input
                id="clientCompany"
                value={clientCompany}
                onChange={(e) => setClientCompany(e.target.value)}
                placeholder="Nombre de la empresa mandante"
                className="font-rubik"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientContact">Nombre de Contacto</Label>
              <Input
                id="clientContact"
                value={clientContact}
                onChange={(e) => setClientContact(e.target.value)}
                placeholder="Nombre del contacto"
                className="font-rubik"
              />
              <p className="text-xs text-gray-500 italic">
                ¿A quién le enviaremos toda la documentación?
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientEmail">Email de Contacto</Label>
                <Input
                  id="clientEmail"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="correo@mandante.com"
                  className="font-rubik"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientPhone">Teléfono de Contacto</Label>
                <Input
                  id="clientPhone"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="+569xxxxxxxx"
                  className="font-rubik"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="firstPaymentDate">Fecha de presentación del primer estado de pago</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal font-rubik",
                      !firstPaymentDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {firstPaymentDate ? format(firstPaymentDate, "dd/MM/yyyy") : <span>Selecciona fecha del primer estado de pago</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={firstPaymentDate}
                    onSelect={setFirstPaymentDate}
                    initialFocus
                    className="p-3"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentPeriod">Período de Caducidad</Label>
              <Select value={paymentPeriod} onValueChange={setPaymentPeriod}>
                <SelectTrigger className="font-rubik">
                  <SelectValue placeholder="Selecciona la frecuencia" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quincenal">Quincenal</SelectItem>
                  <SelectItem value="mensual">Mensual</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 italic">
                ¿Cada cuánto se deben presentar los documentos?
              </p>
              {paymentPeriod === 'otro' && (
                <Input
                  value={customPeriod}
                  onChange={(e) => setCustomPeriod(e.target.value)}
                  placeholder="Especifica el período"
                  className="font-rubik mt-2"
                />
              )}
            </div>

            <div className="space-y-4">
              <Label>Documentación Requerida</Label>
              <div className="space-y-3">
                {documentsList.map((doc) => (
                  <div key={doc} className="flex items-center space-x-2">
                    <Checkbox
                      id={doc}
                      checked={requiredDocuments.includes(doc)}
                      onCheckedChange={(checked) => handleDocumentChange(doc, checked as boolean)}
                    />
                    <Label htmlFor={doc} className="text-sm font-rubik">{doc}</Label>
                  </div>
                ))}
                <div className="space-y-2">
                  <Label htmlFor="otherDocuments">Otros</Label>
                  <Input
                    id="otherDocuments"
                    value={otherDocuments}
                    onChange={(e) => setOtherDocuments(e.target.value)}
                    placeholder="Especifica otros documentos"
                    className="font-rubik"
                  />
                </div>
              </div>
            </div>
          </div>
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
