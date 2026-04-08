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
      // Use a simple approach: decode the shared strings and sheet data from the XLSX zip
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

    // Truncate to avoid token limits
    const maxChars = 15000;
    const truncatedText = extractedText.length > maxChars
      ? extractedText.substring(0, maxChars) + '\n... [truncado]'
      : extractedText;

    // ── AI extraction ──
    const openAIKey = Deno.env.get('LOVABLE_API_KEY');
    if (!openAIKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `Eres un experto en presupuestos de construcción en Chile.
Tu tarea es convertir un documento en un itemizado estructurado.

REGLAS ESTRICTAS:
- Si el documento ya contiene un presupuesto, planilla o itemizado explícito, extráelo respetando su estructura y orden.
- Si el documento corresponde a EETT, bases técnicas, memorias descriptivas o antecedentes de obra sin planilla explícita, genera un itemizado base PROVISIONAL a partir de los trabajos descritos.
- En documentos tipo EETT debes desglosar partidas medibles y valorizables, evitando omitir obras preliminares, terminaciones, pruebas, protecciones, aseo y cierres si aplican.
- Cada ítem debe tener: descripcion, unidad, cantidad, precio_unitario, precio_total.
- Si un campo no está disponible, usa null.
- Si la cantidad no está explícita pero la partida existe, usa 1 como cantidad provisional.
- El precio_unitario debe ser null si el documento no trae precio.
- El precio_total debe ser cantidad * precio_unitario cuando ambos existan; si no, usa null.
- Mantén el orden lógico del documento.
- NO inventes especialidades o partidas que no tengan sustento en el texto.
- Si hay subtotales, GG, utilidades o IVA, NO los incluyas como ítems.
- Responde SOLO con JSON válido, sin markdown ni explicaciones.

Formato de respuesta:
{
  "items": [
    {
      "descripcion": "string",
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
    "total": number o null
  }
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Extrae el itemizado del siguiente documento (${fileName}):\n\n${truncatedText}` },
        ],
        temperature: 0.1,
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
  // Simple ZIP-based extraction for XLSX
  const zip = await parseZip(bytes);
  
  // Extract shared strings
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

  // Extract sheet data
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

    // Convert to tab-separated text
    const sortedRows = [...rows.entries()].sort((a, b) => a[0] - b[0]);
    for (const [, cellMap] of sortedRows) {
      const maxCol = Math.max(...cellMap.keys());
      const cells: string[] = [];
      for (let c = 1; c <= maxCol; c++) {
        cells.push(cellMap.get(c) || '');
      }
      lines.push(cells.join('\t'));
    }
    lines.push(''); // separator between sheets
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
  
  // Also extract tables for structured data
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
  // Simple PDF text extraction - find text between BT/ET blocks
  const text = new TextDecoder('latin1').decode(bytes);
  const lines: string[] = [];
  
  // Try to extract from streams
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  while ((match = streamRegex.exec(text)) !== null) {
    const streamContent = match[1];
    // Extract text from Tj and TJ operators
    const tjRegex = /\(((?:[^()\\]|\\.)*)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(streamContent)) !== null) {
      const decoded = tjMatch[1].replace(/\\([nrt\\()])/g, (_, c) => {
        const map: Record<string, string> = { n: '\n', r: '\r', t: '\t', '\\': '\\', '(': '(', ')': ')' };
        return map[c] || c;
      });
      if (decoded.trim()) lines.push(decoded.trim());
    }
    
    // TJ array operator
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
  
  // If no text extracted from streams, try raw content
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
    if (sig !== 0x04034b50) break; // Local file header
    
    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const uncompressedSize = view.getUint32(offset + 22, true);
    const fileNameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);
    
    const fileName = new TextDecoder().decode(bytes.slice(offset + 30, offset + 30 + fileNameLen));
    const dataStart = offset + 30 + fileNameLen + extraLen;
    const dataBytes = bytes.slice(dataStart, dataStart + compressedSize);
    
    if (compressedSize > 0) {
      if (compressionMethod === 0) {
        // Stored (no compression)
        files[fileName] = new TextDecoder().decode(dataBytes);
      } else if (compressionMethod === 8) {
        // Deflate
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
