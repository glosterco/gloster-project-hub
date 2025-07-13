
import { PaymentDetail } from '@/hooks/usePaymentDetail';

export const formatCurrency = (amount: number, payment: PaymentDetail | null) => {
  if (!payment?.projectData?.Currency) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  }

  if (payment.projectData.Currency === 'UF') {
    return `${amount.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UF`;
  } else if (payment.projectData.Currency === 'USD') {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  } else {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  }
};

export const getDocumentsFromPayment = (projectRequirements?: string[]) => {
  // Mapeo de términos comunes en requirements a nombres de documentos
  const documentMapping = [
    {
      id: 'eepp',
      name: 'Carátula EEPP',
      description: 'Presentación y resumen del estado de pago',
      keywords: ['caratula', 'eepp', 'presentacion'],
      required: true // Siempre incluido
    },
    {
      id: 'avance',
      name: 'Avance del período',
      description: 'Planilla detallada del avance de obras del período',
      keywords: ['avance', 'periodo', 'periodico', 'planilla'],
      required: false
    },
    {
      id: 'cotizaciones',
      name: 'Certificado de pago de cotizaciones',
      description: 'Certificado de cumplimiento de obligaciones previsionales',
      keywords: ['cotizaciones', 'previsionales', 'pago'],
      required: false
    },
    {
      id: 'f30',
      name: 'Certificado F30',
      description: 'Certificado de antecedentes laborales y previsionales',
      keywords: ['f30', 'certificado f30', 'antecedentes'],
      required: false
    },
    {
      id: 'f30_1',
      name: 'Certificado F30-1',
      description: 'Certificado de cumplimiento de obligaciones laborales y previsionales',
      keywords: ['f30-1', 'f301', 'certificado f30-1'],
      required: false
    },
    {
      id: 'factura',
      name: 'Factura',
      description: 'Factura del período correspondiente',
      keywords: ['factura', 'boleta'],
      required: false
    }
  ];

  const normalizeText = (text: string) => text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim();

  const requiredDocuments = documentMapping.filter(doc => {
    // Documentos que son requeridos por defecto siempre se incluyen
    if (doc.required) return true;
    
    // Si no hay requirements del proyecto, no incluir documentos opcionales
    if (!projectRequirements || projectRequirements.length === 0) {
      return false;
    }

    // Verificar si algún requirement coincide con las keywords del documento
    return projectRequirements.some(requirement => {
      const reqNormalized = normalizeText(requirement);
      
      return doc.keywords.some(keyword => {
        const keywordNormalized = normalizeText(keyword);
        return reqNormalized.includes(keywordNormalized) || keywordNormalized.includes(reqNormalized);
      });
    });
  });

  // Marcar todos los documentos encontrados como uploaded: true para la vista
  return requiredDocuments.map(doc => ({
    ...doc,
    uploaded: true
  }));
};
