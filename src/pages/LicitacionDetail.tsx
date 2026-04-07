import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, FileText, MessageSquare, ListOrdered, BarChart3, Mail } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useLicitacionDetail } from '@/hooks/useLicitacionDetail';
import LicitacionCalendarioTab from '@/components/licitacion/LicitacionCalendarioTab';
import LicitacionDocumentosTab from '@/components/licitacion/LicitacionDocumentosTab';
import LicitacionPreguntasTab from '@/components/licitacion/LicitacionPreguntasTab';
import LicitacionItemizadoTab from '@/components/licitacion/LicitacionItemizadoTab';
import LicitacionOfertasTab from '@/components/licitacion/LicitacionOfertasTab';
import LicitacionInvitacionTab from '@/components/licitacion/LicitacionInvitacionTab';
import { Skeleton } from '@/components/ui/skeleton';

const LicitacionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const licitacionId = id ? parseInt(id) : null;
  const [activeTab, setActiveTab] = useState('invitacion');

  const {
    licitacion, rondas, preguntas, ofertas, oferentesDetail, loading, refetch,
    createRonda, closeRonda, openRonda, answerPregunta, deleteAnswer, publishPreguntas,
    updateEvento, completeEvento
  } = useLicitacionDetail(licitacionId);

  const getEstadoBadgeVariant = (estado?: string) => {
    switch (estado) {
      case 'abierta': return 'default' as const;
      case 'cerrada': return 'secondary' as const;
      case 'en_evaluacion': return 'outline' as const;
      default: return 'secondary' as const;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader />
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
      <div className="min-h-screen bg-background">
        <PageHeader />
        <div className="container mx-auto px-6 py-8 text-center">
          <p className="text-muted-foreground">Licitación no encontrada</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/licitaciones')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
        </div>
      </div>
    );
  }

  // Filter items to only show mandante's base items (not oferente-added)
  const baseItems = (licitacion.items || []).filter((i: any) => !i.agregado_por_oferente);

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate('/licitaciones')} className="mb-3">
            <ArrowLeft className="h-4 w-4 mr-1" /> Volver a Licitaciones
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-rubik">{licitacion.nombre}</h1>
            <Badge variant={getEstadoBadgeVariant(licitacion.estado)}>
              {licitacion.estado.replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{licitacion.descripcion}</p>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>{oferentesDetail.length} oferentes</span>
            <span>{licitacion.eventos?.length || 0} eventos</span>
            <span>{licitacion.documentos?.length || 0} documentos</span>
            <span>{ofertas.length} ofertas recibidas</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
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
            <TabsTrigger value="preguntas" className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" /> Consultas
              {preguntas.filter(p => !p.respondida && p.enviada).length > 0 && (
                <Badge variant="destructive" className="text-[10px] h-4 px-1">
                  {preguntas.filter(p => !p.respondida && p.enviada).length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="itemizado" className="flex items-center gap-1.5">
              <ListOrdered className="h-4 w-4" /> Itemizado
            </TabsTrigger>
            <TabsTrigger value="ofertas" className="flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" /> Ofertas
              {ofertas.length > 0 && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1">
                  {ofertas.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="invitacion">
            <LicitacionInvitacionTab
              licitacionId={licitacion.id}
              mensajeOferentes={licitacion.mensaje_oferentes}
              oferentes={oferentesDetail}
              ofertas={ofertas}
              onRefresh={refetch}
            />
          </TabsContent>

          <TabsContent value="calendario">
            <LicitacionCalendarioTab 
              eventos={licitacion.eventos || []} 
              fechaCreacion={licitacion.created_at}
              onUpdateEvento={updateEvento}
              onCompleteEvento={completeEvento}
            />
          </TabsContent>

          <TabsContent value="documentos">
            <LicitacionDocumentosTab 
              documentos={licitacion.documentos || []} 
              licitacionId={licitacion.id}
              onRefresh={refetch}
            />
          </TabsContent>

          <TabsContent value="preguntas">
            <LicitacionPreguntasTab
              rondas={rondas}
              preguntas={preguntas}
              licitacionId={licitacion.id}
              onCreateRonda={createRonda}
              onCloseRonda={closeRonda}
              onOpenRonda={openRonda}
              onAnswerPregunta={answerPregunta}
              onPublishPreguntas={publishPreguntas}
              onRefetch={refetch}
            />
          </TabsContent>

          <TabsContent value="itemizado">
            <LicitacionItemizadoTab 
              items={baseItems}
              gastosGenerales={licitacion.gastos_generales}
              utilidades={licitacion.utilidades}
              ivaPorcentaje={licitacion.iva_porcentaje}
              licitacionId={licitacion.id}
              onRefresh={refetch}
            />
          </TabsContent>

          <TabsContent value="ofertas">
            <LicitacionOfertasTab 
              ofertas={ofertas}
              itemsReferencia={licitacion.items || []}
              licitacionId={licitacion.id}
              licitacionGG={licitacion.gastos_generales}
              licitacionUtil={licitacion.utilidades}
              licitacionIVA={licitacion.iva_porcentaje}
              onRefresh={refetch}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LicitacionDetail;
