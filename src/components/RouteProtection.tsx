import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface RouteProtectionProps {
  children: React.ReactNode;
}

/**
 * RouteProtection
 * - NO se aplica a rutas públicas (se mantienen fuera en App.tsx)
 * - Para rutas protegidas: exige sesión Supabase
 * - Render condicional (sin navigate() en useEffect)
 * - NO infiere permisos por sessionStorage (evita bloqueos y escalamiento)
 */
export const RouteProtection = ({ children }: RouteProtectionProps) => {
  const location = useLocation();
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-muted-foreground">Cargando sesión…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};
