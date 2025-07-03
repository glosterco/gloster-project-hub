
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
      {/* Header con logo Gloster */}
      <div style={{ 
        backgroundColor: '#F5DF4D', 
        padding: '20px', 
        textAlign: 'center',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img 
            src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
            alt="Gloster Logo" 
            style={{ width: '32px', height: '32px', marginRight: '12px' }}
          />
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#1e293b',
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
      {/* Header con logo Gloster */}
      <div style={{ 
        backgroundColor: '#F5DF4D', 
        padding: '20px', 
        textAlign: 'center',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img 
            src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
            alt="Gloster Logo" 
            style={{ width: '32px', height: '32px', marginRight: '12px' }}
          />
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#1e293b',
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
      {/* Header con logo Gloster */}
      <div style={{ 
        backgroundColor: '#F5DF4D', 
        padding: '20px', 
        textAlign: 'center',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img 
            src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
            alt="Gloster Logo" 
            style={{ width: '32px', height: '32px', marginRight: '12px' }}
          />
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#1e293b',
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
      {/* Header con logo Gloster */}
      <div style={{ 
        backgroundColor: '#F5DF4D', 
        padding: '20px', 
        textAlign: 'center',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img 
            src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
            alt="Gloster Logo" 
            style={{ width: '32px', height: '32px', marginRight: '12px' }}
          />
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#1e293b',
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
      {/* Header con logo Gloster */}
      <div style={{ 
        backgroundColor: '#F5DF4D', 
        padding: '20px', 
        textAlign: 'center',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img 
            src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
            alt="Gloster Logo" 
            style={{ width: '32px', height: '32px', marginRight: '12px' }}
          />
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#1e293b',
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
      {/* Header con logo Gloster */}
      <div style={{ 
        backgroundColor: '#F5DF4D', 
        padding: '20px', 
        textAlign: 'center',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img 
            src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
            alt="Gloster Logo" 
            style={{ width: '32px', height: '32px', marginRight: '12px' }}
          />
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#1e293b',
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
      {/* Header con logo Gloster */}
      <div style={{ 
        backgroundColor: '#F5DF4D', 
        padding: '20px', 
        textAlign: 'center',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img 
            src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
            alt="Gloster Logo" 
            style={{ width: '32px', height: '32px', marginRight: '12px' }}
          />
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#1e293b',
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
      {/* Header con logo Gloster */}
      <div style={{ 
        backgroundColor: '#F5DF4D', 
        padding: '20px', 
        textAlign: 'center',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img 
            src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
            alt="Gloster Logo" 
            style={{ width: '32px', height: '32px', marginRight: '12px' }}
          />
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#1e293b',
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
      {/* Header con logo Gloster */}
      <div style={{ 
        backgroundColor: '#F5DF4D', 
        padding: '20px', 
        textAlign: 'center',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img 
            src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
            alt="Gloster Logo" 
            style={{ width: '32px', height: '32px', marginRight: '12px' }}
          />
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 'bold', 
            color: '#1e293b',
            margin: '0'
          }}>
            Gloster
          </h1>
        </div>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          color: '#1e293b',
          margin: '10px 0 0 0'
        }}>
          Nuevo Estado de Pago Disponible
        </h2>
      </div>

      {/* Contenido principal */}
      <div style={{ 
        backgroundColor: '#ffffff', 
        padding: '30px',
        borderRadius: '0 0 8px 8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <p style={{ fontSize: '16px', marginBottom: '20px' }}>
          Estimado/a equipo de <strong>{project.client}</strong>,
        </p>
        
        <p style={{ fontSize: '16px', marginBottom: '25px' }}>
          Se ha publicado un nuevo estado de pago para su proyecto que requiere su revisión:
        </p>

        {/* Información del Estado de Pago */}
        <div style={{ 
          backgroundColor: '#f8fafc', 
          padding: '20px', 
          borderRadius: '8px',
          borderLeft: '4px solid #F5DF4D',
          marginBottom: '25px'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#1e293b',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center'
          }}>
            📅 Información del Estado de Pago
          </h3>
          
          <div style={{ display: 'grid', gap: '10px' }}>
            <div>
              <span style={{ fontWeight: '500', color: '#64748b' }}>Proyecto:</span>
              <span style={{ marginLeft: '8px', fontWeight: '600' }}>{project.name}</span>
            </div>
            <div>
              <span style={{ fontWeight: '500', color: '#64748b' }}>Período:</span>
              <span style={{ marginLeft: '8px', fontWeight: '600' }}>{paymentState.month}</span>
            </div>
            <div>
              <span style={{ fontWeight: '500', color: '#64748b' }}>Monto:</span>
              <span style={{ 
                marginLeft: '8px', 
                fontWeight: 'bold', 
                fontSize: '18px',
                color: '#059669' 
              }}>
                {formatCurrency(paymentState.amount)}
              </span>
            </div>
            <div>
              <span style={{ fontWeight: '500', color: '#64748b' }}>Ubicación:</span>
              <span style={{ marginLeft: '8px', fontWeight: '600' }}>{project.location}</span>
            </div>
          </div>
        </div>

        {/* Información del Contratista */}
        <div style={{ 
          backgroundColor: '#f1f5f9', 
          padding: '20px', 
          borderRadius: '8px',
          borderLeft: '4px solid #939597',
          marginBottom: '30px'
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: '#1e293b',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center'
          }}>
            🏢 Información del Contratista
          </h3>
          
          <div style={{ display: 'grid', gap: '10px' }}>
            <div>
              <span style={{ fontWeight: '500', color: '#64748b' }}>Empresa:</span>
              <span style={{ marginLeft: '8px', fontWeight: '600' }}>{project.contractor}</span>
            </div>
            <div>
              <span style={{ fontWeight: '500', color: '#64748b' }}>Project Manager:</span>
              <span style={{ marginLeft: '8px', fontWeight: '600' }}>{project.projectManager}</span>
            </div>
            <div>
              <span style={{ fontWeight: '500', color: '#64748b' }}>Email de Contacto:</span>
              <span style={{ marginLeft: '8px', fontWeight: '600' }}>{project.contactEmail}</span>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div style={{ textAlign: 'center', marginBottom: '25px' }}>
          <p style={{ fontSize: '16px', marginBottom: '20px' }}>
            Para revisar los documentos adjuntos y el estado de pago completo, haga clic en el siguiente enlace:
          </p>
          
          <a 
            href={accessUrl}
            style={{
              display: 'inline-block',
              backgroundColor: '#F5DF4D',
              color: '#1e293b',
              padding: '15px 30px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '16px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
            }}
          >
            📋 Revisar Estado de Pago
          </a>
          
          <p style={{ 
            fontSize: '14px', 
            color: '#64748b', 
            marginTop: '15px',
            fontStyle: 'italic'
          }}>
            Se solicitará su email de contacto para verificar el acceso
          </p>
        </div>

        {/* Nota importante */}
        <div style={{ 
          backgroundColor: '#fef3c7', 
          padding: '15px', 
          borderRadius: '6px',
          border: '1px solid #fbbf24',
          marginBottom: '25px'
        }}>
          <p style={{ 
            fontSize: '14px', 
            color: '#92400e',
            margin: '0',
            fontWeight: '500'
          }}>
            <strong>⚠️ Importante:</strong> Este enlace le permitirá acceder de forma segura al estado de pago. 
            Para cualquier consulta adicional, puede contactar directamente al contratista usando la información proporcionada.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ 
        textAlign: 'center', 
        padding: '20px',
        backgroundColor: '#f8fafc',
        borderRadius: '0 0 8px 8px',
        borderTop: '1px solid #e2e8f0'
      }}>
        <p style={{ 
          fontSize: '14px', 
          color: '#64748b', 
          margin: '0 0 10px 0' 
        }}>
          Este estado de pago ha sido generado automáticamente por el sistema Gloster
        </p>
        
        <div style={{ marginTop: '15px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginBottom: '8px'
          }}>
            <img 
              src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
              alt="Gloster Logo" 
              style={{ width: '20px', height: '20px', marginRight: '8px' }}
            />
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              color: '#64748b' 
            }}>
              Gloster - Gestión de Proyectos
            </span>
          </div>
          
          <p style={{ 
            fontSize: '12px', 
            color: '#94a3b8', 
            margin: '5px 0'
          }}>
            soporte.gloster@gmail.com
          </p>
          
          <a 
            href="https://www.linkedin.com/company/glostercl/" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{
              fontSize: '12px',
              color: '#64748b',
              textDecoration: 'none'
            }}
          >
            🔗 LinkedIn
          </a>
        </div>
      </div>
    </div>
  );
};

export default EmailHTMLTemplate;
