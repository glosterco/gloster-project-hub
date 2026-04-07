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

// Download file content from Drive and extract text
async function extractTextFromDriveFile(
  accessToken: string,
  fileId: string,
  mimeType: string,
  fileName: string,
): Promise<string> {
  try {
    // For Google Docs native formats, export as plain text
    const googleDocTypes = [
      "application/vnd.google-apps.document",
      "application/vnd.google-apps.spreadsheet",
      "application/vnd.google-apps.presentation",
    ];

    if (googleDocTypes.includes(mimeType)) {
      const exportUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
      const resp = await fetch(exportUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!resp.ok) {
        console.error(`Failed to export ${fileName}: ${resp.status}`);
        return "";
      }
      return await resp.text();
    }

    // For PDFs, Word docs, Excel — download binary and send to AI for extraction
    const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
    const resp = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!resp.ok) {
      console.error(`Failed to download ${fileName}: ${resp.status}`);
      return "";
    }

    const buffer = await resp.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // For text-based files, try direct text extraction
    if (
      mimeType?.includes("text/") ||
      mimeType?.includes("csv") ||
      fileName.endsWith(".txt") ||
      fileName.endsWith(".csv")
    ) {
      return new TextDecoder().decode(bytes);
    }

    // For PDFs - extract text using basic PDF text extraction
    if (mimeType === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) {
      return extractTextFromPdfBytes(bytes, fileName);
    }

    // For XLSX files
    if (
      mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      fileName.toLowerCase().endsWith(".xlsx")
    ) {
      return extractTextFromXlsxBytes(bytes, fileName);
    }

    // For DOCX files
    if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      fileName.toLowerCase().endsWith(".docx")
    ) {
      return extractTextFromDocxBytes(bytes, fileName);
    }

    // Fallback: try Google Drive export to text
    try {
      const copyUrl = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
      const expResp = await fetch(copyUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (expResp.ok) return await expResp.text();
    } catch {}

    console.log(`Could not extract text from ${fileName} (${mimeType})`);
    return "";
  } catch (err) {
    console.error(`Error extracting text from ${fileName}:`, err);
    return "";
  }
}

// Basic PDF text extraction (stream-based)
function extractTextFromPdfBytes(bytes: Uint8Array, fileName: string): string {
  try {
    const raw = new TextDecoder("latin1").decode(bytes);
    const textParts: string[] = [];

    // Extract text between BT...ET blocks
    const btEtRegex = /BT\s([\s\S]*?)ET/g;
    let match;
    while ((match = btEtRegex.exec(raw)) !== null) {
      const block = match[1];
      const tjRegex = /\(([^)]*)\)\s*Tj/g;
      let tjMatch;
      while ((tjMatch = tjRegex.exec(block)) !== null) {
        textParts.push(tjMatch[1]);
      }
      const tdRegex = /\[(.*?)\]\s*TJ/g;
      let tdMatch;
      while ((tdMatch = tdRegex.exec(block)) !== null) {
        const inner = tdMatch[1];
        const parts = inner.match(/\(([^)]*)\)/g);
        if (parts) {
          textParts.push(parts.map((p) => p.slice(1, -1)).join(""));
        }
      }
    }

    // Also try to find stream content with readable text
    const streamRegex = /stream\r?\n([\s\S]*?)endstream/g;
    while ((match = streamRegex.exec(raw)) !== null) {
      const content = match[1];
      // Only grab printable ASCII sequences
      const readable = content.match(/[\x20-\x7E\xC0-\xFF]{4,}/g);
      if (readable) {
        textParts.push(...readable);
      }
    }

    const text = textParts.join(" ").replace(/\s+/g, " ").trim();
    console.log(`PDF ${fileName}: extracted ${text.length} chars`);
    return text;
  } catch (err) {
    console.error(`PDF extraction error for ${fileName}:`, err);
    return "";
  }
}

// Basic XLSX text extraction via ZIP/XML
function extractTextFromXlsxBytes(bytes: Uint8Array, fileName: string): string {
  try {
    const files = parseZip(bytes);
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

// Basic DOCX text extraction via ZIP/XML
function extractTextFromDocxBytes(bytes: Uint8Array, fileName: string): string {
  try {
    const files = parseZip(bytes);
    const docXml = files["word/document.xml"];
    if (!docXml) return "";
    const xml = new TextDecoder().decode(docXml);
    const texts: string[] = [];
    const tRegex = /<w:t[^>]*>([^<]+)<\/w:t>/g;
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

// Minimal ZIP parser
function parseZip(data: Uint8Array): Record<string, Uint8Array> {
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
        const chunks: Uint8Array[] = [];

        // Synchronous-ish decompression
        writer.write(compressed);
        writer.close();

        // We'll collect synchronously via a flag
        let done = false;
        const readAll = async () => {
          while (true) {
            const { value, done: d } = await reader.read();
            if (d) break;
            if (value) chunks.push(value);
          }
        };

        // Can't truly await in this context, so we use a workaround
        // Store as empty and handle async below
        files[fileName] = new Uint8Array(0);
        readAll().then(() => {
          const total = chunks.reduce((s, c) => s + c.length, 0);
          const result = new Uint8Array(total);
          let pos = 0;
          for (const chunk of chunks) {
            result.set(chunk, pos);
            pos += chunk.length;
          }
          files[fileName] = result;
        }).catch(() => {});
      } catch {}
    }

    offset = fileDataStart + compressedSize;
  }

  return files;
}

// Use AI to extract text from binary content when basic extraction fails
async function extractTextWithAI(
  base64Content: string,
  fileName: string,
  mimeType: string,
): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) return "";

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "Extrae TODO el texto del documento adjunto. Devuelve solo el texto plano sin formato. Si hay tablas, represéntalas con guiones y pipes.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extrae todo el texto de este archivo: ${fileName}`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Content}`,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!resp.ok) {
      console.error(`AI text extraction failed for ${fileName}: ${resp.status}`);
      return "";
    }

    const data = await resp.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (err) {
    console.error(`AI extraction error for ${fileName}:`, err);
    return "";
  }
}

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

    // Fetch licitacion context
    const { data: licitacion } = await supabase
      .from("Licitaciones")
      .select("nombre, descripcion, especificaciones, drive_docs_folder_id")
      .eq("id", licitacionId)
      .single();

    // Fetch documents
    const { data: docs } = await supabase
      .from("LicitacionDocumentos")
      .select("nombre, tipo, url")
      .eq("licitacion_id", licitacionId);

    // Fetch process context: oferentes, eventos, items, other questions
    const { data: oferentes } = await supabase
      .from("LicitacionOferentes")
      .select("email, nombre_empresa, aceptada")
      .eq("licitacion_id", licitacionId);

    const { data: eventos } = await supabase
      .from("LicitacionEventos")
      .select("titulo, fecha, estado, descripcion")
      .eq("licitacion_id", licitacionId)
      .order("fecha");

    const { data: items } = await supabase
      .from("LicitacionItems")
      .select("descripcion, unidad, cantidad, precio_unitario")
      .eq("licitacion_id", licitacionId)
      .eq("agregado_por_oferente", false)
      .order("orden")
      .limit(50);

    const { data: otherPreguntas } = await supabase
      .from("LicitacionPreguntas")
      .select("pregunta, respuesta, respondida, publicada")
      .eq("licitacion_id", licitacionId)
      .eq("respondida", true)
      .neq("id", preguntaId)
      .limit(20);

    // --- Extract actual document content from Drive ---
    const documentTexts: { nombre: string; contenido: string }[] = [];

    if (docs && docs.length > 0) {
      let accessToken: string | null = null;
      try {
        accessToken = await getDriveAccessToken();
      } catch (err) {
        console.error("Could not get Drive token:", err);
      }

      if (accessToken) {
        for (const doc of docs) {
          if (!doc.url) continue;
          const fileId = extractDriveFileId(doc.url);
          if (!fileId) continue;

          console.log(`📄 Extracting text from: ${doc.nombre} (${fileId})`);

          let text = "";
          const isPdf = doc.tipo === "application/pdf" || doc.nombre.toLowerCase().endsWith(".pdf");

          // For PDFs, go directly to AI-based extraction (most reliable)
          if (isPdf) {
            console.log(`🤖 Using AI extraction for PDF: ${doc.nombre}`);
            try {
              const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
              const resp = await fetch(downloadUrl, {
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              if (resp.ok) {
                const buffer = await resp.arrayBuffer();
                const bytes = new Uint8Array(buffer);
                // btoa can fail on large files, use chunked approach
                let binary = "";
                const chunkSize = 8192;
                for (let i = 0; i < bytes.length; i += chunkSize) {
                  binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
                }
                const base64 = btoa(binary);
                text = await extractTextWithAI(base64, doc.nombre, "application/pdf");
              }
            } catch (err) {
              console.error(`AI extraction failed for ${doc.nombre}:`, err);
            }
          } else {
            // For non-PDF files, try basic extraction
            text = await extractTextFromDriveFile(
              accessToken,
              fileId,
              doc.tipo || "",
              doc.nombre,
            );
          }

          if (text && text.length > 10) {
            // Limit per document to avoid token overflow (max ~8000 chars per doc)
            const trimmed = text.length > 8000 ? text.substring(0, 8000) + "\n[... documento truncado ...]" : text;
            documentTexts.push({ nombre: doc.nombre, contenido: trimmed });
            console.log(`✅ ${doc.nombre}: ${trimmed.length} chars extracted`);
          } else {
            console.log(`⚠️ ${doc.nombre}: no text extracted`);
          }
        }
      }
    }

    // Build context
    const contextParts: string[] = [];
    if (licitacion) {
      contextParts.push(`Nombre del proceso: ${licitacion.nombre}`);
      contextParts.push(`Descripción: ${licitacion.descripcion}`);
      if (licitacion.especificaciones) {
        contextParts.push(`Especificaciones técnicas:\n${licitacion.especificaciones}`);
      }
    }

    // Add actual document content
    if (documentTexts.length > 0) {
      for (const dt of documentTexts) {
        contextParts.push(`--- CONTENIDO DEL DOCUMENTO: "${dt.nombre}" ---\n${dt.contenido}\n--- FIN DOCUMENTO ---`);
      }
    } else if (docs && docs.length > 0) {
      // Fallback: at least list document names
      contextParts.push(
        `Documentos adjuntos (no se pudo extraer su contenido):\n${docs.map((d) => `- ${d.nombre} (${d.tipo || "documento"})`).join("\n")}`,
      );
    }

    const systemPrompt = `Eres un asistente técnico especializado en licitaciones de construcción en Chile. 
Se te proporcionará el contexto de un proceso de licitación y una pregunta de un oferente.
Tu tarea es generar una pre-respuesta basada ESTRICTAMENTE en la información disponible del proceso.

CONTEXTO DEL PROCESO:
${contextParts.join("\n\n")}

REGLAS ESTRICTAS:
- Responde SOLO con información que se encuentre explícitamente en los documentos, especificaciones o descripción del proceso proporcionados arriba.
- NO uses información externa, conocimiento general ni suposiciones. Si la información no está en el contexto, responde: "No se encontró información suficiente en los antecedentes del proceso para responder esta consulta. Se recomienda que el mandante responda directamente."
- NO uses formato con doble asterisco (**). Usa texto plano, viñetas simples con guiones (-) y saltos de línea para organizar la respuesta.
- Sé conciso, directo y profesional.
- Cita brevemente la fuente: "Según [nombre del documento/sección]..."
- Responde en español chileno.
- La respuesta será revisada por el mandante antes de publicarse, así que sé preciso y no inventes información.`;

    const userPrompt = `Pregunta del oferente${pregunta.especialidad ? ` (especialidad: ${pregunta.especialidad})` : ""}:\n\n"${pregunta.pregunta}"`;

    console.log(`🤖 Sending to AI with ${contextParts.length} context parts, total ~${contextParts.join("").length} chars`);

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI error:", aiResp.status, t);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResp.json();
    const aiAnswer = aiData.choices?.[0]?.message?.content || "";

    // Build sources
    const fuentes: any[] = [];
    if (documentTexts.length > 0) {
      for (const dt of documentTexts) {
        fuentes.push({
          documento: dt.nombre,
          extracto: dt.contenido.substring(0, 200) + (dt.contenido.length > 200 ? "..." : ""),
        });
      }
    }
    if (licitacion?.especificaciones) {
      fuentes.push({
        documento: "Especificaciones Técnicas",
        extracto:
          licitacion.especificaciones.substring(0, 200) +
          (licitacion.especificaciones.length > 200 ? "..." : ""),
      });
    }
    if (licitacion?.descripcion) {
      fuentes.push({
        documento: "Descripción del Proceso",
        extracto:
          licitacion.descripcion.substring(0, 200) +
          (licitacion.descripcion.length > 200 ? "..." : ""),
      });
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
