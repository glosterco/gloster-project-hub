
import { useEffect, useCallback } from 'react';

interface UseNavigationWarningProps {
  shouldWarn: boolean;
  message?: string;
}

export const useNavigationWarning = ({ 
  shouldWarn, 
  message = "¿Estás seguro de que quieres salir? La notificación no ha sido enviada al mandante. Se perderán todos los avances y archivos guardados." 
}: UseNavigationWarningProps) => {

  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (shouldWarn) {
      e.preventDefault();
      e.returnValue = message;
      return message;
    }
  }, [shouldWarn, message]);

  const handleNavigation = useCallback((callback: () => void) => {
    if (shouldWarn) {
      if (window.confirm(message)) {
        callback();
      }
    } else {
      callback();
    }
  }, [shouldWarn, message]);

  useEffect(() => {
    if (shouldWarn) {
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [shouldWarn, handleBeforeUnload]);

  return { handleNavigation };
};
