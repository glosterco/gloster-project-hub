
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
      id: 'planilla',
      name: 'Avance del período',
      description: 'Planilla detallada del avance de obras del período',
      keywords: [
        'avance del período', 
        'avance del periodo', 
        'avance', 
        'planilla de avance', 
        'planilla', 
        'avance periodico', 
        'avance periódico', 
        'avance del periodo', 
        'periodo',
        'planilla del periodo',
        'planilla del período',
        'avance periodo',
        'avance período',
        'del periodo',
        'del período'
      ],
      required: false
    },
    {
      id: 'cotizaciones',
      name: 'Certificado de pago de cotizaciones',
      description: 'Certificado de cumplimiento de obligaciones previsionales',
      keywords: ['certificado de pago de cotizaciones', 'pago de cotizaciones', 'cotizaciones', 'previsionales', 'certificado de pago de cotizaciones previsionales', 'cotizaciones previsionales'],
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
      id: 'f29',
      name: 'Certificado F29',
      description: 'Certificado de declaración jurada de impuestos mensuales',
      keywords: ['certificado f29', 'f29', 'declaracion jurada'],
      required: false,
      externalLink: 'https://www4.sii.cl/rfiInternet/index.html#rfiSelFormularioPeriodo'
    },
    {
      id: 'libro_remuneraciones',
      name: 'Libro de remuneraciones',
      description: 'Registro de remuneraciones de trabajadores',
      keywords: ['libro de remuneraciones', 'libro remuneraciones', 'remuneraciones'],
      required: false,
      externalLink: 'https://midt.dirtrab.cl/empleador/lre'
    },
    {
      id: 'finiquitos',
      name: 'Finiquito/Anexo Traslado',
      description: 'Documento de finiquito o anexo de traslado de trabajadores (opcional)',
      keywords: ['finiquitos', 'finiquito', 'anexo traslado', 'anexo', 'traslado'],
      required: false,
      optional: true
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
    const isRequired = projectRequirements.some(requirement => {
      const reqNormalized = normalizeText(requirement);
      
      const matches = doc.keywords.some(keyword => {
        const keywordNormalized = normalizeText(keyword);
        // Coincidencia exacta o contiene el término completo
        const exactMatch = reqNormalized === keywordNormalized;
        const containsMatch = reqNormalized.includes(keywordNormalized);
        const reverseContainsMatch = keywordNormalized.includes(reqNormalized);
        
        if (exactMatch || containsMatch || reverseContainsMatch) {
          console.log(`🔍 Document match found: "${requirement}" matches "${keyword}" for ${doc.name}`);
          console.log(`🔍 Match type: exact=${exactMatch}, contains=${containsMatch}, reverse=${reverseContainsMatch}`);
          return true;
        }
        return false;
      });
      
      return matches;
    });
    
    if (isRequired) {
      console.log(`✅ Document "${doc.name}" is required for this project`);
    }
    
    return isRequired;
  });

  console.log('🔍 Required documents found:', requiredDocuments.map(d => d.name));

  // Identificar documentos "otros" que no coinciden con los predefinidos
  const matchedRequirements = new Set();
  requiredDocuments.forEach(doc => {
    projectRequirements.forEach(requirement => {
      const reqNormalized = normalizeText(requirement);
      const hasMatch = doc.keywords.some(keyword => {
        const keywordNormalized = normalizeText(keyword);
        return reqNormalized === keywordNormalized || 
               reqNormalized.includes(keywordNormalized) || 
               keywordNormalized.includes(reqNormalized);
      });
      if (hasMatch) {
        matchedRequirements.add(requirement);
      }
    });
  });

  // Agregar documentos "otros" que no coincidieron con los predefinidos
  const otherDocuments = projectRequirements.filter(req => 
    !matchedRequirements.has(req) && req.trim()
  ).map((req, index) => ({
    id: `other_${index}`,
    name: req,
    description: 'Documento requerido específico del proyecto',
    keywords: [req.toLowerCase()],
    required: false,
    uploaded: true,
    isOtherDocument: true
  }));

  console.log('🔍 Other documents found:', otherDocuments.map(d => d.name));

  // Combinar todos los documentos
  const allDocuments = [...requiredDocuments, ...otherDocuments];

  // Marcar todos los documentos encontrados como uploaded: true para la vista
  return allDocuments.map(doc => ({
    ...doc,
    uploaded: true
  }));
};
