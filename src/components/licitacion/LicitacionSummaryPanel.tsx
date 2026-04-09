import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Users,
  Calendar,
  ClipboardList,
  Building2,
  DollarSign,
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { es } from 'date-fns/locale';

export interface LicitacionSummary {
  nombre?: string;
  descripcion?: string;
  divisa?: string;
  oferentes?: string[];
  documentos?: string[];
  calendario?: Array<{
    titulo: string;
    fecha: string;
    fecha_fin?: string | null;
    esRondaPreguntas?: boolean;
  }>;
  itemizado_compartido?: boolean;
  gastos_generales?: number;
  utilidades?: number;
  iva_porcentaje?: number;
  items_count?: number;
}

interface LicitacionSummaryPanelProps {
  summary: LicitacionSummary;
  attachedFiles: string[];
}

const formatDate = (dateStr: string) => {
  try {
    const d = parseISO(dateStr);
    if (!isValid(d)) return dateStr;
    return format(d, "d 'de' MMM yyyy", { locale: es });
  } catch {
    return dateStr;
  }
};

const SectionHeader = ({ icon: Icon, title, filled }: { icon: React.ElementType; title: string; filled: boolean }) => (
  <div className="flex items-center gap-2 mb-1.5">
    {filled ? (
      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
    ) : (
      <Circle className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
    )}
    <Icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</span>
  </div>
);

const LicitacionSummaryPanel: React.FC<LicitacionSummaryPanelProps> = ({ summary, attachedFiles }) => {
  const allDocs = [...(summary.documentos || []), ...attachedFiles];
  const uniqueDocs = [...new Set(allDocs)];
  const hasName = !!summary.nombre;
  const hasDesc = !!summary.descripcion;
  const hasOferentes = (summary.oferentes?.length || 0) > 0;
  const hasDocs = uniqueDocs.length > 0;
  const hasCalendario = (summary.calendario?.length || 0) > 0;

  const filledCount = [hasName, hasDesc, hasOferentes, hasDocs, hasCalendario].filter(Boolean).length;

  // Calculate Gantt chart data
  const ganttData = React.useMemo(() => {
    if (!summary.calendario || summary.calendario.length === 0) return null;

    const events = summary.calendario
      .filter(e => e.fecha)
      .map(e => {
        const start = parseISO(e.fecha);
        const end = e.fecha_fin ? parseISO(e.fecha_fin) : null;
        return { ...e, startDate: start, endDate: end };
      })
      .filter(e => isValid(e.startDate));

    if (events.length === 0) return null;

    const allDates = events.flatMap(e => [e.startDate, ...(e.endDate && isValid(e.endDate) ? [e.endDate] : [])]);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    // Add padding
    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 2);

    const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));

    return { events, minDate, maxDate, totalDays };
  }, [summary.calendario]);

  return (
    <div className="h-full flex flex-col border-l bg-muted/30">
      <div className="px-4 py-3 border-b bg-background">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold font-rubik text-foreground">Resumen</h3>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            {filledCount}/5
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Nombre */}
          <div>
            <SectionHeader icon={Building2} title="Nombre" filled={hasName} />
            {hasName ? (
              <p className="text-sm font-medium text-foreground pl-6">{summary.nombre}</p>
            ) : (
              <p className="text-xs text-muted-foreground/60 italic pl-6">Pendiente...</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <SectionHeader icon={ClipboardList} title="Descripción" filled={hasDesc} />
            {hasDesc ? (
              <p className="text-xs text-foreground/80 pl-6 line-clamp-3">{summary.descripcion}</p>
            ) : (
              <p className="text-xs text-muted-foreground/60 italic pl-6">Pendiente...</p>
            )}
          </div>

          {/* Divisa */}
          {summary.divisa && (
            <div>
              <SectionHeader icon={DollarSign} title="Divisa" filled={true} />
              <p className="text-xs text-foreground/80 pl-6">
                {summary.divisa === 'CLP' ? 'Pesos chilenos ($)' : summary.divisa === 'UF' ? 'UF' : summary.divisa === 'abierto' ? 'Abierto al oferente' : summary.divisa}
              </p>
            </div>
          )}

          {/* Documentos */}
          <div>
            <SectionHeader icon={FileText} title={`Documentos (${uniqueDocs.length})`} filled={hasDocs} />
            {hasDocs ? (
              <div className="pl-6 space-y-1">
                {uniqueDocs.map((doc, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <FileText className="h-3 w-3 text-primary/60 flex-shrink-0" />
                    <span className="text-xs text-foreground/80 truncate">{doc}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/60 italic pl-6">Sin documentos aún</p>
            )}
          </div>

          {/* Oferentes */}
          <div>
            <SectionHeader icon={Users} title={`Oferentes (${summary.oferentes?.length || 0})`} filled={hasOferentes} />
            {hasOferentes ? (
              <div className="pl-6 space-y-1">
                {summary.oferentes!.map((of, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <span className="text-xs text-foreground/80 truncate">{of}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/60 italic pl-6">Sin oferentes aún</p>
            )}
          </div>

          {/* Calendario / Mini Gantt */}
          <div>
            <SectionHeader icon={Calendar} title={`Calendario (${summary.calendario?.length || 0})`} filled={hasCalendario} />
            {hasCalendario && ganttData ? (
              <div className="pl-6 mt-2">
                {/* Mini Gantt chart */}
                <div className="space-y-1.5">
                  {ganttData.events.map((evt, i) => {
                    const startOffset = Math.max(0, Math.ceil((evt.startDate.getTime() - ganttData.minDate.getTime()) / (1000 * 60 * 60 * 24)));
                    const duration = evt.endDate && isValid(evt.endDate)
                      ? Math.max(1, Math.ceil((evt.endDate.getTime() - evt.startDate.getTime()) / (1000 * 60 * 60 * 24)))
                      : 1;
                    const leftPct = (startOffset / ganttData.totalDays) * 100;
                    const widthPct = Math.max(3, (duration / ganttData.totalDays) * 100);
                    const isRange = evt.endDate && isValid(evt.endDate);

                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] text-foreground/70 font-medium truncate flex-1 mr-1">
                            {evt.titulo}
                          </span>
                          <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                            {formatDate(evt.fecha)}
                          </span>
                        </div>
                        <div className="relative h-2.5 bg-muted rounded-full overflow-hidden">
                          {isRange ? (
                            <div
                              className={`absolute h-full rounded-full ${
                                evt.esRondaPreguntas ? 'bg-blue-400' : 'bg-primary/60'
                              }`}
                              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                            />
                          ) : (
                            <div
                              className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background"
                              style={{ left: `${leftPct}%` }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Date range labels */}
                <div className="flex justify-between mt-1.5">
                  <span className="text-[9px] text-muted-foreground">{formatDate(ganttData.minDate.toISOString())}</span>
                  <span className="text-[9px] text-muted-foreground">{formatDate(ganttData.maxDate.toISOString())}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/60 italic pl-6">Sin eventos aún</p>
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default LicitacionSummaryPanel;
