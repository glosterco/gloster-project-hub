
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface DocumentationSectionProps {
  canDownloadFiles: boolean;
  onDownloadFiles: () => void;
  downloadLoading: boolean;
}

const DocumentationSection: React.FC<DocumentationSectionProps> = ({
  canDownloadFiles,
  onDownloadFiles,
  downloadLoading
}) => {
  const documents = [
    {
      title: 'Carátula EEPP',
      description: 'Presentación y resumen del estado de pago'
    },
    {
      title: 'Avance Periódico',
      description: 'Planilla detallada del avance de obras del período'
    },
    {
      title: 'Certificados y Factura',
      description: 'Documentos de cumplimiento y facturación'
    }
  ];

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Documentación Requerida</h2>
      
      <div className="space-y-4">
        {documents.map((doc, index) => (
          <div key={index} className="p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">{doc.title}</h3>
                <p className="text-sm text-slate-600">{doc.description}</p>
              </div>
              {canDownloadFiles && (
                <Button
                  onClick={onDownloadFiles}
                  variant="outline"
                  size="sm"
                  disabled={downloadLoading}
                >
                  {downloadLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Descargar'
                  )}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default DocumentationSection;
