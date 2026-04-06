import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { CalendarEvent } from '@/hooks/useLicitaciones';
import { format, differenceInDays, isBefore, addDays, startOfWeek, endOfWeek, eachWeekOfInterval, eachDayOfInterval } from 'date-fns';
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

  const sortedEventos = useMemo(() =>
    [...eventos].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()),
    [eventos]
  );

  const now = new Date();

  // Calculate timeline range
  const timelineRange = useMemo(() => {
    const start = new Date(fechaCreacion);
    start.setDate(start.getDate() - 2); // small padding
    const lastEvent = sortedEventos.length > 0
      ? new Date(sortedEventos[sortedEventos.length - 1].fecha)
      : addDays(now, 30);
    const end = addDays(new Date(Math.max(lastEvent.getTime(), now.getTime())), 7);
    return { start, end };
  }, [fechaCreacion, sortedEventos, now]);

  const totalDays = Math.max(differenceInDays(timelineRange.end, timelineRange.start), 1);

  // Generate week columns for the header
  const weeks = useMemo(() => {
    return eachWeekOfInterval(
      { start: timelineRange.start, end: timelineRange.end },
      { weekStartsOn: 1 }
    );
  }, [timelineRange]);

  // Generate month spans for the top header
  const monthSpans = useMemo(() => {
    const months: { label: string; startPct: number; widthPct: number }[] = [];
    let currentMonth = -1;
    let currentYear = -1;
    let monthStart = 0;

    const days = eachDayOfInterval({ start: timelineRange.start, end: timelineRange.end });
    days.forEach((day, idx) => {
      const m = day.getMonth();
      const y = day.getFullYear();
      if (m !== currentMonth || y !== currentYear) {
        if (currentMonth !== -1) {
          const pctStart = (monthStart / totalDays) * 100;
          const pctWidth = ((idx - monthStart) / totalDays) * 100;
          months.push({
            label: format(new Date(currentYear, currentMonth, 1), 'MMMM yyyy', { locale: es }),
            startPct: pctStart,
            widthPct: pctWidth,
          });
        }
        currentMonth = m;
        currentYear = y;
        monthStart = idx;
      }
    });
    // Last month
    if (currentMonth !== -1) {
      const pctStart = (monthStart / totalDays) * 100;
      const pctWidth = ((days.length - monthStart) / totalDays) * 100;
      months.push({
        label: format(new Date(currentYear, currentMonth, 1), 'MMMM yyyy', { locale: es }),
        startPct: pctStart,
        widthPct: pctWidth,
      });
    }
    return months;
  }, [timelineRange, totalDays]);

  const getPositionPct = (date: Date) => {
    const days = differenceInDays(date, timelineRange.start);
    return Math.min(Math.max((days / totalDays) * 100, 0), 100);
  };

  const todayPct = getPositionPct(now);

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

  // Label column width
  const LABEL_WIDTH = 200;

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
        <CardContent className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Header: Months row */}
            <div className="flex">
              <div className="shrink-0" style={{ width: LABEL_WIDTH }} />
              <div className="flex-1 relative h-7 border-b border-muted">
                {monthSpans.map((m, i) => (
                  <div
                    key={i}
                    className="absolute top-0 h-full flex items-center justify-center text-xs font-semibold text-foreground border-l border-muted first:border-l-0 capitalize"
                    style={{ left: `${m.startPct}%`, width: `${m.widthPct}%` }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Header: Weeks row */}
            <div className="flex">
              <div className="shrink-0 flex items-center px-3 text-xs font-medium text-muted-foreground border-b border-r border-muted bg-muted/30" style={{ width: LABEL_WIDTH }}>
                Actividad
              </div>
              <div className="flex-1 relative h-6 border-b border-muted">
                {weeks.map((weekStart, i) => {
                  const pct = getPositionPct(weekStart);
                  const nextWeek = i < weeks.length - 1 ? getPositionPct(weeks[i + 1]) : 100;
                  const width = nextWeek - pct;
                  return (
                    <div
                      key={i}
                      className="absolute top-0 h-full flex items-center justify-center text-[10px] text-muted-foreground border-l border-muted/60"
                      style={{ left: `${pct}%`, width: `${width}%` }}
                    >
                      {format(weekStart, 'd MMM', { locale: es })}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Event rows */}
            <div className="relative">
              {sortedEventos.map((evento, idx) => {
                const status = getEventStatus(evento);
                const config = statusConfig[status];
                const eventDate = new Date(evento.fecha);
                const eventPct = getPositionPct(eventDate);

                // Bar from creation to event date
                const creationPct = getPositionPct(new Date(fechaCreacion));
                const barLeft = Math.max(creationPct, 0);
                const barWidth = Math.max(eventPct - barLeft, 1);

                return (
                  <div key={idx} className="flex group">
                    {/* Activity label */}
                    <div
                      className="shrink-0 flex items-center gap-2 px-3 border-b border-r border-muted bg-card hover:bg-muted/20 transition-colors"
                      style={{ width: LABEL_WIDTH, height: 40 }}
                    >
                      <div className={`w-2.5 h-2.5 rounded-full ${config.color} shrink-0`} />
                      <span className="text-xs font-medium truncate flex-1">{evento.titulo}</span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {evento.esRondaPreguntas && <MessageSquare className="h-3 w-3 text-muted-foreground" />}
                        {evento.requiereArchivos && <FileText className="h-3 w-3 text-muted-foreground" />}
                      </div>
                    </div>

                    {/* Timeline bar area */}
                    <div className="flex-1 relative border-b border-muted" style={{ height: 40 }}>
                      {/* Week grid lines */}
                      {weeks.map((weekStart, i) => (
                        <div
                          key={i}
                          className="absolute top-0 bottom-0 w-px bg-muted/40"
                          style={{ left: `${getPositionPct(weekStart)}%` }}
                        />
                      ))}

                      {/* Horizontal bar */}
                      <div
                        className={`absolute top-2 h-4 rounded ${config.color} opacity-30`}
                        style={{ left: `${barLeft}%`, width: `${barWidth}%` }}
                      />
                      {/* Solid end portion */}
                      <div
                        className={`absolute top-2 h-4 rounded-r ${config.color} opacity-70`}
                        style={{ left: `${Math.max(eventPct - 2, barLeft)}%`, width: `${Math.min(2, barWidth)}%` }}
                      />

                      {/* Diamond marker at event date */}
                      <div
                        className={`absolute top-1/2 w-3 h-3 ${config.color} rotate-45 z-10 border border-background`}
                        style={{ left: `${eventPct}%`, transform: 'translateX(-50%) translateY(-50%) rotate(45deg)' }}
                      />

                      {/* Date label */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground whitespace-nowrap bg-background/80 px-1 rounded z-10"
                        style={{ left: `${Math.min(eventPct + 1.5, 85)}%` }}
                      >
                        {format(eventDate, 'd MMM', { locale: es })}
                      </div>

                      {/* Today marker */}
                      {idx === 0 && (
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-destructive z-20"
                          style={{ left: `${todayPct}%` }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Today marker spanning all rows (overlay) */}
              {sortedEventos.length > 0 && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-destructive z-20 pointer-events-none"
                  style={{ left: `calc(${LABEL_WIDTH}px + (100% - ${LABEL_WIDTH}px) * ${todayPct / 100})` }}
                >
                  <span className="absolute -top-5 -translate-x-1/2 text-[9px] text-destructive font-bold whitespace-nowrap">
                    Hoy
                  </span>
                </div>
              )}

              {sortedEventos.length === 0 && (
                <div className="h-20 flex items-center justify-center text-sm text-muted-foreground">
                  No hay eventos programados
                </div>
              )}
            </div>
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
                      <Badge variant="outline" className="text-[9px] h-4 px-1">Ronda de consultas</Badge>
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
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(evento)} title="Editar evento">
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  {status !== 'completado' && evento.id && (
                    <Button
                      variant="ghost" size="icon"
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
