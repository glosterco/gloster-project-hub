
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send } from 'lucide-react';

interface SubmissionPreviewHeaderProps {
  isProjectUser: boolean;
  onSendEmail: () => void;
  onBackNavigation: () => void;
  isUploading: boolean;
  notificationLoading: boolean;
}

const SubmissionPreviewHeader: React.FC<SubmissionPreviewHeaderProps> = ({
  isProjectUser,
  onSendEmail,
  onBackNavigation,
  isUploading,
  notificationLoading
}) => {
  return (
    <>
      <div className="bg-white border-b border-gloster-gray/20 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
                alt="Gloster Logo" 
                className="w-8 h-8"
              />
              <h1 className="text-xl font-bold text-slate-800 font-rubik">Vista previa del Email</h1>
            </div>
            
            <div className="flex items-center space-x-3">
              {isProjectUser && (
                <Button
                  size="sm"
                  onClick={onSendEmail}
                  disabled={isUploading || notificationLoading}
                  className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black font-rubik"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isUploading || notificationLoading ? 'Enviando...' : 'Enviar Notificación'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 py-2">
        <div className="container mx-auto px-6">
          <button 
            onClick={onBackNavigation}
            className="text-gloster-gray hover:text-slate-800 text-sm font-rubik flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isProjectUser ? 'Volver' : 'Volver al Inicio'}
          </button>
        </div>
      </div>
    </>
  );
};

export default SubmissionPreviewHeader;
