import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ParsedItem {
  descripcion: string;
  unidad: string | null;
  cantidad: number | null;
  precio_unitario: number | null;
  precio_total: number | null;
  orden: number;
}

export interface ParsedMetadata {
  gastos_generales_pct?: number | null;
  utilidades_pct?: number | null;
  iva_pct?: number | null;
  moneda?: string | null;
  subtotal?: number | null;
  total?: number | null;
}

export interface ParseResult {
  items: ParsedItem[];
  metadata: ParsedMetadata;
  itemCount: number;
}

export const useParseItemizado = () => {
  const { toast } = useToast();
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const parseFile = async (file: File): Promise<ParseResult | null> => {
    setParsing(true);
    setError(null);
    setResult(null);

    try {
      // Read file as base64
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.slice(i, i + chunkSize));
      }
      const fileBase64 = btoa(binary);

      const { data, error: fnError } = await supabase.functions.invoke('parse-itemizado', {
        body: {
          fileBase64,
          fileName: file.name,
          mimeType: file.type,
        },
      });

      if (fnError) throw new Error(fnError.message || 'Error al procesar archivo');

      if (data?.error) {
        setError(data.error);
        toast({
          title: 'Error al interpretar archivo',
          description: data.error,
          variant: 'destructive',
        });
        return null;
      }

      const parsed: ParseResult = {
        items: data.items || [],
        metadata: data.metadata || {},
        itemCount: data.itemCount || 0,
      };

      setResult(parsed);
      toast({
        title: 'Itemizado extraído',
        description: `Se encontraron ${parsed.itemCount} partidas`,
      });
      return parsed;
    } catch (err: any) {
      const msg = err.message || 'Error desconocido';
      setError(msg);
      toast({
        title: 'Error',
        description: msg,
        variant: 'destructive',
      });
      return null;
    } finally {
      setParsing(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { parseFile, parsing, result, error, reset };
};
