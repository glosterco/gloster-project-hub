import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Loader2, 
  Paperclip, 
  X, 
  FileText 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RFIResponseFormProps {
  rfiId: number;
  projectId: number;
  authorEmail: string;
  authorName?: string;
  authorRole: 'contratista' | 'mandante' | 'aprobador' | 'especialista';
  onSubmit: (params: {
    projectId: number;
    authorEmail: string;
    authorName?: string;
    authorRole: 'contratista' | 'mandante' | 'aprobador' | 'especialista';
    messageText: string;
    attachments?: {
      fileName: string;
      fileContent: string;
      mimeType: string;
    }[];
  }) => Promise<boolean>;
  sending: boolean;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const RFIResponseForm: React.FC<RFIResponseFormProps> = ({
  rfiId,
  projectId,
  authorEmail,
  authorName,
  authorRole,
  onSubmit,
  sending,
  disabled = false,
}) => {
  const [messageText, setMessageText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast({
          title: "Archivo muy grande",
          description: `${file.name} excede el límite de 10MB`,
          variant: "destructive",
        });
        return;
      }
    }

    setAttachedFiles(prev => [...prev, ...files]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async () => {
    if (!messageText.trim()) {
      toast({
        title: "Error",
        description: "Debe escribir un mensaje",
        variant: "destructive",
      });
      return;
    }

    let attachments: { fileName: string; fileContent: string; mimeType: string }[] | undefined;

    if (attachedFiles.length > 0) {
      try {
        attachments = await Promise.all(
          attachedFiles.map(async (file) => ({
            fileName: file.name,
            fileContent: await convertFileToBase64(file),
            mimeType: file.type || 'application/octet-stream',
          }))
        );
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudieron procesar los archivos",
          variant: "destructive",
        });
        return;
      }
    }

    const success = await onSubmit({
      projectId,
      authorEmail,
      authorName,
      authorRole,
      messageText,
      attachments,
    });

    if (success) {
      setMessageText('');
      setAttachedFiles([]);
    }
  };

  return (
    <div className="space-y-3">
      <Textarea
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        placeholder="Escriba su respuesta aquí..."
        className="min-h-[100px] resize-none"
        disabled={disabled || sending}
      />

      {/* Attached files list */}
      {attachedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Archivos adjuntos ({attachedFiles.length})
          </p>
          <div className="space-y-1">
            {attachedFiles.map((file, index) => (
              <div 
                key={index}
                className="flex items-center justify-between gap-2 p-2 bg-muted/50 rounded-md text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{file.name}</span>
                  <span className="text-muted-foreground shrink-0">
                    ({formatFileSize(file.size)})
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => removeFile(index)}
                  disabled={sending}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.zip,.rar"
        />
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || sending}
        >
          <Paperclip className="h-4 w-4 mr-2" />
          Adjuntar
        </Button>

        <div className="flex-1" />

        <Button
          onClick={handleSubmit}
          disabled={disabled || sending || !messageText.trim()}
        >
          {sending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Enviar respuesta
        </Button>
      </div>
    </div>
  );
};
