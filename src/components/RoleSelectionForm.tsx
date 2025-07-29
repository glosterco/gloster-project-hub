import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, User } from 'lucide-react';

interface RoleSelectionFormProps {
  onSelectRole: (role: 'contratista' | 'mandante') => void;
}

const RoleSelectionForm: React.FC<RoleSelectionFormProps> = ({ onSelectRole }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800 font-rubik mb-4">
            Crear Cuenta en Gloster
          </h1>
          <p className="text-lg text-gloster-gray font-rubik">
            Selecciona el tipo de cuenta que deseas crear
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Tarjeta Contratista */}
          <Card className="border-2 border-transparent hover:border-gloster-yellow/50 transition-all duration-200 cursor-pointer group">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gloster-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gloster-yellow/30 transition-colors">
                <Building2 className="h-8 w-8 text-gloster-gray" />
              </div>
              <CardTitle className="text-xl font-rubik">Contratista</CardTitle>
              <CardDescription className="font-rubik">
                Para empresas que ejecutan obras y proyectos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="text-sm text-gloster-gray space-y-2 font-rubik">
                <li>• Enviar estados de pago</li>
                <li>• Gestionar documentación</li>
                <li>• Seguimiento de proyectos</li>
                <li>• Comunicación con mandantes</li>
              </ul>
              <Button 
                onClick={() => onSelectRole('contratista')}
                className="w-full bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
              >
                Crear Cuenta de Contratista
              </Button>
            </CardContent>
          </Card>

          {/* Tarjeta Mandante */}
          <Card className="border-2 border-transparent hover:border-gloster-yellow/50 transition-all duration-200 cursor-pointer group">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gloster-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gloster-yellow/30 transition-colors">
                <User className="h-8 w-8 text-gloster-gray" />
              </div>
              <CardTitle className="text-xl font-rubik">Mandante</CardTitle>
              <CardDescription className="font-rubik">
                Para empresas que contratan y supervisan obras
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="text-sm text-gloster-gray space-y-2 font-rubik">
                <li>• Aprobar estados de pago</li>
                <li>• Supervisar múltiples proyectos</li>
                <li>• Dashboard centralizado</li>
                <li>• Gestión de contratistas</li>
              </ul>
              <Button 
                onClick={() => onSelectRole('mandante')}
                className="w-full bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
              >
                Crear Cuenta de Mandante
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gloster-gray font-rubik">
            ¿Ya tienes una cuenta?{' '}
            <a href="/" className="text-gloster-yellow hover:underline">
              Iniciar sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelectionForm;