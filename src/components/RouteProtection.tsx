import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface RouteProtectionProps {
  children: React.ReactNode;
}

export const RouteProtection = ({ children }: RouteProtectionProps) => {
  const location = useLocation();

  useEffect(() => {
    const activeRole = sessionStorage.getItem('activeRole');
    const currentPath = location.pathname;
    
    // If user is not authenticated with an active role, enforce limited-access restrictions
    if (!activeRole) {
      const mandanteAccess = sessionStorage.getItem('mandanteAccess');
      
      if (mandanteAccess) {
        try {
          const accessData = JSON.parse(mandanteAccess);
          
          // If mandante has limited access (no user_auth_id), restrict to specific views
          if (accessData.isLimitedAccess || !accessData.hasFullAccess) {
            // Allow access patterns based on user type
            let allowedPaths: string[] = [];
            
            if (accessData.userType === 'cc') {
              // CC users can access executive summary and related routes
              allowedPaths = ['/executive-summary'];
            } else if (accessData.paymentId) {
              // Regular limited mandante users can only access submission view
              allowedPaths = [`/submission/${accessData.paymentId}`];
            }
            
            // Check if current path is allowed (support exact and startsWith)
            const isAllowedPath = allowedPaths.some(path => currentPath === path || currentPath.startsWith(path));
            
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
    }
    
    // CRITICAL: Enforce role separation for users with multiple roles
    if (activeRole) {
      // Define contractor-only routes
      const contractorRoutes = ['/dashboard', '/payment/'];
      
      // Define mandante-only routes
      const mandanteRoutes = ['/dashboard-mandante', '/submission/', '/project-mandante/', '/executive-summary-mandante'];
      
      if (activeRole === 'contratista') {
        // Block access to mandante-only routes
        const isMandanteRoute = mandanteRoutes.some(route => currentPath.startsWith(route));
        if (isMandanteRoute) {
          console.log('🚫 RouteProtection: Contratista blocked from mandante route:', currentPath);
          window.location.href = '/dashboard';
          return;
        }
      } else if (activeRole === 'mandante') {
        // Block access to contractor-only routes
        const isContractorRoute = contractorRoutes.some(route => currentPath.startsWith(route));
        if (isContractorRoute) {
          console.log('🚫 RouteProtection: Mandante blocked from contractor route:', currentPath);
          window.location.href = '/dashboard-mandante';
          return;
        }
      }
    }
  }, [location.pathname]);

  return <>{children}</>;
};