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
  FileText, Calendar, MessageSquare, Plus, Send, Trash2,
  Clock, CheckCircle, Lock, Loader2, ListOrdered, BarChart3, Mail,
  Edit2, Save, X, Upload, Download, Eye
} from 'lucide-react';
import CompactDropZone from '@/components/licitacion/CompactDropZone';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import LicitacionCalendarioTab from '@/components/licitacion/LicitacionCalendarioTab';
import { DocumentPreviewModal } from '@/components/DocumentPreviewModal';
import ItemizadoFileParser from '@/components/ItemizadoFileParser';
import { ParsedItem } from '@/hooks/useParseItemizado';
import { buildHierarchicalItems, getNextSubitemCode, prefixItemDescription } from '@/utils/licitacionItemHierarchy';

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

  // OTP state
  const [otpStep, setOtpStep] = useState<'email' | 'code'>('email');
  const [otpCode, setOtpCode] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Per-ronda draft question state (independent inputs)
  const [rondaInputs, setRondaInputs] = useState<Record<number, { pregunta: string; especialidad: string }>>({});
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
  const [newItemParentId, setNewItemParentId] = useState('');
  const [savingItem, setSavingItem] = useState(false);

  // Inline edit item state
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editItemValues, setEditItemValues] = useState<{ cantidad: string; pu: string; unidad: string }>({ cantidad: '', pu: '', unidad: '' });

  // Per-bidder GG / Utilidades
  const [bidderGG, setBidderGG] = useState('');
  const [bidderUtil, setBidderUtil] = useState('');

  // Oferta final state
  const [ofertaDuracion, setOfertaDuracion] = useState('');
  const [ofertaNotas, setOfertaNotas] = useState('');
  const [savingOferta, setSavingOferta] = useState(false);
  const [sendingItemizado, setSendingItemizado] = useState(false);

  // Document preview state
  const [previewDoc, setPreviewDoc] = useState<{ name: string; url: string; mimeType: string } | null>(null);
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);

  const licitacionId = id ? parseInt(id) : null;

  const fetchData = useCallback(async () => {
    if (!licitacionId || !emailVerified) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('Licitaciones')
        .select(`
          id, nombre, descripcion, mensaje_oferentes, estado, url_acceso, gastos_generales, utilidades, iva_porcentaje, divisa, created_at,
          LicitacionEventos(id, fecha, fecha_fin, titulo, descripcion, estado, es_ronda_preguntas),
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
        setBidderGG(ofertaData.gastos_generales?.toString() || '');
        setBidderUtil(ofertaData.utilidades?.toString() || '');
      }
    } catch (err: any) {
      console.error('Error loading licitacion:', err);
    } finally {
      setLoading(false);
    }
  }, [licitacionId, emailVerified, oferenteEmail]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // OTP countdown timer
  useEffect(() => {
    if (otpCountdown <= 0) return;
    const timer = setInterval(() => setOtpCountdown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const requestOtp = async () => {
    if (!oferenteEmail.trim() || !licitacionId) return;
    setSendingOtp(true);
    setVerifyError(null);
    setOtpError(null);
    try {
      const { data, error } = await supabase.functions.invoke('send-licitacion-otp', {
        body: { licitacionId, email: oferenteEmail.trim() },
      });
      if (error) throw error;
      if (data?.error) {
        setVerifyError(data.error);
        return;
      }
      setOtpStep('code');
      setOtpCountdown(600); // 10 min
      toast({ title: "Código enviado", description: "Revisa tu correo electrónico" });
    } catch (err: any) {
      setVerifyError(err.message || 'Error al enviar el código');
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyOtp = async () => {
    if (!otpCode.trim() || !licitacionId) return;
    setVerifyingOtp(true);
    setOtpError(null);
    try {
      const { data, error } = await supabase
        .from('licitacion_otp_codes')
        .select('id, expires_at')
        .eq('licitacion_id', licitacionId)
        .eq('email', oferenteEmail.toLowerCase().trim())
        .eq('code', otpCode.trim())
        .eq('used', false)
        .maybeSingle();

      if (!data) {
        setOtpError('Código inválido o ya utilizado');
        return;
      }

      if (new Date(data.expires_at) < new Date()) {
        setOtpError('El código ha expirado. Solicita uno nuevo.');
        return;
      }

      // Mark as used
      await supabase
        .from('licitacion_otp_codes')
        .update({ used: true })
        .eq('id', data.id);

      setEmailVerified(true);
      setOtpError(null);
      toast({ title: "Acceso verificado", description: "Bienvenido al portal de la licitación" });
    } catch (err: any) {
      setOtpError(err.message);
    } finally {
      setVerifyingOtp(false);
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
  const getRondaInput = (rondaId: number) => rondaInputs[rondaId] || { pregunta: '', especialidad: '' };
  const setRondaInput = (rondaId: number, field: 'pregunta' | 'especialidad', value: string) => {
    setRondaInputs(prev => ({ ...prev, [rondaId]: { ...getRondaInput(rondaId), [field]: value } }));
  };

  const saveDraftQuestion = async (rondaId: number) => {
    const input = getRondaInput(rondaId);
    if (!input.pregunta.trim() || !licitacionId || !oferenteEmail) return;
    setSavingDraft(true);
    try {
      const { error } = await supabase.from('LicitacionPreguntas').insert({
        licitacion_id: licitacionId,
        ronda_id: rondaId,
        oferente_email: oferenteEmail.toLowerCase().trim(),
        pregunta: input.pregunta.trim(),
        especialidad: input.especialidad.trim() || null,
        enviada: false,
      });
      if (error) throw error;
      setRondaInputs(prev => ({ ...prev, [rondaId]: { pregunta: '', especialidad: '' } }));
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
      const visibleItems = allItems.filter((item) => !item.agregado_por_oferente || item.oferente_email === oferenteEmail.toLowerCase().trim());
      const parentCode = newItemParentId
        ? buildHierarchicalItems(visibleItems).find(({ item }) => String(item.id) === newItemParentId)?.displayCode || null
        : null;

      const { error } = await supabase.from('LicitacionItems').insert({
        licitacion_id: licitacionId,
        descripcion: parentCode ? prefixItemDescription(getNextSubitemCode(visibleItems, parentCode), newItemDesc.trim()) : newItemDesc.trim(),
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
      setNewItemParentId('');
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

  // === INLINE EDIT ITEM ===
  const startEditItem = (item: any) => {
    setEditingItemId(item.id);
    setEditItemValues({
      cantidad: item.cantidad?.toString() || '',
      pu: item.precio_unitario?.toString() || '',
      unidad: item.unidad?.toString() || '',
    });
  };

  // Ensure an oferta record exists for this bidder, return its id
  const ensureOferta = async (): Promise<number | null> => {
    if (miOferta) return miOferta.id;
    if (!licitacionId) return null;
    const { data, error } = await supabase
      .from('LicitacionOfertas')
      .insert({
        licitacion_id: licitacionId,
        oferente_email: oferenteEmail.toLowerCase().trim(),
        estado: 'borrador',
      })
      .select('id')
      .single();
    if (error) { console.error(error); return null; }
    // Refresh to get the new oferta
    fetchData();
    return data.id;
  };

  const saveEditItem = async () => {
    if (!editingItemId) return;
    setSavingItem(true);
    try {
      const cantidad = parseFloat(editItemValues.cantidad) || null;
      const pu = parseFloat(editItemValues.pu) || null;
      const total = cantidad && pu ? cantidad * pu : null;
      const unidad = editItemValues.unidad.trim() || null;

      // Find the item being edited
      const editedItem = allItems.find((i: any) => i.id === editingItemId);
      
      if (editedItem && !editedItem.agregado_por_oferente) {
        // Mandante item → save override to LicitacionOfertaItems
        const ofertaId = await ensureOferta();
        if (!ofertaId) throw new Error('No se pudo crear la oferta');

        // Check if an override already exists
        const existingOverride = miOfertaItems.find((oi: any) => oi.item_referencia_id === editingItemId);
        
        if (existingOverride) {
          const { error } = await supabase
            .from('LicitacionOfertaItems')
            .update({ cantidad, precio_unitario: pu, precio_total: total, unidad })
            .eq('id', existingOverride.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('LicitacionOfertaItems')
            .insert({
              oferta_id: ofertaId,
              item_referencia_id: editingItemId,
              descripcion: editedItem.descripcion,
              unidad,
              cantidad,
              precio_unitario: pu,
              precio_total: total,
              orden: editedItem.orden || 0,
            });
          if (error) throw error;
        }
      } else {
        // Bidder-added item → update LicitacionItems directly (RLS allows this)
        const { error } = await supabase
          .from('LicitacionItems')
          .update({ cantidad, precio_unitario: pu, precio_total: total, unidad })
          .eq('id', editingItemId);
        if (error) throw error;
      }

      setEditingItemId(null);
      toast({ title: "Partida actualizada" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSavingItem(false);
    }
  };

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

  // === IMPORTAR ITEMIZADO DESDE ARCHIVO (oferente) ===
  const handleImportedItems = async (parsedItems: ParsedItem[]) => {
    if (!licitacion?.id) return;
    setSavingItem(true);
    try {
      const maxOrden = allItems.length > 0 ? Math.max(...allItems.map((i: any) => i.orden || 0)) : 0;
      const rows = parsedItems.map((item, idx) => ({
        licitacion_id: licitacion.id,
        descripcion: item.descripcion,
        unidad: item.unidad,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        precio_total: item.precio_total,
        orden: maxOrden + idx + 1,
        agregado_por_oferente: true,
        oferente_email: oferenteEmail,
      }));
      const { error } = await supabase.from('LicitacionItems').insert(rows);
      if (error) throw error;
      toast({ title: 'Partidas importadas', description: `${rows.length} partidas agregadas` });
      fetchData();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSavingItem(false);
    }
  };

  const parsedBidderGG = parseFloat(bidderGG) || 0;
  const parsedBidderUtil = parseFloat(bidderUtil) || 0;

  const saveOferta = async () => {
    if (!licitacionId) return;
    setSavingOferta(true);
    try {
      const itemsTotal = combinedItemNodes.reduce((sum, node) => sum + (node.item.precio_total || 0), 0);
      const gg = parsedBidderGG ? itemsTotal * (parsedBidderGG / 100) : 0;
      const ut = parsedBidderUtil ? (itemsTotal + gg) * (parsedBidderUtil / 100) : 0;
      const neto = itemsTotal + gg + ut;
      const iva = licitacion?.iva_porcentaje ? neto * (licitacion.iva_porcentaje / 100) : 0;
      const total = neto + iva;

      if (miOferta) {
        const { error } = await supabase
          .from('LicitacionOfertas')
          .update({
            duracion_dias: parseInt(ofertaDuracion) || null,
            notas: ofertaNotas.trim() || null,
            gastos_generales: parsedBidderGG || null,
            utilidades: parsedBidderUtil || null,
            total,
          })
          .eq('id', miOferta.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('LicitacionOfertas')
          .insert({
            licitacion_id: licitacionId,
            oferente_email: oferenteEmail.toLowerCase().trim(),
            estado: 'borrador',
            duracion_dias: parseInt(ofertaDuracion) || null,
            notas: ofertaNotas.trim() || null,
            gastos_generales: parsedBidderGG || null,
            utilidades: parsedBidderUtil || null,
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
    }
    try {
      const { data: ofertaData } = await supabase
        .from('LicitacionOfertas')
        .select('id')
        .eq('licitacion_id', licitacionId!)
        .eq('oferente_email', oferenteEmail.toLowerCase().trim())
        .maybeSingle();
      
      if (ofertaData) {
        const combined = combinedItemNodes.map((node) => node.item);
        
        const sub = combined.reduce((sum: number, i: any) => sum + (i.precio_total || 0), 0);
        const ggVal = parsedBidderGG ? sub * (parsedBidderGG / 100) : 0;
        const utVal = parsedBidderUtil ? (sub + ggVal) * (parsedBidderUtil / 100) : 0;
        const netoVal = sub + ggVal + utVal;
        const ivaVal = licitacion?.iva_porcentaje ? netoVal * (licitacion.iva_porcentaje / 100) : 0;
        const total = netoVal + ivaVal;

        await supabase
          .from('LicitacionOfertaItems')
          .delete()
          .eq('oferta_id', ofertaData.id);

        const ofertaItems = combined.map((item: any, idx: number) => ({
          oferta_id: ofertaData.id,
          item_referencia_id: item.agregado_por_oferente ? null : item.id,
          descripcion: item.descripcion,
          unidad: item.unidad || null,
          cantidad: item.cantidad || null,
          precio_unitario: item.precio_unitario || null,
          precio_total: item.precio_total || null,
          orden: idx,
        }));

        if (ofertaItems.length > 0) {
          const { error: itemsError } = await supabase
            .from('LicitacionOfertaItems')
            .insert(ofertaItems);
          if (itemsError) console.error('Error inserting oferta items:', itemsError);
        }

        const { error } = await supabase
          .from('LicitacionOfertas')
          .update({ 
            estado: 'enviada',
            gastos_generales: parsedBidderGG || null,
            utilidades: parsedBidderUtil || null,
            total,
          })
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

  const divisa = licitacion?.divisa || 'CLP';
  const currencySymbol = divisa === 'UF' ? 'UF' : '$';
  const fmtCurrency = (n: number) => {
    if (divisa === 'UF') return `${n.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UF`;
    return `$${n.toLocaleString('es-CL', { minimumFractionDigits: 0 })}`;
  };
  const fmt = (n: number) => n.toLocaleString('es-CL', { minimumFractionDigits: 0 });

  // Round is open if today is within the event's date range (fecha to fecha_cierre/fecha_fin)
  const canSendForRonda = (ronda: any) => {
    if (ronda.estado === 'cerrada') return false;
    const now = new Date();
    // Use fecha_cierre if set, otherwise check if the linked event has fecha_fin
    if (ronda.fecha_cierre) {
      return now <= new Date(ronda.fecha_cierre);
    }
    // Fallback: find the linked event and use its fecha_fin
    const linkedEvent = licitacion?.LicitacionEventos?.find((e: any) => e.es_ronda_preguntas && e.titulo === ronda.titulo);
    if (linkedEvent?.fecha_fin) {
      return now <= new Date(linkedEvent.fecha_fin);
    }
    // Legacy: allow sending from 1 week before deadline
    const deadline = new Date(ronda.fecha_apertura);
    const oneWeekBefore = new Date(deadline.getTime() - 7 * 24 * 60 * 60 * 1000);
    return now >= oneWeekBefore;
  };

  const getRondaDateRange = (ronda: any) => {
    const linkedEvent = licitacion?.LicitacionEventos?.find((e: any) => e.es_ronda_preguntas && e.titulo === ronda.titulo);
    const start = new Date(ronda.fecha_apertura);
    const end = ronda.fecha_cierre
      ? new Date(ronda.fecha_cierre)
      : linkedEvent?.fecha_fin
        ? new Date(linkedEvent.fecha_fin)
        : null;
    return { start, end };
  };

  // Document helpers
  const extractDriveId = (url: string): string | null => {
    const match = url.match(/\/d\/([^\/]+)/);
    if (match) return match[1];
    const match2 = url.match(/[?&]id=([^&]+)/);
    if (match2) return match2[1];
    return null;
  };

  const downloadLicitacionDoc = async (doc: any) => {
    const driveId = doc.url ? extractDriveId(doc.url) : null;
    if (!driveId) {
      toast({ title: 'Error', description: 'No se pudo obtener el archivo', variant: 'destructive' });
      return;
    }
    setLoadingDoc(doc.nombre);
    try {
      const { data, error } = await supabase.functions.invoke('download-project-document', {
        body: { fileName: doc.nombre, driveId, mode: 'content' }
      });
      if (error) throw new Error(error.message);
      if (!data?.success || !data.content) throw new Error(data?.error || 'No se pudo descargar');

      const byteCharacters = atob(data.content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: data.mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.nombre;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'Descarga completada', description: `Se ha descargado ${doc.nombre}` });
    } catch (err: any) {
      toast({ title: 'Error en la descarga', description: err.message, variant: 'destructive' });
    } finally {
      setLoadingDoc(null);
    }
  };

  const previewLicitacionDoc = async (doc: any) => {
    const driveId = doc.url ? extractDriveId(doc.url) : null;
    if (!driveId) {
      toast({ title: 'Error', description: 'No se pudo obtener el archivo', variant: 'destructive' });
      return;
    }
    setLoadingDoc(doc.nombre);
    try {
      const { data, error } = await supabase.functions.invoke('download-project-document', {
        body: { fileName: doc.nombre, driveId, mode: 'content' }
      });
      if (error) throw new Error(error.message);
      if (!data?.success || !data.content) throw new Error(data?.error || 'No se pudo obtener vista previa');

      const byteCharacters = atob(data.content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: data.mimeType });
      const url = URL.createObjectURL(blob);
      setPreviewDoc({ name: doc.nombre, url, mimeType: data.mimeType });
    } catch (err: any) {
      toast({ title: 'Error en vista previa', description: err.message, variant: 'destructive' });
    } finally {
      setLoadingDoc(null);
    }
  };

  // === RENDER ===
  if (!emailVerified) {
    const formatCountdown = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              {otpStep === 'email' ? <Lock className="h-8 w-8 text-primary" /> : <Mail className="h-8 w-8 text-primary" />}
            </div>
            <CardTitle className="text-2xl font-bold font-rubik">
              Portal del Oferente
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              {otpStep === 'email'
                ? 'Ingresa tu email para recibir un código de verificación'
                : `Ingresa el código de 6 dígitos enviado a ${oferenteEmail}`}
            </p>
          </CardHeader>
          <CardContent>
            {otpStep === 'email' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@empresa.com"
                    value={oferenteEmail}
                    onChange={e => setOferenteEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && requestOtp()}
                    disabled={sendingOtp}
                  />
                </div>
                <Button onClick={requestOtp} disabled={sendingOtp || !oferenteEmail.trim()} className="w-full">
                  {sendingOtp ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando código...</> : <><Send className="h-4 w-4 mr-2" />Enviar código de acceso</>}
                </Button>
                {verifyError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">{verifyError}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="otp" className="text-sm font-medium">Código de verificación</label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={e => e.key === 'Enter' && verifyOtp()}
                    disabled={verifyingOtp}
                    className="text-center text-2xl tracking-[0.5em] font-mono"
                  />
                </div>
                {otpCountdown > 0 && (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Expira en {formatCountdown(otpCountdown)}</span>
                  </div>
                )}
                <Button onClick={verifyOtp} disabled={verifyingOtp || otpCode.length !== 6} className="w-full">
                  {verifyingOtp ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Verificando...</> : <><CheckCircle className="h-4 w-4 mr-2" />Verificar código</>}
                </Button>
                {otpError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">{otpError}</p>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2">
                  <Button variant="ghost" size="sm" onClick={() => { setOtpStep('email'); setOtpCode(''); setOtpError(null); }}>
                    ← Cambiar email
                  </Button>
                  <Button variant="ghost" size="sm" onClick={requestOtp} disabled={sendingOtp}>
                    {sendingOtp ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    Reenviar código
                  </Button>
                </div>
              </div>
            )}
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

  const visibleEmail = oferenteEmail.toLowerCase().trim();
  const eventosConDuracion = (licitacion.LicitacionEventos || []).map((evento: any) => {
    if (evento.fecha_fin || !evento.es_ronda_preguntas) return evento;

    const ronda = rondas.find((item: any) => item.evento_id === evento.id || item.titulo === evento.titulo);
    return {
      ...evento,
      fecha_fin: ronda?.fecha_cierre || null,
    };
  });
  // Merge bidder's oferta item overrides onto mandante items
  const mergedItems = allItems.filter(i => !i.agregado_por_oferente || i.oferente_email === visibleEmail).map((item: any) => {
    if (item.agregado_por_oferente) return item;
    // Check if bidder has an override in LicitacionOfertaItems
    const override = miOfertaItems.find((oi: any) => oi.item_referencia_id === item.id);
    if (override) {
      return {
        ...item,
        cantidad: override.cantidad ?? item.cantidad,
        precio_unitario: override.precio_unitario ?? item.precio_unitario,
        precio_total: override.precio_total ?? item.precio_total,
        unidad: override.unidad ?? item.unidad,
      };
    }
    return item;
  });
  const combinedItemNodes = buildHierarchicalItems(mergedItems);
  const mandanteItemNodes = combinedItemNodes.filter(({ item }) => !item.agregado_por_oferente);
  const bidderItemNodes = combinedItemNodes.filter(({ item }) => item.agregado_por_oferente && item.oferente_email === visibleEmail);
  const combinedItems = combinedItemNodes.map(({ item }) => item);
  const topLevelItemOptions = combinedItemNodes.filter(({ level }) => level === 0);
  const subtotal = combinedItems.reduce((sum, i) => sum + (i.precio_total || 0), 0);
  const gg = parsedBidderGG ? subtotal * (parsedBidderGG / 100) : 0;
  const utilidad = parsedBidderUtil ? (subtotal + gg) * (parsedBidderUtil / 100) : 0;
  const neto = subtotal + gg + utilidad;
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
                        <CompactDropZone
                          onFilesSelected={() => {}}
                          disabled
                          placeholder="Arrastra carta de aceptación aquí (próximamente)"
                        />
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
            <LicitacionCalendarioTab
              eventos={eventosConDuracion.map((e: any) => ({
                id: e.id,
                titulo: e.titulo,
                fecha: e.fecha,
                fechaFin: e.fecha_fin || null,
                descripcion: e.descripcion,
                estado: e.estado,
                esRondaPreguntas: e.es_ronda_preguntas,
                requiereArchivos: e.requiere_archivos,
              }))}
              fechaCreacion={licitacion.created_at || new Date().toISOString()}
            />
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
                        <div className="flex items-center gap-1">
                          {doc.url && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => previewLicitacionDoc(doc)}
                                disabled={loadingDoc === doc.nombre}
                                title="Vista previa"
                              >
                                {loadingDoc === doc.nombre ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => downloadLicitacionDoc(doc)}
                                disabled={loadingDoc === doc.nombre}
                                title="Descargar"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Document Preview Modal */}
            <DocumentPreviewModal
              isOpen={!!previewDoc}
              onClose={() => {
                if (previewDoc?.url) URL.revokeObjectURL(previewDoc.url);
                setPreviewDoc(null);
              }}
              documentName={previewDoc?.name || null}
              previewUrl={previewDoc?.url || null}
              mimeType={previewDoc?.mimeType || null}
            />
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
              {rondas.map((ronda, rondaIndex) => {
                // Sequential activation: only the first non-cerrada ronda is active/open for input
                const isClosedExplicitly = ronda.estado === 'cerrada';
                const firstActiveIndex = rondas.findIndex(r => r.estado !== 'cerrada');
                const isActiveRonda = !isClosedExplicitly && rondaIndex === firstActiveIndex;
                const isOpen = isActiveRonda;
                const drafts = getDraftsForRonda(ronda.id);
                const sent = getSentForRonda(ronda.id);
                const { start: rondaStart, end: rondaEnd } = getRondaDateRange(ronda);
                const deadlineText = rondaEnd
                  ? `${format(rondaStart, "d MMM", { locale: es })} — ${format(rondaEnd, "d MMM yyyy", { locale: es })}`
                  : format(rondaStart, "d MMM yyyy", { locale: es });
                const canSend = canSendForRonda(ronda);

                return (
                  <Card key={ronda.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-rubik flex items-center gap-2">
                          <MessageSquare className="h-5 w-5" />
                          {ronda.titulo}
                          <Badge variant={isOpen ? 'default' : isClosedExplicitly ? 'secondary' : 'outline'}>
                            {isClosedExplicitly ? 'Cerrada' : isOpen ? 'Activa' : 'Próxima'}
                          </Badge>
                        </CardTitle>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {deadlineText}
                        </span>
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
                            {!canSend && rondaEnd && (
                              <span className="ml-1 text-xs opacity-75">
                                (abierta hasta {format(rondaEnd, "d MMM yyyy", { locale: es })})
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
                            value={getRondaInput(ronda.id).especialidad}
                            onChange={e => setRondaInput(ronda.id, 'especialidad', e.target.value)}
                            className="text-sm"
                          />
                          <Textarea
                            placeholder="Escribe tu consulta aquí..."
                            value={getRondaInput(ronda.id).pregunta}
                            onChange={e => setRondaInput(ronda.id, 'pregunta', e.target.value)}
                            className="text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => saveDraftQuestion(ronda.id)}
                            disabled={savingDraft || !getRondaInput(ronda.id).pregunta.trim()}
                          >
                            {savingDraft ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                            Guardar borrador
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            Las consultas se guardan como borrador. Envíalas todas juntas cuando estés listo.
                          </p>
                        </div>
                      ) : isClosedExplicitly ? (
                        <div className="text-center py-4 text-muted-foreground">
                          <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Esta ronda de consultas está cerrada</p>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Esta ronda se activará una vez que finalice la ronda anterior</p>
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
            {/* File import for oferente */}
            <div className="mb-4">
              <ItemizadoFileParser
                onItemsAccepted={handleImportedItems}
                title="Importar Itemizado desde Archivo"
                description="Sube un Excel, PDF o Word y se extraerán las partidas automáticamente para tu oferta."
              />
            </div>

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
                      {mandanteItemNodes.length === 0
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
                            <TableHead className="w-16">Ítem</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="text-center w-20">Unidad</TableHead>
                            <TableHead className="text-right w-24">Cantidad</TableHead>
                            <TableHead className="text-right w-32">P. Unitario</TableHead>
                            <TableHead className="text-right w-32">Total</TableHead>
                            <TableHead className="w-16"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {mandanteItemNodes.map(({ item, displayCode, cleanDescription, level }) => (
                            <TableRow key={item.id}>
                              <TableCell className="text-muted-foreground">{displayCode}</TableCell>
                              <TableCell className="font-medium" style={{ paddingLeft: `${level * 20 + 16}px` }}>{cleanDescription}</TableCell>
                              <TableCell className="text-center">{item.unidad || '-'}</TableCell>
                              {editingItemId === item.id ? (
                                <>
                                  <TableCell className="text-right">
                                    <Input type="number" className="w-20 h-7 text-xs text-right" value={editItemValues.cantidad} onChange={e => setEditItemValues(v => ({ ...v, cantidad: e.target.value }))} />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Input type="number" className="w-24 h-7 text-xs text-right" value={editItemValues.pu} onChange={e => setEditItemValues(v => ({ ...v, pu: e.target.value }))} />
                                  </TableCell>
                                  <TableCell className="text-right font-medium text-xs">
                                    {fmtCurrency((parseFloat(editItemValues.cantidad) || 0) * (parseFloat(editItemValues.pu) || 0))}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="sm" onClick={saveEditItem} disabled={savingItem}><Save className="h-3.5 w-3.5" /></Button>
                                      <Button variant="ghost" size="sm" onClick={() => setEditingItemId(null)}><X className="h-3.5 w-3.5" /></Button>
                                    </div>
                                  </TableCell>
                                </>
                              ) : (
                                <>
                                  <TableCell className="text-right">{item.cantidad || '-'}</TableCell>
                                  <TableCell className="text-right">{item.precio_unitario ? fmtCurrency(item.precio_unitario) : '-'}</TableCell>
                                  <TableCell className="text-right font-medium">{item.precio_total ? fmtCurrency(item.precio_total) : '-'}</TableCell>
                                  <TableCell>
                                    <Button variant="ghost" size="sm" onClick={() => startEditItem(item)}>
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </TableCell>
                                </>
                              )}
                            </TableRow>
                          ))}
                          {bidderItemNodes.length > 0 && (
                            <TableRow>
                              <TableCell colSpan={7} className="bg-blue-50 dark:bg-blue-950/20 text-center">
                                <span className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                  Partidas agregadas por oferente
                                </span>
                              </TableCell>
                            </TableRow>
                          )}
                          {bidderItemNodes.map(({ item, displayCode, cleanDescription, level }) => (
                            <TableRow key={item.id} className="bg-blue-50/30 dark:bg-blue-950/10 border-l-2 border-l-blue-400">
                              <TableCell className="text-muted-foreground">{displayCode}</TableCell>
                              <TableCell className="font-medium">
                                <span style={{ paddingLeft: `${level * 20}px` }} className="inline-block">{cleanDescription}</span>
                                <Badge variant="outline" className="ml-2 text-[9px] border-blue-400 text-blue-600">Nueva</Badge>
                              </TableCell>
                              <TableCell className="text-center">{item.unidad || '-'}</TableCell>
                              {editingItemId === item.id ? (
                                <>
                                  <TableCell className="text-right">
                                    <Input type="number" className="w-20 h-7 text-xs text-right" value={editItemValues.cantidad} onChange={e => setEditItemValues(v => ({ ...v, cantidad: e.target.value }))} />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Input type="number" className="w-24 h-7 text-xs text-right" value={editItemValues.pu} onChange={e => setEditItemValues(v => ({ ...v, pu: e.target.value }))} />
                                  </TableCell>
                                  <TableCell className="text-right font-medium text-xs">
                                    {fmtCurrency((parseFloat(editItemValues.cantidad) || 0) * (parseFloat(editItemValues.pu) || 0))}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="sm" onClick={saveEditItem} disabled={savingItem}><Save className="h-3.5 w-3.5" /></Button>
                                      <Button variant="ghost" size="sm" onClick={() => setEditingItemId(null)}><X className="h-3.5 w-3.5" /></Button>
                                    </div>
                                  </TableCell>
                                </>
                              ) : (
                                <>
                                  <TableCell className="text-right">{item.cantidad || '-'}</TableCell>
                                  <TableCell className="text-right">{item.precio_unitario ? fmtCurrency(item.precio_unitario) : '-'}</TableCell>
                                  <TableCell className="text-right font-medium">{item.precio_total ? fmtCurrency(item.precio_total) : '-'}</TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="sm" onClick={() => startEditItem(item)}>
                                        <Edit2 className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => deleteBidderItem(item.id)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </>
                              )}
                            </TableRow>
                          ))}

                          {/* GG / Utilidades editable by bidder */}
                          <TableRow className="border-t-2">
                            <TableCell colSpan={5} className="text-right font-medium">Subtotal</TableCell>
                            <TableCell className="text-right font-bold">{fmtCurrency(subtotal)}</TableCell>
                            <TableCell />
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={4} className="text-right font-medium">
                              Gastos Generales
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Input type="number" className="w-16 h-7 text-xs text-right" placeholder="%" value={bidderGG} onChange={e => setBidderGG(e.target.value)} />
                                <span className="text-xs text-muted-foreground">%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{fmtCurrency(gg)}</TableCell>
                            <TableCell />
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={4} className="text-right font-medium">
                              Utilidades
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Input type="number" className="w-16 h-7 text-xs text-right" placeholder="%" value={bidderUtil} onChange={e => setBidderUtil(e.target.value)} />
                                <span className="text-xs text-muted-foreground">%</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{fmtCurrency(utilidad)}</TableCell>
                            <TableCell />
                          </TableRow>
                          {licitacion.iva_porcentaje > 0 && (
                            <TableRow>
                              <TableCell colSpan={5} className="text-right font-medium">IVA ({licitacion.iva_porcentaje}%)</TableCell>
                              <TableCell className="text-right">{fmtCurrency(iva)}</TableCell>
                              <TableCell />
                            </TableRow>
                          )}
                          <TableRow className="bg-primary/5">
                            <TableCell colSpan={5} className="text-right font-bold text-base">Total</TableCell>
                            <TableCell className="text-right font-bold text-base">{fmtCurrency(totalOferta)}</TableCell>
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
                          <div className="col-span-2">
                            <select
                              value={newItemParentId}
                              onChange={e => setNewItemParentId(e.target.value)}
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                            >
                              <option value="">Nueva partida principal</option>
                              {topLevelItemOptions.map(({ item, displayCode, cleanDescription }) => (
                                <option key={item.id || displayCode} value={String(item.id)}>
                                  Subitem de {displayCode} · {cleanDescription}
                                </option>
                              ))}
                            </select>
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
                      <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" onClick={() => setShowNewItemForm(true)}>
                          <Plus className="h-4 w-4 mr-2" /> Agregar partida
                        </Button>
                      </div>
                    )}

                    {/* Enviar Itemizado button */}
                    {(bidderItemNodes.length > 0 || mandanteItemNodes.length > 0) && (
                      <div className="border-t pt-4">
                        {oferenteRecord?.itemizado_enviado ? (
                          <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                            <div>
                              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Itemizado enviado al mandante</p>
                              {oferenteRecord.itemizado_enviado_at && (
                                <p className="text-xs text-muted-foreground">
                                  Enviado el {format(new Date(oferenteRecord.itemizado_enviado_at), "d MMM yyyy HH:mm", { locale: es })}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <Button
                            className="w-full"
                            onClick={sendItemizado}
                            disabled={sendingItemizado}
                          >
                            {sendingItemizado ? (
                              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</>
                            ) : (
                              <><Send className="h-4 w-4 mr-2" />Enviar itemizado al mandante</>
                            )}
                          </Button>
                        )}
                      </div>
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
                  <p className="text-3xl font-bold mt-1">{fmtCurrency(totalOferta)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Subtotal: {fmtCurrency(subtotal)}
                    {parsedBidderGG > 0 && ` + GG ${parsedBidderGG}%: ${fmtCurrency(gg)}`}
                    {parsedBidderUtil > 0 && ` + Util. ${parsedBidderUtil}%: ${fmtCurrency(utilidad)}`}
                    {licitacion.iva_porcentaje > 0 && ` + IVA ${licitacion.iva_porcentaje}%: ${fmtCurrency(iva)}`}
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
                    <CompactDropZone
                      onFilesSelected={() => {}}
                      disabled
                      multiple
                      placeholder="Arrastra archivos aquí (próximamente)"
                    />
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
