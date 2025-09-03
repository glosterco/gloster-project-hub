
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, Upload, X } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  description: string;
  downloadUrl?: string | null;
  externalLink?: string;
  required: boolean;
}

interface DriveFilesCardProps {
  documents: Document[];
  downloadLoading?: boolean;
  isDocumentLoading?: (docName: string) => boolean;
  onDownloadFile: (fileName: string) => void;
  onDocumentUpload: (docId: string) => void;
  paymentStatus?: string;
  uploadedFiles?: { [key: string]: string[] };
  onFileRemove?: (docId: string, fileIndex: number) => void;
}

const DriveFilesCard: React.FC<DriveFilesCardProps> = ({
  documents,
  downloadLoading = false,
  isDocumentLoading,
  onDownloadFile,
  onDocumentUpload,
  paymentStatus,
  uploadedFiles,
  onFileRemove
}) => {
  // Documentos del mandante
  const mandanteFiles = React.useMemo(() => {
    if (!uploadedFiles || !uploadedFiles['mandante_docs']) return [];
    return uploadedFiles['mandante_docs'];
  }, [uploadedFiles]);

  // Documentos del contratista
  const contractorFiles = React.useMemo(() => {
    if (!uploadedFiles) return {};
    return Object.entries(uploadedFiles).reduce((acc, [docId, files]) => {
      if (docId !== 'mandante_docs' && files?.length) {
        acc[docId] = files;
      }
      return acc;
    }, {} as { [key: string]: string[] });
  }, [uploadedFiles]);

  return (
    <div className="space-y-6">
      {/* Documentos del Contratista */}
      <Card className="mb-8 border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="font-rubik text-lg text-slate-800">Documentos del Contratista</CardTitle>
          <CardDescription className="font-rubik">
            Documentos cargados por el contratista. Puedes descargarlos o actualizarlos si es necesario.
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

                    {/* Archivos del contratista filtrados por coincidencia de nombre */}
                    {Object.entries(contractorFiles).map(([key, files]) =>
                      files
                        .filter(file => file.includes(doc.name))
                        .map((file, index) => (
                          <div key={`${key}-${file}`} className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-200 mt-2">
                            <span className="text-xs text-green-800 font-rubik truncate flex-1 pr-2">{file}</span>
                            {onFileRemove && paymentStatus === 'Rechazado' && (
                              <Button
                                onClick={() => onFileRemove(key, index)}
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 text-red-600 hover:text-red-800 hover:bg-red-100 shrink-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))
                    )}

                    {/* Botones de acción */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDownloadFile(doc.name)}
                        disabled={isDocumentLoading ? isDocumentLoading(doc.name) : downloadLoading}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        <span className="text-xs">
                          {(isDocumentLoading ? isDocumentLoading(doc.name) : downloadLoading) ? 'Descargando...' : 'Descargar'}
                        </span>
                      </Button>

                      {(doc.externalLink || doc.downloadUrl) && paymentStatus !== 'Enviado' && paymentStatus !== 'Aprobado' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(doc.externalLink || doc.downloadUrl, '_blank')}
                          className="flex-1"
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          <span className="text-xs">Visitar sitio</span>
                        </Button>
                      )}

                      {paymentStatus !== 'Enviado' && paymentStatus !== 'Aprobado' && (
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
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documentos del Mandante */}
      {mandanteFiles.length > 0 && (
        <Card className="mb-8 border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="font-rubik text-lg text-slate-800">Documentos del Mandante</CardTitle>
            <CardDescription className="font-rubik">
              Documentos adicionales cargados por el mandante durante el proceso de aprobación.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mandanteFiles.map((fileName, index) => (
                <div key={`mandante-${index}`} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-green-50">
                  <div className="flex flex-col space-y-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800 font-rubik text-sm">Documentos Adicionales</h4>
                      <p className="text-xs text-gloster-gray font-rubik mt-1">Cargados por el mandante</p>
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center justify-between bg-green-100 p-2 rounded border border-green-300">
                          <span className="text-xs text-green-800 font-rubik truncate flex-1 pr-2">{fileName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDownloadFile(fileName)}
                        disabled={isDocumentLoading ? isDocumentLoading(fileName) : downloadLoading}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        <span className="text-xs">
                          {(isDocumentLoading ? isDocumentLoading(fileName) : downloadLoading) ? 'Descargando...' : 'Descargar'}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DriveFilesCard;
