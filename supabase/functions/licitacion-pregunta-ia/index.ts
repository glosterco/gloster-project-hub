import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Get Google Drive access token via token manager
async function getDriveAccessToken(): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const resp = await fetch(`${supabaseUrl}/functions/v1/google-drive-token-manager`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({ action: "validate" }),
  });

  const result = await resp.json();
  if (!result.valid || !result.access_token) {
    throw new Error("Failed to get Drive access token");
  }
  return result.access_token;
}

// Extract Drive file ID from URL
function extractDriveFileId(url: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// Download file bytes from Drive
async function downloadDriveFile(
  accessToken: string,
  fileId: string,
  fileName: string,
): Promise<{ bytes: Uint8Array; mimeType: string } | null> {
  try {
    // First get file metadata for mime type
    const metaUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType,size`;
    const metaResp = await fetch(metaUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    let fileMimeType = "";
    if (metaResp.ok) {
      const meta = await metaResp.json();
      fileMimeType = meta.mimeType || "";
    }

    // For Google Docs native formats, export as plain text
    const googleDocTypes = [
      "application/vnd.google-apps.document",
      "application/vnd.google-apps.spreadsheet",
      "application/vnd.google-apps.presentation",
    ];

    if (googleDocTypes.includes(fileMimeType)) {
      const exportUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
      const resp = await fetch(exportUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!resp.ok) return null;
      const text = await resp.text();
      return { bytes: new TextEncoder().encode(text), mimeType: "text/plain" };
    }

    // Download binary
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const resp = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) {
      console.error(`Failed to download ${fileName}: ${resp.status}`);
      return null;
    }

    const buffer = await resp.arrayBuffer();
    return { bytes: new Uint8Array(buffer), mimeType: fileMimeType };
  } catch (err) {
    console.error(`Error downloading ${fileName}:`, err);
    return null;
  }
}

// Extract text from non-PDF files (text, DOCX, XLSX)
function extractTextFromFile(bytes: Uint8Array, mimeType: string, fileName: string): string {
  // Text-based files
  if (
    mimeType?.includes("text/") ||
    mimeType?.includes("csv") ||
    fileName.endsWith(".txt") ||
    fileName.endsWith(".csv")
  ) {
    return new TextDecoder().decode(bytes);
  }

  // DOCX - extract via ZIP/XML  
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    fileName.toLowerCase().endsWith(".docx")
  ) {
    return extractTextFromDocxBytes(bytes, fileName);
  }

  // XLSX
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
    fileName.toLowerCase().endsWith(".xlsx")
  ) {
    return extractTextFromXlsxBytes(bytes, fileName);
  }

  return "";
}

// Synchronous DOCX text extraction
function extractTextFromDocxBytes(bytes: Uint8Array, fileName: string): string {
  try {
    const files = parseZipSync(bytes);
    const docXml = files["word/document.xml"];
    if (!docXml) return "";
    const xml = new TextDecoder().decode(docXml);
    const texts: string[] = [];
    // Match w:t tags
    const tRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let m;
    while ((m = tRegex.exec(xml)) !== null) {
      texts.push(m[1]);
    }
    const text = texts.join(" ");
    console.log(`DOCX ${fileName}: extracted ${text.length} chars`);
    return text;
  } catch (err) {
    console.error(`DOCX extraction error for ${fileName}:`, err);
    return "";
  }
}

// Synchronous XLSX text extraction
function extractTextFromXlsxBytes(bytes: Uint8Array, fileName: string): string {
  try {
    const files = parseZipSync(bytes);
    const sharedStringsFile = files["xl/sharedStrings.xml"];
    if (!sharedStringsFile) return "";
    const xml = new TextDecoder().decode(sharedStringsFile);
    const texts: string[] = [];
    const tRegex = /<t[^>]*>([^<]+)<\/t>/g;
    let m;
    while ((m = tRegex.exec(xml)) !== null) {
      texts.push(m[1]);
    }
    const text = texts.join(" ");
    console.log(`XLSX ${fileName}: extracted ${text.length} chars`);
    return text;
  } catch (err) {
    console.error(`XLSX extraction error for ${fileName}:`, err);
    return "";
  }
}

// Synchronous ZIP parser — only handles STORED (uncompressed) entries
function parseZipSync(data: Uint8Array): Record<string, Uint8Array> {
  const files: Record<string, Uint8Array> = {};
  let offset = 0;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  while (offset < data.length - 4) {
    const sig = view.getUint32(offset, true);
    if (sig !== 0x04034b50) break;

    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const uncompressedSize = view.getUint32(offset + 22, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const fileName = new TextDecoder().decode(data.slice(offset + 30, offset + 30 + nameLength));
    const fileDataStart = offset + 30 + nameLength + extraLength;

    if (compressionMethod === 0) {
      // STORED
      files[fileName] = data.slice(fileDataStart, fileDataStart + uncompressedSize);
    }
    // Skip compressed entries — they'll be handled by AI extraction as fallback

    offset = fileDataStart + compressedSize;
  }

  return files;
}

// Async ZIP parser for compressed entries
async function parseZipAsync(data: Uint8Array): Promise<Record<string, Uint8Array>> {
  const files: Record<string, Uint8Array> = {};
  let offset = 0;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

  while (offset < data.length - 4) {
    const sig = view.getUint32(offset, true);
    if (sig !== 0x04034b50) break;

    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const uncompressedSize = view.getUint32(offset + 22, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const fileName = new TextDecoder().decode(data.slice(offset + 30, offset + 30 + nameLength));
    const fileDataStart = offset + 30 + nameLength + extraLength;

    if (compressionMethod === 0) {
      files[fileName] = data.slice(fileDataStart, fileDataStart + uncompressedSize);
    } else if (compressionMethod === 8) {
      try {
        const compressed = data.slice(fileDataStart, fileDataStart + compressedSize);
        const ds = new DecompressionStream("raw-deflate" as any);
        const writer = ds.writable.getWriter();
        const reader = ds.readable.getReader();
        
        writer.write(compressed);
        writer.close();
        
        const chunks: Uint8Array[] = [];
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) chunks.push(value);
        }
        
        const total = chunks.reduce((s, c) => s + c.length, 0);
        const result = new Uint8Array(total);
        let pos = 0;
        for (const chunk of chunks) {
          result.set(chunk, pos);
          pos += chunk.length;
        }
        files[fileName] = result;
      } catch (e) {
        console.error(`Failed to decompress ${fileName}:`, e);
      }
    }

    offset = fileDataStart + compressedSize;
  }

  return files;
}

// Extract text from DOCX using async ZIP (handles compressed entries)
async function extractTextFromDocxAsync(bytes: Uint8Array, fileName: string): Promise<string> {
  try {
    const files = await parseZipAsync(bytes);
    const docXml = files["word/document.xml"];
    if (!docXml) return "";
    const xml = new TextDecoder().decode(docXml);
    const texts: string[] = [];
    const tRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let m;
    while ((m = tRegex.exec(xml)) !== null) {
      texts.push(m[1]);
    }
    const text = texts.join(" ");
    console.log(`DOCX async ${fileName}: extracted ${text.length} chars`);
    return text;
  } catch (err) {
    console.error(`DOCX async extraction error for ${fileName}:`, err);
    return "";
  }
}

// Extract text from XLSX using async ZIP
async function extractTextFromXlsxAsync(bytes: Uint8Array, fileName: string): Promise<string> {
  try {
    const files = await parseZipAsync(bytes);
    const sharedStringsFile = files["xl/sharedStrings.xml"];
    if (!sharedStringsFile) return "";
    const xml = new TextDecoder().decode(sharedStringsFile);
    const texts: string[] = [];
    const tRegex = /<t[^>]*>([^<]+)<\/t>/g;
    let m;
    while ((m = tRegex.exec(xml)) !== null) {
      texts.push(m[1]);
    }
    const text = texts.join(" ");
    console.log(`XLSX async ${fileName}: extracted ${text.length} chars`);
    return text;
  } catch (err) {
    console.error(`XLSX async extraction error for ${fileName}:`, err);
    return "";
  }
}

// Convert bytes to base64
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
  }
  return btoa(binary);
}

// Determine if a file should be sent natively to Gemini (as inline_data)
function isNativeGeminiFormat(mimeType: string, fileName: string): boolean {
  const nativeMimes = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
  ];
  const fl = fileName.toLowerCase();
  return nativeMimes.includes(mimeType) || fl.endsWith(".pdf") || fl.endsWith(".png") || fl.endsWith(".jpg") || fl.endsWith(".jpeg");
}

// Size limit for inline files (15MB)
const MAX_INLINE_FILE_SIZE = 15 * 1024 * 1024;
// Increased text limit per document (20K chars)
const MAX_TEXT_PER_DOC = 20000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { preguntaId, licitacionId } = await req.json();
    if (!preguntaId || !licitacionId) {
      return new Response(JSON.stringify({ error: "preguntaId and licitacionId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the question
    const { data: pregunta, error: pErr } = await supabase
      .from("LicitacionPreguntas")
      .select("*")
      .eq("id", preguntaId)
      .single();
    if (pErr || !pregunta) throw new Error("Pregunta not found");

    // Fetch all context in parallel
    const [
      { data: licitacion },
      { data: docs },
      { data: oferentes },
      { data: eventos },
      { data: items },
      { data: otherPreguntas },
    ] = await Promise.all([
      supabase.from("Licitaciones").select("nombre, descripcion, especificaciones, drive_docs_folder_id").eq("id", licitacionId).single(),
      supabase.from("LicitacionDocumentos").select("nombre, tipo, url").eq("licitacion_id", licitacionId),
      supabase.from("LicitacionOferentes").select("email, nombre_empresa, aceptada").eq("licitacion_id", licitacionId),
      supabase.from("LicitacionEventos").select("titulo, fecha, estado, descripcion").eq("licitacion_id", licitacionId).order("fecha"),
      supabase.from("LicitacionItems").select("descripcion, unidad, cantidad, precio_unitario").eq("licitacion_id", licitacionId).eq("agregado_por_oferente", false).order("orden").limit(100),
      supabase.from("LicitacionPreguntas").select("pregunta, respuesta, respondida, publicada").eq("licitacion_id", licitacionId).eq("respondida", true).neq("id", preguntaId).limit(30),
    ]);

    // --- Download and prepare document content ---
    // Strategy: All documents are converted to text for GPT-5 compatibility
    const textDocuments: { nombre: string; contenido: string }[] = [];
    const fileNames: string[] = [];

    if (docs && docs.length > 0) {
      let accessToken: string | null = null;
      try {
        accessToken = await getDriveAccessToken();
      } catch (err) {
        console.error("Could not get Drive token:", err);
      }

      if (accessToken) {
        // Download all files in parallel
        const downloadPromises = docs.map(async (doc) => {
          if (!doc.url) return null;
          const fileId = extractDriveFileId(doc.url);
          if (!fileId) return null;
          
          console.log(`📄 Downloading: ${doc.nombre}`);
          const result = await downloadDriveFile(accessToken!, fileId, doc.nombre);
          if (!result) return null;
          return { doc, ...result };
        });

        const downloaded = (await Promise.all(downloadPromises)).filter(Boolean) as {
          doc: { nombre: string; tipo: string | null; url: string | null };
          bytes: Uint8Array;
          mimeType: string;
        }[];

        for (const { doc, bytes, mimeType } of downloaded) {
          fileNames.push(doc.nombre);
          const effectiveMime = mimeType || doc.tipo || "";

          // For PDFs and images: use Gemini to extract text first (GPT-5 doesn't support inline binary)
          if (isNativeGeminiFormat(effectiveMime, doc.nombre) && bytes.length <= MAX_INLINE_FILE_SIZE) {
            console.log(`📄 Extracting text from PDF via Gemini: ${doc.nombre} (${bytes.length} bytes)`);
            try {
              const base64 = bytesToBase64(bytes);
              const pdfMime = effectiveMime.includes("pdf") ? "application/pdf" : effectiveMime;
              const extractResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${LOVABLE_API_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  model: "google/gemini-2.5-flash-lite",
                  messages: [
                    { role: "system", content: "Extrae TODO el texto del documento adjunto. Devuelve el contenido completo tal cual, sin resúmenes ni omisiones. Incluye tablas, notas, anexos y todo el contenido visible. No agregues comentarios propios." },
                    { role: "user", content: [
                      { type: "text", text: `Extrae todo el texto del archivo "${doc.nombre}":` },
                      { inline_data: { mime_type: pdfMime, data: base64 } },
                    ]},
                  ],
                }),
              });

              if (extractResp.ok) {
                const extractData = await extractResp.json();
                const extractedText = extractData.choices?.[0]?.message?.content || "";
                if (extractedText.length > 10) {
                  const trimmed = extractedText.length > MAX_TEXT_PER_DOC * 2
                    ? extractedText.substring(0, MAX_TEXT_PER_DOC * 2) + "\n[... documento truncado ...]"
                    : extractedText;
                  textDocuments.push({ nombre: doc.nombre, contenido: trimmed });
                  console.log(`✅ ${doc.nombre}: ${trimmed.length} chars extracted via Gemini OCR`);
                } else {
                  console.log(`⚠️ ${doc.nombre}: Gemini extraction returned minimal text`);
                }
              } else {
                console.error(`❌ Gemini extraction failed for ${doc.nombre}: ${extractResp.status}`);
              }
            } catch (extractErr) {
              console.error(`❌ Gemini extraction error for ${doc.nombre}:`, extractErr);
            }
            continue;
          }

          // DOCX/XLSX → try async extraction (handles compressed ZIP entries)
          let text = "";
          if (effectiveMime.includes("wordprocessingml") || doc.nombre.toLowerCase().endsWith(".docx")) {
            text = await extractTextFromDocxAsync(bytes, doc.nombre);
          } else if (effectiveMime.includes("spreadsheetml") || doc.nombre.toLowerCase().endsWith(".xlsx")) {
            text = await extractTextFromXlsxAsync(bytes, doc.nombre);
          } else {
            text = extractTextFromFile(bytes, effectiveMime, doc.nombre);
          }

          if (text && text.length > 10) {
            const trimmed = text.length > MAX_TEXT_PER_DOC
              ? text.substring(0, MAX_TEXT_PER_DOC) + "\n[... documento truncado ...]"
              : text;
            textDocuments.push({ nombre: doc.nombre, contenido: trimmed });
            console.log(`✅ ${doc.nombre}: ${trimmed.length} chars extracted as text`);
          } else {
            console.log(`⚠️ ${doc.nombre}: no text extracted (${text.length} chars)`);
          }
        }
      }
    }

    // Build text context
    const contextParts: string[] = [];
    if (licitacion) {
      contextParts.push(`Nombre del proceso: ${licitacion.nombre}`);
      contextParts.push(`Descripción: ${licitacion.descripcion}`);
      if (licitacion.especificaciones) {
        contextParts.push(`Especificaciones técnicas:\n${licitacion.especificaciones}`);
      }
    }

    if (oferentes && oferentes.length > 0) {
      contextParts.push(`OFERENTES INVITADOS:\n${oferentes.map(o => `- ${o.email}${o.nombre_empresa ? ` (${o.nombre_empresa})` : ''} - ${o.aceptada ? 'Aceptó' : 'Pendiente'}`).join('\n')}`);
    }
    if (eventos && eventos.length > 0) {
      contextParts.push(`CALENDARIO DEL PROCESO:\n${eventos.map(e => `- ${e.fecha}: ${e.titulo} [${e.estado}]${e.descripcion ? ` - ${e.descripcion}` : ''}`).join('\n')}`);
    }
    if (items && items.length > 0) {
      contextParts.push(`ITEMIZADO BASE (${items.length} ítems):\n${items.map(i => `- ${i.descripcion} | ${i.unidad || '-'} | Cant: ${i.cantidad || '-'} | PU: ${i.precio_unitario || '-'}`).join('\n')}`);
    }
    if (otherPreguntas && otherPreguntas.length > 0) {
      contextParts.push(`PREGUNTAS YA RESPONDIDAS EN ESTE PROCESO:\n${otherPreguntas.map(p => `P: ${p.pregunta}\nR: ${p.respuesta}`).join('\n\n')}`);
    }
    if (textDocuments.length > 0) {
      for (const dt of textDocuments) {
        contextParts.push(`--- CONTENIDO DEL DOCUMENTO: "${dt.nombre}" ---\n${dt.contenido}\n--- FIN DOCUMENTO ---`);
      }
    }

    const systemPrompt = `Eres un asistente técnico experto en licitaciones de construcción en Chile.
Se te proporciona el contexto completo de un proceso de licitación y una pregunta de un oferente.
Tu tarea es buscar exhaustivamente en TODOS los antecedentes proporcionados para encontrar la respuesta.

CONTEXTO DEL PROCESO:
${contextParts.join("\n\n")}

INSTRUCCIONES DE BÚSQUEDA (MUY IMPORTANTE):
1. BUSCA EN TODOS LOS DOCUMENTOS: Lee cada documento completo, no solo los primeros párrafos. La respuesta puede estar en cualquier sección, tabla, anexo o nota al pie.
2. BUSCA SINÓNIMOS Y TÉRMINOS RELACIONADOS: Si la pregunta habla de "plazo", busca también "duración", "calendario", "tiempo", "días", "meses". Si habla de "pago", busca "facturación", "cobro", "estado de pago", etc.
3. BUSCA EN TABLAS Y LISTAS: Muchas veces la información está en tablas, cuadros o listas numeradas dentro de los documentos.
4. CRUZA INFORMACIÓN: Si un documento menciona un tema parcialmente, busca en los demás documentos información complementaria.
5. CITAS TEXTUALES: Cuando encuentres la información, incluye la cita textual exacta del documento para respaldar tu respuesta.

REGLAS DE RESPUESTA:
- Responde SOLO con información que se encuentre en los documentos, especificaciones, itemizado, calendario o descripción del proceso.
- También puedes usar respuestas previas ya dadas en este proceso para mantener coherencia.
- Si tras buscar exhaustivamente NO encuentras la información, responde: "No se encontró información suficiente en los antecedentes del proceso para responder esta consulta. Se recomienda que el mandante responda directamente."
- NO uses formato con doble asterisco (**). Usa texto plano, viñetas simples con guiones (-) y saltos de línea.
- Sé directo y profesional. Incluye citas textuales del documento fuente.
- Cita la fuente: "Según [nombre del documento], sección/página X: '[cita textual]'..."
- Responde en español chileno.

IMPORTANTE SOBRE FUENTES:
Al final de tu respuesta, agrega una línea con "---FUENTES---" seguida de las citas textuales relevantes:
[DOCUMENTO: nombre_documento] "cita textual exacta del documento que respalda la respuesta"
Incluye SOLO los pasajes textuales específicos que fundamentan tu respuesta.`;

    const userPrompt = `Pregunta del oferente${pregunta.especialidad ? ` (especialidad: ${pregunta.especialidad})` : ""}:\n\n"${pregunta.pregunta}"\n\nBusca exhaustivamente en todos los antecedentes del proceso la respuesta a esta pregunta.`;

    console.log(`🤖 Sending to GPT-5: ${contextParts.join("").length} chars text context, ${textDocuments.length} documents extracted`);

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI error:", aiResp.status, t);
      throw new Error(`AI gateway error: ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    let aiAnswer = aiData.choices?.[0]?.message?.content || "";

    // Parse sources from AI response
    const fuentes: any[] = [];
    const fuentesSeparator = "---FUENTES---";
    if (aiAnswer.includes(fuentesSeparator)) {
      const parts = aiAnswer.split(fuentesSeparator);
      aiAnswer = parts[0].trim();
      const fuentesText = parts[1]?.trim() || "";
      const fuenteRegex = /\[DOCUMENTO:\s*([^\]]+)\]\s*([\s\S]*?)(?=\[DOCUMENTO:|$)/g;
      let fm;
      while ((fm = fuenteRegex.exec(fuentesText)) !== null) {
        fuentes.push({
          documento: fm[1].trim(),
          extracto_relevante: fm[2].trim(),
        });
      }
      if (fuentes.length === 0 && fuentesText.length > 10) {
        fuentes.push({
          documento: "Fuentes del proceso",
          extracto_relevante: fuentesText,
        });
      }
    }

    // Fallback: add document names if no structured sources
    if (fuentes.length === 0) {
      if (textDocuments.length > 0) {
        for (const dt of textDocuments) {
          fuentes.push({
            documento: dt.nombre,
            extracto: dt.contenido.substring(0, 500) + (dt.contenido.length > 500 ? "..." : ""),
          });
        }
      }
      if (fileNames.length > 0 && fuentes.length === 0) {
        fuentes.push({
          documento: "Documentos analizados",
          extracto_relevante: `Se analizaron los siguientes archivos: ${fileNames.join(", ")}`,
        });
      }
      if (licitacion?.especificaciones) {
        fuentes.push({
          documento: "Especificaciones Técnicas",
          extracto: licitacion.especificaciones.substring(0, 500) + (licitacion.especificaciones.length > 500 ? "..." : ""),
        });
      }
    }

    // Update the pregunta with AI answer
    const { error: uErr } = await supabase
      .from("LicitacionPreguntas")
      .update({
        respuesta_ia: aiAnswer,
        respuesta_ia_fuentes: fuentes,
      })
      .eq("id", preguntaId);

    if (uErr) throw uErr;

    return new Response(JSON.stringify({ success: true, respuesta_ia: aiAnswer, fuentes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("licitacion-pregunta-ia error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
