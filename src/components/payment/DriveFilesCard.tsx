
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, Upload } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  description: string;
  downloadUrl?: string | null;
  required: boolean;
}

interface DriveFilesCardProps {
  documents: Document[];
  downloadLoading: boolean;
  onDownloadFile: (fileName: string) => void;
  onDocumentUpload: (docId: string) => void;
  paymentStatus?: string;
}

const DriveFilesCard: React.FC<DriveFilesCardProps> = ({
  documents,
  downloadLoading,
  onDownloadFile,
  onDocumentUpload,
  paymentStatus
}) => {
  return (
    <Card className="mb-8 border-l-4 border-l-blue-500">
      <CardHeader>
        <CardTitle className="font-rubik text-lg text-slate-800">Documentos en Drive</CardTitle>
        <CardDescription className="font-rubik">
          Los documentos se encuentran almacenados. Puedes actualizar cualquier documento si es necesario.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.filter(doc => doc.required).map((doc) => (
            <div key={doc.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col space-y-3">
                <div className="flex-1">
                  <h4 className="font-medium text-slate-800 font-rubik text-sm">{doc.name}</h4>
                  <p className="text-xs text-gloster-gray font-rubik mt-1">{doc.description}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDownloadFile(doc.name)}
                    disabled={downloadLoading}
                    className="flex-1"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    <span className="text-xs">{downloadLoading ? 'Descargando...' : 'Descargar'}</span>
                  </Button>
                  {doc.downloadUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(doc.downloadUrl, '_blank')}
                      className="flex-1"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      <span className="text-xs">Visitar</span>
                    </Button>
                  )}
                  {paymentStatus !== 'Aprobado' && (
                    <Button
                      size="sm"
                      onClick={() => onDocumentUpload(doc.id)}
                      className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black flex-1"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      <span className="text-xs">Actualizar</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DriveFilesCard;
