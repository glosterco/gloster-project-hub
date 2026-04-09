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
  const patterns = [/\/file\/d\/([a-zA-Z0-9_-]+)/, /id=([a-zA-Z0-9_-]+)/, /\/d\/([a-zA-Z0-9_-]+)/];
  for (const p of patterns) {
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
    if (metaResp.ok) {
      const meta = await metaResp.json();
      fileMimeType = meta.mimeType || "";
    }

    const googleDocTypes = [
      "application/vnd.google-apps.document",
      "application/vnd.google-apps.spreadsheet",
      "application/vnd.google-apps.presentation",
    ];
    if (googleDocTypes.includes(fileMimeType)) {
      const resp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!resp.ok) return null;
      const text = await resp.text();
      return { bytes: new TextEncoder().encode(text), mimeType: "text/plain" };
    }

    const resp = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!resp.ok) return null;
    return { bytes: new Uint8Array(await resp.arrayBuffer()), mimeType: fileMimeType };
  } catch (err) {
    console.error(`Error downloading ${fileName}:`, err);
    return null;
  }
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
        for (const chunk of chunks) { result.set(chunk, pos); pos += chunk.length; }
        files[fileName] = result;
      } catch (e) { console.error(`Failed to decompress ${fileName}:`, e); }
    }
    offset = fileDataStart + compressedSize;
  }
  return files;
}

async function extractTextFromDocx(bytes: Uint8Array, fileName: string): Promise<string> {
  try {
    const files = await parseZipAsync(bytes);
    const docXml = files["word/document.xml"];
    if (!docXml) return "";
    const xml = new TextDecoder().decode(docXml);
    const texts: string[] = [];
    const tRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let m;
    while ((m = tRegex.exec(xml)) !== null) texts.push(m[1]);
    return texts.join(" ");
  } catch { return ""; }
}

async function extractTextFromXlsx(bytes: Uint8Array, fileName: string): Promise<string> {
  try {
    const files = await parseZipAsync(bytes);
    const ss = files["xl/sharedStrings.xml"];
    if (!ss) return "";
    const xml = new TextDecoder().decode(ss);
    const texts: string[] = [];
    const tRegex = /<t[^>]*>([^<]+)<\/t>/g;
    let m;
    while ((m = tRegex.exec(xml)) !== null) texts.push(m[1]);
    return texts.join(" ");
  } catch { return ""; }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
  }
  return btoa(binary);
}

function isNativeGeminiFormat(mimeType: string, fileName: string): boolean {
  const fl = fileName.toLowerCase();
  return mimeType === "application/pdf" || mimeType.startsWith("image/") ||
    fl.endsWith(".pdf") || fl.endsWith(".png") || fl.endsWith(".jpg") || fl.endsWith(".jpeg");
}

const MAX_INLINE_FILE_SIZE = 15 * 1024 * 1024;
const MAX_TEXT_PER_DOC = 40000;

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

    // --- Build message content parts for Gemini (single-model approach) ---
    // Gemini 2.5 Flash handles PDFs and images natively via inline_data
    const userContentParts: any[] = [];
    const fileNames: string[] = [];
    const textDocuments: { nombre: string; contenido: string }[] = [];

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
            console.log(`📎 ${doc.nombre}: sent as inline_data (${bytes.length} bytes)`);
            continue;
          }

          // DOCX/XLSX/Text: extract text
          let text = "";
          if (effectiveMime.includes("wordprocessingml") || doc.nombre.toLowerCase().endsWith(".docx")) {
            text = await extractTextFromDocx(bytes, doc.nombre);
          } else if (effectiveMime.includes("spreadsheetml") || doc.nombre.toLowerCase().endsWith(".xlsx")) {
            text = await extractTextFromXlsx(bytes, doc.nombre);
          } else if (effectiveMime.includes("text/") || effectiveMime.includes("csv") || doc.nombre.endsWith(".txt") || doc.nombre.endsWith(".csv")) {
            text = new TextDecoder().decode(bytes);
          }

          if (text && text.length > 10) {
            const trimmed = text.length > MAX_TEXT_PER_DOC
              ? text.substring(0, MAX_TEXT_PER_DOC) + "\n[... documento truncado ...]"
              : text;
            textDocuments.push({ nombre: doc.nombre, contenido: trimmed });
            console.log(`✅ ${doc.nombre}: ${trimmed.length} chars extracted as text`);
          } else {
            console.log(`⚠️ ${doc.nombre}: no text extracted`);
          }
        }
      }
    }

    // Build structured context
    const contextParts: string[] = [];
    if (licitacion) {
      contextParts.push(`Nombre del proceso: ${licitacion.nombre}`);
      contextParts.push(`Descripción: ${licitacion.descripcion}`);
      if (licitacion.especificaciones) contextParts.push(`Especificaciones técnicas:\n${licitacion.especificaciones}`);
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
      contextParts.push(`PREGUNTAS YA RESPONDIDAS:\n${otherPreguntas.map(p => `P: ${p.pregunta}\nR: ${p.respuesta}`).join('\n\n')}`);
    }
    // Add text-extracted documents
    for (const dt of textDocuments) {
      contextParts.push(`--- CONTENIDO DEL DOCUMENTO: "${dt.nombre}" ---\n${dt.contenido}\n--- FIN DOCUMENTO ---`);
    }

    const systemPrompt = `Eres un asistente técnico experto en licitaciones de construcción en Chile.
Se te proporciona el contexto completo de un proceso de licitación incluyendo documentos adjuntos (PDFs, imágenes, planillas) y una pregunta de un oferente.
Tu tarea es buscar exhaustivamente en TODOS los antecedentes proporcionados para encontrar la respuesta.

CONTEXTO DEL PROCESO:
${contextParts.join("\n\n")}

INSTRUCCIONES DE BÚSQUEDA (MUY IMPORTANTE):
1. BUSCA EN TODOS LOS DOCUMENTOS ADJUNTOS: Lee cada documento completo incluyendo tablas, anexos, notas al pie, planos y especificaciones. La respuesta puede estar en cualquier parte.
2. BUSCA SINÓNIMOS: Si la pregunta habla de "plazo", busca también "duración", "calendario", "tiempo", "días", "meses". Si habla de "pago", busca "facturación", "cobro", "estado de pago", etc.
3. BUSCA EN TABLAS Y LISTAS: La información frecuentemente está en tablas o cuadros dentro de los documentos.
4. CRUZA INFORMACIÓN entre documentos: Si un documento menciona un tema parcialmente, busca complementos en los demás.
5. CITAS TEXTUALES OBLIGATORIAS: Cuando encuentres la información, incluye la cita textual exacta del documento.

REGLAS DE RESPUESTA:
- Responde SOLO con información que se encuentre en los documentos, especificaciones, itemizado, calendario o descripción del proceso.
- También puedes usar respuestas previas ya dadas en este proceso para mantener coherencia.
- Si NO encuentras la información, responde: "No se encontró información suficiente en los antecedentes del proceso para responder esta consulta. Se recomienda que el mandante responda directamente."
- NO uses formato con doble asterisco (**). Usa texto plano, viñetas con guiones (-) y saltos de línea.
- Sé directo y profesional.
- Cita la fuente: "Según [nombre del documento]: '[cita textual]'..."
- Responde en español chileno.

FUENTES (OBLIGATORIO):
Al final de tu respuesta, agrega una línea con "---FUENTES---" seguida de las citas textuales:
[DOCUMENTO: nombre_documento] "cita textual exacta del documento que respalda la respuesta"`;

    // Build user message with inline documents
    const questionText = `Pregunta del oferente${pregunta.especialidad ? ` (especialidad: ${pregunta.especialidad})` : ""}:\n\n"${pregunta.pregunta}"\n\nBusca exhaustivamente en todos los antecedentes y documentos adjuntos la respuesta a esta pregunta.`;

    // If we have inline parts (PDFs/images), use multimodal content array
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
        return new Response(JSON.stringify({ error: "Rate limit excedido. Intenta de nuevo en unos segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados. Agrega fondos en Settings > Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${aiResp.status}`);
    }

    const aiData = await aiResp.json();
    let aiAnswer = aiData.choices?.[0]?.message?.content || "";

    // Parse sources
    const fuentes: any[] = [];
    const fuentesSeparator = "---FUENTES---";
    if (aiAnswer.includes(fuentesSeparator)) {
      const parts = aiAnswer.split(fuentesSeparator);
      aiAnswer = parts[0].trim();
      const fuentesText = parts[1]?.trim() || "";
      const fuenteRegex = /\[DOCUMENTO:\s*([^\]]+)\]\s*([\s\S]*?)(?=\[DOCUMENTO:|$)/g;
      let fm;
      while ((fm = fuenteRegex.exec(fuentesText)) !== null) {
        fuentes.push({ documento: fm[1].trim(), extracto_relevante: fm[2].trim() });
      }
      if (fuentes.length === 0 && fuentesText.length > 10) {
        fuentes.push({ documento: "Fuentes del proceso", extracto_relevante: fuentesText });
      }
    }

    if (fuentes.length === 0 && fileNames.length > 0) {
      fuentes.push({ documento: "Documentos analizados", extracto_relevante: `Se analizaron: ${fileNames.join(", ")}` });
    }

    const { error: uErr } = await supabase
      .from("LicitacionPreguntas")
      .update({ respuesta_ia: aiAnswer, respuesta_ia_fuentes: fuentes })
      .eq("id", preguntaId);
    if (uErr) throw uErr;

    return new Response(JSON.stringify({ success: true, respuesta_ia: aiAnswer, fuentes }), {
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
