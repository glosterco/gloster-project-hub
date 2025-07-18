
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CompanyInfoStep from '@/components/registration/CompanyInfoStep';
import ContactInfoStep from '@/components/registration/ContactInfoStep';
import ProjectInfoStep from '@/components/registration/ProjectInfoStep';
import ClientInfoStep from '@/components/registration/ClientInfoStep';
import PaymentInfoStep from '@/components/registration/PaymentInfoStep';
import { useRegistrationForm } from '@/hooks/useRegistrationForm';
import { useFormValidation } from '@/hooks/useFormValidation';
import { useRegistrationSteps } from '@/hooks/useRegistrationSteps';
import { RegistrationProgressBar } from '@/components/registration/RegistrationProgressBar';
import { RegistrationBreakPage } from '@/components/registration/RegistrationBreakPage';

const Register = () => {
  const navigate = useNavigate();
  const formData = useRegistrationForm();
  const { errors, validateField } = useFormValidation();
  const { 
    currentStep, 
    totalSteps, 
    handleNext, 
    handlePrevious, 
    handleSubmit, 
    contratistaLoading, 
    mandanteLoading 
  } = useRegistrationSteps({ formData, errors });

  // Required documents list
  const documentsList = [
    'Carátula EEPP',
    'Avance del período', // Always required - will be auto-added if not selected
    'Certificado de pago de cotizaciones',
    'Certificado F30',
    'Certificado F30-1',
    'Exámenes preocupacionales',
    'Finiquitos',
    'Factura'
  ];

  // Enhanced setter functions with validation
  const setRutWithValidation = (value: string) => {
    formData.setRut(value);
    validateField('rut', value);
  };

  const setEmailWithValidation = (value: string) => {
    formData.setEmail(value);
    validateField('email', value);
  };

  const setPhoneWithValidation = (value: string) => {
    formData.setPhone(value);
    validateField('phone', value);
  };

  const setPasswordWithValidation = (value: string) => {
    formData.setPassword(value);
    validateField('password', value);
    if (formData.confirmPassword) {
      validateField('confirmPassword', formData.confirmPassword);
    }
  };

  const setConfirmPasswordWithValidation = (value: string) => {
    formData.setConfirmPassword(value);
    validateField('confirmPassword', value, formData.password);
  };

  const setClientEmailWithValidation = (value: string) => {
    formData.setClientEmail(value);
    validateField('clientEmail', value);
  };

  const setClientPhoneWithValidation = (value: string) => {
    formData.setClientPhone(value);
    validateField('clientPhone', value);
  };

  const setContractAmountWithValidation = (value: string) => {
    formData.setContractAmount(value);
    validateField('contractAmount', value);
  };

  const setDurationWithValidation = (value: string) => {
    formData.setDuration(value);
    validateField('duration', value);
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return 'Información de la Empresa';
      case 2: return 'Información de Contacto';
      case 3: return 'Información Recopilada';
      case 4: return 'Información del Proyecto';
      case 5: return 'Información del Mandante';
      case 6: return 'Estados de Pago';
      default: return '';
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <CompanyInfoStep
            companyName={formData.companyName}
            setCompanyName={formData.setCompanyName}
            rut={formData.rut}
            setRut={setRutWithValidation}
            specialties={formData.specialties}
            setSpecialties={formData.setSpecialties}
            customSpecialty={formData.customSpecialty}
            setCustomSpecialty={formData.setCustomSpecialty}
            experience={formData.experience}
            setExperience={formData.setExperience}
            address={formData.address}
            setAddress={formData.setAddress}
            city={formData.city}
            setCity={formData.setCity}
            errors={errors}
          />
        );

      case 2:
        return (
          <ContactInfoStep
            contactName={formData.contactName}
            setContactName={formData.setContactName}
            email={formData.email}
            setEmail={setEmailWithValidation}
            phone={formData.phone}
            setPhone={setPhoneWithValidation}
            password={formData.password}
            setPassword={setPasswordWithValidation}
            confirmPassword={formData.confirmPassword}
            setConfirmPassword={setConfirmPasswordWithValidation}
            errors={errors}
          />
        );

      case 3:
        return <RegistrationBreakPage />;

      case 4:
        return (
          <ProjectInfoStep
            projectName={formData.projectName}
            setProjectName={formData.setProjectName}
            projectAddress={formData.projectAddress}
            setProjectAddress={formData.setProjectAddress}
            projectDescription={formData.projectDescription}
            setProjectDescription={formData.setProjectDescription}
            contractAmount={formData.contractAmount}
            setContractAmount={setContractAmountWithValidation}
            contractCurrency={formData.contractCurrency}
            setContractCurrency={formData.setContractCurrency}
            startDate={formData.startDate}
            setStartDate={formData.setStartDate}
            duration={formData.duration}
            setDuration={setDurationWithValidation}
            errors={errors}
          />
        );

      case 5:
        return (
          <ClientInfoStep
            clientCompany={formData.clientCompany}
            setClientCompany={formData.setClientCompany}
            clientContact={formData.clientContact}
            setClientContact={formData.setClientContact}
            clientEmail={formData.clientEmail}
            setClientEmail={setClientEmailWithValidation}
            clientPhone={formData.clientPhone}
            setClientPhone={setClientPhoneWithValidation}
            errors={errors}
          />
        );

      case 6:
        return (
          <PaymentInfoStep
            firstPaymentDate={formData.firstPaymentDate}
            setFirstPaymentDate={formData.setFirstPaymentDate}
            paymentPeriod={formData.paymentPeriod}
            setPaymentPeriod={formData.setPaymentPeriod}
            customPeriod={formData.customPeriod}
            setCustomPeriod={formData.setCustomPeriod}
            requiredDocuments={formData.requiredDocuments}
            setRequiredDocuments={formData.setRequiredDocuments}
            otherDocuments={formData.otherDocuments}
            setOtherDocuments={formData.setOtherDocuments}
            documentsList={documentsList}
          />
        );

      default:
        return null;
    }
  };

  const onSubmit = async () => {
    const success = await handleSubmit();
    if (success) {
      setTimeout(() => {
        navigate('/');
      }, 1500);
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
                {currentStep === 3 ? (
                  "Información del usuario completada y guardada en la base de datos"
                ) : (
                  <>
                    Completa la información para crear tu cuenta
                    <br />
                    <span className="text-sm text-gloster-gray">Tiempo estimado: menos de 10 minutos</span>
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RegistrationProgressBar currentStep={currentStep} totalSteps={totalSteps} />
              {renderStep()}
              
              <div className="flex justify-between pt-6">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    className="font-rubik"
                    disabled={contratistaLoading || mandanteLoading}
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
                      disabled={contratistaLoading || mandanteLoading}
                    >
                      {(contratistaLoading || mandanteLoading) ? 'Guardando...' : 'Continuar'}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      onClick={onSubmit}
                      className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
                      disabled={contratistaLoading || mandanteLoading}
                    >
                      {(contratistaLoading || mandanteLoading) ? 'Guardando...' : 'Crear Cuenta'}
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
