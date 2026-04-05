import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Documento } from '@/hooks/useLicitaciones';
import { FileText, Download, ExternalLink, File } from 'lucide-react';

interface Props {
  documentos: Documento[];
}

const LicitacionDocumentosTab: React.FC<Props> = ({ documentos }) => {
  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const getFileIcon = (tipo?: string) => {
    if (tipo?.includes('pdf')) return '📄';
    if (tipo?.includes('image')) return '🖼️';
    if (tipo?.includes('spreadsheet') || tipo?.includes('excel')) return '📊';
    if (tipo?.includes('word') || tipo?.includes('document')) return '📝';
    return '📎';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-rubik">
          <FileText className="h-5 w-5" />
          Documentos y Antecedentes ({documentos.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {documentos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <File className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No hay documentos cargados</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documentos.map((doc, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <span className="text-xl">{getFileIcon(doc.tipo)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{doc.nombre}</p>
                  {doc.size && (
                    <p className="text-xs text-muted-foreground">{formatSize(doc.size)}</p>
                  )}
                </div>
                {doc.url && (
                  <Button variant="ghost" size="sm" asChild>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LicitacionDocumentosTab;
