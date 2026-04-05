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
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  FileText, Calendar, MessageSquare, ExternalLink, Plus, Send, Trash2,
  Clock, CheckCircle, Lock, Loader2, ListOrdered, BarChart3, Mail,
  Edit2, Save, X, Upload
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
  const [oferenteRecord, setOferenteRecord] = useState<any>(null);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [miOferta, setMiOferta] = useState<any>(null);
  const [miOfertaItems, setMiOfertaItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [oferenteEmail, setOferenteEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  // Draft question state
  const [newPregunta, setNewPregunta] = useState('');
  const [newEspecialidad, setNewEspecialidad] = useState('');
  const [savingDraft, setSavingDraft] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [selectedRondaId, setSelectedRondaId] = useState<number | null>(null);

  // Edit draft state
  const [editingDraftId, setEditingDraftId] = useState<number | null>(null);
  const [editingDraftText, setEditingDraftText] = useState('');
  const [editingDraftEsp, setEditingDraftEsp] = useState('');

  // Invitation acceptance
  const [acceptingInvitation, setAcceptingInvitation] = useState(false);
  const [acceptName, setAcceptName] = useState('');

  // New item state
  const [showNewItemForm, setShowNewItemForm] = useState(false);
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemUnidad, setNewItemUnidad] = useState('');
  const [newItemCantidad, setNewItemCantidad] = useState('');
  const [newItemPU, setNewItemPU] = useState('');
  const [savingItem, setSavingItem] = useState(false);

  // Oferta final state
  const [ofertaDuracion, setOfertaDuracion] = useState('');
  const [ofertaNotas, setOfertaNotas] = useState('');
  const [savingOferta, setSavingOferta] = useState(false);
  const [sendingItemizado, setSendingItemizado] = useState(false);

  const licitacionId = id ? parseInt(id) : null;

  const fetchData = useCallback(async () => {
    if (!licitacionId || !emailVerified) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Licitaciones')
        .select(`
          id, nombre, descripcion, mensaje_oferentes, estado, url_acceso, gastos_generales, iva_porcentaje,
          LicitacionEventos(id, fecha, titulo, descripcion, estado, es_ronda_preguntas),
          LicitacionDocumentos(id, nombre, size, tipo, url),
          LicitacionItems(id, descripcion, unidad, cantidad, precio_unitario, precio_total, orden, agregado_por_oferente, oferente_email)
        `)
        .eq('id', licitacionId)
        .single();

      if (error) throw error;
      setLicitacion(data);
      setAllItems(data.LicitacionItems || []);

      // Fetch oferente record for invitation acceptance
      const { data: ofRecord } = await supabase
        .from('LicitacionOferentes')
        .select('*')
        .eq('licitacion_id', licitacionId)
        .eq('email', oferenteEmail.toLowerCase().trim())
        .maybeSingle();
      setOferenteRecord(ofRecord);

      // Fetch rondas
      const { data: rondasData } = await supabase
        .from('LicitacionRondas')
        .select('*')
        .eq('licitacion_id', licitacionId)
        .order('numero');
      setRondas(rondasData || []);

      // Fetch published questions
      const { data: publicadas } = await supabase
        .from('LicitacionPreguntas')
        .select('*')
        .eq('licitacion_id', licitacionId)
        .eq('publicada', true)
        .order('created_at');
      setPreguntasPublicadas(publicadas || []);

      // Fetch my questions
      if (oferenteEmail) {
        const { data: mias } = await supabase
          .from('LicitacionPreguntas')
          .select('*')
          .eq('licitacion_id', licitacionId)
          .eq('oferente_email', oferenteEmail.toLowerCase())
          .order('created_at');
        setMisPreguntas(mias || []);
      }

      // Fetch my oferta
      const { data: ofertaData } = await supabase
        .from('LicitacionOfertas')
        .select('*, LicitacionOfertaItems(*)')
        .eq('licitacion_id', licitacionId)
        .eq('oferente_email', oferenteEmail.toLowerCase().trim())
        .maybeSingle();
      
      if (ofertaData) {
        setMiOferta(ofertaData);
        setMiOfertaItems((ofertaData.LicitacionOfertaItems || []).sort((a: any, b: any) => a.orden - b.orden));
        setOfertaDuracion(ofertaData.duracion_dias?.toString() || '');
        setOfertaNotas(ofertaData.notas || '');
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
      const { data } = await supabase
        .from('LicitacionOferentes')
        .select('id')
        .eq('licitacion_id', licitacionId)
        .eq('email', oferenteEmail.toLowerCase().trim())
        .maybeSingle();

      if (data) {
        setEmailVerified(true);
        setVerifyError(null);
        toast({ title: "Email verificado", description: "Acceso concedido a la licitación" });
      } else {
        setVerifyError('Este email no está invitado a esta licitación. Verifica que sea el email correcto.');
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  // === INVITATION ACCEPTANCE ===
  const acceptInvitation = async () => {
    if (!oferenteRecord || !acceptName.trim()) return;
    setAcceptingInvitation(true);
    try {
      const { error } = await supabase
        .from('LicitacionOferentes')
        .update({
          aceptada: true,
          aceptada_at: new Date().toISOString(),
          aceptada_por_nombre: acceptName.trim(),
        })
        .eq('id', oferenteRecord.id);
      if (error) throw error;
      toast({ title: "Invitación aceptada", description: "Se ha registrado tu aceptación" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setAcceptingInvitation(false);
    }
  };

  // === DRAFT QUESTIONS ===
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

  const saveEditDraft = async () => {
    if (!editingDraftId || !editingDraftText.trim()) return;
    try {
      const { error } = await supabase
        .from('LicitacionPreguntas')
        .update({
          pregunta: editingDraftText.trim(),
          especialidad: editingDraftEsp.trim() || null,
        })
        .eq('id', editingDraftId)
        .eq('enviada', false);
      if (error) throw error;
      setEditingDraftId(null);
      toast({ title: "Borrador actualizado" });
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

  // === ITEMIZADO (BIDDER) ===
  const addBidderItem = async () => {
    if (!newItemDesc.trim() || !licitacionId) return;
    setSavingItem(true);
    try {
      const maxOrden = allItems.length > 0 ? Math.max(...allItems.map(i => i.orden || 0)) : 0;
      const cantidad = parseFloat(newItemCantidad) || null;
      const pu = parseFloat(newItemPU) || null;
      const total = cantidad && pu ? cantidad * pu : null;

      const { error } = await supabase.from('LicitacionItems').insert({
        licitacion_id: licitacionId,
        descripcion: newItemDesc.trim(),
        unidad: newItemUnidad.trim() || null,
        cantidad,
        precio_unitario: pu,
        precio_total: total,
        orden: maxOrden + 1,
        agregado_por_oferente: true,
        oferente_email: oferenteEmail.toLowerCase().trim(),
      });
      if (error) throw error;
      setNewItemDesc('');
      setNewItemUnidad('');
      setNewItemCantidad('');
      setNewItemPU('');
      setShowNewItemForm(false);
      toast({ title: "Partida agregada" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingItem(false);
    }
  };

  const deleteBidderItem = async (itemId: number) => {
    try {
      const { error } = await supabase
        .from('LicitacionItems')
        .delete()
        .eq('id', itemId)
        .eq('agregado_por_oferente', true);
      if (error) throw error;
      toast({ title: "Partida eliminada" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  // === ENVIAR ITEMIZADO ===
  const sendItemizado = async () => {
    if (!oferenteRecord) return;
    setSendingItemizado(true);
    try {
      const { error } = await supabase
        .from('LicitacionOferentes')
        .update({
          itemizado_enviado: true,
          itemizado_enviado_at: new Date().toISOString(),
        })
        .eq('id', oferenteRecord.id);
      if (error) throw error;
      toast({ title: "Itemizado enviado", description: "El mandante podrá ver tu itemizado" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSendingItemizado(false);
    }
  };

  const saveOferta = async () => {
    if (!licitacionId) return;
    setSavingOferta(true);
    try {
      // Calculate total from items
      const itemsTotal = allItems.reduce((sum, i) => sum + (i.precio_total || 0), 0);
      const gg = licitacion?.gastos_generales ? itemsTotal * (licitacion.gastos_generales / 100) : 0;
      const neto = itemsTotal + gg;
      const iva = licitacion?.iva_porcentaje ? neto * (licitacion.iva_porcentaje / 100) : 0;
      const total = neto + iva;

      if (miOferta) {
        // Update existing
        const { error } = await supabase
          .from('LicitacionOfertas')
          .update({
            duracion_dias: parseInt(ofertaDuracion) || null,
            notas: ofertaNotas.trim() || null,
            total,
          })
          .eq('id', miOferta.id);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('LicitacionOfertas')
          .insert({
            licitacion_id: licitacionId,
            oferente_email: oferenteEmail.toLowerCase().trim(),
            estado: 'borrador',
            duracion_dias: parseInt(ofertaDuracion) || null,
            notas: ofertaNotas.trim() || null,
            total,
          });
        if (error) throw error;
      }
      toast({ title: "Oferta guardada" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingOferta(false);
    }
  };

  const submitOferta = async () => {
    if (!miOferta) {
      await saveOferta();
      // Need to re-fetch to get the oferta id, then submit
    }
    try {
      const { data: ofertaData } = await supabase
        .from('LicitacionOfertas')
        .select('id')
        .eq('licitacion_id', licitacionId!)
        .eq('oferente_email', oferenteEmail.toLowerCase().trim())
        .maybeSingle();
      
      if (ofertaData) {
        const { error } = await supabase
          .from('LicitacionOfertas')
          .update({ estado: 'enviada' })
          .eq('id', ofertaData.id);
        if (error) throw error;
        toast({ title: "Oferta enviada", description: "Tu oferta ha sido enviada al mandante" });
        fetchData();
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const getDraftsForRonda = (rondaId: number) =>
    misPreguntas.filter(p => p.ronda_id === rondaId && !p.enviada);

  const getSentForRonda = (rondaId: number) =>
    misPreguntas.filter(p => p.ronda_id === rondaId && p.enviada);

  const fmt = (n: number) => n.toLocaleString('es-CL', { minimumFractionDigits: 0 });

  // Compute if send button should be enabled for a ronda
  const canSendForRonda = (ronda: any) => {
    const now = new Date();
    const apertura = new Date(ronda.fecha_apertura);
    return ronda.estado === 'abierta' && now >= apertura;
  };

  const getRondaAperturaText = (ronda: any) => {
    return format(new Date(ronda.fecha_apertura), "d MMM yyyy", { locale: es });
  };

  // === RENDER ===
  if (!emailVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold font-rubik">
              Portal del Oferente
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Ingresa tu email para verificar tu acceso a esta licitación
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@empresa.com"
                  value={oferenteEmail}
                  onChange={e => setOferenteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && verifyEmail()}
                  disabled={verifying}
                />
              </div>
              <Button onClick={verifyEmail} disabled={verifying || !oferenteEmail.trim()} className="w-full">
                {verifying ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Verificando...</> : 'Verificar Acceso'}
              </Button>
              {verifyError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <p className="text-sm text-destructive">{verifyError}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const mandanteItems = allItems.filter(i => !i.agregado_por_oferente).sort((a, b) => a.orden - b.orden);
  const bidderItems = allItems.filter(i => i.agregado_por_oferente && i.oferente_email === oferenteEmail.toLowerCase().trim()).sort((a, b) => a.orden - b.orden);
  const combinedItems = [...mandanteItems, ...bidderItems];
  const subtotal = combinedItems.reduce((sum, i) => sum + (i.precio_total || 0), 0);
  const gg = licitacion.gastos_generales ? subtotal * (licitacion.gastos_generales / 100) : 0;
  const neto = subtotal + gg;
  const iva = licitacion.iva_porcentaje ? neto * (licitacion.iva_porcentaje / 100) : 0;
  const totalOferta = neto + iva;

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
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        <Tabs defaultValue="invitacion" className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="invitacion" className="flex items-center gap-1.5">
              <Mail className="h-4 w-4" /> Invitación
            </TabsTrigger>
            <TabsTrigger value="calendario" className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" /> Calendario
            </TabsTrigger>
            <TabsTrigger value="documentos" className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> Documentos
            </TabsTrigger>
            <TabsTrigger value="consultas" className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" /> Consultas
            </TabsTrigger>
            <TabsTrigger value="itemizado" className="flex items-center gap-1.5">
              <ListOrdered className="h-4 w-4" /> Itemizado
            </TabsTrigger>
            <TabsTrigger value="oferta" className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" /> Oferta Final
            </TabsTrigger>
          </TabsList>

          {/* ===== INVITACIÓN TAB ===== */}
          <TabsContent value="invitacion">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-rubik">
                  <Mail className="h-5 w-5" />
                  Invitación a Licitación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Invitation message */}
                {licitacion.mensaje_oferentes ? (
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <p className="text-sm font-medium text-muted-foreground mb-2">Mensaje del mandante:</p>
                    <p className="text-sm whitespace-pre-wrap">{licitacion.mensaje_oferentes}</p>
                  </div>
                ) : (
                  <div className="p-4 bg-muted/50 rounded-lg border">
                    <p className="text-sm text-muted-foreground">
                      Ha sido invitado a participar en el proceso de licitación "{licitacion.nombre}".
                    </p>
                  </div>
                )}

                {/* Acceptance section */}
                {oferenteRecord?.aceptada ? (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                      <p className="font-medium text-emerald-700 dark:text-emerald-400">Invitación aceptada</p>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>Aceptada por:</strong> {oferenteRecord.aceptada_por_nombre}</p>
                      <p><strong>Fecha:</strong> {format(new Date(oferenteRecord.aceptada_at), "d MMM yyyy, HH:mm", { locale: es })}</p>
                      <p><strong>Email:</strong> {oferenteRecord.email}</p>
                    </div>
                    {oferenteRecord.archivo_aceptacion_url && (
                      <div className="flex items-center gap-2 mt-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <a href={oferenteRecord.archivo_aceptacion_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">
                          {oferenteRecord.archivo_aceptacion_nombre || 'Carta de aceptación'}
                        </a>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="border rounded-lg p-4 space-y-4">
                    <p className="text-sm font-medium">Aceptar invitación</p>
                    <p className="text-xs text-muted-foreground">
                      Al aceptar quedará registrada la fecha, hora y persona que aceptó la invitación.
                      Opcionalmente puede adjuntar una carta formal de aceptación.
                    </p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium">Nombre completo *</label>
                        <Input
                          placeholder="Tu nombre completo"
                          value={acceptName}
                          onChange={e => setAcceptName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Carta de aceptación (opcional)</label>
                        <p className="text-xs text-muted-foreground mb-1">Adjunta un archivo si deseas incluir una carta firmada</p>
                        <Input type="file" className="text-sm" disabled />
                        <p className="text-[10px] text-muted-foreground mt-1">Funcionalidad de carga de archivos próximamente disponible</p>
                      </div>
                      <Button
                        onClick={acceptInvitation}
                        disabled={acceptingInvitation || !acceptName.trim()}
                        className="w-full"
                      >
                        {acceptingInvitation ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Aceptando...</>
                        ) : (
                          <><CheckCircle className="h-4 w-4 mr-2" />Aceptar Invitación</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== CALENDARIO TAB ===== */}
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

          {/* ===== DOCUMENTOS TAB ===== */}
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

          {/* ===== CONSULTAS TAB ===== */}
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
                        {p.especialidad && <Badge variant="outline" className="text-[10px]">{p.especialidad}</Badge>}
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
              {rondas.map(ronda => {
                const isOpen = ronda.estado === 'abierta';
                const drafts = getDraftsForRonda(ronda.id);
                const sent = getSentForRonda(ronda.id);
                const deadline = ronda.fecha_cierre
                  ? format(new Date(ronda.fecha_cierre), "d MMM yyyy HH:mm", { locale: es })
                  : null;
                const canSend = canSendForRonda(ronda);

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
                                {p.especialidad && <Badge variant="outline" className="text-[10px]">{p.especialidad}</Badge>}
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
                              {editingDraftId === p.id ? (
                                <div className="space-y-2">
                                  <Input
                                    value={editingDraftEsp}
                                    onChange={e => setEditingDraftEsp(e.target.value)}
                                    placeholder="Especialidad (opcional)"
                                    className="text-sm"
                                  />
                                  <Textarea
                                    value={editingDraftText}
                                    onChange={e => setEditingDraftText(e.target.value)}
                                    className="text-sm"
                                  />
                                  <div className="flex gap-2">
                                    <Button size="sm" onClick={saveEditDraft}>
                                      <Save className="h-3.5 w-3.5 mr-1" /> Guardar
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditingDraftId(null)}>
                                      <X className="h-3.5 w-3.5 mr-1" /> Cancelar
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-600">
                                        Borrador
                                      </Badge>
                                      {p.especialidad && <Badge variant="outline" className="text-[10px]">{p.especialidad}</Badge>}
                                    </div>
                                    <p className="text-sm">{p.pregunta}</p>
                                  </div>
                                  <div className="flex gap-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingDraftId(p.id);
                                        setEditingDraftText(p.pregunta);
                                        setEditingDraftEsp(p.especialidad || '');
                                      }}
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
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
                              )}
                            </div>
                          ))}

                          {/* Send all drafts button */}
                          <Button
                            className="w-full"
                            disabled={!canSend}
                            onClick={() => {
                              if (canSend) {
                                setSelectedRondaId(ronda.id);
                                setShowSendConfirm(true);
                              }
                            }}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            Enviar {drafts.length} consulta(s) al mandante
                            {!canSend && (
                              <span className="ml-1 text-xs opacity-75">
                                (disponible el {getRondaAperturaText(ronda)})
                              </span>
                            )}
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
                            {savingDraft ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
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
              })}

              {rondas.length === 0 && (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No hay rondas de consultas activas.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ===== ITEMIZADO TAB ===== */}
          <TabsContent value="itemizado">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-rubik">
                  <ListOrdered className="h-5 w-5" />
                  Itemizado ({combinedItems.length} partidas)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {combinedItems.length === 0 && !showNewItemForm ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      {mandanteItems.length === 0
                        ? 'No se definió un itemizado base. Puedes crear tus propias partidas.'
                        : 'No hay partidas definidas.'}
                    </p>
                    <Button variant="outline" onClick={() => setShowNewItemForm(true)}>
                      <Plus className="h-4 w-4 mr-2" /> Agregar partida
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">#</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="text-center w-20">Unidad</TableHead>
                            <TableHead className="text-right w-24">Cantidad</TableHead>
                            <TableHead className="text-right w-32">P. Unitario</TableHead>
                            <TableHead className="text-right w-32">Total</TableHead>
                            <TableHead className="w-16"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mandanteItems.map((item, idx) => (
                            <TableRow key={item.id}>
                              <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                              <TableCell className="font-medium">{item.descripcion}</TableCell>
                              <TableCell className="text-center">{item.unidad || '-'}</TableCell>
                              <TableCell className="text-right">{item.cantidad || '-'}</TableCell>
                              <TableCell className="text-right">{item.precio_unitario ? `$${fmt(item.precio_unitario)}` : '-'}</TableCell>
                              <TableCell className="text-right font-medium">{item.precio_total ? `$${fmt(item.precio_total)}` : '-'}</TableCell>
                              <TableCell />
                            </TableRow>
                          ))}
                          {bidderItems.length > 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="bg-blue-50 dark:bg-blue-950/20 text-center">
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                  Partidas agregadas por oferente
                                </span>
                              </TableCell>
                            </TableRow>
                          )}
                          {bidderItems.map((item, idx) => (
                            <TableRow key={item.id} className="bg-blue-50/30 dark:bg-blue-950/10 border-l-2 border-l-blue-400">
                              <TableCell className="text-muted-foreground">{mandanteItems.length + idx + 1}</TableCell>
                              <TableCell className="font-medium">
                                {item.descripcion}
                                <Badge variant="outline" className="ml-2 text-[9px] border-blue-400 text-blue-600">Nueva</Badge>
                              </TableCell>
                              <TableCell className="text-center">{item.unidad || '-'}</TableCell>
                              <TableCell className="text-right">{item.cantidad || '-'}</TableCell>
                              <TableCell className="text-right">{item.precio_unitario ? `$${fmt(item.precio_unitario)}` : '-'}</TableCell>
                              <TableCell className="text-right font-medium">{item.precio_total ? `$${fmt(item.precio_total)}` : '-'}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteBidderItem(item.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {/* Totals */}
                          <TableRow className="border-t-2">
                            <TableCell colSpan={5} className="text-right font-medium">Subtotal</TableCell>
                            <TableCell className="text-right font-bold">${fmt(subtotal)}</TableCell>
                            <TableCell />
                          </TableRow>
                          {licitacion.gastos_generales > 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-right font-medium">GG ({licitacion.gastos_generales}%)</TableCell>
                              <TableCell className="text-right">${fmt(gg)}</TableCell>
                              <TableCell />
                            </TableRow>
                          )}
                          {licitacion.iva_porcentaje > 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-right font-medium">IVA ({licitacion.iva_porcentaje}%)</TableCell>
                              <TableCell className="text-right">${fmt(iva)}</TableCell>
                              <TableCell />
                            </TableRow>
                          )}
                          <TableRow className="bg-primary/5">
                            <TableCell colSpan={5} className="text-right font-bold text-base">Total</TableCell>
                            <TableCell className="text-right font-bold text-base">${fmt(totalOferta)}</TableCell>
                            <TableCell />
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    {/* Add new item form */}
                    {showNewItemForm ? (
                      <div className="border rounded-lg p-4 space-y-3 bg-blue-50/30 dark:bg-blue-950/10">
                        <p className="text-sm font-medium">Nueva partida</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2">
                            <Input placeholder="Descripción *" value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} />
                          </div>
                          <Input placeholder="Unidad" value={newItemUnidad} onChange={e => setNewItemUnidad(e.target.value)} />
                          <Input placeholder="Cantidad" type="number" value={newItemCantidad} onChange={e => setNewItemCantidad(e.target.value)} />
                          <Input placeholder="Precio Unitario" type="number" value={newItemPU} onChange={e => setNewItemPU(e.target.value)} />
                          <div className="text-sm text-muted-foreground flex items-center">
                            Total: ${fmt((parseFloat(newItemCantidad) || 0) * (parseFloat(newItemPU) || 0))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={addBidderItem} disabled={savingItem || !newItemDesc.trim()}>
                            {savingItem ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                            Agregar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setShowNewItemForm(false)}>Cancelar</Button>
                        </div>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => setShowNewItemForm(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Agregar partida
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== OFERTA FINAL TAB ===== */}
          <TabsContent value="oferta">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-rubik">
                  <BarChart3 className="h-5 w-5" />
                  Oferta Final
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Total from itemizado */}
                <div className="p-4 bg-primary/5 border rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">Monto total (del itemizado)</p>
                  <p className="text-3xl font-bold mt-1">${fmt(totalOferta)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Subtotal: ${fmt(subtotal)}
                    {licitacion.gastos_generales > 0 && ` + GG ${licitacion.gastos_generales}%: $${fmt(gg)}`}
                    {licitacion.iva_porcentaje > 0 && ` + IVA ${licitacion.iva_porcentaje}%: $${fmt(iva)}`}
                  </p>
                </div>

                {/* Form fields */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Duración de la oferta (días)</label>
                    <Input
                      type="number"
                      placeholder="Ej: 90"
                      value={ofertaDuracion}
                      onChange={e => setOfertaDuracion(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Plazo de validez de la oferta en días calendario</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Comentarios y observaciones</label>
                    <Textarea
                      placeholder="Ingresa cualquier comentario, condiciones, o aclaraciones relevantes..."
                      value={ofertaNotas}
                      onChange={e => setOfertaNotas(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Archivos adjuntos (opcional)</label>
                    <p className="text-xs text-muted-foreground mb-1">Adjunta documentación de respaldo para tu oferta</p>
                    <Input type="file" className="text-sm" disabled />
                    <p className="text-[10px] text-muted-foreground mt-1">Funcionalidad de carga de archivos próximamente disponible</p>
                  </div>
                </div>

                {/* Status */}
                {miOferta && (
                  <div className="p-3 border rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">
                      Estado: <Badge variant={miOferta.estado === 'enviada' ? 'default' : 'secondary'} className="ml-1">
                        {miOferta.estado === 'enviada' ? 'Enviada' : 'Borrador'}
                      </Badge>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Última actualización: {format(new Date(miOferta.updated_at), "d MMM yyyy HH:mm", { locale: es })}
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={saveOferta} disabled={savingOferta}>
                    {savingOferta ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Guardar borrador
                  </Button>
                  {(!miOferta || miOferta.estado !== 'enviada') && (
                    <Button onClick={submitOferta} disabled={savingOferta}>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar oferta
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
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
