import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/hooks/useAuth';

const ContractorAccess = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Si ya está autenticado, redirigir al detalle del pago
    if (session?.user) {
      navigate(`/payment/${paymentId}`);
      return;
    }
    setLoading(false);
  }, [session, paymentId, navigate]);

  const handleLoginSuccess = () => {
    // Redirigir al payment detail después del login exitoso
    navigate(`/payment/${paymentId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-rubik flex items-center justify-center">
        <div className="text-center">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 font-rubik">
      <header className="bg-white border-b border-gloster-gray/20 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
              alt="Gloster Logo" 
              className="w-8 h-8"
            />
            <h1 className="text-xl font-bold text-slate-800 font-rubik">Gloster</h1>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 font-rubik mb-4">
              Acceso Seguro Requerido
            </h2>
            <p className="text-slate-600 font-rubik">
              Para acceder a la información del estado de pago, necesitas iniciar sesión con tu cuenta registrada.
            </p>
          </div>
          
          <LoginForm onSuccess={handleLoginSuccess} />
          
          <div className="text-center mt-8">
            <p className="text-sm text-slate-600 font-rubik">
              ¿No tienes una cuenta?{' '}
              <button 
                onClick={() => navigate('/register')}
                className="text-gloster-yellow hover:underline font-medium"
              >
                Regístrate aquí
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractorAccess;