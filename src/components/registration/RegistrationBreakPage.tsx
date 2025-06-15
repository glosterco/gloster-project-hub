
import { CheckCircle } from 'lucide-react';

export const RegistrationBreakPage = () => {
  return (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="h-8 w-8 text-green-600" />
      </div>
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800 font-rubik">
          ¡Información del Usuario Recopilada!
        </h3>
        <p className="text-gloster-gray font-rubik">
          Hemos registrado exitosamente tu información personal y de contacto.
        </p>
        <div className="bg-gloster-yellow/10 border border-gloster-yellow/20 rounded-lg p-4">
          <p className="text-sm text-slate-700 font-rubik">
            <strong>Próximo paso:</strong> Ahora necesitamos la información del proyecto para crear tu espacio de trabajo.
          </p>
          <p className="text-xs text-gloster-gray font-rubik mt-2">
            La información del proyecto es requerida para completar la creación de tu cuenta.
          </p>
        </div>
      </div>
    </div>
  );
};
