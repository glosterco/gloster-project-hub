
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface NavigationGuardOptions {
  hasUnsavedChanges: boolean;
  message?: string;
}

export const useNavigationGuard = ({ 
  hasUnsavedChanges, 
  message = '¿Estás seguro de que quieres salir? Los cambios no guardados se perderán.' 
}: NavigationGuardOptions) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    if (hasUnsavedChanges) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges, message]);

  const confirmNavigation = () => {
    if (pendingNavigation) {
      pendingNavigation();
    }
    setShowConfirm(false);
    setPendingNavigation(null);
  };

  const cancelNavigation = () => {
    setShowConfirm(false);
    setPendingNavigation(null);
  };

  const guardedNavigate = (navigationFn: () => void) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(() => navigationFn);
      setShowConfirm(true);
    } else {
      navigationFn();
    }
  };

  return {
    showConfirm,
    confirmNavigation,
    cancelNavigation,
    guardedNavigate
  };
};
