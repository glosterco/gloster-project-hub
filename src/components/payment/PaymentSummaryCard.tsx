
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Eye, Send } from 'lucide-react';

interface PaymentSummaryCardProps {
  completedDocumentsCount: number;
  totalDocuments: number;
  documents: Array<{
    id: string;
    name: string;
    required: boolean;
  }>;
  documentStatus: Record<string, boolean>;
  shouldShowDriveFiles: boolean;
  wereDocumentsUpdated: boolean;
  isUploading: boolean;
  onPreviewEmail: () => void;
  onSendDocuments: () => void;
}

const PaymentSummaryCard: React.FC<PaymentSummaryCardProps> = ({
  completedDocumentsCount,
  totalDocuments,
  documents,
  documentStatus,
  shouldShowDriveFiles,
  wereDocumentsUpdated,
  isUploading,
  onPreviewEmail,
  onSendDocuments,
}) => {
  const allRequiredDocumentsUploaded = documents
    .filter(doc => doc.required)
    .every(doc => documentStatus[doc.id]);

  return (
    <Card className="border-gloster-gray/20 hover:shadow-xl transition-all duration-300 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 font-rubik text-lg">
          <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-600" />
          </div>
          <span className="text-slate-800">Resumen</span>
        </CardTitle>
        <CardDescription className="font-rubik text-sm">
          {completedDocumentsCount} de {totalDocuments} documentos cargados
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 mb-4">
          <p className="text-gloster-gray font-rubik text-xs mb-3">
            Para procesar este estado de pago, debes obtener cada documento, cargar los archivos y luego enviarlos.
          </p>
        </div>
        <div className="space-y-1 mb-4 max-h-32 md:max-h-40 overflow-y-auto">
          {documents.map((doc) => doc.required ? (
            <div key={doc.id} className="flex items-center justify-between text-xs">
              <span className="font-rubik text-slate-700 truncate flex-1 pr-2">{doc.name}</span>
              {documentStatus[doc.id] ? (
                <CheckCircle className="h-3 w-3 text-green-600 shrink-0" />
              ) : (
                <Clock className="h-3 w-3 text-gloster-gray shrink-0" />
              )}
            </div>
          ): null)}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={onPreviewEmail}
            variant="outline"
            className="border-gloster-gray/30 hover:bg-gloster-gray/10 font-rubik"
            size="sm"
            disabled={isUploading}
          >
            <Eye className="h-4 w-4 mr-1" />
            Vista Previa
          </Button>
          <Button
            onClick={onSendDocuments}
            disabled={
              shouldShowDriveFiles 
                ? !wereDocumentsUpdated || isUploading
                : !allRequiredDocumentsUploaded || isUploading
            }
            className="bg-green-600 hover:bg-green-700 text-white disabled:bg-slate-300 font-rubik"
            size="sm"
          >
            <Send className="h-4 w-4 mr-1" />
            {isUploading ? 'Enviando...' : 'Enviar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentSummaryCard;
