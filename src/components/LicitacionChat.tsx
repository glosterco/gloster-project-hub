import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, Loader2, CheckCircle2, Paperclip, X, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLicitaciones, NewLicitacion } from '@/hooks/useLicitaciones';
import ReactMarkdown from 'react-markdown';

interface LicitacionChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/licitacion-chat`;

const LicitacionChat = ({ open, onOpenChange, onSuccess }: LicitacionChatProps) => {
  const { toast } = useToast();
  const { createLicitacion } = useLicitaciones();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);

  const ALLOWED_EXTENSIONS = [
    '.pdf', '.xls', '.xlsx', '.xlsm', '.csv',
    '.doc', '.docx',
    '.dwg', '.rvt', '.nwd', '.nwf', '.nwc',
    '.jpg', '.jpeg', '.png',
    '.zip', '.rar', '.7z',
    '.ppt', '.pptx',
    '.ifc',
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => {
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
    setAttachedFiles(prev => [...prev, ...valid]);
    if (e.target) e.target.value = '';
  };

  const removeFile = (idx: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
  };

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

  const extractLicitacionData = (content: string): NewLicitacion | null => {
    const jsonMatch = content.match(/```json_licitacion\s*([\s\S]*?)```/);
    if (!jsonMatch) return null;

    try {
      const data = JSON.parse(jsonMatch[1]);
      return {
        nombre: data.nombre || '',
        descripcion: data.descripcion || '',
        mensaje_oferentes: data.mensaje_oferentes || '',
        especificaciones: data.especificaciones || '',
        oferentes_emails: data.oferentes_emails || [],
        calendario_eventos: (data.calendario_eventos || []).map((e: any) => ({
          fecha: e.fecha,
          titulo: e.titulo,
          descripcion: e.descripcion,
          requiereArchivos: e.requiereArchivos || false,
          esRondaPreguntas: e.esRondaPreguntas || false,
        })),
        items: data.items || [],
        gastos_generales: data.gastos_generales || 0,
        utilidades: data.utilidades || 0,
        iva_porcentaje: data.iva_porcentaje ?? 19,
        documentos: attachedFiles.map(f => ({ nombre: f.name, size: f.size, tipo: f.type })),
        documentFiles: attachedFiles.length > 0 ? attachedFiles : undefined,
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

  const sendToAI = async (messagesToSend: Message[]) => {
    setIsLoading(true);
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
        body: JSON.stringify({ messages: messagesToSend }),
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
    if (!trimmed || isLoading) return;

    const userMsg: Message = { role: 'user', content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');

    await sendToAI(newMessages);
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
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
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
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ALLOWED_EXTENSIONS.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex gap-2 items-end">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl h-[44px] w-[44px] flex-shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isCreating}
              title="Adjuntar documentos"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje..."
              className="min-h-[44px] max-h-[120px] resize-none rounded-xl"
              rows={1}
              disabled={isLoading || isCreating}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isCreating}
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
