import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Eres un asistente experto en gestión de licitaciones para proyectos de construcción en Chile. Tu trabajo es ayudar al usuario a crear un nuevo proceso de licitación de manera conversacional y amigable.

Debes recopilar la siguiente información para crear la licitación:

1. **Nombre de la licitación** (obligatorio)
2. **Descripción del alcance** (obligatorio)
3. **Especificaciones técnicas** (opcional pero recomendado)
4. **Emails de oferentes** a invitar (lista de correos)
5. **Mensaje para los oferentes** (texto que recibirán los oferentes invitados)
6. **Calendario de eventos** (fechas importantes como visita a terreno, cierre de consultas, entrega de ofertas, etc.)
   - Para cada evento: fecha, título, descripción, y si requiere que los oferentes envíen archivos
7. **Itemizado/Presupuesto** (opcional - lista de partidas con descripción, unidad, cantidad, precio unitario)
8. **Gastos generales** (monto en pesos, opcional)
9. **Porcentaje de IVA** (por defecto 19%)

## Flujo de la conversación:

1. Primero, saluda al usuario y pídele que describa el proceso de licitación que quiere crear. Hazlo de forma amigable y breve.
2. A partir de su descripción, extrae la información que ya proporcionó.
3. Luego, pregunta por la información faltante de forma natural y conversacional. No preguntes todo de una vez, sino de forma progresiva.
4. Cuando tengas toda la información necesaria (al menos nombre, descripción y emails de oferentes), genera un resumen y pregunta si quiere confirmar la creación.

## Formato de respuesta cuando la licitación está lista:

Cuando el usuario confirme que quiere crear la licitación, responde con EXACTAMENTE este formato JSON al final de tu mensaje (después de cualquier texto):

\`\`\`json_licitacion
{
  "nombre": "string",
  "descripcion": "string",
  "especificaciones": "string o vacío",
  "mensaje_oferentes": "string o vacío",
  "oferentes_emails": ["email1@example.com"],
  "calendario_eventos": [
    {
      "fecha": "2024-01-15T00:00:00.000Z",
      "titulo": "string",
      "descripcion": "string",
      "requiereArchivos": false
    }
  ],
  "items": [
    {
      "descripcion": "string",
      "unidad": "string",
      "cantidad": 0,
      "precio_unitario": 0,
      "precio_total": 0,
      "orden": 0
    }
  ],
  "gastos_generales": 0,
  "iva_porcentaje": 19
}
\`\`\`

IMPORTANTE:
- Sé conciso y directo, no seas demasiado verboso.
- Usa viñetas para organizar preguntas.
- NO generes el bloque json_licitacion hasta que el usuario confirme explícitamente que quiere crear la licitación.
- Las fechas deben estar en formato ISO 8601.
- El campo "items" puede ser un array vacío si no se proporcionan partidas.
- Siempre muestra un resumen antes de pedir confirmación.
- Responde siempre en español chileno.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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
    console.error("licitacion-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
