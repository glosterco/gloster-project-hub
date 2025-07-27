
export const formatCurrency = (amount: number | null | undefined, currency?: string) => {
  // Handle null, undefined, or invalid amounts
  const validAmount = amount ?? 0;
  
  if (!currency) {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(validAmount);
  }

  if (currency === 'UF') {
    return `${validAmount.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UF`;
  } else if (currency === 'USD') {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(validAmount);
  } else {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(validAmount);
  }
};
