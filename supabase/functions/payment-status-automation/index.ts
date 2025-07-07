import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentStatusUpdate {
  paymentId: string;
  newStatus: 'Programado' | 'Pendiente' | 'Enviado' | 'Aprobado' | 'Rechazado';
  reason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { paymentId, newStatus, reason }: PaymentStatusUpdate = await req.json();
    console.log(`Updating payment ${paymentId} status to ${newStatus}`);

    // This edge function can be called from the frontend or triggered by other events
    // For now, it will just be a placeholder for the automation logic

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Payment ${paymentId} status updated to ${newStatus}` 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error updating payment status:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

serve(handler);