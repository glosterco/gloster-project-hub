
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface SubmissionHeaderProps {
  projectId?: string;
}

const SubmissionHeader: React.FC<SubmissionHeaderProps> = ({ projectId }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { id } = useParams();
  const [userInfo, setUserInfo] = useState<{
    name: string;
    company: string;
    userType: 'mandante' | 'contratista' | null;
  }>({ name: 'Usuario', company: '', userType: null });

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user) return;

      try {
        // Verificar si es mandante
        const { data: mandanteData } = await supabase
          .from('Mandantes')
          .select('ContactName, CompanyName')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (mandanteData) {
          setUserInfo({
            name: mandanteData.ContactName || 'Usuario',
            company: mandanteData.CompanyName || '',
            userType: 'mandante'
          });
          return;
        }

        // Verificar si es contratista
        const { data: contratistaData } = await supabase
          .from('Contratistas')
          .select('ContactName, CompanyName')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (contratistaData) {
          setUserInfo({
            name: contratistaData.ContactName || 'Usuario',
            company: contratistaData.CompanyName || '',
            userType: 'contratista'
          });
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchUserInfo();
  }, [user]);

  const handleBackToProject = () => {
    if (projectId) {
      navigate(`/project/${projectId}`);
    } else {
      navigate(userInfo.userType === 'mandante' ? '/dashboard-mandante' : '/dashboard');
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/');
    }
  };

  return (
    <>
      <div className="bg-white border-b border-gloster-gray/20 shadow-sm print:hidden">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
                alt="Gloster Logo" 
                className="w-8 h-8"
              />
              <h1 className="text-xl font-bold text-slate-800 font-rubik">Estado de Pago</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gloster-gray">
                <User className="h-4 w-4" />
                <span className="text-sm font-rubik">
                  {userInfo.company ? `${userInfo.name} - ${userInfo.company}` : userInfo.name}
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleSignOut}
                className="text-gloster-gray hover:text-slate-800 border-gloster-gray/30 font-rubik"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Botón de volver al proyecto */}
      <div className="bg-slate-50 py-2 print:hidden">
        <div className="container mx-auto px-6">
          <button 
            onClick={handleBackToProject}
            className="text-gloster-gray hover:text-slate-800 text-sm font-rubik flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Proyecto
          </button>
        </div>
      </div>
    </>
  );
};

export default SubmissionHeader;
