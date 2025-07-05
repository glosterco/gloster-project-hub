
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

export const getDocumentsFromPayment = () => [
  {
    id: 'eepp',
    name: 'Carátula EEPP',
    description: 'Presentación y resumen del estado de pago',
    uploaded: true
  },
  {
    id: 'planilla',
    name: 'Avance Periódico',
    description: 'Planilla detallada del avance de obras del período',
    uploaded: true
  },
  {
    id: 'cotizaciones',
    name: 'Certificado de Pago de Cotizaciones Previsionales',
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
    id: 'factura',
    name: 'Factura',
    description: 'Factura del período correspondiente',
    uploaded: true
  }
];
