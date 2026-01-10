import { useCallback } from 'react';
import html2pdf from 'html2pdf.js';

export const useExportPDF = () => {
  const exportAdicionalToPDF = useCallback(async (adicional: any, currency = 'CLP') => {
    const formatCurrency = (value: number) => {
      return new Intl.NumberFormat('es-CL', { 
        style: 'currency', 
        currency: currency,
        minimumFractionDigits: 0 
      }).format(value);
    };

    const content = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
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

        ${adicional.approved_by_email || adicional.action_notes || adicional.rejection_notes ? `
        <div style="background: #fefce8; padding: 20px; border-radius: 8px; border: 1px solid #fef08a;">
          <h2 style="color: #854d0e; font-size: 18px; margin: 0 0 16px 0;">Historial de Revisión</h2>
          ${adicional.approved_by_email ? `<p style="color: #475569; margin: 0 0 8px 0;"><strong>Revisado por:</strong> ${adicional.approved_by_email}</p>` : ''}
          ${adicional.approved_at ? `<p style="color: #475569; margin: 0 0 8px 0;"><strong>Fecha:</strong> ${new Date(adicional.approved_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' })}</p>` : ''}
          ${adicional.action_notes ? `<p style="color: #475569; margin: 0 0 8px 0;"><strong>Comentario:</strong> ${adicional.action_notes}</p>` : ''}
          ${adicional.rejection_notes && adicional.Status === 'Rechazado' ? `<p style="color: #dc2626; margin: 0;"><strong>Motivo de rechazo:</strong> ${adicional.rejection_notes}</p>` : ''}
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
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().set(opt).from(element).save();
  }, []);

  const exportRFIToPDF = useCallback(async (rfi: any) => {
    const content = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto;">
        <div style="border-bottom: 3px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="color: #1e293b; margin: 0; font-size: 28px;">RFI #${rfi.Correlativo || rfi.id}</h1>
          <p style="color: #64748b; margin: 8px 0 0 0; font-size: 14px;">
            Generado el ${new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
          <h2 style="color: #334155; font-size: 18px; margin: 0 0 16px 0;">Información General</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #64748b; width: 40%;">Título:</td><td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${rfi.Titulo || 'Sin título'}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Estado:</td><td style="padding: 8px 0; color: #1e293b; font-weight: 500;">${rfi.Status || 'Pendiente'}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Urgencia:</td><td style="padding: 8px 0; color: #1e293b;">${rfi.Urgencia === 'muy_urgente' ? 'Muy Urgente' : rfi.Urgencia === 'urgente' ? 'Urgente' : 'No Urgente'}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b;">Fecha de Creación:</td><td style="padding: 8px 0; color: #1e293b;">${new Date(rfi.created_at).toLocaleDateString('es-CL')}</td></tr>
            ${rfi.Fecha_Vencimiento ? `<tr><td style="padding: 8px 0; color: #64748b;">Fecha de Vencimiento:</td><td style="padding: 8px 0; color: #1e293b;">${new Date(rfi.Fecha_Vencimiento).toLocaleDateString('es-CL')}</td></tr>` : ''}
            ${rfi.Fecha_Respuesta && rfi.Status === 'Cerrado' ? `<tr><td style="padding: 8px 0; color: #64748b;">Fecha de Cierre:</td><td style="padding: 8px 0; color: #1e293b;">${new Date(rfi.Fecha_Respuesta).toLocaleDateString('es-CL')}</td></tr>` : ''}
          </table>
        </div>

        ${rfi.Descripcion ? `
        <div style="margin-bottom: 24px;">
          <h2 style="color: #334155; font-size: 18px; margin: 0 0 12px 0;">Descripción / Consulta</h2>
          <p style="color: #475569; line-height: 1.6; margin: 0; white-space: pre-wrap;">${rfi.Descripcion}</p>
        </div>` : ''}

        ${rfi.Respuesta ? `
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 24px; border: 1px solid #bbf7d0;">
          <h2 style="color: #166534; font-size: 18px; margin: 0 0 12px 0;">Respuesta</h2>
          <p style="color: #475569; line-height: 1.6; margin: 0; white-space: pre-wrap;">${rfi.Respuesta}</p>
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
      filename: `RFI_${rfi.Correlativo || rfi.id}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    await html2pdf().set(opt).from(element).save();
  }, []);

  return { exportAdicionalToPDF, exportRFIToPDF };
};
