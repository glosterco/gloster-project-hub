import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, PlusCircle, HelpCircle } from "lucide-react";
import { formatCurrency } from "@/utils/currencyUtils";

interface Payment {
  id: number;
  Name: string;
  Status: string;
  Total: number;
  ExpiryDate: string;
}

interface Adicional {
  id: number;
  Status: string;
  Titulo: string;
  Monto_presentado: number;
  created_at: string;
}

interface RFI {
  id: number;
  Status: string;
  Titulo: string;
  created_at: string;
}

interface PendingActionsSectionProps {
  payments: Payment[];
  adicionales: Adicional[];
  rfi: RFI[];
  currency: string;
  onPaymentClick: (paymentId: number) => void;
  onProjectDetailsClick: () => void;
}

export const PendingActionsSection: React.FC<PendingActionsSectionProps> = ({
  payments,
  adicionales,
  rfi,
  currency,
  onPaymentClick,
  onProjectDetailsClick,
}) => {
  const pendingPayments = payments?.filter((p) => p.Status === "Enviado") || [];
  const pendingAdicionales = adicionales?.filter((a) => a.Status === "Pendiente") || [];
  const pendingRFI = rfi?.filter((r) => r.Status === "Pendiente") || [];

  const totalPendingActions = pendingPayments.length + pendingAdicionales.length + pendingRFI.length;

  if (totalPendingActions === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-slate-800 font-rubik">
        Acciones pendientes
        <Badge className="ml-2 bg-amber-100 text-amber-800 font-rubik text-xs">
          {totalPendingActions}
        </Badge>
      </h4>
      <div className="grid gap-2 max-h-40 overflow-y-auto">
        {/* Estados de pago pendientes */}
        {pendingPayments.map((payment) => (
          <div
            key={`payment-${payment.id}`}
            className="flex items-center justify-between p-2 rounded border text-sm cursor-pointer hover:bg-blue-50 border-blue-200"
            onClick={() => onPaymentClick(payment.id)}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-slate-800 font-rubik">{payment.Name}</span>
              <Badge className="text-xs bg-purple-100 text-purple-800 font-rubik">
                Estado de pago
              </Badge>
            </div>
            <div className="text-right">
              <div className="font-medium text-slate-800 font-rubik">
                {formatCurrency(payment.Total, currency)}
              </div>
              <div className="text-xs text-gloster-gray font-rubik">{payment.ExpiryDate}</div>
            </div>
          </div>
        ))}

        {/* Adicionales pendientes */}
        {pendingAdicionales.map((adicional) => (
          <div
            key={`adicional-${adicional.id}`}
            className="flex items-center justify-between p-2 rounded border text-sm cursor-pointer hover:bg-green-50 border-green-200"
            onClick={onProjectDetailsClick}
          >
            <div className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium text-slate-800 font-rubik">{adicional.Titulo || "Sin título"}</span>
              <Badge className="text-xs bg-green-100 text-green-800 font-rubik">
                Adicional
              </Badge>
            </div>
            <div className="text-right">
              <div className="font-medium text-slate-800 font-rubik">
                {formatCurrency(adicional.Monto_presentado || 0, currency)}
              </div>
              <div className="text-xs text-gloster-gray font-rubik">
                {new Date(adicional.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}

        {/* RFI pendientes */}
        {pendingRFI.map((rfiItem) => (
          <div
            key={`rfi-${rfiItem.id}`}
            className="flex items-center justify-between p-2 rounded border text-sm cursor-pointer hover:bg-orange-50 border-orange-200"
            onClick={onProjectDetailsClick}
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-orange-600" />
              <span className="font-medium text-slate-800 font-rubik">{rfiItem.Titulo || "Sin título"}</span>
              <Badge className="text-xs bg-orange-100 text-orange-800 font-rubik">
                RFI
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-xs text-gloster-gray font-rubik">
                {new Date(rfiItem.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingActionsSection;
