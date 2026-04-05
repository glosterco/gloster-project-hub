import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  FileText, Calendar, MessageSquare, ExternalLink, Plus, Send, Trash2,
  Clock, CheckCircle, Lock, Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const LicitacionAcceso = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { toast } = useToast();

  const [licitacion, setLicitacion] = useState<any>(null);
  const [rondas, setRondas] = useState<any[]>([]);
  const [misPreguntas, setMisPreguntas] = useState<any[]>([]);
  const [preguntasPublicadas, setPreguntasPublicadas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [oferenteEmail, setOferenteEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Draft question state
  const [newPregunta, setNewPregunta] = useState('');
  const [newEspecialidad, setNewEspecialidad] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [selectedRondaId, setSelectedRondaId] = useState<number | null>(null);

  const licitacionId = id ? parseInt(id) : null;

  const fetchData = useCallback(async () => {
    if (!licitacionId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Licitaciones')
        .select(`
          id, nombre, descripcion, mensaje_oferentes, estado, url_acceso,
          LicitacionEventos(id, fecha, titulo, descripcion, estado, es_ronda_preguntas),
          LicitacionDocumentos(id, nombre, size, tipo, url),
          LicitacionItems(id, descripcion, unidad, cantidad, orden)
        `)
        .eq('id', licitacionId)
        .single();

      if (error) throw error;
      setLicitacion(data);

      // Fetch rondas
      const { data: rondasData } = await supabase
        .from('LicitacionRondas')
        .select('*')
        .eq('licitacion_id', licitacionId)
        .order('numero');
      setRondas(rondasData || []);

      // Fetch published questions (visible to all)
      const { data: publicadas } = await supabase
        .from('LicitacionPreguntas')
        .select('*')
        .eq('licitacion_id', licitacionId)
        .eq('publicada', true)
        .order('created_at');
      setPreguntasPublicadas(publicadas || []);

      // Fetch my questions if email verified
      if (emailVerified && oferenteEmail) {
        const { data: mias } = await supabase
          .from('LicitacionPreguntas')
          .select('*')
          .eq('licitacion_id', licitacionId)
          .eq('oferente_email', oferenteEmail.toLowerCase())
          .order('created_at');
        setMisPreguntas(mias || []);
      }
    } catch (err: any) {
      console.error('Error loading licitacion:', err);
    } finally {
      setLoading(false);
    }
  }, [licitacionId, emailVerified, oferenteEmail]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const verifyEmail = async () => {
    if (!oferenteEmail.trim() || !licitacionId) return;
    setVerifying(true);
    try {
      // Check if this email is a registered oferente
      const { data } = await supabase
        .from('LicitacionOferentes')
        .select('id')
        .eq('licitacion_id', licitacionId)
        .eq('email', oferenteEmail.toLowerCase().trim())
        .maybeSingle();

      if (data) {
        setEmailVerified(true);
        toast({ title: "Email verificado", description: "Puedes participar en las rondas de consultas" });
        // Re-fetch to get my questions
        setTimeout(fetchData, 100);
      } else {
        toast({
          title: "Email no registrado",
          description: "Este email no está invitado a esta licitación",
          variant: "destructive"
        });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  const saveDraftQuestion = async (rondaId: number) => {
    if (!newPregunta.trim() || !licitacionId || !oferenteEmail) return;
    setSavingDraft(true);
    try {
      const { error } = await supabase.from('LicitacionPreguntas').insert({
        licitacion_id: licitacionId,
        ronda_id: rondaId,
        oferente_email: oferenteEmail.toLowerCase().trim(),
        pregunta: newPregunta.trim(),
        especialidad: newEspecialidad.trim() || null,
        enviada: false,
      });
      if (error) throw error;
      setNewPregunta('');
      setNewEspecialidad('');
      toast({ title: "Consulta guardada como borrador" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingDraft(false);
    }
  };

  const deleteDraft = async (preguntaId: number) => {
    try {
      const { error } = await supabase
        .from('LicitacionPreguntas')
        .delete()
        .eq('id', preguntaId)
        .eq('enviada', false);
      if (error) throw error;
      toast({ title: "Borrador eliminado" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const sendAllDrafts = async (rondaId: number) => {
    setSendingAll(true);
    try {
      const drafts = misPreguntas.filter(p => p.ronda_id === rondaId && !p.enviada);
      if (drafts.length === 0) return;

      const { error } = await supabase
        .from('LicitacionPreguntas')
        .update({ enviada: true })
        .in('id', drafts.map(d => d.id));

      if (error) throw error;
      toast({
        title: "Consultas enviadas",
        description: `${drafts.length} consulta(s) enviadas al mandante`
      });
      setShowSendConfirm(false);
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSendingAll(false);
    }
  };

  const getDraftsForRonda = (rondaId: number) =>
    misPreguntas.filter(p => p.ronda_id === rondaId && !p.enviada);

  const getSentForRonda = (rondaId: number) =>
    misPreguntas.filter(p => p.ronda_id === rondaId && p.enviada);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (!licitacion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Licitación no encontrada o enlace inválido.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">Portal del Oferente</Badge>
            <Badge variant={licitacion.estado === 'abierta' ? 'default' : 'secondary'}>
              {licitacion.estado?.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold font-rubik">{licitacion.nombre}</h1>
          <p className="text-muted-foreground mt-1">{licitacion.descripcion}</p>
          {licitacion.mensaje_oferentes && (
            <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-lg text-sm">
              {licitacion.mensaje_oferentes}
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Email verification */}
        {!emailVerified && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-base">Verificar identidad</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Ingresa tu email para participar en las rondas de consultas.
              </p>
              <div className="flex gap-2 max-w-md">
                <Input
                  type="email"
                  placeholder="tu@empresa.com"
                  value={oferenteEmail}
                  onChange={e => setOferenteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && verifyEmail()}
                />
                <Button onClick={verifyEmail} disabled={verifying}>
                  {verifying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Verificar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="documentos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="documentos" className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> Documentos
            </TabsTrigger>
            <TabsTrigger value="calendario" className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> Calendario
            </TabsTrigger>
            <TabsTrigger value="consultas" className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" /> Consultas
            </TabsTrigger>
          </TabsList>

          {/* Documents Tab */}
          <TabsContent value="documentos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-rubik">
                  <FileText className="h-5 w-5" />
                  Documentos y Antecedentes ({licitacion.LicitacionDocumentos?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(!licitacion.LicitacionDocumentos || licitacion.LicitacionDocumentos.length === 0) ? (
                  <p className="text-center text-muted-foreground py-8">No hay documentos disponibles aún.</p>
                ) : (
                  <div className="space-y-2">
                    {licitacion.LicitacionDocumentos.map((doc: any) => (
                      <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                        <span className="text-xl">📄</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{doc.nombre}</p>
                          {doc.size && (
                            <p className="text-xs text-muted-foreground">
                              {doc.size < 1048576 ? `${(doc.size / 1024).toFixed(1)} KB` : `${(doc.size / 1048576).toFixed(1)} MB`}
                            </p>
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
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendario">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-rubik">
                  <Calendar className="h-5 w-5" />
                  Calendario de Eventos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(!licitacion.LicitacionEventos || licitacion.LicitacionEventos.length === 0) ? (
                  <p className="text-center text-muted-foreground py-8">No hay eventos programados.</p>
                ) : (
                  <div className="space-y-3">
                    {licitacion.LicitacionEventos
                      .sort((a: any, b: any) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
                      .map((evento: any) => (
                        <div key={evento.id} className="flex items-start gap-3 p-3 rounded-lg border">
                          <div className="flex-shrink-0 w-16 text-center">
                            <div className="text-lg font-bold">{format(new Date(evento.fecha), 'd')}</div>
                            <div className="text-xs text-muted-foreground uppercase">
                              {format(new Date(evento.fecha), 'MMM yyyy', { locale: es })}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{evento.titulo}</p>
                              {evento.es_ronda_preguntas && (
                                <Badge variant="outline" className="text-[10px]">Ronda de consultas</Badge>
                              )}
                              <Badge variant={evento.estado === 'completado' ? 'secondary' : 'default'} className="text-[10px]">
                                {evento.estado === 'completado' ? 'Finalizado' : 'Pendiente'}
                              </Badge>
                            </div>
                            {evento.descripcion && (
                              <p className="text-xs text-muted-foreground mt-1">{evento.descripcion}</p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Consultas Tab */}
          <TabsContent value="consultas">
            <div className="space-y-6">
              {/* Published Q&A */}
              {preguntasPublicadas.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-rubik flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                      Respuestas Publicadas ({preguntasPublicadas.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {preguntasPublicadas.map(p => (
                      <div key={p.id} className="border rounded-lg p-3 space-y-2">
                        {p.especialidad && (
                          <Badge variant="outline" className="text-[10px]">{p.especialidad}</Badge>
                        )}
                        <p className="text-sm font-medium">{p.pregunta}</p>
                        {p.respuesta && (
                          <div className="bg-muted/50 rounded-md p-2">
                            <p className="text-xs font-medium text-muted-foreground mb-0.5">Respuesta:</p>
                            <p className="text-sm">{p.respuesta}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* My questions per ronda */}
              {emailVerified ? (
                rondas.map(ronda => {
                  const isOpen = ronda.estado === 'abierta';
                  const drafts = getDraftsForRonda(ronda.id);
                  const sent = getSentForRonda(ronda.id);
                  const deadline = ronda.fecha_cierre
                    ? format(new Date(ronda.fecha_cierre), "d MMM yyyy HH:mm", { locale: es })
                    : null;

                  return (
                    <Card key={ronda.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base font-rubik flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            {ronda.titulo}
                            <Badge variant={isOpen ? 'default' : 'secondary'}>
                              {isOpen ? 'Abierta' : 'Cerrada'}
                            </Badge>
                          </CardTitle>
                          {deadline && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Cierre: {deadline}
                            </span>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Sent questions */}
                        {sent.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Enviadas ({sent.length})
                            </p>
                            {sent.map(p => (
                              <div key={p.id} className="border rounded-lg p-3 bg-emerald-50 dark:bg-emerald-950/20">
                                <div className="flex items-center gap-2 mb-1">
                                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                  <span className="text-[10px] text-emerald-600 font-medium">Enviada</span>
                                  {p.especialidad && (
                                    <Badge variant="outline" className="text-[10px]">{p.especialidad}</Badge>
                                  )}
                                </div>
                                <p className="text-sm">{p.pregunta}</p>
                                {p.respuesta && p.publicada && (
                                  <div className="bg-muted/50 rounded-md p-2 mt-2">
                                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Respuesta:</p>
                                    <p className="text-sm">{p.respuesta}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Draft questions */}
                        {drafts.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                              Borradores ({drafts.length})
                            </p>
                            {drafts.map(p => (
                              <div key={p.id} className="border border-dashed rounded-lg p-3 bg-amber-50/50 dark:bg-amber-950/10">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600">
                                        Borrador
                                      </Badge>
                                      {p.especialidad && (
                                        <Badge variant="outline" className="text-[10px]">{p.especialidad}</Badge>
                                      )}
                                    </div>
                                    <p className="text-sm">{p.pregunta}</p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => deleteDraft(p.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}

                            {/* Send all drafts button */}
                            <Button
                              className="w-full"
                              onClick={() => {
                                setSelectedRondaId(ronda.id);
                                setShowSendConfirm(true);
                              }}
                            >
                              <Send className="h-4 w-4 mr-2" />
                              Enviar {drafts.length} consulta(s) al mandante
                            </Button>
                          </div>
                        )}

                        {/* New question form */}
                        {isOpen ? (
                          <div className="border-t pt-4 space-y-3">
                            <p className="text-sm font-medium">Nueva consulta</p>
                            <Input
                              placeholder="Especialidad (opcional)"
                              value={newEspecialidad}
                              onChange={e => setNewEspecialidad(e.target.value)}
                              className="text-sm"
                            />
                            <Textarea
                              placeholder="Escribe tu consulta aquí..."
                              value={newPregunta}
                              onChange={e => setNewPregunta(e.target.value)}
                              className="text-sm"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => saveDraftQuestion(ronda.id)}
                              disabled={savingDraft || !newPregunta.trim()}
                            >
                              {savingDraft ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4 mr-1" />
                              )}
                              Guardar borrador
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              Las consultas se guardan como borrador. Envíalas todas juntas cuando estés listo.
                            </p>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground">
                            <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Esta ronda de consultas está cerrada</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Verifica tu email para participar en las rondas de consultas.</p>
                  </CardContent>
                </Card>
              )}

              {emailVerified && rondas.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No hay rondas de consultas activas.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Send confirmation dialog */}
      <AlertDialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enviar consultas</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedRondaId && (
                <>
                  Estás a punto de enviar <strong>{getDraftsForRonda(selectedRondaId).length} consulta(s)</strong> al mandante.
                  Una vez enviadas, no podrás modificarlas ni eliminarlas.
                  <br /><br />
                  ¿Deseas continuar?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={sendingAll}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedRondaId && sendAllDrafts(selectedRondaId)}
              disabled={sendingAll}
            >
              {sendingAll ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              Enviar consultas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LicitacionAcceso;
