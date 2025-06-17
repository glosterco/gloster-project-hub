
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp } from 'lucide-react';
import { useUFValue } from '@/hooks/useUFValue';

interface TotalContractsValueProps {
  totalValue: number;
  currency: string;
}

const TotalContractsValue: React.FC<TotalContractsValueProps> = ({ totalValue, currency }) => {
  const { value: ufValue, date: ufDate, loading: ufLoading, error: ufError } = useUFValue();

  const formatCurrency = (amount: number, curr: string = 'CLP') => {
    if (curr === 'UF') {
      return `${amount.toLocaleString('es-CL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} UF`;
    }
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const convertToCLP = (ufAmount: number) => {
    return ufAmount * ufValue;
  };

  const getConversionText = () => {
    if (ufLoading) return 'Obteniendo valor UF...';
    if (ufError) return ufError;
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
        <div className="space-y-2">
          <div className="text-2xl font-bold text-slate-800 font-rubik">
            {currency === 'UF' ? formatCurrency(totalValue, 'UF') : formatCurrency(totalValue)}
          </div>
          
          {currency === 'UF' && !ufLoading && !ufError && (
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <div className="text-sm text-slate-600 font-rubik">
                <div className="font-semibold">
                  {formatCurrency(convertToCLP(totalValue))}
                </div>
                <div className="text-xs text-gloster-gray">
                  {getConversionText()}
                </div>
              </div>
            </div>
          )}
          
          {currency === 'UF' && (ufLoading || ufError) && (
            <div className="text-xs text-gloster-gray font-rubik">
              {getConversionText()}
            </div>
          )}
          
          {currency !== 'UF' && (
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
