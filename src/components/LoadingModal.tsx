
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Upload } from 'lucide-react';

interface LoadingModalProps {
  isOpen: boolean;
  title?: string;
  description?: string;
}

const LoadingModal: React.FC<LoadingModalProps> = ({ 
  isOpen, 
  title = "Cargando archivos...", 
  description = "Por favor espera mientras se carga la documentación" 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 border-gloster-gray/20">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-gloster-yellow/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="h-8 w-8 text-gloster-gray animate-pulse" />
          </div>
          <CardTitle className="text-xl font-bold text-slate-800 font-rubik">
            {title}
          </CardTitle>
          <CardDescription className="font-rubik">
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin text-gloster-yellow" />
            <span className="text-sm text-gloster-gray font-rubik">
              Subiendo documentos...
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoadingModal;
