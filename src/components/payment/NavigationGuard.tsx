
import React from 'react';
import { Button } from '@/components/ui/button';

interface NavigationGuardProps {
  showConfirm: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const NavigationGuard: React.FC<NavigationGuardProps> = ({
  showConfirm,
  onConfirm,
  onCancel
}) => {
  if (!showConfirm) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-4">Confirmar salida</h3>
        <p className="text-gray-600 mb-6">
          Tienes cambios sin guardar. ¿Estás seguro de que quieres salir?
        </p>
        <div className="flex space-x-4 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Salir sin guardar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NavigationGuard;
