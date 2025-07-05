
import React from 'react';

interface SubmissionHeaderProps {
  // Removed onPrint, onDownloadPDF, onDownloadFiles, downloadLoading, downloadProgress
}

const SubmissionHeader: React.FC<SubmissionHeaderProps> = () => {
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
          
          {/* Removed all download buttons */}
        </div>
      </div>
    </div>
  );
};

export default SubmissionHeader;
