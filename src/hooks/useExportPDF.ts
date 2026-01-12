import { useCallback } from 'react';
import html2pdf from 'html2pdf.js';
import { supabase } from '@/integrations/supabase/client';

interface RFIMessage {
  id: string;
  author_email: string;
  author_name: string | null;
  author_role: string;
  message_text: string;
  attachments_url: string | null;
  created_at: string;
}

interface RFIDestinatario {
  id: number;
  rfi_id: number;
  contacto_id: number;
  enviado_at: string;
  respondido: boolean;
  contacto?: {
    nombre: string;
    email: string;
    especialidad: string | null;
    rol: string;
  };
}

interface AdicionalAction {
  id: string;
  action_type: string;
  action_by_email: string | null;
  action_by_name: string | null;
  notes: string | null;
  created_at: string;
}

const getActionLabel = (actionType: string): string => {
  const labels: Record<string, string> = {
    enviado: 'Enviado',
    pausado: 'Pausado',
    reanudado: 'Reanudado',
    aprobado: 'Aprobado',
    rechazado: 'Rechazado'
  };
  return labels[actionType] || actionType;
};

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    contratista: 'Contratista',
    mandante: 'Mandante',
    aprobador: 'Aprobador',
    especialista: 'Especialista'
  };
  return labels[role] || role;
};

const getEspecialidadLabel = (especialidad: string): string => {
  const labels: Record<string, string> = {
    arquitectura: 'Arquitectura',
    estructura: 'Estructura',
    electricidad: 'Electricidad',
    sanitario: 'Sanitario',
    mecanico: 'Mecánico',
    climatizacion: 'Climatización',
    incendio: 'Incendio',
    paisajismo: 'Paisajismo',
    otro: 'Otro'
  };
  return labels[especialidad] || especialidad;
};

export const useExportPDF = () => {
  const fetchAdicionalHistory = async (adicionalId: number): Promise<AdicionalAction[]> => {
    try {
      const { data, error } = await supabase
        .from('adicional_actions_history')
        .select('*')
        .eq('adicional_id', adicionalId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as AdicionalAction[];
    } catch (error) {
      console.error('Error fetching adicional history:', error);
      return [];
    }
  };

  const fetchRFIMessages = async (rfiId: number): Promise<RFIMessage[]> => {
    try {
      const { data, error } = await supabase.functions.invoke('rfi-message', {
        body: {
          action: 'get_messages',
          rfiId,
          authorEmail: '',
          authorRole: 'contratista',
        }
      });

      if (error) throw error;
      return data?.messages || [];
    } catch (error) {
      console.error('Error fetching RFI messages:', error);
      return [];
    }
  };

  const fetchRFIDestinatarios = async (rfiId: number): Promise<RFIDestinatario[]> => {
    try {
      const { data, error } = await supabase
        .from('rfi_destinatarios')
        .select('*')
        .eq('rfi_id', rfiId);

      if (error) throw error;
      
      // Fetch contactos separately
      const destinatariosWithContacts: RFIDestinatario[] = [];
      for (const dest of (data || [])) {
        const { data: contactoData } = await supabase
          .from('contactos')
          .select('nombre, email, especialidad, rol')
          .eq('id', dest.contacto_id)
          .single();
        
        destinatariosWithContacts.push({
          ...dest,
          contacto: contactoData || undefined
        } as RFIDestinatario);
      }
      
      return destinatariosWithContacts;
    } catch (error) {
      console.error('Error fetching RFI destinatarios:', error);
      return [];
    }
  };

  const exportAdicionalToPDF = useCallback(async (adicional: any, currency = 'CLP') => {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('es-CL', { 
        style: 'currency', 
        currency: currency,
        minimumFractionDigits: 0 
      }).format(value);
    };

    // Fetch action history
    const actions = await fetchAdicionalHistory(adicional.id);

    const historyHtml = actions.length > 0 ? `
      <div style="background: #fefce8; padding: 20px; border-radius: 8px; border: 1px solid #fef08a; margin-bottom: 24px;">
        <h2 style="color: #854d0e; font-size: 18px; margin: 0 0 16px 0;">Historial de Revisión</h2>
        ${actions.map((action, index) => `
          <div style="padding: 12px; margin-bottom: ${index < actions.length - 1 ? '12px' : '0'}; background: white; border-radius: 6px; border-left: 4px solid ${
            action.action_type === 'aprobado' ? '#22c55e' :
            action.action_type === 'rechazado' ? '#ef4444' :
            action.action_type === 'pausado' ? '#f59e0b' :
            action.action_type === 'reanudado' ? '#06b6d4' : '#3b82f6'
          };">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <strong style="color: ${
                action.action_type === 'aprobado' ? '#166534' :
                action.action_type === 'rechazado' ? '#dc2626' :
                action.action_type === 'pausado' ? '#d97706' :
                action.action_type === 'reanudado' ? '#0891b2' : '#2563eb'
              };">${getActionLabel(action.action_type)}</strong>
              <span style="color: #64748b; font-size: 12px;">${new Date(action.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p style="color: #475569; margin: 0; font-size: 13px;">Por: ${action.action_by_email || 'Sistema'}</p>
            ${action.notes ? `<p style="color: #64748b; margin: 8px 0 0 0; font-size: 13px; font-style: italic;">"${action.notes}"</p>` : ''}
          </div>
        `).join('')}
      </div>
    ` : '';

    const content = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; position: relative;">
        <!-- Watermark Logo -->
        <div style="position: absolute; top: 20px; right: 20px; opacity: 0.15;">
          <img src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" alt="Gloster" style="width: 80px; height: 80px;" crossorigin="anonymous" />
        </div>

        <div style="border-bottom: 3px solid #f59e0b; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #1e293b; margin: 0; font-size: 28px;">Adicional #${adicional.Correlativo || adicional.id}</h1>
          <p style="color: #64748b; margin: 8px 0 0 0; font-size: 14px;">
            Generado el ${new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <h2 style="color: #334155; font-size: 18px; margin: 0 0 16px 0;">Información General</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #64748b; width: 40%;">Título:</td><td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${adicional.Titulo || 'Sin título'}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Estado:</td><td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${adicional.Status || 'Enviado'}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Fecha de Creación:</td><td style="padding: 8px 0; color: #1e293b;">${new Date(adicional.created_at).toLocaleDateString('es-CL')}</td></tr>
            ${adicional.Categoria ? `<tr><td style="padding: 8px 0; color: #64748b;">Categoría:</td><td style="padding: 8px 0; color: #1e293b;">${adicional.Categoria}</td></tr>` : ''}
            ${adicional.Especialidad ? `<tr><td style="padding: 8px 0; color: #64748b;">Especialidad:</td><td style="padding: 8px 0; color: #1e293b;">${adicional.Especialidad}</td></tr>` : ''}
            ${adicional.Vencimiento ? `<tr><td style="padding: 8px 0; color: #64748b;">Vencimiento:</td><td style="padding: 8px 0; color: #1e293b;">${new Date(adicional.Vencimiento).toLocaleDateString('es-CL')}</td></tr>` : ''}
          </table>
        </div>

        ${adicional.Descripcion ? `
        <div style="margin-bottom: 24px;">
          <h2 style="color: #334155; font-size: 18px; margin: 0 0 12px 0;">Descripción</h2>
          <p style="color: #475569; line-height: 1.6; margin: 0;">${adicional.Descripcion}</p>
        </div>` : ''}

        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
          <h2 style="color: #166534; font-size: 18px; margin: 0 0 16px 0;">Información Financiera</h2>
          <table style="width: 100%; border-collapse: collapse;">
            ${adicional.Subtotal ? `<tr><td style="padding: 8px 0; color: #64748b; width: 40%;">Subtotal:</td><td style="padding: 8px 0; color: #1e293b;">${formatCurrency(adicional.Subtotal)}</td></tr>` : ''}
            ${adicional.GG !== null && adicional.GG !== undefined ? `<tr><td style="padding: 8px 0; color: #64748b;">Gastos Generales:</td><td style="padding: 8px 0; color: #1e293b;">${adicional.GG}%</td></tr>` : ''}
            ${adicional.Utilidades !== null && adicional.Utilidades !== undefined ? `<tr><td style="padding: 8px 0; color: #64748b;">Utilidades:</td><td style="padding: 8px 0; color: #1e293b;">${adicional.Utilidades}%</td></tr>` : ''}
            <tr style="border-top: 2px solid #166534;"><td style="padding: 12px 0; color: #166534; font-weight: 600;">Monto Presentado:</td><td style="padding: 12px 0; color: #166534; font-weight: 600; font-size: 18px;">${adicional.Monto_presentado ? formatCurrency(adicional.Monto_presentado) : 'No especificado'}</td></tr>
            ${adicional.Status === 'Aprobado' && adicional.Monto_aprobado ? `<tr><td style="padding: 8px 0; color: #166534; font-weight: 600;">Monto Aprobado:</td><td style="padding: 8px 0; color: #166534; font-weight: 600; font-size: 18px;">${formatCurrency(adicional.Monto_aprobado)}</td></tr>` : ''}
          </table>
        </div>

        ${historyHtml}

        ${adicional.URL ? `
        <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #bfdbfe;">
          <p style="color: #1e40af; margin: 0; font-size: 13px;">
            <strong>Archivos adjuntos:</strong> Los documentos asociados están disponibles en la plataforma Gloster.
          </p>
        </div>` : ''}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">Documento generado automáticamente por Gloster</p>
        </div>
      </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = content;

    const opt = {
      margin: 10,
      filename: `Adicional_${adicional.Correlativo || adicional.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  }, []);

  const exportRFIToPDF = useCallback(async (rfi: any) => {
    // Fetch conversation history and destinatarios in parallel
    const [messages, destinatarios] = await Promise.all([
      fetchRFIMessages(rfi.id),
      fetchRFIDestinatarios(rfi.id)
    ]);

    const destinatariosHtml = destinatarios.length > 0 ? `
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
        <h3 style="color: #64748b; font-size: 14px; margin: 0 0 12px 0;">Compartido con:</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          ${destinatarios.map(d => `
            <div style="background: #f1f5f9; padding: 8px 12px; border-radius: 6px; font-size: 12px;">
              <strong style="color: #334155;">${d.contacto?.nombre || 'Sin nombre'}</strong>
              <span style="color: #64748b;"> (${d.contacto?.especialidad || d.contacto?.rol || 'Contacto'})</span>
              <br/>
              <span style="color: #94a3b8;">${d.contacto?.email || ''}</span>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    const messagesHtml = messages.length > 0 ? `
      <div style="margin-bottom: 24px;">
        <h2 style="color: #334155; font-size: 18px; margin: 0 0 16px 0;">Historial de Conversación</h2>
        ${messages.map((msg, index) => `
          <div style="padding: 16px; margin-bottom: ${index < messages.length - 1 ? '12px' : '0'}; background: ${msg.author_role === 'contratista' ? '#eff6ff' : '#f0fdf4'}; border-radius: 8px; border-left: 4px solid ${msg.author_role === 'contratista' ? '#3b82f6' : '#22c55e'};">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
              <div>
                <strong style="color: #1e293b;">${msg.author_name || msg.author_email}</strong>
                <span style="color: #64748b; font-size: 12px; margin-left: 8px;">(${getRoleLabel(msg.author_role)})</span>
              </div>
              <span style="color: #64748b; font-size: 12px;">${new Date(msg.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <p style="color: #475569; margin: 0; line-height: 1.6; white-space: pre-wrap;">${msg.message_text}</p>
            ${msg.attachments_url ? `<p style="color: #2563eb; margin: 8px 0 0 0; font-size: 12px;">📎 Archivos adjuntos disponibles en la plataforma</p>` : ''}
          </div>
        `).join('')}
      </div>
    ` : '';

    const content = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; position: relative;">
        <!-- Watermark Logo -->
        <div style="position: absolute; top: 20px; right: 20px; opacity: 0.15;">
          <img src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" alt="Gloster" style="width: 80px; height: 80px;" crossorigin="anonymous" />
        </div>

        <div style="border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #1e293b; margin: 0; font-size: 28px;">RFI #${rfi.Correlativo || rfi.id}</h1>
          <p style="color: #64748b; margin: 8px 0 0 0; font-size: 14px;">
            Generado el ${new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div style="display: flex; gap: 24px; margin-bottom: 24px;">
          <!-- Left column: General info -->
          <div style="flex: 1; background: #f8fafc; padding: 20px; border-radius: 8px;">
            <h2 style="color: #334155; font-size: 18px; margin: 0 0 16px 0;">Información General</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #64748b;">Título:</td><td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${rfi.Titulo || 'Sin título'}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748b;">Estado:</td><td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${rfi.Status || 'Pendiente'}</td></tr>
              <tr><td style="padding: 8px 0; color: #64748b;">Urgencia:</td><td style="padding: 8px 0; color: #1e293b;">${rfi.Urgencia === 'muy_urgente' ? 'Muy Urgente' : rfi.Urgencia === 'urgente' ? 'Urgente' : 'No Urgente'}</td></tr>
              ${rfi.Especialidad ? `<tr><td style="padding: 8px 0; color: #64748b;">Especialidad:</td><td style="padding: 8px 0; color: #1e293b;">${getEspecialidadLabel(rfi.Especialidad)}</td></tr>` : ''}
              <tr><td style="padding: 8px 0; color: #64748b;">Creación:</td><td style="padding: 8px 0; color: #1e293b;">${new Date(rfi.created_at).toLocaleDateString('es-CL')}</td></tr>
              ${rfi.Fecha_Vencimiento ? `<tr><td style="padding: 8px 0; color: #64748b;">Vencimiento:</td><td style="padding: 8px 0; color: #1e293b;">${new Date(rfi.Fecha_Vencimiento).toLocaleDateString('es-CL')}</td></tr>` : ''}
              ${rfi.Fecha_Respuesta && rfi.Status === 'Cerrado' ? `<tr><td style="padding: 8px 0; color: #64748b;">Cierre:</td><td style="padding: 8px 0; color: #1e293b;">${new Date(rfi.Fecha_Respuesta).toLocaleDateString('es-CL')}</td></tr>` : ''}
            </table>
            ${destinatariosHtml}
          </div>
        </div>

        ${rfi.Descripcion ? `
        <div style="margin-bottom: 24px;">
          <h2 style="color: #334155; font-size: 18px; margin: 0 0 12px 0;">Descripción / Consulta Inicial</h2>
          <p style="color: #475569; line-height: 1.6; margin: 0; white-space: pre-wrap;">${rfi.Descripcion}</p>
        </div>` : ''}

        ${rfi.URL ? `
        <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #bfdbfe;">
          <p style="color: #1e40af; margin: 0; font-size: 13px;">
            <strong>Archivos iniciales adjuntos:</strong> Los documentos asociados a esta consulta están disponibles en la plataforma Gloster.
          </p>
        </div>` : ''}

        ${messagesHtml}

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">Documento generado automáticamente por Gloster</p>
        </div>
      </div>
    `;

    const element = document.createElement('div');
    element.innerHTML = content;

    const opt = {
      margin: 10,
      filename: `RFI_${rfi.Correlativo || rfi.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  }, []);

  return { exportAdicionalToPDF, exportRFIToPDF };
};