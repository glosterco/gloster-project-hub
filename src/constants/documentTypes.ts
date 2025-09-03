
export const documentsFromPayment = [
  {
    id: 'eepp',
    name: 'Carátula EEPP',
    description: 'Presentación y resumen del estado de pago',
    uploaded: true
  },
  {
    id: 'planilla',
    name: 'Avance del período',
    description: 'Planilla detallada del avance de obras del período',
    uploaded: true
  },
  {
    id: 'cotizaciones',
    name: 'Certificado de pago de cotizaciones',
    description: 'Certificado de cumplimiento de obligaciones previsionales',
    uploaded: true
  },
  {
    id: 'f30',
    name: 'Certificado F30',
    description: 'Certificado de antecedentes laborales y previsionales',
    uploaded: true
  },
  {
    id: 'f30_1',
    name: 'Certificado F30-1',
    description: 'Certificado de cumplimiento de obligaciones laborales y previsionales',
    uploaded: true
  },
  {
    id: 'f29',
    name: 'Certificado F29',
    description: 'Certificado de declaración jurada de impuestos mensuales',
    uploaded: true,
    externalLink: 'https://www4.sii.cl/rfiInternet/index.html#rfiSelFormularioPeriodo'
  },
  {
    id: 'libro_remuneraciones',
    name: 'Libro de remuneraciones',
    description: 'Registro de remuneraciones de trabajadores',
    uploaded: true,
    externalLink: 'https://midt.dirtrab.cl/empleador/lre'
  },
  {
    id: 'finiquito',
    name: 'Finiquito/Anexo Traslado',
    description: 'Documento de finiquito o anexo de traslado de trabajadores (opcional)',
    uploaded: true,
    optional: true
  },
  {
    id: 'factura',
    name: 'Factura',
    description: 'Factura del período correspondiente',
    uploaded: true
  }
];
