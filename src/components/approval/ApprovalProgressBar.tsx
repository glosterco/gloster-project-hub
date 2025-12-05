import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

interface ApprovalProgressBarProps {
  totalRequired: number;
  totalApproved: number;
  totalRejected: number;
  isFullyApproved: boolean;
  hasRejection: boolean;
}

export const ApprovalProgressBar = ({
  totalRequired,
  totalApproved,
  totalRejected,
  isFullyApproved,
  hasRejection
}: ApprovalProgressBarProps) => {
  const progress = totalRequired > 0 ? (totalApproved / totalRequired) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Progreso de aprobación</span>
        <div className="flex items-center gap-2">
          {hasRejection ? (
            <>
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-destructive font-medium">Rechazado</span>
            </>
          ) : isFullyApproved ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">Aprobado</span>
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-amber-600 font-medium">
                {totalApproved}/{totalRequired} aprobaciones
              </span>
            </>
          )}
        </div>
      </div>
      
      <Progress 
        value={hasRejection ? 100 : progress} 
        className={`h-2 ${hasRejection ? '[&>div]:bg-destructive' : isFullyApproved ? '[&>div]:bg-green-600' : '[&>div]:bg-amber-500'}`}
      />
      
      {totalRejected > 0 && !hasRejection && (
        <p className="text-xs text-muted-foreground">
          {totalRejected} rechazo(s) registrado(s)
        </p>
      )}
    </div>
  );
};
