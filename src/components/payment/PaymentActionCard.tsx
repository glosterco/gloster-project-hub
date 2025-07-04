
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Eye, Send } from 'lucide-react';

interface PaymentActionCardProps {
  onPreviewEmail: () => void;
  onSendDocuments: () => void;
  shouldShowDriveFiles: boolean;
  areAllRequiredDocumentsUploaded: boolean;
  wereDocumentsUpdated: boolean;
  isUploading: boolean;
}

export const PaymentActionCard: React.FC<PaymentActionCardProps> = ({
  onPreviewEmail,
  onSendDocuments,
  shouldShowDriveFiles,
  areAllRequiredDocumentsUploaded,
  wereDocumentsUpdated,
  isUploading
}) => {
  return (
    <Card className="border-gloster-gray/20 hover:shadow-xl transition-all duration-300 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 font-rubik text-lg">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <span className="text-gloster-gray">Vista Previa o Enviar</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-1">
        <div className="space-y-4">
          <Button
            onClick={onPreviewEmail}
            variant="outline"
            className="w-full border-gloster-gray/30 hover:bg-gloster-gray/10 font-rubik"
            size="sm"
            disabled={isUploading || (!areAllRequiredDocumentsUploaded && !shouldShowDriveFiles)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Vista Previa
          </Button>
          <Button
            onClick={onSendDocuments}
            disabled={
              shouldShowDriveFiles 
                ? !wereDocumentsUpdated || isUploading
                : !areAllRequiredDocumentsUploaded || isUploading
            }
            className="w-full bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-300 font-rubik"
            size="sm"
          >
            <Send className="h-4 w-4 mr-2" />
            {isUploading ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
