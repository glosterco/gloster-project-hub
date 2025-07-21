
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
    <Card className="border-l-4 border-l-gloster-yellow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gloster-gray font-rubik">
          Valor Total Contratos
        </CardTitle>
        <DollarSign className="h-4 w-4 text-gloster-gray" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Display values by currency */}
          {Object.entries(projectsByCurrency).map(([currency, amount]) => (
            <div key={currency} className="space-y-1">
              <div className="text-lg font-bold text-slate-800 font-rubik">
                {formatCurrency(amount, currency)}
              </div>
              
              {currency === 'UF' && !ufLoading && !ufError && ufValue && ufValue > 0 && (
                <div className="text-sm text-slate-600 font-rubik">
                  <div className="text-xs text-gloster-gray">
                    ≈ {formatCurrency(convertToCLP(amount, currency))}
                  </div>
                </div>
              )}
              
              {currency === 'USD' && (
                <div className="text-sm text-slate-600 font-rubik">
                  <div className="text-xs text-gloster-gray">
                    ≈ {formatCurrency(convertToCLP(amount, currency))}
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {/* Show total equivalent in CLP if there are multiple currencies */}
          {Object.keys(projectsByCurrency).length > 1 && (
            <div className="pt-2 border-t border-gloster-gray/20">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div className="text-sm text-slate-600 font-rubik">
                  <div className="font-semibold">
                    Total equivalente: {formatCurrency(totalInCLP)}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* UF conversion info if UF projects exist */}
          {projectsByCurrency.UF && getConversionText() && (
            <div className="text-xs text-gloster-gray font-rubik">
              {getConversionText()}
            </div>
          )}
          
          {!projectsByCurrency.UF && Object.keys(projectsByCurrency).length === 1 && Object.keys(projectsByCurrency)[0] === 'CLP' && (
            <p className="text-xs text-gloster-gray font-rubik">
              Valor en pesos chilenos
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TotalContractsValue;
