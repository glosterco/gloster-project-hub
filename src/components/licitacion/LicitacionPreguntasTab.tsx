import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, Send, Eye, Lock, Unlock, Sparkles, BookOpen, Clock, Paperclip, FileText, ExternalLink, Loader2 } from 'lucide-react';
import { Ronda, Pregunta } from '@/hooks/useLicitacionDetail';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Props {
  rondas: Ronda[];
  preguntas: Pregunta[];
  licitacionId: number;
  onCreateRonda: (titulo: string) => void;
  onCloseRonda: (rondaId: number) => void;
  onOpenRonda: (rondaId: number) => void;
  onAnswerPregunta: (preguntaId: number, respuesta: string, adjuntoUrl?: string, adjuntoNombre?: string) => void;
  onPublishPreguntas: (preguntaIds: number[]) => void;
  onRefetch: () => void;
}

const LicitacionPreguntasTab: React.FC<Props> = ({
  rondas, preguntas, licitacionId, onCloseRonda, onOpenRonda,
  onAnswerPregunta, onPublishPreguntas, onRefetch
}) => {
  const { toast } = useToast();
  const [answeringId, setAnsweringId] = useState<number | null>(null);
  const [respuesta, setRespuesta] = useState('');
  const [respuestaFile, setRespuestaFile] = useState<File | null>(null);
  const [showIASource, setShowIASource] = useState<Pregunta | null>(null);
  const [generatingIA, setGeneratingIA] = useState<number | null>(null);

  const sentPreguntasByRonda = (rondaId: number) =>
    preguntas.filter(p => p.ronda_id === rondaId && p.enviada);

  const draftPreguntasByRonda = (rondaId: number) =>
    preguntas.filter(p => p.ronda_id === rondaId && !p.enviada);

  const handleAnswer = async (preguntaId: number) => {
    if (!respuesta.trim()) return;
    // For now, pass answer text (file upload to Drive can be added later)
    onAnswerPregunta(preguntaId, respuesta);
    setAnsweringId(null);
    setRespuesta('');
    setRespuestaFile(null);
  };

  const handlePublishAll = (rondaId: number) => {
    const rondaPreguntas = sentPreguntasByRonda(rondaId);
    const toPublish = rondaPreguntas
      .filter(p => p.respondida && !p.publicada)
      .map(p => p.id);
    if (toPublish.length > 0) {
      onPublishPreguntas(toPublish);
    }
  };

  const generateIAPreAnswer = async (preguntaId: number) => {
    setGeneratingIA(preguntaId);
    try {
      const { data, error } = await supabase.functions.invoke('licitacion-pregunta-ia', {
        body: { preguntaId, licitacionId },
      });
      if (error) throw error;
      toast({ title: "Pre-respuesta generada", description: "La IA ha generado una sugerencia de respuesta" });
      onRefetch();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "No se pudo generar la pre-respuesta", variant: "destructive" });
    } finally {
      setGeneratingIA(null);
    }
  };

  const renderPreguntaCard = (p: Pregunta) => (
    <div key={p.id} className="border rounded-lg p-3 space-y-2">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {p.especialidad && (
              <Badge variant="outline" className="text-[10px]">{p.especialidad}</Badge>
            )}
            {p.respondida && <Badge className="text-[10px] bg-emerald-500">Respondida</Badge>}
            {p.publicada && <Badge variant="secondary" className="text-[10px]">Publicada</Badge>}
            {p.respuesta_ia && (
              <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600">
                <Sparkles className="h-2.5 w-2.5 mr-0.5" /> Pre-respuesta IA
              </Badge>
            )}
          </div>
          <p className="text-sm font-medium">{p.pregunta}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <p className="text-xs text-muted-foreground">
              {format(new Date(p.created_at), "d MMM yyyy HH:mm", { locale: es })}
            </p>
            <Badge variant="outline" className="text-[9px] font-normal">
              {p.oferente_email}
            </Badge>
          </div>
          {/* Oferente attachment */}
          {p.adjunto_url && (
            <a href={p.adjunto_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-1 text-xs text-primary hover:underline">
              <Paperclip className="h-3 w-3" />
              {p.adjunto_nombre || 'Archivo adjunto'}
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>

        {/* Generate AI button */}
        {!p.respondida && !p.respuesta_ia && (
          <Button
            variant="outline"
            size="sm"
            className="ml-2 shrink-0"
            onClick={() => generateIAPreAnswer(p.id)}
            disabled={generatingIA === p.id}
          >
            {generatingIA === p.id ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span className="ml-1 text-xs">IA</span>
          </Button>
        )}
      </div>

      {/* AI pre-answer */}
      {p.respuesta_ia && !p.respondida && (
        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-md p-2 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Sugerencia IA
            </span>
            {p.respuesta_ia_fuentes && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => setShowIASource(p)}
              >
                <BookOpen className="h-3 w-3 mr-1" /> Ver fuentes
              </Button>
            )}
          </div>
          <p className="text-xs text-foreground whitespace-pre-wrap">{p.respuesta_ia}</p>
        </div>
      )}

      {/* Answer */}
      {p.respuesta && (
        <div className="bg-muted/50 rounded-md p-2">
          <p className="text-xs font-medium text-muted-foreground mb-0.5">Respuesta:</p>
          <p className="text-sm">{p.respuesta}</p>
          {p.respuesta_adjunto_url && (
            <a href={p.respuesta_adjunto_url} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-1 text-xs text-primary hover:underline">
              <FileText className="h-3 w-3" />
              {p.respuesta_adjunto_nombre || 'Archivo adjunto'}
              <ExternalLink className="h-2.5 w-2.5" />
            </a>
          )}
        </div>
      )}

      {/* Answer form */}
      {!p.respondida && answeringId === p.id ? (
        <div className="space-y-2">
          <Textarea
            value={respuesta}
            onChange={e => setRespuesta(e.target.value)}
            placeholder="Escribir respuesta..."
            className="text-sm"
          />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Input
              type="file"
              className="text-xs h-8"
              onChange={(e) => setRespuestaFile(e.target.files?.[0] || null)}
            />
            {respuestaFile && <span className="truncate max-w-[150px]">{respuestaFile.name}</span>}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleAnswer(p.id)}>
              <Send className="h-3.5 w-3.5 mr-1" /> Responder
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setAnsweringId(null); setRespuestaFile(null); }}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : !p.respondida ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setAnsweringId(p.id);
            setRespuesta(p.respuesta_ia || '');
            setRespuestaFile(null);
          }}
        >
          Responder
        </Button>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold font-rubik flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Rondas de Consultas ({rondas.length})
        </h3>
      </div>

      {rondas.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No hay rondas de consultas. Se crean automáticamente desde el calendario.</p>
          </CardContent>
        </Card>
      ) : (
        rondas.map(ronda => {
          const sent = sentPreguntasByRonda(ronda.id);
          const drafts = draftPreguntasByRonda(ronda.id);
          const respondidas = sent.filter(p => p.respondida).length;
          const allAnswered = sent.length > 0 && respondidas === sent.length;
          const unpublished = sent.filter(p => p.respondida && !p.publicada).length;

          return (
            <Card key={ronda.id}>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base font-rubik flex items-center gap-2">
                    {ronda.titulo}
                    <Badge variant={ronda.estado === 'abierta' ? 'default' : 'secondary'}>
                      {ronda.estado === 'abierta' ? 'Abierta' : ronda.estado === 'programada' ? 'Programada' : 'Cerrada'}
                    </Badge>
                    <span className="text-sm font-normal text-muted-foreground">
                      {respondidas}/{sent.length} respondidas
                    </span>
                  </CardTitle>
                  <div className="flex gap-2">
                    {ronda.estado === 'abierta' ? (
                      <Button variant="outline" size="sm" onClick={() => onCloseRonda(ronda.id)}>
                        <Lock className="h-3.5 w-3.5 mr-1" /> Cerrar
                      </Button>
                    ) : ronda.estado === 'cerrada' ? (
                      <Button variant="outline" size="sm" onClick={() => onOpenRonda(ronda.id)}>
                        <Unlock className="h-3.5 w-3.5 mr-1" /> Reabrir
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      onClick={() => handlePublishAll(ronda.id)}
                      disabled={!allAnswered || unpublished === 0}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" /> Publicar Respuestas
                      {unpublished > 0 && ` (${unpublished})`}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {sent.length === 0 && drafts.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aún no hay consultas en esta ronda
                  </p>
                ) : (
                  <div className="space-y-4">
                    {sent.length > 0 && (
                      <div className="space-y-3">
                        {sent.map(p => renderPreguntaCard(p))}
                      </div>
                    )}

                    {drafts.length > 0 && (
                      <div className="border rounded-lg p-3 bg-muted/30">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <p className="text-sm">
                            {drafts.length} consulta(s) en borrador por oferentes (aún no enviadas)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })
      )}

      {/* IA Source Dialog */}
      <Dialog open={!!showIASource} onOpenChange={() => setShowIASource(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> Fuentes de la Pre-respuesta
            </DialogTitle>
          </DialogHeader>
          {showIASource?.respuesta_ia_fuentes && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {(Array.isArray(showIASource.respuesta_ia_fuentes)
                ? showIASource.respuesta_ia_fuentes
                : [showIASource.respuesta_ia_fuentes]
              ).map((fuente: any, idx: number) => (
                <div key={idx} className="border rounded-lg p-3 bg-amber-50 dark:bg-amber-950/20">
                  {fuente.documento && (
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">
                      📄 {fuente.documento}
                    </p>
                  )}
                  <p className="text-sm italic border-l-2 border-amber-400 pl-2">
                    "{fuente.extracto || fuente.text || JSON.stringify(fuente)}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LicitacionPreguntasTab;