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
  text.toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/[^\w\s-]/g, '') // Remove special characters except word chars, spaces, hyphens
    .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
    .trim();

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
  console.log(`🔍 MATCHING - Requirement: "${requirement}"`);
  
  // Normalize requirement: remove accents, lowercase, trim spaces
  const normalizedRequirement = normalizeText(requirement);
  console.log(`🔍 MATCHING - Normalized requirement: "${normalizedRequirement}"`);
  
  // First priority: exact match with document name (normalized)
  const exactNameMatch = DOCUMENT_CATALOG.find(doc => {
    const normalizedDocName = normalizeText(doc.name);
    console.log(`🔍 COMPARING - "${normalizedRequirement}" vs doc.name "${normalizedDocName}"`);
    return normalizedDocName === normalizedRequirement;
  });
  
  if (exactNameMatch) {
    console.log(`✅ Exact name match: "${requirement}" → "${exactNameMatch.name}" (id: ${exactNameMatch.id})`);
    return exactNameMatch;
  }
  
  // Second priority: exact match with any keyword (normalized)
  const exactKeywordMatch = DOCUMENT_CATALOG.find(doc => {
    const matchedKeyword = doc.keywords.find(keyword => {
      const normalizedKeyword = normalizeText(keyword);
      console.log(`🔍 COMPARING - "${normalizedRequirement}" vs keyword "${normalizedKeyword}"`);
      return normalizedKeyword === normalizedRequirement;
    });
    if (matchedKeyword) {
      console.log(`🎯 Keyword match found: "${matchedKeyword}" in doc "${doc.name}"`);
    }
    return !!matchedKeyword;
  });
  
  if (exactKeywordMatch) {
    console.log(`✅ Exact keyword match: "${requirement}" → "${exactKeywordMatch.name}" (id: ${exactKeywordMatch.id})`);
    return exactKeywordMatch;
  }
  
  // Third priority: partial matches (contains)
  const partialNameMatch = DOCUMENT_CATALOG.find(doc => {
    const normalizedDocName = normalizeText(doc.name);
    const isPartialMatch = normalizedDocName.includes(normalizedRequirement) || normalizedRequirement.includes(normalizedDocName);
    if (isPartialMatch) {
      console.log(`🔍 PARTIAL MATCH - "${normalizedRequirement}" partially matches doc.name "${normalizedDocName}"`);
    }
    return isPartialMatch;
  });
  
  if (partialNameMatch) {
    console.log(`⚠️ Partial name match: "${requirement}" → "${partialNameMatch.name}" (id: ${partialNameMatch.id})`);
    return partialNameMatch;
  }
  
  // Fourth priority: partial keyword matches
  const partialKeywordMatch = DOCUMENT_CATALOG.find(doc => {
    const matchedKeyword = doc.keywords.find(keyword => {
      const normalizedKeyword = normalizeText(keyword);
      const isPartialMatch = normalizedKeyword.includes(normalizedRequirement) || normalizedRequirement.includes(normalizedKeyword);
      if (isPartialMatch) {
        console.log(`🔍 PARTIAL KEYWORD MATCH - "${normalizedRequirement}" partially matches keyword "${normalizedKeyword}"`);
      }
      return isPartialMatch;
    });
    return !!matchedKeyword;
  });
  
  if (partialKeywordMatch) {
    console.log(`⚠️ Partial keyword match: "${requirement}" → "${partialKeywordMatch.name}" (id: ${partialKeywordMatch.id})`);
    return partialKeywordMatch;
  }
  
  console.log(`❌ No match found for requirement: "${requirement}"`);
  console.log(`🔍 DEBUG - Available documents:`, DOCUMENT_CATALOG.map(d => ({
    name: d.name,
    normalizedName: normalizeText(d.name),
    id: d.id,
    keywords: d.keywords.map(k => normalizeText(k))
  })));
  
  return null;
};

export const getDocumentsFromRequirements = (projectRequirements?: string[]) => {
  console.log('🔍 DEBUG - Project requirements received:', projectRequirements);
  console.log('🔍 DEBUG - Type of projectRequirements:', typeof projectRequirements);
  console.log('🔍 DEBUG - Is array:', Array.isArray(projectRequirements));

  // Always include documents marked as required (core documents)
  const requiredDocuments = DOCUMENT_CATALOG.filter(doc => doc.required);
  const matchedDocuments = new Set<DocumentDefinition>(requiredDocuments);
  
  console.log('📋 Always required documents:', requiredDocuments.map(d => d.name));

  // If we have project requirements, match them to additional documents
  const matchedRequirements = new Set<string>();
  
  if (projectRequirements && projectRequirements.length > 0) {
    console.log('🔍 DEBUG - Processing', projectRequirements.length, 'requirements');
    
    projectRequirements.forEach((requirement, index) => {
      console.log(`🔍 DEBUG - Processing requirement ${index + 1}:`, {
        raw: requirement,
        type: typeof requirement,
        trimmed: requirement?.trim(),
        length: requirement?.length
      });
      
      // Skip empty or whitespace-only requirements
      if (!requirement.trim()) {
        console.log(`⚠️ DEBUG - Skipping empty requirement at index ${index}`);
        return;
      }
      
      const matchedDoc = matchRequirementToDocument(requirement);
      
      // Log específico solicitado por el usuario
      console.log('Requirement:', requirement, 'Matched document:', matchedDoc?.name || 'NONE');
      
      if (matchedDoc) {
        matchedDocuments.add(matchedDoc);
        matchedRequirements.add(requirement);
        console.log(`✅ Document "${matchedDoc.name}" (id: ${matchedDoc.id}) matched for requirement "${requirement}"`);
      } else {
        console.warn(`⚠️ No document found for requirement "${requirement}"`);
        console.log('🔍 DEBUG - Available document names:', DOCUMENT_CATALOG.map(d => d.name));
        console.log('🔍 DEBUG - Available keywords for debugging:', DOCUMENT_CATALOG.find(d => d.name.toLowerCase().includes('libro'))?.keywords);
      }
    });

    // Create "other" documents for truly unmatched requirements
    const otherDocuments = projectRequirements
      .filter(req => !matchedRequirements.has(req) && req.trim()) // Only non-matched, non-empty requirements
      .sort() // Stable sorting for consistent IDs
      .map(req => ({
        id: buildOtherIdFromName(req),
        name: req,
        description: 'Documento requerido específico del proyecto',
        keywords: [req.toLowerCase()],
        required: false,
        uploaded: true,
        isOtherDocument: true
      }));

    console.log('📄 Other documents created:', otherDocuments.map(d => ({ id: d.id, name: d.name })));

    // Combine all documents and mark as uploaded for the view
    const allDocuments = [
      ...Array.from(matchedDocuments).map(doc => ({ ...doc, uploaded: true })),
      ...otherDocuments
    ];

    console.log('🔍 Final document list:', allDocuments.map(d => ({ id: d.id, name: d.name })));
    return allDocuments;
  }

  // If no project requirements, return only required documents
  const allDocuments = Array.from(matchedDocuments).map(doc => ({ ...doc, uploaded: true }));
  console.log('🔍 Final document list (required only):', allDocuments.map(d => ({ id: d.id, name: d.name })));
  return allDocuments;
};