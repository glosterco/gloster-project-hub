
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp } from 'lucide-react';
import { useUFValue } from '@/hooks/useUFValue';

interface TotalContractsValueProps {
  projects: Array<{
    Budget?: number;
    Currency?: string;
  }>;
}

const TotalContractsValue: React.FC<TotalContractsValueProps> = ({ projects }) => {
  const { value: ufValue, date: ufDate, loading: ufLoading, error: ufError } = useUFValue();

  const formatCurrency = (amount: number, curr: string = 'CLP') => {
    if (curr === 'UF') {
      return `UF ${amount.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (curr === 'USD') {
      return `US$${amount.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const convertToCLP = (amount: number, currency: string) => {
    if (currency === 'UF' && ufValue) {
      return amount * ufValue;
    }
    if (currency === 'USD') {
      return amount * 900; // Approximate conversion rate
    }
    return amount; // Already in CLP
  };

  // Group projects by currency
  const projectsByCurrency = projects.reduce((acc, project) => {
    const currency = project.Currency || 'CLP';
    if (!acc[currency]) {
      acc[currency] = 0;
    }
    acc[currency] += project.Budget || 0;
    return acc;
  }, {} as Record<string, number>);

  // Calculate total in CLP for comparison
  const totalInCLP = Object.entries(projectsByCurrency).reduce((total, [currency, amount]) => {
    return total + convertToCLP(amount, currency);
  }, 0);

  const getConversionText = () => {
    if (ufLoading) return 'Obteniendo valor UF...';
    if (ufError) return ufError;
    if (!ufValue || ufValue === 0) return '';
    return `Conversión SII UF: $${ufValue.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${ufDate})`;
  };

  return (
    <Card className="border-gloster-gray/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gloster-gray font-rubik">
          Valor Total Contratos
        </CardTitle>
        <div className="w-8 h-8 bg-gloster-yellow/20 rounded-lg flex items-center justify-center">
          <DollarSign className="h-4 w-4 text-gloster-gray" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Object.entries(projectsByCurrency).length === 1 ? (
            <div className="text-2xl font-bold text-slate-800 font-rubik">
              {Object.entries(projectsByCurrency).map(([currency, amount]) => 
                formatCurrency(amount, currency)
              )[0]}
            </div>
          ) : (
            Object.entries(projectsByCurrency).map(([currency, amount]) => (
              <div key={currency} className="flex justify-between items-center">
                <span className="text-sm font-medium text-gloster-gray font-rubik">{currency}:</span>
                <span className="text-lg font-bold text-slate-800 font-rubik">
                  {formatCurrency(amount, currency)}
                </span>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TotalContractsValue;
