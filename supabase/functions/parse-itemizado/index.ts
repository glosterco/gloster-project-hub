import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Extract text from CSV-like content (tab or comma separated)
function parseCSVText(text: string): string[][] {
  return text.split('\n').filter(l => l.trim()).map(line => line.split(/\t|,(?=(?:[^"]*"[^"]*")*[^"]*$)/));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { fileBase64, fileName, mimeType } = await req.json();

    if (!fileBase64 || !fileName) {
      return new Response(JSON.stringify({ error: 'fileBase64 and fileName are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const fileBytes = Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0));
    let extractedText = '';

    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const mime = (mimeType || '').toLowerCase();

    // ── XLSX parsing ──
    if (ext === 'xlsx' || ext === 'xls' || mime.includes('spreadsheet') || mime.includes('excel')) {
      extractedText = await extractXLSXText(fileBytes);
    }
    // ── CSV / TSV ──
    else if (ext === 'csv' || ext === 'tsv' || mime.includes('csv')) {
      extractedText = new TextDecoder().decode(fileBytes);
    }
    // ── PDF parsing ──
    else if (ext === 'pdf' || mime.includes('pdf')) {
      extractedText = extractPDFText(fileBytes);
    }
    // ── DOCX parsing ──
    else if (ext === 'docx' || mime.includes('wordprocessingml')) {
      extractedText = await extractDOCXText(fileBytes);
    }
    // ── Plain text fallback ──
    else {
      extractedText = new TextDecoder().decode(fileBytes);
    }

    if (!extractedText || extractedText.trim().length < 10) {
      return new Response(JSON.stringify({
        error: 'No se pudo extraer texto del archivo. Intente con un formato diferente.',
        extractedLength: extractedText.length,
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Increase limit to capture full document structure
    const maxChars = 60000;
    const truncatedText = extractedText.length > maxChars
      ? extractedText.substring(0, maxChars) + '\n... [documento truncado — se procesaron los primeros ' + maxChars + ' caracteres]'
      : extractedText;

    // ── AI extraction ──
    const openAIKey = Deno.env.get('LOVABLE_API_KEY');
    if (!openAIKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `Eres un ingeniero civil experto en presupuestos de construcción en Chile con más de 20 años de experiencia. Tu ÚNICA tarea es analizar documentos técnicos y convertirlos en un itemizado estructurado con máximo rigor y fidelidad al documento original.

## REGLA FUNDAMENTAL: RESPETAR LA ESTRUCTURA ORIGINAL DEL DOCUMENTO

El documento puede usar CUALQUIER sistema de codificación. Tu trabajo es DETECTAR y RESPETAR ese sistema exacto. Ejemplos de sistemas comunes:

- Numérico con puntos: 1, 1.1, 1.2, 2, 2.1
- Alfanumérico: A, A.01, A.02, B, B.01, B.02
- Romano: I, II, III con subsecciones 1, 2, 3
- Capítulos con letras: Cap. A, Cap. B
- Mixto: A.1, A.2, A.2.1, B.1
- Con guiones: 01-01, 01-02, 02-01
- Descriptivo por secciones/títulos sin código explícito

### Procedimiento obligatorio:

1. **PRIMERO**: Identifica el sistema de codificación que usa el documento (puede ser letras, números, alfanumérico, etc.)
2. **SEGUNDO**: Identifica TODOS los capítulos/secciones principales (primer nivel de jerarquía)
3. **TERCERO**: Dentro de CADA capítulo, identifica TODAS las subsecciones y partidas
4. **CUARTO**: Dentro de CADA subsección, identifica sub-partidas si existen
5. **QUINTO**: Genera el itemizado conservando EXACTAMENTE los códigos originales como prefijo de la descripción

### Ejemplo con codificación alfanumérica:
Si el documento dice:
  "A. OBRAS PRELIMINARES
   A.01 Instalación de faenas
   A.02 Trazado y replanteo
   B. MOVIMIENTO DE TIERRAS
   B.01 Excavación general"

Entonces el itemizado DEBE ser:
  "A - Obras Preliminares" (ítem padre)
  "A.01 - Instalación de faenas" (subítem)
  "A.02 - Trazado y replanteo" (subítem)
  "B - Movimiento de Tierras" (ítem padre)
  "B.01 - Excavación general" (subítem)

### Ejemplo con codificación numérica:
Si el documento dice:
  "1. OBRAS CIVILES
   1.1 Hormigones
   1.1.1 Hormigón de fundaciones
   1.2 Enfierradura"

Entonces:
  "1 - Obras Civiles"
  "1.1 - Hormigones"
  "1.1.1 - Hormigón de fundaciones"
  "1.2 - Enfierradura"

## REGLAS DE EXTRACCIÓN EXHAUSTIVA

1. **Recorre el documento COMPLETO de principio a fin**. No saltes secciones.
2. **Cada párrafo que describa un trabajo, actividad, tarea o material es una partida potencial**. Analiza CADA uno.
3. **Si una sección describe múltiples tareas en un mismo párrafo**, desglósalas como sub-partidas separadas.
4. **NO omitas**:
   - Obras preliminares, instalación y retiro de faenas
   - Protecciones, sellos, impermeabilizaciones
   - Terminaciones, pinturas, revestimientos
   - Pruebas, ensayos, certificaciones
   - Aseo permanente y final
   - Conexiones provisionales (agua, electricidad)
   - Cualquier trabajo mencionado aunque sea brevemente
5. **Incluye materiales específicos en la descripción** si se mencionan (ej: "Hormigón H-30", "Acero A630-420H", "Cerámica 30x30").

## UNIDADES DE MEDIDA

Infiere la unidad según el tipo de trabajo:
- Superficies → m²
- Longitudes → ml
- Volúmenes → m³
- Peso → kg o ton
- Unidades discretas → un
- Trabajos globales → gl
- Tiempo → mes, día, hr

## CANTIDADES Y PRECIOS

- Si el documento indica cantidades, úsalas exactas.
- Si no hay cantidad explícita pero la partida existe, usa 1 como cantidad provisional.
- precio_unitario: usa el valor del documento si existe, sino null.
- precio_total: cantidad × precio_unitario si ambos existen, sino null.
- NO incluyas subtotales, GG, utilidades ni IVA como ítems del itemizado.

## VALIDACIÓN FINAL

Antes de generar el JSON, verifica:
- ¿Cubriste TODAS las secciones del documento?
- ¿Los códigos en la descripción coinciden con los del documento original?
- ¿Hay partidas que omitiste por parecer menores?
- ¿La jerarquía refleja fielmente la estructura del documento?

## FORMATO DE RESPUESTA

Responde ÚNICAMENTE con JSON válido, sin markdown, sin explicaciones, sin texto adicional:

{
  "items": [
    {
      "descripcion": "CÓDIGO_ORIGINAL - Descripción exacta del trabajo",
      "unidad": "string o null",
      "cantidad": number o null,
      "precio_unitario": number o null,
      "precio_total": number o null
    }
  ],
  "metadata": {
    "gastos_generales_pct": number o null,
    "utilidades_pct": number o null,
    "iva_pct": number o null,
    "moneda": "string o null",
    "subtotal": number o null,
    "total": number o null,
    "codificacion_detectada": "descripción breve del sistema de codificación detectado"
  }
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analiza este documento técnico completo y genera el itemizado respetando EXACTAMENTE su estructura y codificación original.\n\nArchivo: ${fileName}\nCaracteres extraídos: ${truncatedText.length}\n\n--- INICIO DEL DOCUMENTO ---\n${truncatedText}\n--- FIN DEL DOCUMENTO ---` },
        ],
        reasoning: {
          effort: "high",
        },
        response_format: { type: 'json_object' },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('AI API error:', errText);
      throw new Error(`AI API returned ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || '{}';

    let parsed;
    try {
      // Clean potential markdown wrapping
      const cleaned = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('Failed to parse AI response:', content);
      return new Response(JSON.stringify({
        error: 'No se pudo interpretar la respuesta de IA',
        raw: content.substring(0, 500),
      }), {
        status: 422,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate and clean items
    const items = (parsed.items || []).map((item: any, idx: number) => ({
      descripcion: String(item.descripcion || '').trim(),
      unidad: item.unidad ? String(item.unidad).trim() : null,
      cantidad: typeof item.cantidad === 'number' ? item.cantidad : null,
      precio_unitario: typeof item.precio_unitario === 'number' ? item.precio_unitario : null,
      precio_total: typeof item.precio_total === 'number' ? item.precio_total : null,
      orden: idx + 1,
    })).filter((i: any) => i.descripcion.length > 0);

    return new Response(JSON.stringify({
      items,
      metadata: parsed.metadata || {},
      itemCount: items.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('parse-itemizado error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ── XLSX text extraction using ZIP parsing ──
async function extractXLSXText(bytes: Uint8Array): Promise<string> {
  const zip = await parseZip(bytes);
  
  const sharedStringsXml = zip['xl/sharedStrings.xml'] || '';
  const strings: string[] = [];
  const siRegex = /<si[^>]*>([\s\S]*?)<\/si>/g;
  let match;
  while ((match = siRegex.exec(sharedStringsXml)) !== null) {
    const tRegex = /<t[^>]*>([\s\S]*?)<\/t>/g;
    let tMatch;
    let cellText = '';
    while ((tMatch = tRegex.exec(match[1])) !== null) {
      cellText += tMatch[1];
    }
    strings.push(decodeXMLEntities(cellText));
  }

  const lines: string[] = [];
  for (const [path, content] of Object.entries(zip)) {
    if (!path.startsWith('xl/worksheets/sheet') || !path.endsWith('.xml')) continue;
    
    const rows: Map<number, Map<number, string>> = new Map();
    const rowRegex = /<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(content)) !== null) {
      const rowNum = parseInt(rowMatch[1]);
      const cellMap = new Map<number, string>();
      
      const cellRegex = /<c\s+r="([A-Z]+)(\d+)"[^>]*(?:t="([^"]*)")?[^>]*>[\s\S]*?(?:<v>([\s\S]*?)<\/v>)?[\s\S]*?<\/c>/g;
      let cellMatch;
      while ((cellMatch = cellRegex.exec(rowMatch[2])) !== null) {
        const colLetter = cellMatch[1];
        const colNum = colLetterToNum(colLetter);
        const cellType = cellMatch[3] || '';
        const value = cellMatch[4] || '';
        
        if (cellType === 's' && strings[parseInt(value)]) {
          cellMap.set(colNum, strings[parseInt(value)]);
        } else if (value) {
          cellMap.set(colNum, decodeXMLEntities(value));
        }
      }
      if (cellMap.size > 0) rows.set(rowNum, cellMap);
    }

    const sortedRows = [...rows.entries()].sort((a, b) => a[0] - b[0]);
    for (const [, cellMap] of sortedRows) {
      const maxCol = Math.max(...cellMap.keys());
      const cells: string[] = [];
      for (let c = 1; c <= maxCol; c++) {
        cells.push(cellMap.get(c) || '');
      }
      lines.push(cells.join('\t'));
    }
    lines.push('');
  }

  return lines.join('\n');
}

// ── DOCX text extraction ──
async function extractDOCXText(bytes: Uint8Array): Promise<string> {
  const zip = await parseZip(bytes);
  const docXml = zip['word/document.xml'] || '';
  
  const lines: string[] = [];
  const pRegex = /<w:p[\s>][\s\S]*?<\/w:p>/g;
  let match;
  while ((match = pRegex.exec(docXml)) !== null) {
    const tRegex = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
    let tMatch;
    let paraText = '';
    while ((tMatch = tRegex.exec(match[0])) !== null) {
      paraText += tMatch[1];
    }
    if (paraText.trim()) lines.push(decodeXMLEntities(paraText));
  }
  
  const tableRegex = /<w:tbl[\s>][\s\S]*?<\/w:tbl>/g;
  let tableMatch;
  while ((tableMatch = tableRegex.exec(docXml)) !== null) {
    const rowRegex = /<w:tr[\s>][\s\S]*?<\/w:tr>/g;
    let rowMatch;
    while ((rowMatch = rowRegex.exec(tableMatch[0])) !== null) {
      const cellRegex = /<w:tc[\s>][\s\S]*?<\/w:tc>/g;
      let cellMatch;
      const cells: string[] = [];
      while ((cellMatch = cellRegex.exec(rowMatch[0])) !== null) {
        const tRegex2 = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
        let tMatch2;
        let cellText = '';
        while ((tMatch2 = tRegex2.exec(cellMatch[0])) !== null) {
          cellText += tMatch2[1];
        }
        cells.push(decodeXMLEntities(cellText.trim()));
      }
      if (cells.some(c => c)) lines.push(cells.join('\t'));
    }
  }
  
  return lines.join('\n');
}

// ── PDF text extraction (basic) ──
function extractPDFText(bytes: Uint8Array): string {
  const text = new TextDecoder('latin1').decode(bytes);
  const lines: string[] = [];
  
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  while ((match = streamRegex.exec(text)) !== null) {
    const streamContent = match[1];
    const tjRegex = /\(((?:[^()\\]|\\.)*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(streamContent)) !== null) {
      const decoded = tjMatch[1].replace(/\\([nrt\\()])/g, (_, c) => {
        const map: Record<string, string> = { n: '\n', r: '\r', t: '\t', '\\': '\\', '(': '(', ')': ')' };
        return map[c] || c;
      });
      if (decoded.trim()) lines.push(decoded.trim());
    }
    
    const tjArrayRegex = /\[((?:[^\]]*?))\]\s*TJ/g;
    let tjArrMatch;
    while ((tjArrMatch = tjArrayRegex.exec(streamContent)) !== null) {
      const parts: string[] = [];
      const partRegex = /\(((?:[^()\\]|\\.)*)\)/g;
      let partMatch;
      while ((partMatch = partRegex.exec(tjArrMatch[1])) !== null) {
        parts.push(partMatch[1].replace(/\\([nrt\\()])/g, (_, c) => {
          const map: Record<string, string> = { n: '\n', r: '\r', t: '\t', '\\': '\\', '(': '(', ')': ')' };
          return map[c] || c;
        }));
      }
      const joined = parts.join('').trim();
      if (joined) lines.push(joined);
    }
  }
  
  if (lines.length === 0) {
    const rawTjRegex = /\(((?:[^()\\]|\\.)*)\)\s*Tj/g;
    let rawMatch;
    while ((rawMatch = rawTjRegex.exec(text)) !== null) {
      const decoded = rawMatch[1].trim();
      if (decoded) lines.push(decoded);
    }
  }
  
  return lines.join('\n');
}

// ── ZIP parser (minimal) ──
async function parseZip(bytes: Uint8Array): Promise<Record<string, string>> {
  const files: Record<string, string> = {};
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  
  let offset = 0;
  while (offset < bytes.length - 4) {
    const sig = view.getUint32(offset, true);
    if (sig !== 0x04034b50) break;
    
    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const fileNameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);
    
    const fileName = new TextDecoder().decode(bytes.slice(offset + 30, offset + 30 + fileNameLen));
    const dataStart = offset + 30 + fileNameLen + extraLen;
    const dataBytes = bytes.slice(dataStart, dataStart + compressedSize);
    
    if (compressedSize > 0) {
      if (compressionMethod === 0) {
        files[fileName] = new TextDecoder().decode(dataBytes);
      } else if (compressionMethod === 8) {
        try {
          const ds = new DecompressionStream('deflate-raw');
          const writer = ds.writable.getWriter();
          writer.write(dataBytes);
          writer.close();
          const reader = ds.readable.getReader();
          const chunks: Uint8Array[] = [];
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
          }
          const total = chunks.reduce((s, c) => s + c.length, 0);
          const result = new Uint8Array(total);
          let pos = 0;
          for (const chunk of chunks) {
            result.set(chunk, pos);
            pos += chunk.length;
          }
          files[fileName] = new TextDecoder().decode(result);
        } catch {
          // Skip files that can't be decompressed
        }
      }
    }
    
    offset = dataStart + compressedSize;
  }
  
  return files;
}

function colLetterToNum(letters: string): number {
  let num = 0;
  for (let i = 0; i < letters.length; i++) {
    num = num * 26 + (letters.charCodeAt(i) - 64);
  }
  return num;
}

function decodeXMLEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
}