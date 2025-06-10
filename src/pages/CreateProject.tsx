
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';

const CreateProject = () => {
  const [formData, setFormData] = useState({
    projectName: '',
    clientName: '',
    clientContact: '',
    clientEmail: '',
    projectType: '',
    location: '',
    address: '',
    description: '',
    totalValue: '',
    startDate: '',
    endDate: '',
    specialization: '',
    teamSize: '',
    requirements: ''
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
    setIsLoading(true);
    
    // Simulamos la creación del proyecto
    setTimeout(() => {
      toast({
        title: "¡Proyecto creado exitosamente!",
        description: `${formData.projectName} ha sido agregado a tus proyectos`,
      });
      navigate('/dashboard');
      setIsLoading(false);
    }, 2000);
  };

  const totalSteps = 3;

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <PageHeader title="Crear Nuevo Proyecto" />

      {/* Volver */}
      <div className="bg-slate-50 py-2">
        <div className="container mx-auto px-6">
          <button 
            onClick={() => navigate('/dashboard')}
            className="text-gloster-gray hover:text-slate-800 text-sm font-rubik flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </button>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-800 font-rubik">Paso {currentStep} de {totalSteps}</span>
              <span className="text-slate-800 font-rubik">{Math.round((currentStep / totalSteps) * 100)}%</span>
            </div>
            <div className="w-full bg-gloster-gray/20 rounded-full h-2">
              <div 
                className="bg-gloster-yellow h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>

          <Card className="border-gloster-gray/20">
            <CardHeader>
              <CardTitle className="text-2xl text-slate-800 font-rubik">
                {currentStep === 1 && 'Información del Proyecto'}
                {currentStep === 2 && 'Detalles del Cliente'}
                {currentStep === 3 && 'Especificaciones Técnicas'}
              </CardTitle>
              <CardDescription className="text-gloster-gray font-rubik">
                {currentStep === 1 && 'Datos básicos del nuevo proyecto'}
                {currentStep === 2 && 'Información del mandante o cliente'}
                {currentStep === 3 && 'Detalles técnicos y cronograma'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Paso 1: Información del Proyecto */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <div>
                      <Input
                        placeholder="Nombre del proyecto"
                        value={formData.projectName}
                        onChange={(e) => handleInputChange('projectName', e.target.value)}
                        className="font-rubik"
                        required
                      />
                    </div>
                    <div>
                      <Select value={formData.projectType} onValueChange={(value) => handleInputChange('projectType', value)}>
                        <SelectTrigger className="font-rubik">
                          <SelectValue placeholder="Tipo de proyecto" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="comercial">Edificio Comercial</SelectItem>
                          <SelectItem value="residencial">Proyecto Residencial</SelectItem>
                          <SelectItem value="industrial">Proyecto Industrial</SelectItem>
                          <SelectItem value="infraestructura">Infraestructura</SelectItem>
                          <SelectItem value="remodelacion">Remodelación</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Input
                        placeholder="Ubicación (ciudad, comuna)"
                        value={formData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        className="font-rubik"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Dirección completa"
                        value={formData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        className="font-rubik"
                        required
                      />
                    </div>
                    <div>
                      <Textarea
                        placeholder="Descripción del proyecto"
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="font-rubik min-h-[100px]"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Paso 2: Detalles del Cliente */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <Input
                        placeholder="Nombre del mandante/cliente"
                        value={formData.clientName}
                        onChange={(e) => handleInputChange('clientName', e.target.value)}
                        className="font-rubik"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Persona de contacto"
                        value={formData.clientContact}
                        onChange={(e) => handleInputChange('clientContact', e.target.value)}
                        className="font-rubik"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        type="email"
                        placeholder="Email de contacto"
                        value={formData.clientEmail}
                        onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                        className="font-rubik"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Valor total del contrato (CLP)"
                        value={formData.totalValue}
                        onChange={(e) => handleInputChange('totalValue', e.target.value)}
                        className="font-rubik"
                        type="number"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Paso 3: Especificaciones Técnicas */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gloster-gray font-rubik mb-2 block">
                          Fecha de inicio
                        </label>
                        <Input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => handleInputChange('startDate', e.target.value)}
                          className="font-rubik"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gloster-gray font-rubik mb-2 block">
                          Fecha estimada de término
                        </label>
                        <Input
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => handleInputChange('endDate', e.target.value)}
                          className="font-rubik"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Select value={formData.specialization} onValueChange={(value) => handleInputChange('specialization', value)}>
                        <SelectTrigger className="font-rubik">
                          <SelectValue placeholder="Tu especialización en este proyecto" />
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
                      <Input
                        placeholder="Tamaño del equipo de trabajo"
                        value={formData.teamSize}
                        onChange={(e) => handleInputChange('teamSize', e.target.value)}
                        className="font-rubik"
                        type="number"
                        min="1"
                      />
                    </div>
                    <div>
                      <Textarea
                        placeholder="Requerimientos especiales o consideraciones adicionales"
                        value={formData.requirements}
                        onChange={(e) => handleInputChange('requirements', e.target.value)}
                        className="font-rubik min-h-[100px]"
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
                      className="border-gloster-gray/30 text-gloster-gray hover:bg-gloster-gray/10 font-rubik"
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
                      {isLoading ? 'Creando proyecto...' : 'Crear Proyecto'}
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

export default CreateProject;
