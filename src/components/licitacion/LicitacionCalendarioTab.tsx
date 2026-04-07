import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { CalendarEvent } from '@/hooks/useLicitaciones';
import { format, differenceInDays, isBefore, addDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, FileText, Pencil, CheckCircle2, MessageSquare } from 'lucide-react';

interface Props {
  eventos: CalendarEvent[];
  fechaCreacion: string;
  onUpdateEvento?: (eventoId: number, updates: { titulo?: string; fecha?: string; fecha_fin?: string | null; descripcion?: string }) => Promise<void>;
  onCompleteEvento?: (eventoId: number) => Promise<void>;
}

const ROW_HEIGHT = 36;
const LABEL_COL_WIDTH = 200;
const DAY_COL_WIDTH = 32;

const LicitacionCalendarioTab: React.FC<Props> = ({ eventos, fechaCreacion, onUpdateEvento, onCompleteEvento }) => {
  const [editingEvento, setEditingEvento] = useState<CalendarEvent | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDateFin, setEditDateFin] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const sortedEventos = useMemo(
    () => [...eventos].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()),
    [eventos]
  );

  const now = startOfDay(new Date());

  const { timelineDays } = useMemo(() => {
    const creation = startOfDay(new Date(fechaCreacion));

    if (sortedEventos.length === 0) {
      const rangeStart = addDays(creation < now ? creation : now, -2);
      const rangeEnd = addDays(creation > now ? creation : now, 30);
      const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
      return { timelineDays: days };
    }

    const allDates = sortedEventos.flatMap(e => {
      const dates = [new Date(e.fecha)];
      if (e.fechaFin) dates.push(new Date(e.fechaFin));
      return dates;
    });
    const firstDate = startOfDay(new Date(Math.min(...allDates.map(d => d.getTime()))));
    const lastDate = startOfDay(new Date(Math.max(...allDates.map(d => d.getTime()))));

    const rangeStart = addDays(firstDate < now ? firstDate : now, -3);
    const rangeEnd = addDays(lastDate > now ? lastDate : now, 5);
    const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

    return { timelineDays: days };
  }, [fechaCreacion, now, sortedEventos]);

  const totalDays = timelineDays.length;
  const timelineWidth = totalDays * DAY_COL_WIDTH;

  const monthGroups = useMemo(() => {
    const groups: { label: string; span: number }[] = [];
    let current = '';
    let count = 0;

    timelineDays.forEach((day) => {
      const key = format(day, 'MMM yyyy', { locale: es });
      if (key !== current) {
        if (current) groups.push({ label: current, span: count });
        current = key;
        count = 1;
      } else {
        count++;
      }
    });

    if (current) groups.push({ label: current, span: count });
    return groups;
  }, [timelineDays]);

  const dayIndex = (date: Date) => differenceInDays(startOfDay(date), timelineDays[0]);
  const creationIdx = Math.min(Math.max(dayIndex(new Date(fechaCreacion)), 0), Math.max(totalDays - 1, 0));
  const todayIdx = dayIndex(now);
  const isTodayInRange = todayIdx >= 0 && todayIdx < totalDays;

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || totalDays === 0) return;

    const focusIndex = isTodayInRange ? todayIdx : creationIdx;
    const left = Math.max(focusIndex * DAY_COL_WIDTH - container.clientWidth / 2, 0);
    container.scrollTo({ left });
  }, [creationIdx, isTodayInRange, todayIdx, totalDays]);

  const getEventStatus = (evento: CalendarEvent) => {
    if (evento.estado === 'completado') return 'completado';
    const endDate = evento.fechaFin ? new Date(evento.fechaFin) : new Date(evento.fecha);
    if (isBefore(endDate, now)) return 'vencido';
    if (differenceInDays(endDate, now) <= 3) return 'proximo';
    return 'pendiente';
  };

  const statusColors: Record<string, { bar: string; dot: string }> = {
    completado: { bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
    vencido: { bar: 'bg-destructive', dot: 'bg-destructive' },
    proximo: { bar: 'bg-amber-500', dot: 'bg-amber-500' },
    pendiente: { bar: 'bg-primary', dot: 'bg-primary' },
  };

  const statusBadge: Record<string, { variant: 'default' | 'destructive' | 'secondary' | 'outline'; label: string }> = {
    completado: { variant: 'default', label: 'Completado' },
    vencido: { variant: 'destructive', label: 'Vencido' },
    proximo: { variant: 'secondary', label: 'Próximo' },
    pendiente: { variant: 'outline', label: 'Pendiente' },
  };

  const openEdit = (evento: CalendarEvent) => {
    setEditingEvento(evento);
    setEditTitle(evento.titulo);
    setEditDate(evento.fecha ? format(new Date(evento.fecha), 'yyyy-MM-dd') : '');
    setEditDateFin(evento.fechaFin ? format(new Date(evento.fechaFin), 'yyyy-MM-dd') : '');
    setEditDesc(evento.descripcion || '');
  };

  const handleSaveEdit = async () => {
    if (!editingEvento?.id || !onUpdateEvento) return;
    await onUpdateEvento(editingEvento.id, {
      titulo: editTitle,
      fecha: new Date(editDate).toISOString(),
      fecha_fin: editDateFin ? new Date(editDateFin).toISOString() : null,
      descripcion: editDesc,
    });
    setEditingEvento(null);
  };

  const HEADER_HEIGHT = 52;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 font-rubik text-base">
            <Calendar className="h-5 w-5" />
            Carta Gantt del Proceso
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sortedEventos.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              No hay eventos programados
            </div>
          ) : (
            <div className="relative flex" style={{ minHeight: HEADER_HEIGHT + sortedEventos.length * ROW_HEIGHT }}>
              {/* Fixed activity labels column */}
              <div
                className="shrink-0 border-r border-muted bg-background z-20 sticky left-0"
                style={{ width: LABEL_COL_WIDTH }}
              >
                <div className="border-b border-muted" style={{ height: 24 }} />
                <div className="border-b border-muted flex items-end px-2 text-[10px] font-medium text-muted-foreground" style={{ height: 28 }}>
                  Actividad
                </div>
                {sortedEventos.map((evento, idx) => {
                  const status = getEventStatus(evento);
                  const colors = statusColors[status];
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-2 border-b border-muted/50 hover:bg-muted/20 transition-colors"
                      style={{ height: ROW_HEIGHT }}
                    >
                      <div className={`w-2 h-2 rounded-full ${colors.dot} shrink-0`} />
                      <span className="text-xs font-medium truncate">{evento.titulo}</span>
                    </div>
                  );
                })}
              </div>

              {/* Scrollable timeline */}
              <div className="overflow-x-auto flex-1" ref={scrollContainerRef}>
                <div style={{ width: timelineWidth }} className="relative">
                  {/* Month headers */}
                  <div className="flex border-b border-muted" style={{ height: 24 }}>
                    {monthGroups.map((mg, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-center text-[10px] font-semibold text-foreground border-r border-muted/60 capitalize"
                        style={{ width: mg.span * DAY_COL_WIDTH }}
                      >
                        {mg.label}
                      </div>
                    ))}
                  </div>

                  {/* Day headers */}
                  <div className="flex border-b border-muted" style={{ height: 28 }}>
                    {timelineDays.map((day, i) => {
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                      const isToday = differenceInDays(day, now) === 0;
                      return (
                        <div
                          key={i}
                          className={`flex flex-col items-center justify-end pb-0.5 text-center border-r border-muted/30 ${
                            isWeekend ? 'bg-muted/20' : ''
                          } ${isToday ? 'bg-destructive/10' : ''}`}
                          style={{ width: DAY_COL_WIDTH }}
                        >
                          <span className="text-[8px] uppercase text-muted-foreground">
                            {format(day, 'EEE', { locale: es }).slice(0, 2)}
                          </span>
                          <span className={`text-[10px] leading-none ${isToday ? 'text-destructive font-bold' : 'text-foreground'}`}>
                            {format(day, 'd')}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Event rows */}
                  {sortedEventos.map((evento, idx) => {
                    const status = getEventStatus(evento);
                    const colors = statusColors[status];
                    const hasDuration = !!evento.fechaFin;
                    const startIdx = Math.min(Math.max(dayIndex(new Date(evento.fecha)), 0), totalDays - 1);
                    const endIdx = hasDuration
                      ? Math.min(Math.max(dayIndex(new Date(evento.fechaFin!)), 0), totalDays - 1)
                      : startIdx;

                    return (
                      <div
                        key={idx}
                        className="relative flex items-center border-b border-muted/30"
                        style={{ height: ROW_HEIGHT }}
                      >
                        {/* Weekend shading */}
                        {timelineDays.map((day, di) => {
                          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                          return isWeekend ? (
                            <div
                              key={di}
                              className="absolute top-0 bottom-0 bg-muted/10"
                              style={{ left: di * DAY_COL_WIDTH, width: DAY_COL_WIDTH }}
                            />
                          ) : null;
                        })}

                        {hasDuration ? (
                          /* Duration bar */
                          <div
                            className={`absolute z-10 ${colors.bar} rounded-sm opacity-80`}
                            style={{
                              left: startIdx * DAY_COL_WIDTH + 4,
                              width: (endIdx - startIdx + 1) * DAY_COL_WIDTH - 8,
                              top: ROW_HEIGHT / 2 - 5,
                              height: 10,
                            }}
                          />
                        ) : (
                          <>
                            {/* Horizontal track line from start to event */}
                            <div
                              className="absolute bg-muted/40"
                              style={{
                                left: 0,
                                width: startIdx * DAY_COL_WIDTH + DAY_COL_WIDTH / 2,
                                top: ROW_HEIGHT / 2 - 1,
                                height: 2,
                              }}
                            />

                            {/* Diamond milestone marker */}
                            <div
                              className={`absolute z-10 w-3.5 h-3.5 ${colors.dot} border-2 border-background shadow-sm`}
                              style={{
                                left: startIdx * DAY_COL_WIDTH + DAY_COL_WIDTH / 2 - 7,
                                top: ROW_HEIGHT / 2 - 7,
                                transform: 'rotate(45deg)',
                              }}
                            />
                          </>
                        )}

                        {/* Icons for special events */}
                        {(evento.requiereArchivos || evento.esRondaPreguntas) && (
                          <div
                            className="absolute z-10 flex items-center gap-0.5"
                            style={{
                              left: (hasDuration ? (endIdx + 1) : startIdx) * DAY_COL_WIDTH + (hasDuration ? 2 : DAY_COL_WIDTH / 2 + 10),
                              top: ROW_HEIGHT / 2 - 6,
                            }}
                          >
                            {evento.requiereArchivos && <FileText className="h-3 w-3 text-muted-foreground" />}
                            {evento.esRondaPreguntas && <MessageSquare className="h-3 w-3 text-muted-foreground" />}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* TODAY vertical red line */}
                  {isTodayInRange && (
                    <div
                      className="absolute z-30 pointer-events-none"
                      style={{
                        left: todayIdx * DAY_COL_WIDTH + DAY_COL_WIDTH / 2,
                        top: 0,
                        bottom: 0,
                        width: 0,
                      }}
                    >
                      <div className="absolute top-0 bottom-0 w-0 border-l-2 border-destructive" />
                      <div className="absolute top-0 -translate-x-1/2 bg-destructive text-destructive-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-b whitespace-nowrap">
                        Hoy
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event details list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-rubik">Detalle de Eventos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sortedEventos.map((evento, idx) => {
            const status = getEventStatus(evento);
            const badge = statusBadge[status];
            const colors = statusColors[status];
            const hasDuration = !!evento.fechaFin;
            return (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                <div className={`w-3 h-3 rounded-full ${colors.dot} shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{evento.titulo}</p>
                    {evento.requiereArchivos && <FileText className="h-3.5 w-3.5 text-muted-foreground" />}
                    {evento.esRondaPreguntas && (
                      <Badge variant="outline" className="text-[9px] h-4 px-1">Ronda de consultas</Badge>
                    )}
                  </div>
                  {evento.descripcion && (
                    <p className="text-xs text-muted-foreground truncate">{evento.descripcion}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {hasDuration ? (
                    <p className="text-sm font-medium">
                      {format(new Date(evento.fecha), 'd MMM', { locale: es })} — {format(new Date(evento.fechaFin!), 'd MMM yyyy', { locale: es })}
                    </p>
                  ) : (
                    <p className="text-sm font-medium">
                      {format(new Date(evento.fecha), 'd MMM yyyy', { locale: es })}
                    </p>
                  )}
                  <Badge variant={badge.variant} className="text-[10px]">
                    {badge.label}
                  </Badge>
                </div>
                {(onUpdateEvento || onCompleteEvento) && (
                  <div className="flex items-center gap-1 shrink-0">
                    {onUpdateEvento && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(evento)} title="Editar evento">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {onCompleteEvento && status !== 'completado' && evento.id && (
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
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Edit event dialog */}
      {onUpdateEvento && (
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha inicio</Label>
                  <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Fecha fin <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                  <Input type="date" value={editDateFin} onChange={(e) => setEditDateFin(e.target.value)} />
                </div>
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
      )}
    </div>
  );
};

export default LicitacionCalendarioTab;
