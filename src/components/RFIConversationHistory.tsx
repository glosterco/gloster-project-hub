import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  User, 
  Calendar, 
  Paperclip, 
  Download,
  Folder,
  FileText,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RFIMessage, AttachmentFile, useRFIMessages } from '@/hooks/useRFIMessages';

interface RFIConversationHistoryProps {
  rfiId: number;
  projectId: number;
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'contratista':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'mandante':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'aprobador':
      return 'bg-purple-100 text-purple-700 border-purple-200';
    case 'especialista':
      return 'bg-amber-100 text-amber-700 border-amber-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'contratista':
      return 'Contratista';
    case 'mandante':
      return 'Mandante';
    case 'aprobador':
      return 'Aprobador';
    case 'especialista':
      return 'Especialista';
    default:
      return role;
  }
};

const formatFileSize = (bytes: number | null): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MessageAttachments: React.FC<{
  attachmentsUrl: string;
  getAttachmentFiles: (url: string) => Promise<AttachmentFile[]>;
}> = ({ attachmentsUrl, getAttachmentFiles }) => {
  const [files, setFiles] = useState<AttachmentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFolder, setIsFolder] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    const load = async () => {
      const result = await getAttachmentFiles(attachmentsUrl);
      setFiles(result);
      setIsFolder(attachmentsUrl.includes('/folders/'));
      setLoading(false);
    };
    load();
  }, [attachmentsUrl, getAttachmentFiles]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-2">
        <Loader2 className="h-3 w-3 animate-spin" />
        Cargando adjuntos...
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="mt-2">
        <a 
          href={attachmentsUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
        >
          <Paperclip className="h-3 w-3" />
          Ver adjunto
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {isFolder ? <Folder className="h-3.5 w-3.5" /> : <Paperclip className="h-3.5 w-3.5" />}
        {isFolder ? `${files.length} archivos adjuntos` : 'Archivo adjunto'}
      </div>
      
      <div className="space-y-1.5">
        {files.map((file) => (
          <div 
            key={file.id}
            className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-md text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{file.name}</span>
              {file.size && (
                <span className="text-muted-foreground shrink-0">
                  ({formatFileSize(file.size)})
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2"
                onClick={() => window.open(file.webViewLink, '_blank')}
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
              {file.webContentLink && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => window.open(file.webContentLink, '_blank')}
                >
                  <Download className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isFolder && (
        <a 
          href={attachmentsUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
        >
          <Folder className="h-3 w-3" />
          Abrir carpeta en Drive
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
};

export const RFIConversationHistory: React.FC<RFIConversationHistoryProps> = ({
  rfiId,
  projectId,
}) => {
  const { messages, loading, getAttachmentFiles } = useRFIMessages(rfiId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
        No hay mensajes en este RFI aún.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-blue-500" />
        <h3 className="text-sm font-medium text-muted-foreground">
          Historial de conversación ({messages.length})
        </h3>
      </div>
      
      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {messages.map((message, index) => (
          <div key={message.id}>
            {index > 0 && <Separator className="my-3" />}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium text-sm truncate">
                    {message.author_name || message.author_email}
                  </span>
                  <Badge className={`${getRoleColor(message.author_role)} text-xs`}>
                    {getRoleLabel(message.author_role)}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Calendar className="h-3 w-3" />
                  {new Date(message.created_at).toLocaleString('es-CL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
              
              <p className="text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-md">
                {message.message_text}
              </p>
              
              {message.attachments_url && (
                <MessageAttachments 
                  attachmentsUrl={message.attachments_url}
                  getAttachmentFiles={getAttachmentFiles}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
