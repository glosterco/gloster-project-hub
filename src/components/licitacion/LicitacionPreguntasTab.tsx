import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MessageSquare, Plus, Send, Eye, Lock, Unlock, Sparkles, BookOpen } from 'lucide-react';
import { Ronda, Pregunta } from '@/hooks/useLicitacionDetail';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  rondas: Ronda[];
  preguntas: Pregunta[];
  onCreateRonda: (titulo: string) => void;
  onCloseRonda: (rondaId: number) => void;
  onOpenRonda: (rondaId: number) => void;
  onAnswerPregunta: (preguntaId: number, respuesta: string) => void;
  onPublishPreguntas: (preguntaIds: number[]) => void;
}

const LicitacionPreguntasTab: React.FC<Props> = ({
  rondas, preguntas, onCreateRonda, onCloseRonda, onOpenRonda,
  onAnswerPregunta, onPublishPreguntas
}) => {
  const [answeringId, setAnsweringId] = useState<number | null>(null);
  const [respuesta, setRespuesta] = useState('');
  const [showIASource, setShowIASource] = useState<Pregunta | null>(null);
  const [selectedForPublish, setSelectedForPublish] = useState<Set<number>>(new Set());

  const preguntasByRonda = (rondaId: number) =>
    preguntas.filter(p => p.ronda_id === rondaId);

  const handleAnswer = (preguntaId: number) => {
    if (!respuesta.trim()) return;
    onAnswerPregunta(preguntaId, respuesta);
    setAnsweringId(null);
    setRespuesta('');
  };

  const handlePublishSelected = (rondaId: number) => {
    const rondaPreguntas = preguntasByRonda(rondaId);
    const toPublish = rondaPreguntas
      .filter(p => p.respondida && selectedForPublish.has(p.id))
      .map(p => p.id);
    if (toPublish.length > 0) {
      onPublishPreguntas(toPublish);
      setSelectedForPublish(new Set());
    }
  };

  const togglePublishSelect = (id: number) => {
    const next = new Set(selectedForPublish);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedForPublish(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold font-rubik flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Rondas de Consultas ({rondas.length})
        </h3>
        <Button size="sm" onClick={() => onCreateRonda(`Ronda ${rondas.length + 1}`)}>
          <Plus className="h-4 w-4 mr-1" /> Nueva Ronda
        </Button>
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
          const rondaPreguntas = preguntasByRonda(ronda.id);
          const respondidas = rondaPreguntas.filter(p => p.respondida).length;

          return (
            <Card key={ronda.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-rubik flex items-center gap-2">
                    {ronda.titulo}
                    <Badge variant={ronda.estado === 'abierta' ? 'default' : 'secondary'}>
                      {ronda.estado === 'abierta' ? 'Abierta' : 'Cerrada'}
                    </Badge>
                    <span className="text-sm font-normal text-muted-foreground">
                      {respondidas}/{rondaPreguntas.length} respondidas
                    </span>
                  </CardTitle>
                  <div className="flex gap-2">
                    {ronda.estado === 'abierta' ? (
                      <Button variant="outline" size="sm" onClick={() => onCloseRonda(ronda.id)}>
                        <Lock className="h-3.5 w-3.5 mr-1" /> Cerrar
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => onOpenRonda(ronda.id)}>
                        <Unlock className="h-3.5 w-3.5 mr-1" /> Reabrir
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      onClick={() => handlePublishSelected(ronda.id)}
                      disabled={selectedForPublish.size === 0}
                    >
                      <Eye className="h-3.5 w-3.5 mr-1" /> Publicar Selección
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {rondaPreguntas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aún no hay preguntas en esta ronda
                  </p>
                ) : (
                  <div className="space-y-3">
                    {rondaPreguntas.map(p => (
                      <div key={p.id} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
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
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(new Date(p.created_at), "d MMM yyyy HH:mm", { locale: es })}
                              {/* Oferente identity hidden for transparency */}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {!p.respondida && (
                              <input
                                type="checkbox"
                                className="mr-1"
                                checked={selectedForPublish.has(p.id)}
                                onChange={() => togglePublishSelect(p.id)}
                              />
                            )}
                            {p.respondida && !p.publicada && (
                              <input
                                type="checkbox"
                                checked={selectedForPublish.has(p.id)}
                                onChange={() => togglePublishSelect(p.id)}
                              />
                            )}
                          </div>
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
                            <p className="text-xs text-foreground">{p.respuesta_ia}</p>
                          </div>
                        )}

                        {/* Answer */}
                        {p.respuesta && (
                          <div className="bg-muted/50 rounded-md p-2">
                            <p className="text-xs font-medium text-muted-foreground mb-0.5">Respuesta:</p>
                            <p className="text-sm">{p.respuesta}</p>
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
                              defaultValue={p.respuesta_ia || ''}
                            />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleAnswer(p.id)}>
                                <Send className="h-3.5 w-3.5 mr-1" /> Responder
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setAnsweringId(null)}>
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
                            }}
                          >
                            Responder
                          </Button>
                        ) : null}
                      </div>
                    ))}
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
