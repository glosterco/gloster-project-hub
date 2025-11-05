import { useState } from 'react';
import { FileText, Folder, File, ExternalLink, Calendar, HardDrive, Eye, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useProjectDocumentDownload } from '@/hooks/useProjectDocumentDownload';
import { DocumentPreviewModal } from '@/components/DocumentPreviewModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Documento {
  id: number;
  Proyecto: number;
  Tipo: string | null;
  Nombre: string | null;
  Size: number | null;
  Extension: string | null;
  MimeType: string | null;
  DriveId: string | null;
  WebViewLink: string | null;
  created_at: string;
}

interface DocumentosTableWithSidebarProps {
  documentos: Documento[];
  loading: boolean;
  projectId: string;
}

export const DocumentosTableWithSidebar = ({ documentos, loading, projectId }: DocumentosTableWithSidebarProps) => {
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    documentName: string | null;
    webViewLink: string | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    documentName: null,
    webViewLink: null,
    isLoading: false,
  });
  const { downloadDocument, previewDocument, isDocumentLoading } = useProjectDocumentDownload();

  const handlePreview = async (doc: Documento) => {
    if (!doc.Nombre) return;

    setPreviewModal({
      isOpen: true,
      documentName: doc.Nombre,
      webViewLink: doc.WebViewLink,
      isLoading: !doc.WebViewLink,
    });

    // If we don't have webViewLink, fetch it
    if (!doc.WebViewLink) {
      const result = await previewDocument({
        fileName: doc.Nombre,
        webViewLink: doc.WebViewLink,
        driveId: doc.DriveId,
        projectId: Number(projectId),
      });

      if (result.success && result.webViewLink) {
        setPreviewModal(prev => ({
          ...prev,
          webViewLink: result.webViewLink || null,
          isLoading: false,
        }));
      } else {
        setPreviewModal(prev => ({ ...prev, isLoading: false }));
      }
    }
  };

  // Get unique document types with counts
  const documentTypes = documentos.reduce((acc, doc) => {
    const tipo = doc.Tipo || 'Sin Categoría';
    acc[tipo] = (acc[tipo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filter documents by selected type
  const filteredDocuments = selectedType
    ? documentos.filter(doc => (doc.Tipo || 'Sin Categoría') === selectedType)
    : documentos;

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const getFileIcon = (extension: string | null) => {
    if (!extension) return <File className="h-4 w-4 text-muted-foreground" />;
    const ext = extension.toLowerCase();
    if (['pdf'].includes(ext)) return <FileText className="h-4 w-4 text-red-500" />;
    if (['doc', 'docx'].includes(ext)) return <FileText className="h-4 w-4 text-blue-500" />;
    if (['xls', 'xlsx'].includes(ext)) return <FileText className="h-4 w-4 text-green-500" />;
    if (['jpg', 'jpeg', 'png'].includes(ext)) return <FileText className="h-4 w-4 text-purple-500" />;
    return <File className="h-4 w-4 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <div className="flex gap-4">
        <Card className="w-64 h-[600px]">
          <CardContent className="p-4">
            <Skeleton className="h-8 w-full mb-4" />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-full mb-2" />
            ))}
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardContent className="p-4">
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <DocumentPreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal({ isOpen: false, documentName: null, webViewLink: null, isLoading: false })}
        documentName={previewModal.documentName}
        webViewLink={previewModal.webViewLink}
        isLoading={previewModal.isLoading}
      />
      
      <div className="flex gap-4">
      {/* Sidebar with document categories */}
      <Card className="w-64 flex-shrink-0">
        <CardContent className="p-4">
          <div className="space-y-1">
            <button
              onClick={() => setSelectedType(null)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left ${
                selectedType === null
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              <Folder className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium truncate">Todos</span>
              <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full">
                {documentos.length}
              </span>
            </button>

            {Object.entries(documentTypes)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([tipo, count]) => (
                <button
                  key={tipo}
                  onClick={() => setSelectedType(tipo)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left ${
                    selectedType === tipo
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-muted-foreground'
                  }`}
                >
                  <Folder className="h-4 w-4 flex-shrink-0" />
                  <span className="text-sm font-medium truncate">{tipo}</span>
                  <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full">
                    {count}
                  </span>
                </button>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Main table */}
      <Card className="flex-1">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="w-[120px]">Tamaño</TableHead>
                  <TableHead className="w-[100px]">Tipo</TableHead>
                  <TableHead className="w-[100px]">Extensión</TableHead>
                  <TableHead className="w-[160px]">Fecha</TableHead>
                  <TableHead className="w-[120px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {selectedType
                        ? `No hay documentos en la categoría "${selectedType}"`
                        : 'No hay documentos cargados'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocuments.map((doc) => (
                    <TableRow key={doc.id} className="hover:bg-muted/50">
                      <TableCell>{getFileIcon(doc.Extension)}</TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="truncate max-w-[300px]">{doc.Nombre}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <HardDrive className="h-3 w-3" />
                          <span className="text-sm">{formatFileSize(doc.Size)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{doc.Tipo || 'N/A'}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-mono text-muted-foreground uppercase">
                          {doc.Extension || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span className="text-sm">
                            {format(new Date(doc.created_at), 'dd MMM yyyy', { locale: es })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handlePreview(doc)}
                            title="Vista previa"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => doc.Nombre && downloadDocument({
                              fileName: doc.Nombre,
                              driveId: doc.DriveId,
                              projectId: Number(projectId)
                            })}
                            disabled={!doc.Nombre || isDocumentLoading(doc.Nombre)}
                            title="Descargar"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
};
