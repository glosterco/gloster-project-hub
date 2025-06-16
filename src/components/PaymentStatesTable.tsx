
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, AlertCircle, Calendar } from 'lucide-react';

interface PaymentState {
  id: number;
  Name: string;
  Project: number;
  ExpiryDate: string;
  Status: string;
  Completion: boolean;
  Mes: string;
  Año: number;
  Total: number;
  projectName?: string;
}

interface PaymentStatesTableProps {
  paymentStates: PaymentState[];
  showProjectColumn?: boolean;
}

export const PaymentStatesTable = ({ paymentStates, showProjectColumn = true }: PaymentStatesTableProps) => {
  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'No definido';
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aprobado':
        return 'bg-green-500 hover:bg-green-600';
      case 'Pendiente':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'Programado':
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusIcon = (status: string, completion: boolean) => {
    if (completion) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    
    switch (status) {
      case 'Pendiente':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'Programado':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-600" />;
    }
  };

  const sortedPaymentStates = [...paymentStates].sort((a, b) => {
    // First sort by project, then by expiry date
    if (a.Project !== b.Project) {
      return a.Project - b.Project;
    }
    return new Date(a.ExpiryDate).getTime() - new Date(b.ExpiryDate).getTime();
  });

  // Group by status for summary
  const statusSummary = paymentStates.reduce((acc, payment) => {
    acc[payment.Status] = (acc[payment.Status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium">Aprobados</p>
                <p className="text-2xl font-bold text-green-600">{statusSummary.Aprobado || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{statusSummary.Pendiente || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Programados</p>
                <p className="text-2xl font-bold text-blue-600">{statusSummary.Programado || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold text-gray-700">{paymentStates.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment States Table */}
      <Card>
        <CardHeader>
          <CardTitle>Estados de Pago</CardTitle>
          <CardDescription>
            Lista completa de todos los estados de pago en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estado</TableHead>
                {showProjectColumn && <TableHead>Proyecto</TableHead>}
                <TableHead>Período</TableHead>
                <TableHead>Fecha Vencimiento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Completado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedPaymentStates.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(payment.Status, payment.Completion)}
                      {payment.Name}
                    </div>
                  </TableCell>
                  {showProjectColumn && (
                    <TableCell>
                      <Badge variant="outline">Proyecto {payment.Project}</Badge>
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{payment.Mes} {payment.Año}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(payment.ExpiryDate).toLocaleDateString('es-CL')}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(payment.Status)}>
                      {payment.Status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(payment.Total)}
                  </TableCell>
                  <TableCell>
                    {payment.Completion ? (
                      <Badge className="bg-green-500 hover:bg-green-600">
                        Completado
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        Pendiente
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
