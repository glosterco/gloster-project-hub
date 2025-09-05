import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, ExternalLink, X } from 'lucide-react';
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
  fileObjects?: { [key: string]: File[] };
}

const DriveFilesCard: React.FC<DriveFilesCardProps> = ({
  documents,
  downloadLoading = false,
  isDocumentLoading,
  onDownloadFile,
  onDocumentUpload,
  paymentStatus,
  uploadedFiles,
  onFileRemove,
  fileObjects
}) => {

  // Filtrar documentos del mandante
  const mandanteFiles = React.useMemo(() => {
    if (!uploadedFiles || !uploadedFiles['mandante_docs']) return [];
    return uploadedFiles['mandante_docs'];
  }, [uploadedFiles]);

  // Función para obtener archivos específicos de un documento
  const getDocumentFiles = (doc: Document) => {
    let specificFiles: string[] = [];
    
    // 1. Archivos cargados localmente (fileObjects) - prioritarios para Rechazado
    if (fileObjects?.[doc.id] && fileObjects[doc.id].length > 0) {
      specificFiles = [...specificFiles, ...fileObjects[doc.id].map(file => file.name)];
    }
    
    // 2. Archivos clasificados por ID exacto en el Drive
    if (uploadedFiles?.[doc.id] && uploadedFiles[doc.id].length > 0) {
      specificFiles = [...specificFiles, ...uploadedFiles[doc.id]];
    }
    
    // 3. Buscar archivos que coincidan con el nombre del documento en TODAS las categorías
    if (uploadedFiles) {
      Object.entries(uploadedFiles).forEach(([category, files]) => {
        if (category !== 'mandante_docs' && category !== doc.id && files && files.length > 0) {
          const matchingFiles = files.filter(fileName => {
            // Comparación por nombre: quitar extensión y comparar
            const fileBaseName = fileName.replace(/\.[^/.]+$/, "").toLowerCase().trim();
            const docName = doc.name.toLowerCase().trim();
            return fileBaseName === docName;
          });
          specificFiles = [...specificFiles, ...matchingFiles];
        }
      });
    }
    
    // Eliminar duplicados
    return [...new Set(specificFiles)];
  };

  // Función para obtener archivos "otros" que no coinciden con ningún documento requerido
  const getOtherFiles = () => {
    if (!uploadedFiles?.otros) return [];
    
    return uploadedFiles.otros.filter(fileName => {
      // Verificar si este archivo NO coincide con ningún documento requerido
      const fileBaseName = fileName.replace(/\.[^/.]+$/, "").toLowerCase().trim();
      const matchesRequiredDoc = documents.some(doc => {
        const docName = doc.name.toLowerCase().trim();
        return fileBaseName === docName;
      });
      return !matchesRequiredDoc;
    });
  };

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
            {/* Mostrar TODAS las tarjetas de documentos requeridos */}
            {documents.map((doc) => {
              const specificFiles = getDocumentFiles(doc);
              
              return (
                <div key={doc.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col space-y-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800 font-rubik text-sm">{doc.name}</h4>
                      <p className="text-xs text-gloster-gray font-rubik mt-1">{doc.description}</p>
                      
                      {/* Mostrar vista previa de archivos específicos del documento */}
                      {specificFiles.length > 0 && paymentStatus !== 'Enviado' && paymentStatus !== 'Aprobado' && (
                        <div className="space-y-1 mt-2">
                          {specificFiles.map((file, index) => {
                            // Remove file extension from display name
                            const fileNameWithoutExtension = file.replace(/\.[^/.]+$/, "");
                            return (
                              <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-200">
                                <span className="text-xs text-green-800 font-rubik truncate flex-1 pr-2">{fileNameWithoutExtension}</span>
                                {/* Solo mostrar botón de eliminar para estado Rechazado */}
                                {onFileRemove && (paymentStatus === 'Rechazado' || paymentStatus === 'Pendiente') && (
                                  <Button
                                    onClick={() => onFileRemove(doc.id, index)}
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 text-red-600 hover:text-red-800 hover:bg-red-100 shrink-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDownloadFile(doc.name)}
                        disabled={isDocumentLoading ? isDocumentLoading(doc.name) : downloadLoading}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        <span className="text-xs">
                          {(isDocumentLoading ? isDocumentLoading(doc.name) : downloadLoading) 
                            ? 'Descargando...' 
                            : 'Descargar'}
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
              );
            })}
            
            {/* Agregar tarjetas individuales para archivos "otros" que no coinciden con documentos requeridos */}
            {getOtherFiles().map((fileName: string, index: number) => (
              <div key={`otros-${index}`} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col space-y-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-800 font-rubik text-sm">{fileName.replace(/\.[^/.]+$/, "")}</h4>
                    <p className="text-xs text-gloster-gray font-rubik mt-1">Documento adicional</p>
                    
                    {paymentStatus !== 'Enviado' && paymentStatus !== 'Aprobado' && (
                      <div className="space-y-1 mt-2">
                        <div className="flex items-center justify-between bg-green-50 p-2 rounded border border-green-200">
                          <span className="text-xs text-green-800 font-rubik truncate flex-1 pr-2">{fileName.replace(/\.[^/.]+$/, "")}</span>
                          {onFileRemove && (paymentStatus === 'Rechazado' || paymentStatus === 'Pendiente') && (
                            <Button
                              onClick={() => onFileRemove('otros', index)}
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 text-red-600 hover:text-red-800 hover:bg-red-100 shrink-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
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
                        {(isDocumentLoading ? isDocumentLoading(fileName) : downloadLoading) 
                          ? 'Descargando...' 
                          : 'Descargar'}
                      </span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onDocumentUpload('otros')}
                      className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black flex-1"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      <span className="text-xs">Actualizar</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Documentos del Mandante - Solo mostrar si hay archivos */}
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
                          {(isDocumentLoading ? isDocumentLoading(fileName) : downloadLoading) 
                            ? 'Descargando...' 
                            : 'Descargar'}
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