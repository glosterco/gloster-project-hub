import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users } from 'lucide-react';

interface RoleSelectorProps {
  onSelectRole: (role: 'contratista' | 'mandante') => void;
  contratistaName?: string;
  mandanteName?: string;
}

const RoleSelector: React.FC<RoleSelectorProps> = ({ 
  onSelectRole, 
  contratistaName, 
  mandanteName 
}) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Selecciona tu panel de acceso
          </h1>
          <p className="text-gray-600">
            Tienes acceso a múltiples roles. Elige desde qué perspectiva quieres acceder.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {contratistaName && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Panel de Contratista</CardTitle>
                <CardDescription className="text-sm">
                  Gestiona tus proyectos, estados de pago y documentos como contratista
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Empresa:</strong> {contratistaName}
                </p>
                <Button 
                  onClick={() => onSelectRole('contratista')}
                  className="w-full"
                  size="lg"
                >
                  Acceder como Contratista
                </Button>
              </CardContent>
            </Card>
          )}

          {mandanteName && (
            <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-primary">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-secondary" />
                </div>
                <CardTitle className="text-xl">Panel de Mandante</CardTitle>
                <CardDescription className="text-sm">
                  Supervisa proyectos, aprueba pagos y revisa documentos como mandante
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600 mb-4">
                  <strong>Empresa:</strong> {mandanteName}
                </p>
                <Button 
                  onClick={() => onSelectRole('mandante')}
                  className="w-full"
                  variant="secondary"
                  size="lg"
                >
                  Acceder como Mandante
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            Podrás cambiar de rol en cualquier momento desde el menú de usuario
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelector;