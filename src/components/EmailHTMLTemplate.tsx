
import React from 'react';

interface EmailHTMLTemplateProps {
  paymentState: {
    month: string;
    amount: number;
    projectName: string;
    recipient: string;
  };
  project: {
    name: string;
    client: string;
    contractor?: string;
    location: string;
    projectManager: string;
    contactEmail: string;
  };
  accessUrl: string;
}

const EmailHTMLTemplate: React.FC<EmailHTMLTemplateProps> = ({ 
  paymentState, 
  project, 
  accessUrl 
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div style={{ fontFamily: 'Rubik, Arial, sans-serif', lineHeight: '1.6', color: '#334155' }}>
      {/* Compact Header */}
      <div style={{ 
        backgroundColor: '#F5DF4D', 
        padding: '16px 20px', 
        textAlign: 'center',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
          <img 
            src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
            alt="Gloster Logo" 
            style={{ width: '24px', height: '24px', marginRight: '8px' }}
          />
          <h1 style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: '#1e293b',
            margin: '0'
          }}>
            Estado de Pago
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: '14px', color: '#64748b', marginRight: '4px' }}>📅</span>
          <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
            {paymentState.month}
          </span>
        </div>
      </div>

      {/* Contenido principal */}
      <div style={{ 
        backgroundColor: '#ffffff', 
        padding: '24px',
        borderRadius: '0 0 8px 8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <p style={{ fontSize: '16px', marginBottom: '20px' }}>
          Estimado/a equipo de <strong>{project.client}</strong>,
        </p>
        
        <p style={{ fontSize: '16px', marginBottom: '20px' }}>
          Se ha publicado un nuevo estado de pago para su proyecto que requiere su revisión:
        </p>

        {/* Información del Estado de Pago - Mejorada */}
        <div style={{ 
          backgroundColor: '#f8fafc', 
          padding: '20px', 
          borderRadius: '8px',
          borderLeft: '4px solid #F5DF4D',
          marginBottom: '20px'
        }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#1e293b',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center'
          }}>
            🏢 Información del Estado de Pago
          </h3>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px' }}>📁</span>
              <span style={{ fontWeight: '500', color: '#64748b', marginRight: '8px' }}>Proyecto:</span>
              <span style={{ fontWeight: '600' }}>{project.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px' }}>📅</span>
              <span style={{ fontWeight: '500', color: '#64748b', marginRight: '8px' }}>Período:</span>
              <span style={{ fontWeight: '600' }}>{paymentState.month}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px' }}>💰</span>
              <span style={{ fontWeight: '500', color: '#64748b', marginRight: '8px' }}>Monto:</span>
              <span style={{ 
                fontWeight: 'bold', 
                fontSize: '16px',
                color: '#059669' 
              }}>
                {formatCurrency(paymentState.amount)}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px' }}>📍</span>
              <span style={{ fontWeight: '500', color: '#64748b', marginRight: '8px' }}>Ubicación:</span>
              <span style={{ fontWeight: '600' }}>{project.location}</span>
            </div>
          </div>
        </div>

        {/* Información del Contratista - Mejorada */}
        <div style={{ 
          backgroundColor: '#f1f5f9', 
          padding: '20px', 
          borderRadius: '8px',
          borderLeft: '4px solid #6366f1',
          marginBottom: '24px'
        }}>
          <h3 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: '#1e293b',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center'
          }}>
            👤 Información del Contratista
          </h3>
          
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px' }}>🏢</span>
              <span style={{ fontWeight: '500', color: '#64748b', marginRight: '8px' }}>Empresa:</span>
              <span style={{ fontWeight: '600' }}>{project.contractor}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px' }}>👨‍💼</span>
              <span style={{ fontWeight: '500', color: '#64748b', marginRight: '8px' }}>Project Manager:</span>
              <span style={{ fontWeight: '600' }}>{project.projectManager}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '8px' }}>📧</span>
              <span style={{ fontWeight: '500', color: '#64748b', marginRight: '8px' }}>Email:</span>
              <span style={{ fontWeight: '600' }}>{project.contactEmail}</span>
            </div>
          </div>
        </div>

        {/* Call to Action - Mejorado */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <p style={{ fontSize: '15px', marginBottom: '16px', color: '#475569' }}>
            Para revisar los documentos adjuntos y el estado de pago completo, haga clic en el siguiente enlace:
          </p>
          
          <a 
            href={accessUrl}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: '#F5DF4D',
              color: '#1e293b',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            <span style={{ marginRight: '8px' }}>📋</span>
            Revisar Estado de Pago
          </a>
          
          <p style={{ 
            fontSize: '13px', 
            color: '#64748b', 
            marginTop: '12px',
            fontStyle: 'italic'
          }}>
            Se solicitará su email de contacto para verificar el acceso
          </p>
        </div>

        {/* Nota importante - Compacta */}
        <div style={{ 
          backgroundColor: '#fef3c7', 
          padding: '12px', 
          borderRadius: '6px',
          border: '1px solid #fbbf24',
          marginBottom: '20px'
        }}>
          <p style={{ 
            fontSize: '13px', 
            color: '#92400e',
            margin: '0',
            fontWeight: '500'
          }}>
            <span style={{ marginRight: '6px' }}>⚠️</span>
            <strong>Importante:</strong> Este enlace le permitirá acceder de forma segura al estado de pago.
          </p>
        </div>
      </div>

      {/* Footer compacto */}
      <div style={{ 
        textAlign: 'center', 
        padding: '16px',
        backgroundColor: '#f8fafc',
        borderRadius: '0 0 8px 8px',
        borderTop: '1px solid #e2e8f0'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: '8px'
        }}>
          <img 
            src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
            alt="Gloster Logo" 
            style={{ width: '16px', height: '16px', marginRight: '6px' }}
          />
          <span style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            color: '#64748b' 
          }}>
            Gloster - Gestión de Proyectos
          </span>
        </div>
        
        <p style={{ 
          fontSize: '11px', 
          color: '#94a3b8', 
          margin: '0'
        }}>
          soporte.gloster@gmail.com
        </p>
      </div>
    </div>
  );
};

export default EmailHTMLTemplate;
