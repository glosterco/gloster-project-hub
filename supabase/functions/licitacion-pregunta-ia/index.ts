import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function getDriveAccessToken(): Promise<string> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const resp = await fetch(`${supabaseUrl}/functions/v1/google-drive-token-manager`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${supabaseAnonKey}` },
    body: JSON.stringify({ action: "validate" }),
  });
  const result = await resp.json();
  if (!result.valid || !result.access_token) throw new Error("Failed to get Drive access token");
  return result.access_token;
}

function extractDriveFileId(url: string): string | null {
  for (const p of [/\/file\/d\/([a-zA-Z0-9_-]+)/, /id=([a-zA-Z0-9_-]+)/, /\/d\/([a-zA-Z0-9_-]+)/]) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

async function downloadDriveFile(accessToken: string, fileId: string, fileName: string): Promise<{ bytes: Uint8Array; mimeType: string } | null> {
  try {
    const metaResp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?fields=mimeType,size`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    let fileMimeType = "";
    if (metaResp.ok) { const meta = await metaResp.json(); fileMimeType = meta.mimeType || ""; }

    const googleDocTypes = ["application/vnd.google-apps.document", "application/vnd.google-apps.spreadsheet", "application/vnd.google-apps.presentation"];
    if (googleDocTypes.includes(fileMimeType)) {
      const resp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!resp.ok) return null;
      return { bytes: new TextEncoder().encode(await resp.text()), mimeType: "text/plain" };
    }

    const resp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) return null;
    return { bytes: new Uint8Array(await resp.arrayBuffer()), mimeType: fileMimeType };
  } catch (err) { console.error(`Error downloading ${fileName}:`, err); return null; }
}

async function parseZipAsync(data: Uint8Array): Promise<Record<string, Uint8Array>> {
  const files: Record<string, Uint8Array> = {};
  let offset = 0;
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  while (offset < data.length - 4) {
    const sig = view.getUint32(offset, true);
    if (sig !== 0x04034b50) break;
    const compressionMethod = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const fileName = new TextDecoder().decode(data.slice(offset + 30, offset + 30 + nameLength));
    const fileDataStart = offset + 30 + nameLength + extraLength;
    if (compressionMethod === 0) {
      const uncompressedSize = view.getUint32(offset + 22, true);
      files[fileName] = data.slice(fileDataStart, fileDataStart + uncompressedSize);
    } else if (compressionMethod === 8) {
      try {
        const compressed = data.slice(fileDataStart, fileDataStart + compressedSize);
        const ds = new DecompressionStream("raw-deflate" as any);
        const writer = ds.writable.getWriter();
        const reader = ds.readable.getReader();
        writer.write(compressed); writer.close();
        const chunks: Uint8Array[] = [];
        while (true) { const { value, done } = await reader.read(); if (done) break; if (value) chunks.push(value); }
        const total = chunks.reduce((s, c) => s + c.length, 0);
        const result = new Uint8Array(total);
        let pos = 0;
        for (const chunk of chunks) { result.set(chunk, pos); pos += chunk.length; }
        files[fileName] = result;
      } catch (e) { console.error(`Failed to decompress ${fileName}:`, e); }
    }
    offset = fileDataStart + compressedSize;
  }
  return files;
}

async function extractTextFromDocx(bytes: Uint8Array): Promise<string> {
  try {
    const files = await parseZipAsync(bytes);
    const docXml = files["word/document.xml"];
    if (!docXml) return "";
    const xml = new TextDecoder().decode(docXml);
    const texts: string[] = [];
    const tRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let m; while ((m = tRegex.exec(xml)) !== null) texts.push(m[1]);
    return texts.join(" ");
  } catch { return ""; }
}

async function extractTextFromXlsx(bytes: Uint8Array): Promise<string> {
  try {
    const files = await parseZipAsync(bytes);
    const ss = files["xl/sharedStrings.xml"];
    if (!ss) return "";
    const xml = new TextDecoder().decode(ss);
    const texts: string[] = [];
    const tRegex = /<t[^>]*>([^<]+)<\/t>/g;
    let m; while ((m = tRegex.exec(xml)) !== null) texts.push(m[1]);
    return texts.join(" ");
  } catch { return ""; }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
  return btoa(binary);
}

function isNativeGeminiFormat(mimeType: string, fileName: string): boolean {
  const fl = fileName.toLowerCase();
  return mimeType === "application/pdf" || mimeType.startsWith("image/") ||
    fl.endsWith(".pdf") || fl.endsWith(".png") || fl.endsWith(".jpg") || fl.endsWith(".jpeg");
}

const MAX_INLINE_FILE_SIZE = 15 * 1024 * 1024;
const MAX_TEXT_PER_DOC = 40000;

// --- Cross-validation: verify that cited content relates to source texts ---
function validateCitations(
  fuentes: { documento: string; extracto_relevante: string }[],
  sourceTexts: Map<string, string>
): { documento: string; extracto_relevante: string; verificado: boolean; fragmento_encontrado: string }[] {
  return fuentes.map(f => {
    const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").replace(/[""''«»]/g, '"').trim();

    let bestMatch = false;
    let foundFragment = "";

    // Find matching source documents by name
    const docsToSearch = new Map<string, string>();
    for (const [name, text] of sourceTexts) {
      if (normalize(name).includes(normalize(f.documento)) || normalize(f.documento).includes(normalize(name))) {
        docsToSearch.set(name, text);
      }
    }
    if (docsToSearch.size === 0) {
      for (const [name, text] of sourceTexts) docsToSearch.set(name, text);
    }

    const citaNorm = normalize(f.extracto_relevante);

    for (const [, sourceText] of docsToSearch) {
      const sourceNorm = normalize(sourceText);

      // 1. Full citation match
      if (sourceNorm.includes(citaNorm)) {
        bestMatch = true;
        foundFragment = f.extracto_relevante;
        break;
      }

      // 2. Try meaningful sub-phrases (split by punctuation, >10 chars)
      const phrases = f.extracto_relevante.split(/[.;,:\n]/).filter(p => p.trim().length > 10);
      for (const phrase of phrases) {
        const phraseNorm = normalize(phrase);
        if (sourceNorm.includes(phraseNorm)) {
          bestMatch = true;
          const idx = sourceNorm.indexOf(phraseNorm);
          const start = Math.max(0, idx - 50);
          const end = Math.min(sourceText.length, idx + phraseNorm.length + 50);
          foundFragment = sourceText.substring(start, end);
          break;
        }
      }
      if (bestMatch) break;

      // 3. Keyword-based verification: extract significant words and check density
      const stopWords = new Set(["de", "la", "el", "en", "los", "las", "del", "al", "un", "una", "que", "por", "con", "para", "se", "es", "no", "su", "más", "y", "o", "a"]);
      const extractKeywords = (text: string) => normalize(text).split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));
      const citaKeywords = extractKeywords(f.extracto_relevante);
      if (citaKeywords.length > 0) {
        const matchedCount = citaKeywords.filter(kw => sourceNorm.includes(kw)).length;
        const matchRatio = matchedCount / citaKeywords.length;
        // If >60% of significant keywords are found in the source, consider it verified
        if (matchRatio >= 0.6 && matchedCount >= 3) {
          bestMatch = true;
          // Try to find a relevant fragment around the first matched keyword
          const firstKw = citaKeywords.find(kw => sourceNorm.includes(kw));
          if (firstKw) {
            const idx = sourceNorm.indexOf(firstKw);
            const start = Math.max(0, idx - 100);
            const end = Math.min(sourceText.length, idx + 300);
            foundFragment = sourceText.substring(start, end);
          }
          break;
        }
      }
    }

    return {
      documento: f.documento,
      extracto_relevante: f.extracto_relevante,
      verificado: bestMatch,
      fragmento_encontrado: foundFragment,
    };
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { preguntaId, licitacionId } = await req.json();
    if (!preguntaId || !licitacionId) {
      return new Response(JSON.stringify({ error: "preguntaId and licitacionId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: pregunta, error: pErr } = await supabase
      .from("LicitacionPreguntas").select("*").eq("id", preguntaId).single();
    if (pErr || !pregunta) throw new Error("Pregunta not found");

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

    // --- Download and prepare documents ---
    const userContentParts: any[] = [];
    const fileNames: string[] = [];
    const textDocuments: { nombre: string; contenido: string }[] = [];
    // Store raw source text for cross-validation
    const sourceTextsMap = new Map<string, string>();

    if (docs && docs.length > 0) {
      let accessToken: string | null = null;
      try { accessToken = await getDriveAccessToken(); } catch (err) { console.error("Could not get Drive token:", err); }

      if (accessToken) {
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
          bytes: Uint8Array; mimeType: string;
        }[];

        for (const { doc, bytes, mimeType } of downloaded) {
          fileNames.push(doc.nombre);
          const effectiveMime = mimeType || doc.tipo || "";

          // PDFs and images: send directly as inline_data to Gemini
          if (isNativeGeminiFormat(effectiveMime, doc.nombre) && bytes.length <= MAX_INLINE_FILE_SIZE) {
            const base64 = bytesToBase64(bytes);
            const inlineMime = effectiveMime.includes("pdf") ? "application/pdf" : effectiveMime;
            userContentParts.push({ type: "text", text: `\n--- DOCUMENTO ADJUNTO: "${doc.nombre}" ---` });
            userContentParts.push({ inline_data: { mime_type: inlineMime, data: base64 } });
            // For PDFs we can't easily extract text for validation, but Gemini reads them natively
            // Mark as PDF source
            sourceTextsMap.set(doc.nombre, `[Documento PDF enviado como binario - ${bytes.length} bytes]`);
            console.log(`📎 ${doc.nombre}: sent as inline_data (${bytes.length} bytes)`);
            continue;
          }

          // DOCX/XLSX/Text: extract text
          let text = "";
          if (effectiveMime.includes("wordprocessingml") || doc.nombre.toLowerCase().endsWith(".docx")) {
            text = await extractTextFromDocx(bytes);
          } else if (effectiveMime.includes("spreadsheetml") || doc.nombre.toLowerCase().endsWith(".xlsx")) {
            text = await extractTextFromXlsx(bytes);
          } else if (effectiveMime.includes("text/") || effectiveMime.includes("csv") || doc.nombre.endsWith(".txt") || doc.nombre.endsWith(".csv")) {
            text = new TextDecoder().decode(bytes);
          }

          if (text && text.length > 10) {
            const trimmed = text.length > MAX_TEXT_PER_DOC
              ? text.substring(0, MAX_TEXT_PER_DOC) + "\n[... documento truncado ...]"
              : text;
            textDocuments.push({ nombre: doc.nombre, contenido: trimmed });
            sourceTextsMap.set(doc.nombre, trimmed);
            console.log(`✅ ${doc.nombre}: ${trimmed.length} chars extracted`);
          }
        }
      }
    }

    // Build structured context
    const contextParts: string[] = [];
    if (licitacion) {
      contextParts.push(`Nombre del proceso: ${licitacion.nombre}`);
      contextParts.push(`Descripción: ${licitacion.descripcion}`);
      if (licitacion.especificaciones) {
        contextParts.push(`Especificaciones técnicas:\n${licitacion.especificaciones}`);
        sourceTextsMap.set("Especificaciones técnicas", licitacion.especificaciones);
      }
    }
    if (oferentes && oferentes.length > 0) {
      contextParts.push(`OFERENTES INVITADOS:\n${oferentes.map(o => `- ${o.email}${o.nombre_empresa ? ` (${o.nombre_empresa})` : ''} - ${o.aceptada ? 'Aceptó' : 'Pendiente'}`).join('\n')}`);
    }
    if (eventos && eventos.length > 0) {
      const calText = eventos.map(e => `- ${e.fecha}: ${e.titulo} [${e.estado}]${e.descripcion ? ` - ${e.descripcion}` : ''}`).join('\n');
      contextParts.push(`CALENDARIO DEL PROCESO:\n${calText}`);
      sourceTextsMap.set("Calendario del proceso", calText);
    }
    if (items && items.length > 0) {
      const itemsText = items.map(i => `- ${i.descripcion} | ${i.unidad || '-'} | Cant: ${i.cantidad || '-'} | PU: ${i.precio_unitario || '-'}`).join('\n');
      contextParts.push(`ITEMIZADO BASE (${items.length} ítems):\n${itemsText}`);
      sourceTextsMap.set("Itemizado base", itemsText);
    }
    if (otherPreguntas && otherPreguntas.length > 0) {
      contextParts.push(`PREGUNTAS YA RESPONDIDAS:\n${otherPreguntas.map(p => `P: ${p.pregunta}\nR: ${p.respuesta}`).join('\n\n')}`);
    }
    for (const dt of textDocuments) {
      contextParts.push(`--- CONTENIDO DEL DOCUMENTO: "${dt.nombre}" ---\n${dt.contenido}\n--- FIN DOCUMENTO ---`);
    }

    const systemPrompt = `Eres un asistente técnico experto en licitaciones de construcción en Chile.
Tu tarea es buscar información en los antecedentes proporcionados para responder una pregunta de un oferente.

CONTEXTO DEL PROCESO:
${contextParts.join("\n\n")}

=== REGLAS ===

REGLA 1 - BASARSE EN LOS DOCUMENTOS:
- Responde usando la información contenida en los documentos, especificaciones, itemizado, calendario o respuestas previas.
- Puedes parafrasear, resumir y sintetizar la información, pero el contenido de tu respuesta debe ser verificable en los antecedentes.
- NO inventes datos, cifras, plazos o condiciones que no estén en los documentos.
- Si necesitas interpretar información, déjalo claro con frases como "De acuerdo a lo indicado en..."

REGLA 2 - REFERENCIAS A FUENTES:
- Indica de qué documento o sección proviene la información.
- Incluye el fragmento o sección relevante del documento que sustenta tu respuesta. No necesita ser una cita textual exacta, pero debe ser verificable.
- Formato: Según [nombre del documento]: [resumen o referencia al contenido relevante]

REGLA 3 - CUANDO NO HAY INFORMACIÓN:
- Si NO encuentras información relevante en los antecedentes, responde:
  "No se encontró información en los antecedentes del proceso para responder esta consulta. Se recomienda que el mandante responda directamente."
- Es PREFERIBLE decir "no encontré" que inventar una respuesta.

REGLA 4 - BÚSQUEDA EXHAUSTIVA:
- Lee CADA documento completo incluyendo tablas, anexos, notas al pie.
- Busca sinónimos: "plazo" = "duración", "calendario", "tiempo", "días". "pago" = "facturación", "cobro", "estado de pago".
- Cruza información entre documentos.

REGLA 5 - FORMATO:
- NO uses doble asterisco (**). Usa texto plano, viñetas con guiones (-) y saltos de línea.
- Sé directo, breve y profesional. Responde en español chileno.

=== FORMATO DE FUENTES (OBLIGATORIO) ===

Al final de tu respuesta, agrega exactamente esto:

---FUENTES---
[DOCUMENTO: nombre_exacto_del_documento]
CITA: "fragmento relevante del documento que respalda la respuesta"
UBICACIÓN: sección/tabla/párrafo donde se encuentra

Repite el bloque para cada fuente. El fragmento debe ser contenido real del documento, aunque puede ser un extracto resumido.
Si no encontraste información, escribe:
---FUENTES---
[SIN FUENTES] No se encontró información relevante en los antecedentes.`;

    const questionText = `Pregunta del oferente${pregunta.especialidad ? ` (especialidad: ${pregunta.especialidad})` : ""}:\n\n"${pregunta.pregunta}"\n\nBusca la respuesta en los antecedentes proporcionados. Incluye referencias a los documentos fuente.`;

    const userMessage: any = userContentParts.length > 0
      ? { role: "user", content: [{ type: "text", text: questionText }, ...userContentParts] }
      : { role: "user", content: questionText };

    console.log(`🤖 Sending to Gemini 2.5 Flash: ${contextParts.join("").length} chars context, ${userContentParts.length} inline parts, ${textDocuments.length} text docs`);

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          userMessage,
        ],
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI error:", aiResp.status, t);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    let aiAnswer = aiData.choices?.[0]?.message?.content || "";

    // Parse sources
    const rawFuentes: { documento: string; extracto_relevante: string }[] = [];
    const fuentesSeparator = "---FUENTES---";
    if (aiAnswer.includes(fuentesSeparator)) {
      const parts = aiAnswer.split(fuentesSeparator);
      aiAnswer = parts[0].trim();
      const fuentesText = parts[1]?.trim() || "";

      // Parse structured sources
      const blockRegex = /\[DOCUMENTO:\s*([^\]]+)\]\s*([\s\S]*?)(?=\[DOCUMENTO:|\[SIN FUENTES\]|$)/g;
      let fm;
      while ((fm = blockRegex.exec(fuentesText)) !== null) {
        const docName = fm[1].trim();
        const content = fm[2].trim();
        // Extract CITA: lines
        const citaMatch = content.match(/CITA:\s*"([^"]+)"/);
        const extracto = citaMatch ? citaMatch[1] : content;
        rawFuentes.push({ documento: docName, extracto_relevante: extracto });
      }

      if (rawFuentes.length === 0 && !fuentesText.includes("[SIN FUENTES]") && fuentesText.length > 10) {
        // Fallback parsing
        const oldRegex = /\[DOCUMENTO:\s*([^\]]+)\]\s*([\s\S]*?)(?=\[DOCUMENTO:|$)/g;
        while ((fm = oldRegex.exec(fuentesText)) !== null) {
          rawFuentes.push({ documento: fm[1].trim(), extracto_relevante: fm[2].trim() });
        }
      }
    }

    // --- Cross-validate citations against source texts ---
    let fuentes: any[];
    if (rawFuentes.length > 0) {
      fuentes = validateCitations(rawFuentes, sourceTextsMap);
      const verified = fuentes.filter((f: any) => f.verificado).length;
      const total = fuentes.length;
      console.log(`🔍 Cross-validation: ${verified}/${total} citations verified in source texts`);

      // If no citations were verified, add a warning
      if (verified === 0 && total > 0) {
        aiAnswer += "\n\n⚠️ Nota: Las citas proporcionadas no pudieron ser verificadas textualmente en los documentos fuente. Se recomienda revisar directamente los antecedentes.";
      }
    } else {
      fuentes = fileNames.length > 0
        ? [{ documento: "Documentos analizados", extracto_relevante: `Se analizaron: ${fileNames.join(", ")}`, verificado: false, fragmento_encontrado: "" }]
        : [];
    }

    // Store the source texts for preview (trimmed to save space)
    const documentTextsForPreview: Record<string, string> = {};
    for (const [name, text] of sourceTextsMap) {
      if (!text.startsWith("[Documento PDF")) {
        documentTextsForPreview[name] = text.substring(0, 8000);
      }
    }

    // Build enriched fuentes with document previews
    const enrichedFuentes = fuentes.map((f: any) => ({
      ...f,
      texto_documento: documentTextsForPreview[f.documento] || null,
    }));

    const { error: uErr } = await supabase
      .from("LicitacionPreguntas")
      .update({ respuesta_ia: aiAnswer, respuesta_ia_fuentes: enrichedFuentes })
      .eq("id", preguntaId);
    if (uErr) throw uErr;

    return new Response(JSON.stringify({ success: true, respuesta_ia: aiAnswer, fuentes: enrichedFuentes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("licitacion-pregunta-ia error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
