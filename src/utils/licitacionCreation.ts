const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;

export interface ParsedOferenteEntry {
  email: string;
  nombreEmpresa: string | null;
}

const cleanText = (value: string) =>
  value
    .replace(/[<>()[\]{}]/g, ' ')
    .replace(/correo|email|mail/gi, ' ')
    .replace(/[:;,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const asString = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export const normalizePercentNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return fallback;

  const normalized = value.replace('%', '').replace(',', '.').trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return fallback;

  const normalized = value.replace(/\$/g, '').replace(/\./g, '').replace(',', '.').trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return ['true', 'sí', 'si', 'yes', '1', 'x'].includes(value.trim().toLowerCase());
  }

  return Boolean(value);
};

const normalizeIsoDate = (value: unknown): string => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  if (typeof value !== 'string') return '';

  const parsed = new Date(value.trim());
  return Number.isNaN(parsed.getTime()) ? value.trim() : parsed.toISOString();
};

export const parseOferenteEntry = (value: unknown): ParsedOferenteEntry | null => {
  if (typeof value === 'object' && value !== null) {
    const row = value as Record<string, unknown>;
    const email = asString(row.email) || asString(row.correo) || asString(row.mail);
    if (!EMAIL_REGEX.test(email)) return null;

    const nombreEmpresa =
      asString(row.nombre_empresa) ||
      asString(row.empresa) ||
      asString(row.nombre) ||
      asString(row.name) ||
      null;

    return { email: email.toLowerCase(), nombreEmpresa: nombreEmpresa || null };
  }

  if (typeof value !== 'string') return null;

  const emailMatch = value.match(EMAIL_REGEX);
  if (!emailMatch) return null;

  return {
    email: emailMatch[0].toLowerCase(),
    nombreEmpresa: cleanText(value.replace(emailMatch[0], ' ')) || null,
  };
};

export const parseOferenteEntries = (value: unknown): ParsedOferenteEntry[] => {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();

  return value
    .map(parseOferenteEntry)
    .filter((item): item is ParsedOferenteEntry => Boolean(item))
    .filter((item) => {
      if (seen.has(item.email)) return false;
      seen.add(item.email);
      return true;
    });
};

export const formatOferenteEntry = ({ email, nombreEmpresa }: ParsedOferenteEntry) =>
  nombreEmpresa ? `${nombreEmpresa} <${email}>` : email;

export const normalizeChatCalendarEvents = (value: unknown) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item !== 'object' || item === null) return null;
      const row = item as Record<string, unknown>;
      const fecha = normalizeIsoDate(row.fecha ?? row.date ?? row.fecha_evento);
      const titulo = asString(row.titulo) || asString(row.title) || asString(row.nombre) || asString(row.evento);
      if (!fecha || !titulo) return null;

      const fechaFin = normalizeIsoDate(row.fecha_fin ?? row.fechaFin ?? row.fecha_cierre ?? row.end_date ?? row.endDate);

      return {
        fecha,
        fechaFin: fechaFin || null,
        titulo,
        descripcion: asString(row.descripcion) || asString(row.description),
        requiereArchivos: normalizeBoolean(row.requiereArchivos ?? row.requiere_archivos ?? row.requiresFiles),
        esRondaPreguntas: normalizeBoolean(row.esRondaPreguntas ?? row.es_ronda_preguntas ?? row.rondaPreguntas),
      };
    })
    .filter(Boolean);
};

export const normalizeChatItems = (value: unknown) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      if (typeof item !== 'object' || item === null) return null;
      const row = item as Record<string, unknown>;
      const descripcion = asString(row.descripcion) || asString(row.item) || asString(row.nombre);
      if (!descripcion) return null;

      const cantidad = normalizeNumber(row.cantidad, 0);
      const precioUnitario = normalizeNumber(row.precio_unitario ?? row.precioUnitario ?? row.pu, 0);

      return {
        descripcion,
        unidad: asString(row.unidad) || '-',
        cantidad,
        precio_unitario: precioUnitario,
        precio_total: normalizeNumber(row.precio_total ?? row.precioTotal, cantidad * precioUnitario),
        orden: normalizeNumber(row.orden, index),
      };
    })
    .filter(Boolean);
};