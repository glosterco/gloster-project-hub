import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres un asistente experto en presupuestos de construcción en Chile. Tu trabajo es ayudar al usuario (un oferente/contratista) a armar su itemizado de presupuesto para una licitación.

## Contexto de la licitación:
{LICITACION_CONTEXT}

## Tu rol:
- Ayudar al oferente a estructurar su presupuesto en partidas claras.
- Sugerir precios unitarios razonables basados en estándares de la industria chilena si el usuario lo solicita.
- Ayudar a definir unidades de medida apropiadas (m², ml, gl, kg, un, etc.).
- Calcular totales automáticamente.
- Sugerir partidas adicionales que puedan faltar basándose en el alcance descrito.

## Reglas:
- Responde siempre en español chileno.
- Sé conciso y directo.
- Usa viñetas para organizar información.
- Cuando el usuario confirme que el itemizado está listo, genera el bloque JSON al final de tu mensaje.

## Formato de salida cuando el itemizado esté listo:
Cuando el usuario confirme, responde con EXACTAMENTE este formato JSON al final de tu mensaje:

\`\`\`json_itemizado
[
  {
    "descripcion": "string",
    "unidad": "string",
    "cantidad": 0,
    "precio_unitario": 0,
    "precio_total": 0,
    "orden": 1
  }
]
\`\`\`

IMPORTANTE:
- NO generes el bloque json_itemizado hasta que el usuario confirme explícitamente.
- precio_total = cantidad × precio_unitario (siempre).
- Muestra un resumen legible antes de pedir confirmación.
- Si la licitación ya tiene un itemizado base, úsalo como referencia para guiar al oferente.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, licitacionContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = SYSTEM_PROMPT.replace("{LICITACION_CONTEXT}", licitacionContext || "No hay contexto adicional.");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limits exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("itemizado-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
