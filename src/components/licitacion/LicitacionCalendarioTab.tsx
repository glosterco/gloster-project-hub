import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { CalendarEvent } from '@/hooks/useLicitaciones';
import {
  format,
  differenceInDays,
  isBefore,
  addDays,
  startOfDay,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  endOfMonth,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, FileText, Pencil, CheckCircle2, MessageSquare } from 'lucide-react';

interface Props {
  eventos: CalendarEvent[];
  fechaCreacion: string;
  onUpdateEvento: (eventoId: number, updates: { titulo?: string; fecha?: string; descripcion?: string }) => Promise<void>;
  onCompleteEvento: (eventoId: number) => Promise<void>;
}

const ROW_HEIGHT = 36;
const LABEL_COL_WIDTH = 180;

const LicitacionCalendarioTab: React.FC<Props> = ({ eventos, fechaCreacion, onUpdateEvento, onCompleteEvento }) => {
  const [editingEvento, setEditingEvento] = useState<CalendarEvent | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const sortedEventos = useMemo(
    () => [...eventos].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()),
    [eventos],
  );

  const now = startOfDay(new Date());

  // Timeline range: includes all events AND today
  const { timelineStart, timelineEnd, totalSpanDays } = useMemo(() => {
    const creation = startOfDay(new Date(fechaCreacion));
    const firstEvt = sortedEventos.length ? startOfDay(new Date(sortedEventos[0].fecha)) : creation;
    const lastEvt = sortedEventos.length ? startOfDay(new Date(sortedEventos[sortedEventos.length - 1].fecha)) : creation;
    const start = addDays(new Date(Math.min(creation.getTime(), firstEvt.getTime())), -2);
    const end = addDays(new Date(Math.max(lastEvt.getTime(), now.getTime())), 3);
    return { timelineStart: start, timelineEnd: end, totalSpanDays: differenceInDays(end, start) };
  }, [fechaCreacion, sortedEventos, now]);

  // Determine scale: daily (<= 90 days), weekly (<= 365), or monthly
  const scale = totalSpanDays <= 90 ? 'day' : totalSpanDays <= 730 ? 'week' : 'month';

  // Column definitions based on scale
  const columns = useMemo(() => {
    if (scale === 'day') {
      return eachDayOfInterval({ start: timelineStart, end: timelineEnd }).map(d => ({
        date: d,
        label: format(d, 'd'),
        subLabel: format(d, 'EEE', { locale: es }).slice(0, 2),
        width: 32,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        isToday: differenceInDays(d, now) === 0,
      }));
    } else if (scale === 'week') {
      return eachWeekOfInterval({ start: timelineStart, end: timelineEnd }, { weekStartsOn: 1 }).map(w => ({
        date: w,
        label: format(w, 'd MMM', { locale: es }),
        subLabel: '',
        width: 48,
        isWeekend: false,
        isToday: differenceInDays(now, w) >= 0 && differenceInDays(now, w) < 7,
      }));
    } else {
      return eachMonthOfInterval({ start: timelineStart, end: timelineEnd }).map(m => ({
        date: m,
        label: format(m, 'MMM yy', { locale: es }),
        subLabel: '',
        width: 64,
        isWeekend: false,
        isToday: now.getMonth() === m.getMonth() && now.getFullYear() === m.getFullYear(),
      }));
    }
  }, [scale, timelineStart, timelineEnd, now]);

  const totalWidth = columns.reduce((sum, c) => sum + c.width, 0);

  // Get pixel position for a date within the timeline
  const getPixelX = (date: Date): number => {
    const d = startOfDay(date);
    const dayOffset = differenceInDays(d, timelineStart);
    const pct = dayOffset / totalSpanDays;
    return pct * totalWidth;
  };

  const todayX = getPixelX(now);

  // Month groups for top header
  const monthGroups = useMemo(() => {
    const groups: { label: string; width: number }[] = [];
    let current = '';
    let accWidth = 0;
    columns.forEach(col => {
      const key = format(col.date, 'MMMM yyyy', { locale: es });
      if (key !== current) {
        if (current) groups.push({ label: current, width: accWidth });
        current = key;
        accWidth = col.width;
      } else {
        accWidth += col.width;
      }
    });
    if (current) groups.push({ label: current, width: accWidth });
    return groups;
  }, [columns]);

  // Scroll to today on mount
  useEffect(() => {
    if (scrollContainerRef.current && todayX > 0) {
      const containerWidth = scrollContainerRef.current.clientWidth - LABEL_COL_WIDTH;
      scrollContainerRef.current.scrollLeft = Math.max(0, todayX - containerWidth / 2);
    }
  }, [todayX]);

  const getEventStatus = (evento: CalendarEvent) => {
    if (evento.estado === 'completado') return 'completado';
    const eventDate = new Date(evento.fecha);
    if (isBefore(eventDate, now)) return 'vencido';
    if (differenceInDays(eventDate, now) <= 3) return 'proximo';
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

  const creationX = getPixelX(startOfDay(new Date(fechaCreacion)));

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
            <div ref={scrollContainerRef} className="overflow-x-auto">
              <div className="flex min-w-max">
                {/* Left: activity labels (sticky) */}
                <div className="shrink-0 border-r border-muted z-20 bg-background sticky left-0" style={{ width: LABEL_COL_WIDTH }}>
                  {/* Month header spacer */}
                  <div className="border-b border-muted" style={{ height: 24 }} />
                  {/* Column header spacer */}
                  <div className="border-b border-muted flex items-end px-2 pb-1 text-[10px] font-medium text-muted-foreground" style={{ height: 28 }}>
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

                {/* Right: timeline area */}
                <div style={{ width: totalWidth }} className="relative">
                  {/* Month header */}
                  <div className="flex border-b border-muted" style={{ height: 24 }}>
                    {monthGroups.map((mg, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-center text-[10px] font-semibold text-foreground border-r border-muted/60 capitalize"
                        style={{ width: mg.width }}
                      >
                        {mg.label}
                      </div>
                    ))}
                  </div>

                  {/* Column headers */}
                  <div className="flex border-b border-muted" style={{ height: 28 }}>
                    {columns.map((col, i) => (
                      <div
                        key={i}
                        className={`flex flex-col items-center justify-end pb-0.5 border-r border-muted/30 ${
                          col.isToday ? 'bg-destructive/10 font-bold' : col.isWeekend ? 'bg-muted/20' : ''
                        }`}
                        style={{ width: col.width }}
                      >
                        {col.subLabel && (
                          <span className={`text-[8px] uppercase ${col.isToday ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {col.subLabel}
                          </span>
                        )}
                        <span className={`text-[10px] leading-none ${col.isToday ? 'text-destructive' : 'text-foreground'}`}>
                          {col.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Event rows */}
                  {sortedEventos.map((evento, idx) => {
                    const status = getEventStatus(evento);
                    const colors = statusColors[status];
                    const evtX = getPixelX(startOfDay(new Date(evento.fecha)));

                    const barLeft = Math.max(creationX, 0);
                    const barWidth = Math.max(evtX - barLeft, 8);

                    return (
                      <div key={idx} className="relative border-b border-muted/30" style={{ height: ROW_HEIGHT }}>
                        {/* Column background stripes */}
                        {columns.map((col, di) => {
                          let left = 0;
                          for (let j = 0; j < di; j++) left += columns[j].width;
                          return (
                            <div
                              key={di}
                              className={`absolute top-0 bottom-0 border-r border-muted/15 ${
                                col.isToday ? 'bg-destructive/5' : col.isWeekend ? 'bg-muted/10' : ''
                              }`}
                              style={{ left, width: col.width }}
                            />
                          );
                        })}

                        {/* Bar: light */}
                        <div
                          className={`absolute rounded-sm ${colors.bar} opacity-20`}
                          style={{ left: barLeft, width: barWidth, top: ROW_HEIGHT / 2 - 5, height: 10 }}
                        />
                        {/* Bar: solid end */}
                        <div
                          className={`absolute rounded-sm ${colors.bar} opacity-55`}
                          style={{
                            left: Math.max(evtX - 40, barLeft),
                            width: Math.min(40, barWidth),
                            top: ROW_HEIGHT / 2 - 5,
                            height: 10,
                          }}
                        />

                        {/* Diamond milestone */}
                        <div
                          className={`absolute z-10 w-3 h-3 ${colors.dot} border border-background shadow-sm`}
                          style={{
                            left: evtX - 6,
                            top: ROW_HEIGHT / 2 - 6,
                            transform: 'rotate(45deg)',
                          }}
                        />

                        {/* Icons */}
                        {(evento.requiereArchivos || evento.esRondaPreguntas) && (
                          <div className="absolute z-10 flex items-center gap-0.5" style={{ left: evtX + 10, top: ROW_HEIGHT / 2 - 6 }}>
                            {evento.requiereArchivos && <FileText className="h-3 w-3 text-muted-foreground" />}
                            {evento.esRondaPreguntas && <MessageSquare className="h-3 w-3 text-muted-foreground" />}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* TODAY vertical line */}
                  <div
                    className="absolute z-30 pointer-events-none"
                    style={{ left: todayX, top: 0, bottom: 0, width: 2 }}
                  >
                    <div className="w-full h-full bg-destructive opacity-60" />
                    <div className="absolute -top-0 -translate-x-1/2 bg-destructive text-destructive-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-b whitespace-nowrap">
                      Hoy
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event detail list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-rubik">Detalle de Eventos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sortedEventos.map((evento, idx) => {
            const status = getEventStatus(evento);
            const badge = statusBadge[status];
            const colors = statusColors[status];
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
                  <p className="text-sm font-medium">
                    {format(new Date(evento.fecha), 'd MMM yyyy', { locale: es })}
                  </p>
                  <Badge variant={badge.variant} className="text-[10px]">
                    {badge.label}
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
