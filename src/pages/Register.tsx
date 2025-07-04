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
  const { currentStep, nextStep, prevStep, isFirstStep, isLastStep, steps } = useRegistrationSteps();
  const { registrationData, updateRegistrationData } = useRegistrationData();
  const { isLoading, error, completeRegistration } = useRegistrationProcess();
  const { toast } = useToast();

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <CompanyInfoStep />;
      case 2:
        return <ContactInfoStep />;
      case 3:
        return <ClientInfoStep />;
      case 4:
        return <ProjectInfoStep />;
      case 5:
        return <PaymentInfoStep />;
      default:
        return <div>Paso no encontrado</div>;
    }
  };

  const handleSubmit = async () => {
    try {
      await completeRegistration(registrationData);
      toast({
        title: "Registro Exitoso",
        description: "Su información ha sido registrada correctamente.",
      });
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Error during registration:", err);
      toast({
        variant: "destructive",
        title: "Error en el Registro",
        description: err.message || "Hubo un error al registrar su información. Por favor, inténtelo de nuevo.",
      });
    }
  };

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
                onClick={prevStep}
                disabled={isFirstStep || isLoading}
                className="flex items-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
              {isLastStep ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="bg-green-600 text-white hover:bg-green-700 flex items-center"
                >
                  {isLoading ? (
                    <>
                      Registrando...
                    </>
                  ) : (
                    <>
                      Completar Registro
                      <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  disabled={isLoading}
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
