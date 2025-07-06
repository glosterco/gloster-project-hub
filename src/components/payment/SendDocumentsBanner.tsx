
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Send, Eye } from 'lucide-react';

interface SendDocumentsBannerProps {
  areAllRequiredDocumentsUploaded: boolean;
  areFieldsValidForActions: boolean;
  getValidationMessage: () => string;
  isUploadingOrPreviewing: boolean;
  isUploading: boolean;
  isPreviewUploading: boolean;
  onPreviewEmail: () => void;
  onSendDocuments: () => void;
}

const SendDocumentsBanner: React.FC<SendDocumentsBannerProps> = ({
  areAllRequiredDocumentsUploaded,
  areFieldsValidForActions,
  getValidationMessage,
  isUploadingOrPreviewing,
  isUploading,
  isPreviewUploading,
  onPreviewEmail,
  onSendDocuments
}) => {
  return (
    <Card className="border-l-4 border-l-green-500 bg-green-50/50">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
              <Send className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800 font-rubik mb-1">¿Listo para enviar?</h3>
              <p className="text-gloster-gray text-sm font-rubik">
                Una vez que hayas cargado todos los documentos requeridos y completado el monto y porcentaje, puedes enviarlos para su procesamiento.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    onClick={onPreviewEmail}
                    variant="outline"
                    className="border-gloster-gray/30 hover:bg-gloster-gray/10 font-rubik px-6 md:px-8 py-3 w-full sm:w-auto"
                    size="lg"
                    disabled={isUploadingOrPreviewing || !areAllRequiredDocumentsUploaded || !areFieldsValidForActions}
                  >
                    <Eye className="h-5 w-5 mr-2" />
                    {isPreviewUploading ? 'Subiendo...' : 'Vista Previa'}
                  </Button>
                </div>
              </TooltipTrigger>
              {!areFieldsValidForActions && (
                <TooltipContent>
                  <p>{getValidationMessage()}</p>
                </TooltipContent>
              )}
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    onClick={onSendDocuments}
                    disabled={!areAllRequiredDocumentsUploaded || isUploadingOrPreviewing || !areFieldsValidForActions}
                    className="bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-300 font-rubik px-6 md:px-8 py-3 w-full sm:w-auto"
                    size="lg"
                  >
                    <Send className="h-5 w-5 mr-2" />
                    {isUploading ? 'Subiendo...' : 'Enviar Email y Documentos'}
                  </Button>
                </div>
              </TooltipTrigger>
              {!areFieldsValidForActions && (
                <TooltipContent>
                  <p>{getValidationMessage()}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SendDocumentsBanner;
