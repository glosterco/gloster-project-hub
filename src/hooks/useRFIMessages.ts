import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RFIMessage {
  id: string;
  rfi_id: number;
  project_id: number;
  author_email: string;
  author_name: string | null;
  author_role: 'contratista' | 'mandante' | 'aprobador' | 'especialista';
  message_text: string;
  attachments_url: string | null;
  created_at: string;
}

export interface AttachmentFile {
  id: string;
  name: string;
  mimeType: string;
  size: number | null;
  webViewLink: string;
  webContentLink?: string;
}

export const useRFIMessages = (rfiId: number | null) => {
  const [messages, setMessages] = useState<RFIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  const fetchMessages = useCallback(async () => {
    if (!rfiId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('rfi-message', {
        body: {
          action: 'get_messages',
          rfiId,
          authorEmail: '', // Not needed for get
          authorRole: 'contratista', // Not needed for get
        }
      });

      if (error) throw error;

      if (data?.success && data?.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching RFI messages:', error);
    } finally {
      setLoading(false);
    }
  }, [rfiId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const sendMessage = async (params: {
    projectId: number;
    authorEmail: string;
    authorName?: string;
    authorRole: 'contratista' | 'mandante' | 'aprobador' | 'especialista';
    messageText: string;
    attachments?: {
      fileName: string;
      fileContent: string;
      mimeType: string;
    }[];
  }): Promise<boolean> => {
    if (!rfiId) return false;

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('rfi-message', {
        body: {
          action: 'add_message',
          rfiId,
          ...params,
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Mensaje enviado",
          description: "Su respuesta ha sido registrada correctamente",
        });
        await fetchMessages();
        return true;
      }
      
      throw new Error(data?.error || 'Error desconocido');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el mensaje",
        variant: "destructive",
      });
      return false;
    } finally {
      setSending(false);
    }
  };

  const closeRFI = async (params: {
    authorEmail: string;
    authorName?: string;
  }): Promise<boolean> => {
    if (!rfiId) return false;

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('rfi-message', {
        body: {
          action: 'close_rfi',
          rfiId,
          authorEmail: params.authorEmail,
          authorName: params.authorName,
          authorRole: 'contratista',
        }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "RFI cerrado",
          description: "El RFI ha sido cerrado exitosamente",
        });
        return true;
      }
      
      throw new Error(data?.error || 'Error desconocido');
    } catch (error: any) {
      console.error('Error closing RFI:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo cerrar el RFI",
        variant: "destructive",
      });
      return false;
    } finally {
      setSending(false);
    }
  };

  const getAttachmentFiles = async (attachmentsUrl: string): Promise<AttachmentFile[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('get-drive-folder-files', {
        body: { folderUrl: attachmentsUrl }
      });

      if (error) throw error;

      if (data?.success) {
        return data.files || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error getting attachment files:', error);
      return [];
    }
  };

  return {
    messages,
    loading,
    sending,
    fetchMessages,
    sendMessage,
    closeRFI,
    getAttachmentFiles,
  };
};
