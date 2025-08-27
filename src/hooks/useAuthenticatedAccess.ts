import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Hook para verificar si el usuario tiene acceso completo autenticado
export const useAuthenticatedAccess = () => {
  const [hasFullAccess, setHasFullAccess] = useState(false);
  const [userType, setUserType] = useState<'mandante' | 'contratista' | 'cc' | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkFullAccess = () => {
      try {
        // Verificar acceso de mandante/CC
        const mandanteAccess = sessionStorage.getItem('mandanteAccess');
        if (mandanteAccess) {
          const accessData = JSON.parse(mandanteAccess);
          
          // Para CC, siempre tiene acceso a executive summary
          if (accessData.userType === 'cc') {
            setHasFullAccess(true);
            setUserType('cc');
            setLoading(false);
            return;
          }
          
          // Para mandante, verificar si tiene acceso completo
          if (accessData.userType === 'mandante' && accessData.hasFullAccess) {
            setHasFullAccess(true);
            setUserType('mandante');
            setLoading(false);
            return;
          }
        }

        // Verificar acceso de contratista
        const contractorAccess = sessionStorage.getItem('contractorAccess');
        if (contractorAccess) {
          const accessData = JSON.parse(contractorAccess);
          
          if (accessData.userType === 'contratista' && accessData.hasFullAccess) {
            setHasFullAccess(true);
            setUserType('contratista');
            setLoading(false);
            return;
          }
        }

        // No hay acceso completo
        setHasFullAccess(false);
        setUserType(null);
        setLoading(false);
      } catch (error) {
        console.error('Error checking authenticated access:', error);
        setHasFullAccess(false);
        setUserType(null);
        setLoading(false);
      }
    };

    checkFullAccess();
  }, []);

  const redirectToAccess = () => {
    navigate('/');
  };

  return {
    hasFullAccess,
    userType,
    loading,
    redirectToAccess
  };
};