import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { useUFValue } from '@/hooks/useUFValue';

interface TotalApprovedValueProps {
  projects: Array<{
    Budget?: number;
    Currency?: string;
    EstadosPago?: Array<{
      Status: string;
      Total: number;
      Completion?: boolean;
    }>;
  }>;
}

const TotalApprovedValue: React.FC<TotalApprovedValueProps> = ({ projects }) => {
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

  const getProjectApprovedValue = (project: any) => {
    if (!project.EstadosPago || project.EstadosPago.length === 0) return 0;
    
    return project.EstadosPago
      .filter((payment: any) => payment.Status === 'Aprobado' || payment.Completion === true)
      .reduce((sum: number, payment: any) => sum + (payment.Total || 0), 0);
  };

  // Group approved amounts by currency
  const approvedByCurrency = projects.reduce((acc, project) => {
    const currency = project.Currency || 'CLP';
    const approvedValue = getProjectApprovedValue(project);
    if (!acc[currency]) {
      acc[currency] = 0;
    }
    acc[currency] += approvedValue;
    return acc;
  }, {} as Record<string, number>);

  // Asegurar que se muestre la moneda correcta cuando solo hay un proyecto con valor 0
  if (Object.keys(approvedByCurrency).length === 0 && projects.length > 0) {
    const defaultCurrency = projects[0]?.Currency || 'CLP';
    approvedByCurrency[defaultCurrency] = 0;
  }

  // Calculate total in CLP for comparison
  const totalApprovedInCLP = Object.entries(approvedByCurrency).reduce((total, [currency, amount]) => {
    return total + convertToCLP(amount, currency);
  }, 0);

  return (
    <Card className="border-gloster-gray/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gloster-gray font-rubik">
          Total Aprobado
        </CardTitle>
        <div className="w-8 h-8 bg-gloster-yellow/20 rounded-lg flex items-center justify-center">
          <FileText className="h-4 w-4 text-gloster-gray" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Object.entries(approvedByCurrency).length === 1 ? (
            <div className="text-2xl font-bold text-slate-800 font-rubik">
              {Object.entries(approvedByCurrency).map(([currency, amount]) => 
                formatCurrency(amount, currency)
              )[0]}
            </div>
          ) : (
            Object.entries(approvedByCurrency).map(([currency, amount]) => (
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

export default TotalApprovedValue;