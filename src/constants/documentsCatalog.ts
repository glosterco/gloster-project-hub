export interface DocumentDefinition {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  required: boolean;
  optional?: boolean;
  externalLink?: string;
}

export const DOCUMENT_CATALOG: DocumentDefinition[] = [
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
    keywords: [
      'certificado de pago de cotizaciones', 
      'pago de cotizaciones', 
      'cotizaciones', 
      'previsionales', 
      'certificado de pago de cotizaciones previsionales', 
      'cotizaciones previsionales',
      'comprobante de pago de cotizaciones'
    ],
    required: false
  },
  {
    id: 'comprobante_cotizaciones', 
    name: 'Comprobante de pago de cotizaciones',
    description: 'Comprobante de cumplimiento de obligaciones previsionales',
    keywords: [
      'comprobante de pago de cotizaciones',
      'comprobante de cotizaciones', 
      'comprobante cotizaciones',
      'comprobante pago cotizaciones'
    ],
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
    id: 'finiquito',
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
  },
  {
    id: 'libro_asistencia',
    name: 'Libro de asistencia',
    description: 'Registro de asistencia de trabajadores al proyecto',
    keywords: [
      'libro de asistencia', 
      'libro asistencia', 
      'asistencia', 
      'asistencia trabajadores',
      'libro_asistencia',
      'libro de asistencia de trabajadores'
    ],
    required: false
  },
  {
    id: 'liquidaciones_sueldo',
    name: 'Liquidaciones de sueldo',
    description: 'Liquidaciones de sueldo de trabajadores',
    keywords: [
      'liquidaciones de sueldo', 
      'liquidaciones sueldo', 
      'liquidacion sueldo', 
      'liquidaciones', 
      'sueldo',
      'liquidaciones_sueldo',
      'liquidacion de sueldo',
      'liquidación de sueldo',
      'liquidación sueldo'
    ],
    required: false
  },
  {
    id: 'nomina_trabajadores',
    name: 'Nómina de trabajadores',
    description: 'Lista oficial de trabajadores del proyecto',
    keywords: [
      'nomina de trabajadores', 
      'nómina de trabajadores', 
      'nomina trabajadores', 
      'nómina trabajadores', 
      'nomina', 
      'nómina', 
      'lista trabajadores',
      'nomina_trabajadores',
      'lista de trabajadores'
    ],
    required: false
  },
  {
    id: 'tgr',
    name: 'TGR',
    description: 'Documento de Tesorería General de la República',
    keywords: [
      'tgr', 
      'tesoreria general', 
      'tesorería general', 
      'tesoreria', 
      'tesorería',
      'tesoreria general de la republica',
      'tesorería general de la república'
    ],
    required: false
  }
];

// Utility functions
export const normalizeText = (text: string): string => 
  text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim();

export const slugify = (text: string): string => 
  normalizeText(text).replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

export const buildOtherIdFromName = (name: string): string => 
  `other_${slugify(name)}`;

export const extractNameFromOtherId = (otherId: string): string => {
  if (!otherId.startsWith('other_')) return otherId;
  const slug = otherId.replace('other_', '');
  return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const matchRequirementToDocument = (requirement: string): DocumentDefinition | null => {
  const reqNormalized = normalizeText(requirement);
  
  // First try exact name match (case insensitive)
  const exactNameMatch = DOCUMENT_CATALOG.find(doc => 
    normalizeText(doc.name) === reqNormalized
  );
  
  if (exactNameMatch) {
    return exactNameMatch;
  }
  
  // Then try keyword matching
  return DOCUMENT_CATALOG.find(doc => {
    return doc.keywords.some(keyword => {
      const keywordNormalized = normalizeText(keyword);
      const exactMatch = reqNormalized === keywordNormalized;
      const containsMatch = reqNormalized.includes(keywordNormalized);
      const reverseContainsMatch = keywordNormalized.includes(reqNormalized);
      
      return exactMatch || containsMatch || reverseContainsMatch;
    });
  }) || null;
};

export const getDocumentsFromRequirements = (projectRequirements?: string[]) => {
  console.log('🔍 Project requirements:', projectRequirements);

  // Always include documents marked as required (core documents)
  const requiredDocuments = DOCUMENT_CATALOG.filter(doc => doc.required);
  const matchedDocuments = new Set<DocumentDefinition>(requiredDocuments);
  
  console.log('📋 Always required documents:', requiredDocuments.map(d => d.name));

  // If we have project requirements, match them to additional documents
  const matchedRequirements = new Set<string>();
  
  if (projectRequirements && projectRequirements.length > 0) {
    projectRequirements.forEach(requirement => {
      const matchedDoc = matchRequirementToDocument(requirement);
      if (matchedDoc) {
        matchedDocuments.add(matchedDoc);
        matchedRequirements.add(requirement);
        console.log(`✅ Document "${matchedDoc.name}" (id: ${matchedDoc.id}) matched for requirement "${requirement}"`);
      } else {
        console.warn(`⚠️ No document found for requirement "${requirement}"`);
      }
    });

    // TEMPORARILY DISABLED: Create "other" documents for unmatched requirements
    // const otherDocuments = projectRequirements
    //   .filter(req => !matchedRequirements.has(req) && req.trim())
    //   .sort() // Stable sorting for consistent IDs
    //   .map(req => ({
    //     id: buildOtherIdFromName(req),
    //     name: req,
    //     description: 'Documento requerido específico del proyecto',
    //     keywords: [req.toLowerCase()],
    //     required: false,
    //     uploaded: true,
    //     isOtherDocument: true
    //   }));

    // TEMPORARILY DISABLED: Other documents
    const otherDocuments = []; // Empty array - no other documents
    console.log('🚫 TEMPORARILY DISABLED: Other documents creation');

    // Combine all documents and mark as uploaded for the view
    const allDocuments = [
      ...Array.from(matchedDocuments).map(doc => ({ ...doc, uploaded: true }))
      // ...otherDocuments // DISABLED
    ];

    console.log('🔍 Final document list:', allDocuments.map(d => ({ id: d.id, name: d.name })));
    return allDocuments;
  }

  // If no project requirements, return only required documents
  const allDocuments = Array.from(matchedDocuments).map(doc => ({ ...doc, uploaded: true }));
  console.log('🔍 Final document list (required only):', allDocuments.map(d => ({ id: d.id, name: d.name })));
  return allDocuments;
};