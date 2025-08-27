import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface RouteProtectionProps {
  children: React.ReactNode;
}

export const RouteProtection = ({ children }: RouteProtectionProps) => {
  const location = useLocation();

  useEffect(() => {
    // Check if user has mandante access with limited permissions
    const mandanteAccess = sessionStorage.getItem('mandanteAccess');
    
    if (mandanteAccess) {
      try {
        const accessData = JSON.parse(mandanteAccess);
        
        // If mandante has limited access (no user_auth_id), restrict to submission view only
        if (accessData.isLimitedAccess || !accessData.hasFullAccess) {
          const currentPath = location.pathname;
          
          // Only allow access to submission view for this specific paymentId
          const allowedPathPattern = `/submission/${accessData.paymentId}`;
          
          if (currentPath !== allowedPathPattern) {
            console.log('🚫 RouteProtection: Limited access mandante blocked from accessing:', {
              currentPath,
              allowedPath: allowedPathPattern,
              email: accessData.email,
              isLimitedAccess: accessData.isLimitedAccess,
              hasFullAccess: accessData.hasFullAccess
            });
            
            // Force redirect to submission view
            window.location.href = allowedPathPattern;
            return;
          }
        }
      } catch (error) {
        console.error('Error parsing mandanteAccess in RouteProtection:', error);
      }
    }
  }, [location.pathname]);

  return <>{children}</>;
};