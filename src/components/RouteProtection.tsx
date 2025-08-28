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
        
        // If mandante has limited access (no user_auth_id), restrict to specific views
        if (accessData.isLimitedAccess || !accessData.hasFullAccess) {
          const currentPath = location.pathname;
          
          // Allow access patterns based on user type
          let allowedPaths: string[] = [];
          
          if (accessData.userType === 'cc') {
            // CC users can access executive summary and related routes
            allowedPaths = ['/executive-summary'];
          } else if (accessData.paymentId) {
            // Regular limited mandante users can only access submission view
            allowedPaths = [`/submission/${accessData.paymentId}`];
          }
          
          // Check if current path is allowed
          const isAllowedPath = allowedPaths.some(path => currentPath === path);
          
          if (!isAllowedPath) {
            console.log('🚫 RouteProtection: Limited access user blocked from accessing:', {
              currentPath,
              allowedPaths,
              email: accessData.email,
              userType: accessData.userType,
              isLimitedAccess: accessData.isLimitedAccess,
              hasFullAccess: accessData.hasFullAccess
            });
            
            // Redirect to appropriate allowed path
            const redirectPath = allowedPaths[0];
            if (redirectPath) {
              window.location.href = redirectPath;
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error parsing mandanteAccess in RouteProtection:', error);
      }
    }
  }, [location.pathname]);

  return <>{children}</>;
};