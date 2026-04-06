import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
      .select("nombre, descripcion, especificaciones")
      .eq("id", licitacionId)
      .single();

    // Fetch documents names as context
    const { data: docs } = await supabase
      .from("LicitacionDocumentos")
      .select("nombre, tipo")
      .eq("licitacion_id", licitacionId);

    // Build context
    const contextParts: string[] = [];
    if (licitacion) {
      contextParts.push(`Nombre del proceso: ${licitacion.nombre}`);
      contextParts.push(`Descripción: ${licitacion.descripcion}`);
      if (licitacion.especificaciones) {
        contextParts.push(`Especificaciones técnicas:\n${licitacion.especificaciones}`);
      }
    }
    if (docs && docs.length > 0) {
      contextParts.push(`Documentos adjuntos al proceso:\n${docs.map(d => `- ${d.nombre} (${d.tipo || 'documento'})`).join('\n')}`);
    }

    const systemPrompt = `Eres un asistente técnico especializado en licitaciones de construcción en Chile. 
Se te proporcionará el contexto de un proceso de licitación y una pregunta de un oferente.
Tu tarea es generar una pre-respuesta basada ESTRICTAMENTE en la información disponible del proceso.

CONTEXTO DEL PROCESO:
${contextParts.join('\n\n')}

REGLAS ESTRICTAS:
- Responde SOLO con información que se encuentre explícitamente en los documentos, especificaciones o descripción del proceso proporcionados arriba.
- NO uses información externa, conocimiento general ni suposiciones. Si la información no está en el contexto, responde: "No se encontró información suficiente en los antecedentes del proceso para responder esta consulta. Se recomienda que el mandante responda directamente."
- NO uses formato con doble asterisco (**). Usa texto plano, viñetas simples con guiones (-) y saltos de línea para organizar la respuesta.
- Sé conciso, directo y profesional.
- Cita brevemente la fuente: "Según [nombre del documento/sección]..."
- Responde en español chileno.
- La respuesta será revisada por el mandante antes de publicarse, así que sé preciso y no inventes información.`;

    const userPrompt = `Pregunta del oferente${pregunta.especialidad ? ` (especialidad: ${pregunta.especialidad})` : ''}:\n\n"${pregunta.pregunta}"`;

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
    if (licitacion?.especificaciones) {
      fuentes.push({ documento: "Especificaciones Técnicas", extracto: licitacion.especificaciones.substring(0, 200) + (licitacion.especificaciones.length > 200 ? '...' : '') });
    }
    if (licitacion?.descripcion) {
      fuentes.push({ documento: "Descripción del Proceso", extracto: licitacion.descripcion.substring(0, 200) + (licitacion.descripcion.length > 200 ? '...' : '') });
    }
    if (docs && docs.length > 0) {
      fuentes.push({ documento: "Documentos Adjuntos", extracto: docs.map(d => d.nombre).join(', ') });
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
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});