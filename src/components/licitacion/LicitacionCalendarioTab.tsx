import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { CalendarEvent } from '@/hooks/useLicitaciones';
import { format, differenceInDays, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, FileText, Pencil, CheckCircle2, MessageSquare } from 'lucide-react';

interface Props {
  eventos: CalendarEvent[];
  fechaCreacion: string;
  onUpdateEvento: (eventoId: number, updates: { titulo?: string; fecha?: string; descripcion?: string }) => Promise<void>;
  onCompleteEvento: (eventoId: number) => Promise<void>;
}

const LicitacionCalendarioTab: React.FC<Props> = ({ eventos, fechaCreacion, onUpdateEvento, onCompleteEvento }) => {
  const [editingEvento, setEditingEvento] = useState<CalendarEvent | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const sortedEventos = [...eventos].sort((a, b) =>
    new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  const now = new Date();
  const startDate = new Date(fechaCreacion);
  const endDate = sortedEventos.length > 0
    ? new Date(Math.max(
        new Date(sortedEventos[sortedEventos.length - 1].fecha).getTime(),
        now.getTime() + 7 * 24 * 60 * 60 * 1000
      ))
    : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const totalDays = Math.max(differenceInDays(endDate, startDate), 1);

  const getBarPosition = (fecha: string) => {
    const days = differenceInDays(new Date(fecha), startDate);
    return Math.min(Math.max((days / totalDays) * 100, 2), 98);
  };

  const todayPosition = Math.min(Math.max((differenceInDays(now, startDate) / totalDays) * 100, 0), 100);

  const getEventStatus = (evento: CalendarEvent) => {
    if (evento.estado === 'completado') return 'completado';
    const eventDate = new Date(evento.fecha);
    if (isBefore(eventDate, now)) return 'vencido';
    if (differenceInDays(eventDate, now) <= 3) return 'proximo';
    return 'pendiente';
  };

  const statusConfig = {
    completado: { color: 'bg-emerald-500', badge: 'default' as const, label: 'Completado', text: 'text-emerald-600' },
    vencido: { color: 'bg-destructive', badge: 'destructive' as const, label: 'Vencido', text: 'text-destructive' },
    proximo: { color: 'bg-amber-500', badge: 'secondary' as const, label: 'Próximo', text: 'text-amber-600' },
    pendiente: { color: 'bg-primary', badge: 'outline' as const, label: 'Pendiente', text: 'text-primary' },
  };

  const openEdit = (evento: CalendarEvent) => {
    setEditingEvento(evento);
    setEditTitle(evento.titulo);
    setEditDate(evento.fecha ? format(new Date(evento.fecha), 'yyyy-MM-dd') : '');
    setEditDesc(evento.descripcion || '');
  };

  const handleSaveEdit = async () => {
    if (!editingEvento?.id) return;
    await onUpdateEvento(editingEvento.id, {
      titulo: editTitle,
      fecha: new Date(editDate).toISOString(),
      descripcion: editDesc,
    });
    setEditingEvento(null);
  };

  // Generate month markers for Gantt
  const monthMarkers: { label: string; position: number }[] = [];
  const currentMonth = new Date(startDate);
  currentMonth.setDate(1);
  while (currentMonth <= endDate) {
    const pos = (differenceInDays(currentMonth, startDate) / totalDays) * 100;
    if (pos >= 0 && pos <= 100) {
      monthMarkers.push({
        label: format(currentMonth, 'MMM yy', { locale: es }),
        position: pos,
      });
    }
    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }

  return (
    <div className="space-y-6">
      {/* Gantt Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-rubik">
            <Calendar className="h-5 w-5" />
            Carta Gantt del Proceso
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Month labels */}
          <div className="relative h-6 mb-1">
            {monthMarkers.map((m, i) => (
              <span
                key={i}
                className="absolute text-[10px] text-muted-foreground font-medium"
                style={{ left: `${m.position}%`, transform: 'translateX(-50%)' }}
              >
                {m.label}
              </span>
            ))}
          </div>

          {/* Gantt bars per event */}
          <div className="relative border-l border-r border-muted rounded">
            {/* Background grid lines for months */}
            {monthMarkers.map((m, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-px bg-muted"
                style={{ left: `${m.position}%` }}
              />
            ))}

            {/* Today marker */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-destructive z-10"
              style={{ left: `${todayPosition}%` }}
            >
              <span className="absolute -top-5 -translate-x-1/2 text-[9px] text-destructive font-bold whitespace-nowrap">
                Hoy
              </span>
            </div>

            {/* Event rows */}
            {sortedEventos.map((evento, idx) => {
              const status = getEventStatus(evento);
              const config = statusConfig[status];
              const eventPos = getBarPosition(evento.fecha);
              const barStart = Math.max(0, eventPos - 3);
              const barWidth = Math.min(6, 100 - barStart);

              return (
                <div
                  key={idx}
                  className="relative flex items-center h-10 group border-b border-muted/50 last:border-b-0"
                >
                  {/* Bar background representing duration to event */}
                  <div
                    className={`absolute h-6 rounded-md ${config.color} opacity-20`}
                    style={{ left: '0%', width: `${eventPos}%` }}
                  />
                  {/* Event marker bar */}
                  <div
                    className={`absolute h-6 rounded-md ${config.color} opacity-70`}
                    style={{ left: `${barStart}%`, width: `${barWidth}%` }}
                  />
                  {/* Diamond marker */}
                  <div
                    className={`absolute w-3 h-3 ${config.color} rotate-45 z-10 border border-background`}
                    style={{ left: `${eventPos}%`, transform: `translateX(-50%) rotate(45deg)` }}
                  />
                  {/* Label */}
                  <div className="relative z-10 flex items-center gap-2 px-2 w-full">
                    <span className="text-xs font-medium truncate max-w-[40%] bg-background/80 px-1 rounded">
                      {evento.titulo}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto bg-background/80 px-1 rounded">
                      {format(new Date(evento.fecha), 'd MMM', { locale: es })}
                    </span>
                    {evento.esRondaPreguntas && (
                      <MessageSquare className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                    {evento.requiereArchivos && (
                      <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                    )}
                  </div>
                </div>
              );
            })}

            {sortedEventos.length === 0 && (
              <div className="h-20 flex items-center justify-center text-sm text-muted-foreground">
                No hay eventos programados
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Event list with action buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-rubik">Detalle de Eventos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sortedEventos.map((evento, idx) => {
            const status = getEventStatus(evento);
            const config = statusConfig[status];
            return (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                <div className={`w-3 h-3 rounded-full ${config.color} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{evento.titulo}</p>
                    {evento.requiereArchivos && (
                      <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    {evento.esRondaPreguntas && (
                      <Badge variant="outline" className="text-[9px] h-4 px-1">Ronda Q&A</Badge>
                    )}
                  </div>
                  {evento.descripcion && (
                    <p className="text-xs text-muted-foreground truncate">{evento.descripcion}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium">
                    {format(new Date(evento.fecha), 'd MMM yyyy', { locale: es })}
                  </p>
                  <Badge variant={config.badge} className="text-[10px]">
                    {config.label}
                  </Badge>
                </div>
                {/* Action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEdit(evento)}
                    title="Editar evento"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {status !== 'completado' && evento.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                      onClick={() => onCompleteEvento(evento.id!)}
                      title="Finalizar evento"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingEvento} onOpenChange={(open) => !open && setEditingEvento(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-rubik">Editar Evento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingEvento(null)}>Cancelar</Button>
              <Button onClick={handleSaveEdit}>Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LicitacionCalendarioTab;
