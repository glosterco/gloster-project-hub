import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, Loader2, MessageSquare, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ParsedItem } from '@/hooks/useParseItemizado';
import ReactMarkdown from 'react-markdown';

type Message = { role: 'user' | 'assistant'; content: string };

interface ItemizadoChatbotProps {
  licitacionNombre?: string;
  licitacionDescripcion?: string;
  licitacionEspecificaciones?: string;
  existingItems?: { descripcion: string; unidad: string; cantidad: number | null; precio_unitario: number | null }[];
  onItemsGenerated: (items: ParsedItem[]) => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/itemizado-chat`;

const ItemizadoChatbot: React.FC<ItemizadoChatbotProps> = ({
  licitacionNombre,
  licitacionDescripcion,
  licitacionEspecificaciones,
  existingItems,
  onItemsGenerated,
}) => {
  const { toast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const buildContext = () => {
    const parts: string[] = [];
    if (licitacionNombre) parts.push(`Nombre: ${licitacionNombre}`);
    if (licitacionDescripcion) parts.push(`Descripción/Alcance: ${licitacionDescripcion}`);
    if (licitacionEspecificaciones) parts.push(`Especificaciones técnicas: ${licitacionEspecificaciones}`);
    if (existingItems && existingItems.length > 0) {
      parts.push(`Itemizado base de la licitación (${existingItems.length} partidas):`);
      existingItems.forEach((item, i) => {
        parts.push(`  ${i + 1}. ${item.descripcion} | Unidad: ${item.unidad || '-'} | Cantidad: ${item.cantidad ?? '-'} | P.U.: ${item.precio_unitario ?? '-'}`);
      });
    }
    return parts.join('\n') || 'No hay información adicional de la licitación.';
  };

  const extractItemizado = (content: string): ParsedItem[] | null => {
    const match = content.match(/```json_itemizado\s*([\s\S]*?)```/);
    if (!match) return null;
    try {
      const data = JSON.parse(match[1]);
      if (!Array.isArray(data)) return null;
      return data.map((item: any, idx: number) => ({
        descripcion: item.descripcion || '',
        unidad: item.unidad || 'gl',
        cantidad: item.cantidad || 0,
        precio_unitario: item.precio_unitario || 0,
        precio_total: item.precio_total || (item.cantidad || 0) * (item.precio_unitario || 0),
        orden: item.orden || idx + 1,
      }));
    } catch {
      return null;
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
        body: JSON.stringify({
          messages: messagesToSend,
          licitacionContext: buildContext(),
        }),
      });

      if (!resp.ok || !resp.body) throw new Error('Failed to start stream');

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
          if (jsonStr === '[DONE]') { streamDone = true; break; }
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

      const items = extractItemizado(assistantContent);
      if (items && items.length > 0) {
        onItemsGenerated(items);
        toast({ title: 'Itemizado generado', description: `${items.length} partidas listas para agregar.` });
      }
    } catch (error) {
      console.error('Stream error:', error);
      toast({ title: 'Error', description: 'No se pudo conectar con el asistente.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpand = () => {
    setExpanded(true);
    if (!initialized) {
      setInitialized(true);
      sendToAI([]);
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

  const renderContent = (content: string) => {
    const clean = content.replace(/```json_itemizado[\s\S]*?```/g, '');
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-2 [&>ul]:mb-2 [&>ol]:mb-2">
        <ReactMarkdown>{clean}</ReactMarkdown>
      </div>
    );
  };

  if (!expanded) {
    return (
      <Card className="border-dashed border-primary/30 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors" onClick={handleExpand}>
        <CardContent className="flex items-center gap-3 py-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">Asistente IA para Itemizado</p>
            <p className="text-xs text-muted-foreground">
              ¿Necesitas ayuda para armar tu presupuesto? El asistente te guiará paso a paso.
            </p>
          </div>
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base font-rubik">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Asistente IA para Itemizado
          </div>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(false)}>
            <ChevronUp className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <ScrollArea className="h-[350px] pr-3" ref={scrollRef}>
          <div className="space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mt-1">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                  msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : renderContent(msg.content)}
                </div>
                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center mt-1">
                    <User className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="bg-muted rounded-xl px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 items-end border-t pt-3">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe las partidas que necesitas..."
            className="min-h-[40px] max-h-[100px] resize-none rounded-xl text-sm"
            rows={1}
            disabled={isLoading}
          />
          <Button onClick={handleSend} disabled={!input.trim() || isLoading} size="icon" className="rounded-xl h-[40px] w-[40px] flex-shrink-0">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ItemizadoChatbot;
