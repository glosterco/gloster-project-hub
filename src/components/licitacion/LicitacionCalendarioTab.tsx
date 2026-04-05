import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarEvent } from '@/hooks/useLicitaciones';
import { format, differenceInDays, isAfter, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, FileText, CheckCircle } from 'lucide-react';

interface Props {
  eventos: CalendarEvent[];
  fechaCreacion: string;
}

const LicitacionCalendarioTab: React.FC<Props> = ({ eventos, fechaCreacion }) => {
  const sortedEventos = [...eventos].sort((a, b) => 
    new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );

  const now = new Date();
  const startDate = new Date(fechaCreacion);
  const endDate = sortedEventos.length > 0 
    ? new Date(sortedEventos[sortedEventos.length - 1].fecha) 
    : now;
  const totalDays = Math.max(differenceInDays(endDate, startDate), 1);

  const getBarPosition = (fecha: string) => {
    const days = differenceInDays(new Date(fecha), startDate);
    return Math.min(Math.max((days / totalDays) * 100, 0), 100);
  };

  const getEventStatus = (fecha: string) => {
    const eventDate = new Date(fecha);
    if (isBefore(eventDate, now)) return 'completado';
    if (differenceInDays(eventDate, now) <= 3) return 'proximo';
    return 'pendiente';
  };

  const statusColors = {
    completado: 'bg-emerald-500',
    proximo: 'bg-amber-500',
    pendiente: 'bg-primary'
  };

  const statusBadge = {
    completado: 'default' as const,
    proximo: 'secondary' as const,
    pendiente: 'outline' as const
  };

  return (
    <div className="space-y-6">
      {/* Gantt Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-rubik">
            <Calendar className="h-5 w-5" />
            Carta Gantt del Proceso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline bar */}
            <div className="h-3 bg-muted rounded-full mb-8 relative">
              {/* Progress */}
              <div 
                className="h-full bg-primary/30 rounded-full"
                style={{ width: `${getBarPosition(now.toISOString())}%` }}
              />
              {/* Today marker */}
              <div 
                className="absolute top-0 w-0.5 h-6 bg-destructive -translate-y-1"
                style={{ left: `${getBarPosition(now.toISOString())}%` }}
              >
                <span className="absolute -top-5 -translate-x-1/2 text-[10px] text-destructive font-medium">
                  Hoy
                </span>
              </div>
              {/* Event markers */}
              {sortedEventos.map((evento, idx) => {
                const status = getEventStatus(evento.fecha);
                return (
                  <div 
                    key={idx}
                    className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-background ${statusColors[status]} cursor-pointer`}
                    style={{ left: `${getBarPosition(evento.fecha)}%` }}
                    title={evento.titulo}
                  />
                );
              })}
            </div>
          </div>

          {/* Events list */}
          <div className="space-y-3 mt-4">
            {sortedEventos.map((evento, idx) => {
              const status = getEventStatus(evento.fecha);
              return (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                  <div className={`w-3 h-3 rounded-full ${statusColors[status]} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{evento.titulo}</p>
                      {evento.requiereArchivos && (
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    {evento.descripcion && (
                      <p className="text-xs text-muted-foreground truncate">{evento.descripcion}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">
                      {format(new Date(evento.fecha), "d MMM yyyy", { locale: es })}
                    </p>
                    <Badge variant={statusBadge[status]} className="text-[10px]">
                      {status === 'completado' ? 'Completado' : status === 'proximo' ? 'Próximo' : 'Pendiente'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LicitacionCalendarioTab;
