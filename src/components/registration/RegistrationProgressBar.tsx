
interface RegistrationProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export const RegistrationProgressBar = ({ currentStep, totalSteps }: RegistrationProgressBarProps) => {
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
