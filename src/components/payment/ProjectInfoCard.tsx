
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentDetail } from '@/hooks/usePaymentDetail';

interface ProjectInfoCardProps {
  payment: PaymentDetail;
}

export const ProjectInfoCard: React.FC<ProjectInfoCardProps> = ({ payment }) => {
  return (
    <Card className="border-gloster-gray/20">
      <CardHeader>
        <CardTitle className="font-rubik text-lg text-slate-800">Información del Proyecto</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-semibold text-slate-800 font-rubik mb-2">Mandante</h5>
            <p className="text-sm text-gloster-gray">
              <strong>Empresa:</strong> {payment.projectData?.Owner?.CompanyName}
            </p>
            <p className="text-sm text-gloster-gray">
              <strong>Contacto:</strong> {payment.projectData?.Owner?.ContactName}
            </p>
            <p className="text-sm text-gloster-gray">
              <strong>Email:</strong> {payment.projectData?.Owner?.ContactEmail}
            </p>
            <p className="text-sm text-gloster-gray">
              <strong>Teléfono:</strong> {payment.projectData?.Owner?.ContactPhone}
            </p>
          </div>
          <div>
            <h5 className="font-semibold text-slate-800 font-rubik mb-2">Contratista</h5>
            <p className="text-sm text-gloster-gray">
              <strong>Empresa:</strong> {payment.projectData?.Contratista?.CompanyName}
            </p>
            <p className="text-sm text-gloster-gray">
              <strong>Contacto:</strong> {payment.projectData?.Contratista?.ContactName}
            </p>
            <p className="text-sm text-gloster-gray">
              <strong>Email:</strong> {payment.projectData?.Contratista?.ContactEmail}
            </p>
            <p className="text-sm text-gloster-gray">
              <strong>RUT:</strong> {payment.projectData?.Contratista?.RUT}
            </p>
            <p className="text-sm text-gloster-gray">
              <strong>Teléfono:</strong> {payment.projectData?.Contratista?.ContactPhone}
            </p>
            <p className="text-sm text-gloster-gray">
              <strong>Dirección:</strong> {payment.projectData?.Contratista?.Adress}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
