
import { PaymentDetail } from '@/hooks/usePaymentDetail';
import { getDocumentsFromRequirements } from '@/constants/documentsCatalog';

export const formatCurrency = (amount: number, payment: PaymentDetail | null) => {
  // Si el budget del proyecto es 0 o NULL, mostrar "sin informar"
  if (payment?.projectData?.Budget === 0 || payment?.projectData?.Budget === null || payment?.projectData?.Budget === undefined) {
    return 'Sin informar';
  }

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

export const getDocumentsFromPayment = getDocumentsFromRequirements;
