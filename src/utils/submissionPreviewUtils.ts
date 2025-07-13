
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
  // Mapeo completo de términos en requirements a nombres de documentos
  const documentMapping = [
    {
      id: 'avance',
      name: 'Avance del período',
      description: 'Planilla detallada del avance de obras del período',
      keywords: ['avance del período', 'avance del periodo', 'avance', 'planilla de avance'],
      required: false
    },
    {
      id: 'cotizaciones',
      name: 'Certificado de pago de cotizaciones',
      description: 'Certificado de cumplimiento de obligaciones previsionales',
      keywords: ['certificado de pago de cotizaciones', 'pago de cotizaciones', 'cotizaciones', 'previsionales'],
      required: false
    },
    {
      id: 'f30',
      name: 'Certificado F30',
      description: 'Certificado de antecedentes laborales y previsionales',
      keywords: ['certificado f30', 'f30', 'antecedentes laborales'],
      required: false
    },
    {
      id: 'f30_1',
      name: 'Certificado F30-1',
      description: 'Certificado de cumplimiento de obligaciones laborales y previsionales',
      keywords: ['certificado f30-1', 'f30-1', 'f301'],
      required: false
    },
    {
      id: 'finiquitos',
      name: 'Finiquitos',
      description: 'Documentos de finiquito de trabajadores',
      keywords: ['finiquitos', 'finiquito'],
      required: false
    },
    {
      id: 'examenes',
      name: 'Exámenes preocupacionales',
      description: 'Exámenes médicos preocupacionales de trabajadores',
      keywords: ['examenes preocupacionales', 'exámenes preocupacionales', 'examenes medicos', 'exámenes médicos'],
      required: false
    },
    {
      id: 'factura',
      name: 'Factura',
      description: 'Factura del período correspondiente',
      keywords: ['factura', 'boleta'],
      required: false
    },
    {
      id: 'eepp',
      name: 'Carátula EEPP',
      description: 'Presentación y resumen del estado de pago',
      keywords: ['caratula eepp', 'carátula eepp', 'eepp', 'presentacion'],
      required: false
    }
  ];

  const normalizeText = (text: string) => text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim();

  // Si no hay requirements, no mostrar ningún documento
  if (!projectRequirements || projectRequirements.length === 0) {
    return [];
  }

  console.log('🔍 Project requirements:', projectRequirements);

  const requiredDocuments = documentMapping.filter(doc => {
    // Verificar si algún requirement coincide exactamente con las keywords del documento
    return projectRequirements.some(requirement => {
      const reqNormalized = normalizeText(requirement);
      
      return doc.keywords.some(keyword => {
        const keywordNormalized = normalizeText(keyword);
        // Coincidencia exacta o contiene el término completo
        return reqNormalized === keywordNormalized || reqNormalized.includes(keywordNormalized);
      });
    });
  });

  console.log('🔍 Required documents found:', requiredDocuments.map(d => d.name));

  // Marcar todos los documentos encontrados como uploaded: true para la vista
  return requiredDocuments.map(doc => ({
    ...doc,
    uploaded: true
  }));
};
