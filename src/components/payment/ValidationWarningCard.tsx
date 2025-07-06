
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

interface ValidationWarningCardProps {
  message: string;
  type: 'validation' | 'unsaved';
}

const ValidationWarningCard: React.FC<ValidationWarningCardProps> = ({ message, type }) => {
  const isValidation = type === 'validation';
  const colorClasses = isValidation 
    ? 'border-l-orange-500 bg-orange-50/50 text-orange-600 text-orange-800 text-orange-700'
    : 'border-l-yellow-500 bg-yellow-50/50 text-yellow-600 text-yellow-800 text-yellow-700';

  return (
    <Card className={`mb-6 border-l-4 ${isValidation ? 'border-l-orange-500 bg-orange-50/50' : 'border-l-yellow-500 bg-yellow-50/50'}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <AlertCircle className={`h-5 w-5 shrink-0 ${isValidation ? 'text-orange-600' : 'text-yellow-600'}`} />
          <div>
            <p className={`font-medium font-rubik ${isValidation ? 'text-orange-800' : 'text-yellow-800'}`}>
              {isValidation ? 'Campos requeridos incompletos' : 'Archivos sin respaldar'}
            </p>
            <p className={`text-sm font-rubik mt-1 ${isValidation ? 'text-orange-700' : 'text-yellow-700'}`}>
              {message}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ValidationWarningCard;
