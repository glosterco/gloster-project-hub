import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MoveDocumentRequest {
  documentId: number;
  newTipo: string;
  movedByEmail?: string;
  movedByName?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { documentId, newTipo, movedByEmail, movedByName }: MoveDocumentRequest = await req.json();
    
    if (!documentId || !newTipo) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: documentId and newTipo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Moving document ${documentId} to folder "${newTipo}" by ${movedByEmail || 'unknown'}`);

    // Update the document with new folder and movement tracking
    const { data: updatedDoc, error: updateError } = await supabase
      .from('Documentos')
      .update({
        Tipo: newTipo,
        moved_at: new Date().toISOString(),
        moved_by_email: movedByEmail || null,
        moved_by_name: movedByName || null
      })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating document:', updateError);
      throw new Error(`Failed to move document: ${updateError.message}`);
    }

    console.log(`Successfully moved document ${documentId} to "${newTipo}"`);

    return new Response(
      JSON.stringify({
        success: true,
        document: updatedDoc,
        message: `Documento movido a "${newTipo}" exitosamente`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in move-document:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});