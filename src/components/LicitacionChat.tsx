import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2, CheckCircle2, X, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLicitaciones, NewLicitacion } from '@/hooks/useLicitaciones';
import ReactMarkdown from 'react-markdown';
import { formatOferenteEntry, normalizeChatCalendarEvents, normalizeChatItems, normalizePercentNumber, parseOferenteEntries } from '@/utils/licitacionCreation';
import { supabase } from '@/integrations/supabase/client';
import CompactDropZone from '@/components/licitacion/CompactDropZone';
import type { ParsedItem } from '@/hooks/useParseItemizado';

interface LicitacionChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Message = {
  role: 'user' | 'assistant';
  content: string;
  displayContent?: string;
  attachments?: Array<{ name: string }>;
};

type AttachmentAnalysis = {
  key: string;
  file: File;
  isItemizado: boolean;
  itemCount: number;
  parsedItems: ParsedItem[];
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/licitacion-chat`;
const ITEMIZADO_FILE_KEYWORDS = /(itemizado|presupuesto|planilla|cubicaci(?:on|ó)n|metrado|metrados|oferta)/i;
const ITEMIZADO_PARSABLE_EXTENSIONS = new Set(['xlsx', 'xls', 'xlsm', 'csv', 'pdf', 'docx']);

const getFileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

const getFileExtension = (file: File) => file.name.split('.').pop()?.toLowerCase() || '';

const mergeUniqueFiles = (base: File[], incoming: File[]) => {
  const map = new Map(base.map((file) => [getFileKey(file), file]));
  incoming.forEach((file) => map.set(getFileKey(file), file));
  return Array.from(map.values());
};

const convertFileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Content = result.split(',')[1];
      if (!base64Content) {
        reject(new Error('No se pudo leer el archivo'));
        return;
      }
      resolve(base64Content);
    };
    reader.onerror = () => reject(new Error('Error leyendo archivo'));
    reader.readAsDataURL(file);
  });
};

const LicitacionChat = ({ open, onOpenChange, onSuccess }: LicitacionChatProps) => {
  const { toast } = useToast();
  const { createLicitacion } = useLicitaciones();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [conversationFiles, setConversationFiles] = useState<File[]>([]);
  const conversationFilesRef = useRef<File[]>([]);
  const attachmentAnalysisRef = useRef<Record<string, AttachmentAnalysis>>({});

  const ALLOWED_EXTENSIONS = [
    '.pdf', '.xls', '.xlsx', '.xlsm', '.csv',
    '.doc', '.docx',
    '.dwg', '.rvt', '.nwd', '.nwf', '.nwc',
    '.jpg', '.jpeg', '.png',
    '.zip', '.rar', '.7z',
    '.ppt', '.pptx',
    '.ifc',
  ];

  const validateFiles = (files: File[]) => {
    return files.filter((f) => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        toast({ title: "Formato no válido", description: `${f.name} no tiene un formato aceptado.`, variant: "destructive" });
        return false;
      }
      if (f.size > 12 * 1024 * 1024) {
        toast({ title: "Archivo muy grande", description: `${f.name} excede 12MB.`, variant: "destructive" });
        return false;
      }
      return true;
    });
  };

  const addFiles = (files: File[]) => {
    const validFiles = validateFiles(files);
    setAttachedFiles((prev) => mergeUniqueFiles(prev, validFiles));
  };

  const removeFile = (idx: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  useEffect(() => {
    conversationFilesRef.current = conversationFiles;
  }, [conversationFiles]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Send initial greeting when opened
  useEffect(() => {
    if (open && messages.length === 0) {
      sendToAI([]);
    }
  }, [open]);

  const canAttemptItemizadoDetection = (file: File) => {
    const ext = getFileExtension(file);
    return ITEMIZADO_PARSABLE_EXTENSIONS.has(ext);
  };

  const scoreItemizadoCandidate = (file: File) => {
    const ext = getFileExtension(file);
    let score = ITEMIZADO_FILE_KEYWORDS.test(file.name) ? 10 : 0;
    if (['xlsx', 'xls', 'xlsm', 'csv'].includes(ext)) score += 5;
    if (ext === 'pdf') score += 2;
    return score;
  };

  const analyzeAttachment = async (file: File): Promise<AttachmentAnalysis> => {
    const key = getFileKey(file);
    const cached = attachmentAnalysisRef.current[key];
    if (cached) return cached;

    const fallbackAnalysis: AttachmentAnalysis = {
      key,
      file,
      isItemizado: false,
      itemCount: 0,
      parsedItems: [],
    };

    if (!canAttemptItemizadoDetection(file)) {
      attachmentAnalysisRef.current[key] = fallbackAnalysis;
      return fallbackAnalysis;
    }

    try {
      const fileBase64 = await convertFileToBase64(file);
      const { data, error } = await supabase.functions.invoke('parse-itemizado', {
        body: {
          fileBase64,
          fileName: file.name,
          mimeType: file.type,
        },
      });

      if (error || data?.error) {
        attachmentAnalysisRef.current[key] = fallbackAnalysis;
        return fallbackAnalysis;
      }

      const parsedItems = Array.isArray(data?.items) ? data.items as ParsedItem[] : [];
      const itemCount = parsedItems.length;
      const likelyByName = ITEMIZADO_FILE_KEYWORDS.test(file.name);
      const likelyByFormat = ['xlsx', 'xls', 'xlsm', 'csv'].includes(getFileExtension(file));
      const isItemizado = itemCount > 0 && (likelyByName || likelyByFormat || itemCount >= 5);

      const analysis: AttachmentAnalysis = {
        key,
        file,
        isItemizado,
        itemCount,
        parsedItems,
      };

      attachmentAnalysisRef.current[key] = analysis;
      return analysis;
    } catch {
      attachmentAnalysisRef.current[key] = fallbackAnalysis;
      return fallbackAnalysis;
    }
  };

  const getBestAttachmentItemizado = () => {
    return Object.values(attachmentAnalysisRef.current)
      .filter((analysis) => analysis.isItemizado && analysis.itemCount > 0)
      .sort((a, b) => b.itemCount - a.itemCount)[0];
  };

  const buildAttachmentContext = async (files: File[]) => {
    if (files.length === 0) return '';

    const candidates = [...files]
      .filter(canAttemptItemizadoDetection)
      .sort((a, b) => scoreItemizadoCandidate(b) - scoreItemizadoCandidate(a))
      .slice(0, 3);

    await Promise.all(candidates.map(analyzeAttachment));

    const bestItemizado = [...files]
      .map((file) => attachmentAnalysisRef.current[getFileKey(file)])
      .filter((analysis): analysis is AttachmentAnalysis => Boolean(analysis?.isItemizado && analysis.itemCount > 0))
      .sort((a, b) => b.itemCount - a.itemCount)[0];

    const lines = [
      'Contexto de archivos adjuntos del usuario:',
      ...files.map((file) => `- ${file.name}`),
    ];

    if (bestItemizado) {
      lines.push(
        `Se detectó un itemizado/presupuesto en "${bestItemizado.file.name}" con ${bestItemizado.itemCount} partidas aproximadas. No vuelvas a pedir el itemizado base; úsalo como antecedente ya cargado.`
      );
    } else {
      lines.push('Estos archivos ya fueron adjuntados como antecedentes/EETT/documentos de la licitación. No le pidas al usuario que los vuelva a subir.');
    }

    return lines.join('\n');
  };

  const extractLicitacionData = (content: string): NewLicitacion | null => {
    const jsonMatch = content.match(/```json_licitacion\s*([\s\S]*?)```/);
    if (!jsonMatch) return null;

    try {
      const data = JSON.parse(jsonMatch[1]);
      const parsedOferentes = parseOferenteEntries(data.oferentes_emails || data.oferentes || []);
      const attachmentItemizado = getBestAttachmentItemizado();
      const aiItems = normalizeChatItems(data.items || data.itemizado || data.presupuesto || []);
      const attachmentItems = attachmentItemizado ? normalizeChatItems(attachmentItemizado.parsedItems) : [];

      return {
        nombre: data.nombre || '',
        descripcion: data.descripcion || '',
        mensaje_oferentes: data.mensaje_oferentes || '',
        especificaciones: data.especificaciones || '',
        oferentes_emails: parsedOferentes.map(formatOferenteEntry),
        calendario_eventos: normalizeChatCalendarEvents(data.calendario_eventos || data.eventos || data.calendario || []),
        items: aiItems.length > 0 ? aiItems : attachmentItems,
        gastos_generales: normalizePercentNumber(data.gastos_generales ?? data.gg ?? data.gastosGenerales, 0),
        utilidades: normalizePercentNumber(data.utilidades ?? data.utilidad, 0),
        iva_porcentaje: normalizePercentNumber(data.iva_porcentaje ?? data.iva ?? data.ivaPorcentaje, 19),
        divisa: data.divisa || 'CLP',
        documentos: conversationFilesRef.current.map((f) => ({ nombre: f.name, size: f.size, tipo: f.type })),
        documentFiles: conversationFilesRef.current.length > 0 ? conversationFilesRef.current : undefined,
      };
    } catch (e) {
      console.error('Error parsing licitacion JSON:', e);
      return null;
    }
  };

  const handleCreateLicitacion = async (data: NewLicitacion) => {
    setIsCreating(true);
    try {
      const result = await createLicitacion(data);
      if (result) {
        toast({
          title: "¡Licitación creada!",
          description: `La licitación "${data.nombre}" se ha creado exitosamente.`,
        });
        onSuccess?.();
        // Reset and close after a brief delay
        setTimeout(() => {
          setMessages([]);
          setAttachedFiles([]);
          setConversationFiles([]);
          conversationFilesRef.current = [];
          attachmentAnalysisRef.current = {};
          onOpenChange(false);
        }, 1500);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la licitación. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const sendToAI = async (messagesToSend: Message[], alreadyLoading = false) => {
    if (!alreadyLoading) setIsLoading(true);
    let assistantContent = '';

    const upsertAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
        }
        return [...prev, { role: 'assistant', content: assistantContent }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: messagesToSend.map(({ role, content }) => ({ role, content })) }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error('Failed to start stream');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Final flush
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsertAssistant(content);
          } catch { /* ignore */ }
        }
      }

      // Check if assistant response contains licitacion data
      const licitacionData = extractLicitacionData(assistantContent);
      if (licitacionData) {
        await handleCreateLicitacion(licitacionData);
      }
    } catch (error) {
      console.error('Stream error:', error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el asistente. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if ((trimmed.length === 0 && attachedFiles.length === 0) || isLoading || isCreating) return;

    setIsLoading(true);

    try {
      const filesForThisMessage = attachedFiles;
      const attachmentContext = await buildAttachmentContext(filesForThisMessage);
      const displayContent = trimmed || 'Adjunté documentos para esta licitación.';
      const content = [trimmed, attachmentContext].filter(Boolean).join('\n\n').trim() || displayContent;

      const userMsg: Message = {
        role: 'user',
        content,
        displayContent,
        attachments: filesForThisMessage.map((file) => ({ name: file.name })),
      };

      const nextConversationFiles = mergeUniqueFiles(conversationFilesRef.current, filesForThisMessage);
      conversationFilesRef.current = nextConversationFiles;
      setConversationFiles(nextConversationFiles);

      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput('');
      setAttachedFiles([]);

      await sendToAI(newMessages, true);
    } catch (error) {
      console.error('Error preparing chat message:', error);
      toast({
        title: 'Error al preparar adjuntos',
        description: 'No se pudieron procesar los archivos antes de enviarlos.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderMessageContent = (content: string) => {
    // Remove the json_licitacion block from display
    const cleanContent = content.replace(/```json_licitacion[\s\S]*?```/g, '');
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2">
        <ReactMarkdown>{cleanContent}</ReactMarkdown>
      </div>
    );
  };

  const handleClose = (value: boolean) => {
    if (!value) {
      setMessages([]);
      setAttachedFiles([]);
      setConversationFiles([]);
      conversationFilesRef.current = [];
      attachmentAnalysisRef.current = {};
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b bg-primary/5">
          <DialogTitle className="text-lg font-rubik flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Crear Licitación con Asistente IA
          </DialogTitle>
          <DialogDescription className="sr-only">
            Asistente conversacional para crear una licitación con antecedentes, hitos y oferentes.
          </DialogDescription>
        </DialogHeader>

        {/* Messages area */}
        <ScrollArea className="flex-1 px-6" ref={scrollRef}>
          <div className="py-4 space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {msg.role === 'user' ? (
                    <div className="space-y-2">
                      <p className="text-sm whitespace-pre-wrap">{msg.displayContent || msg.content}</p>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {msg.attachments.map((file) => (
                            <span key={file.name} className="inline-flex items-center gap-1 rounded-lg bg-primary-foreground/10 px-2 py-1 text-xs">
                              <FileText className="h-3 w-3" />
                              <span className="max-w-[180px] truncate">{file.name}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    renderMessageContent(msg.content)
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            {isCreating && (
              <div className="flex gap-3 items-center justify-center py-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 animate-pulse" />
                <span className="text-sm text-muted-foreground">Creando licitación...</span>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input area */}
        <div className="border-t px-4 py-3 bg-background">
          {attachedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {attachedFiles.map((f, i) => (
                <div key={i} className="flex items-center gap-1 bg-muted rounded-lg px-2 py-1 text-xs">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  <span className="max-w-[120px] truncate">{f.name}</span>
                  <button onClick={() => removeFile(i)} className="ml-1 text-muted-foreground hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <CompactDropZone
            onFilesSelected={addFiles}
            accept={ALLOWED_EXTENSIONS.join(',')}
            multiple
            maxSizeMB={12}
            disabled={isLoading || isCreating}
            selectedFiles={attachedFiles}
            onRemoveFile={removeFile}
            placeholder="Arrastra antecedentes aquí o haz click para adjuntarlos"
            className="mb-3"
          />
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje o envía solo los archivos..."
              className="min-h-[44px] max-h-[120px] resize-none rounded-xl"
              rows={1}
              disabled={isLoading || isCreating}
            />
            <Button
              onClick={handleSend}
              disabled={(input.trim().length === 0 && attachedFiles.length === 0) || isLoading || isCreating}
              size="icon"
              className="rounded-xl h-[44px] w-[44px] flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LicitacionChat;
