
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

interface SubmissionHeaderProps {
  onPrint: () => void;
  onDownloadPDF: () => void;
  onDownloadFiles: () => void;
  downloadLoading: boolean;
  downloadProgress: number;
}

const SubmissionHeader: React.FC<SubmissionHeaderProps> = ({
  onPrint,
  onDownloadPDF,
  onDownloadFiles,
  downloadLoading,
  downloadProgress
}) => {
  return (
    <div className="bg-white border-b border-gloster-gray/20 shadow-sm print:hidden">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
              alt="Gloster Logo" 
              className="w-8 h-8"
            />
            <h1 className="text-xl font-bold text-slate-800 font-rubik">Estado de Pago</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onPrint}
              className="font-rubik"
            >
              Imprimir
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDownloadPDF}
              className="font-rubik"
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDownloadFiles}
              disabled={downloadLoading}
              className="font-rubik"
            >
              {downloadLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {downloadLoading ? 
                `Descargando... ${downloadProgress}%` : 
                'Descargar Archivos'
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionHeader;
