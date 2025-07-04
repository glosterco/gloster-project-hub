
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegistrationSteps } from '@/hooks/useRegistrationSteps';
import { useRegistrationData } from '@/hooks/registration/useRegistrationData';
import { useRegistrationProcess } from '@/hooks/registration/useRegistrationProcess';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import CompanyInfoStep from '@/components/registration/CompanyInfoStep';
import ContactInfoStep from '@/components/registration/ContactInfoStep';
import ClientInfoStep from '@/components/registration/ClientInfoStep';
import ProjectInfoStep from '@/components/registration/ProjectInfoStep';
import PaymentInfoStep from '@/components/registration/PaymentInfoStep';

const Register = () => {
  const navigate = useNavigate();
  const { currentStep, totalSteps, handleNext, handlePrevious, handleSubmit } = useRegistrationSteps();
  const { prepareContratistaData, prepareMandanteData, prepareProyectoData } = useRegistrationData();
  const { processRegistration } = useRegistrationProcess();
  const { toast } = useToast();

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <CompanyInfoStep 
          companyName=""
          setCompanyName={() => {}}
          rut=""
          setRut={() => {}}
          specialization=""
          setSpecialization={() => {}}
          experience=""
          setExperience={() => {}}
          address=""
          setAddress={() => {}}
          city=""
          setCity={() => {}}
          contactName=""
          setContactName={() => {}}
          contactEmail=""
          setContactEmail={() => {}}
          contactPhone=""
          setContactPhone={() => {}}
          username=""
          setUsername={() => {}}
          password=""
          setPassword={() => {}}
        />;
      case 2:
        return <ContactInfoStep 
          contactName=""
          setContactName={() => {}}
          email=""
          setEmail={() => {}}
          phone=""
          setPhone={() => {}}
          address=""
          setAddress={() => {}}
          city=""
          setCity={() => {}}
          specialization=""
          setSpecialization={() => {}}
          experience=""
          setExperience={() => {}}
        />;
      case 3:
        return <ClientInfoStep 
          clientCompany=""
          setClientCompany={() => {}}
          clientContact=""
          setClientContact={() => {}}
          clientEmail=""
          setClientEmail={() => {}}
          clientPhone=""
          setClientPhone={() => {}}
          clientAddress=""
          setClientAddress={() => {}}
        />;
      case 4:
        return <ProjectInfoStep 
          projectName=""
          setProjectName={() => {}}
          projectAddress=""
          setProjectAddress={() => {}}
          projectDescription=""
          setProjectDescription={() => {}}
          budget=""
          setBudget={() => {}}
          currency=""
          setCurrency={() => {}}
          duration=""
          setDuration={() => {}}
          startDate=""
          setStartDate={() => {}}
          requirements={[]}
          setRequirements={() => {}}
          expiryRate=""
          setExpiryRate={() => {}}
        />;
      case 5:
        return <PaymentInfoStep 
          firstPaymentDate=""
          setFirstPaymentDate={() => {}}
          paymentPeriod=""
          setPaymentPeriod={() => {}}
          totalPayments=""
          setTotalPayments={() => {}}
          paymentAmount=""
          setPaymentAmount={() => {}}
          currency=""
          setCurrency={() => {}}
          expiryRate=""
          setExpiryRate={() => {}}
          requirements={[]}
          setRequirements={() => {}}
        />;
      default:
        return <div>Paso no encontrado</div>;
    }
  };

  const handleCompleteRegistration = async () => {
    try {
      const success = await handleSubmit();
      if (success) {
        toast({
          title: "Registro Exitoso",
          description: "Su información ha sido registrada correctamente.",
        });
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error("Error during registration:", err);
      toast({
        variant: "destructive",
        title: "Error en el Registro",
        description: err.message || "Hubo un error al registrar su información. Por favor, inténtelo de nuevo.",
      });
    }
  };

  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <div className="container mx-auto px-6 py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Registro de Proyecto</CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <Progress value={(currentStep / steps.length) * 100} className="mb-4" />
            {renderStepContent()}
            <div className="flex justify-between mt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isFirstStep}
                className="flex items-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
              {isLastStep ? (
                <Button
                  onClick={handleCompleteRegistration}
                  className="bg-green-600 text-white hover:bg-green-700 flex items-center"
                >
                  Completar Registro
                  <CheckCircle className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="bg-blue-600 text-white hover:bg-blue-700 flex items-center"
                >
                  Siguiente
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
