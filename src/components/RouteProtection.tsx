import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface RouteProtectionProps {
  children: React.ReactNode;
}

export const RouteProtection = ({ children }: RouteProtectionProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const activeRole = sessionStorage.getItem('activeRole');
    const currentPath = location.pathname;

    // Only enforce role separation between contratista and mandante
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
          navigate('/dashboard', { replace: true });
          return;
        }
      } else if (activeRole === 'mandante') {
        // Block access to contractor-only routes
        const isContractorRoute = contractorRoutes.some(route => currentPath.startsWith(route));
        if (isContractorRoute) {
          console.log('🚫 RouteProtection: Mandante blocked from contractor route:', currentPath);
          navigate('/dashboard-mandante', { replace: true });
          return;
        }
      }
    }
  }, [location.pathname, navigate]);

  return <>{children}</>;
};