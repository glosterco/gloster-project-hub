import { useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface RouteProtectionProps {
  children: React.ReactNode;
}

/**
 * RouteProtection: Componente de protección de rutas basado en roles.
 * 
 * ARQUITECTURA:
 * - NO bloquea acceso global basado en sesión Supabase
 * - SOLO separa rutas de contratista vs mandante
 * - Usa render condicional (no navigate() en useEffect)
 * - Las rutas públicas (/email-access, /project-access) están FUERA de este componente
 */
export const RouteProtection = ({ children }: RouteProtectionProps) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Verificar acceso por rol desde sessionStorage
  const redirectTarget = useMemo(() => {
    const activeRole = sessionStorage.getItem('activeRole');
    
    // Si no hay rol activo, verificar si hay acceso almacenado
    if (!activeRole) {
      const contractorAccess = sessionStorage.getItem('contractorAccess');
      const mandanteAccess = sessionStorage.getItem('mandanteAccess');
      
      // Si hay acceso token-based pero no rol, permitir acceso sin restricciones de rol
      if (contractorAccess || mandanteAccess) {
        return null; // Permitir acceso
      }
      
      // Sin sesión ni acceso token-based: no redirigir, dejar que la página maneje su propia autenticación
      return null;
    }

    // Rutas exclusivas de contratista
    const contractorOnlyRoutes = ['/dashboard', '/payment/'];
    
    // Rutas exclusivas de mandante
    const mandanteOnlyRoutes = ['/dashboard-mandante', '/submission/', '/project-mandante/', '/executive-summary-mandante'];

    if (activeRole === 'contratista') {
      // Bloquear acceso a rutas exclusivas de mandante
      const isMandanteRoute = mandanteOnlyRoutes.some(route => currentPath.startsWith(route));
      if (isMandanteRoute) {
        console.log('🚫 RouteProtection: Contratista blocked from mandante route:', currentPath);
        return '/dashboard';
      }
    } else if (activeRole === 'mandante') {
      // Bloquear acceso a rutas exclusivas de contratista
      const isContractorRoute = contractorOnlyRoutes.some(route => currentPath.startsWith(route));
      if (isContractorRoute) {
        console.log('🚫 RouteProtection: Mandante blocked from contractor route:', currentPath);
        return '/dashboard-mandante';
      }
    }

    return null; // Permitir acceso
  }, [currentPath]);

  // RENDER CONDICIONAL: redirigir solo si hay conflicto de rol
  if (redirectTarget) {
    return <Navigate to={redirectTarget} replace />;
  }

  return <>{children}</>;
};
