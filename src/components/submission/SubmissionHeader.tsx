
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface SubmissionHeaderProps {
  projectId?: string;
}

const SubmissionHeader: React.FC<SubmissionHeaderProps> = ({ projectId }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { id } = useParams();

  const handleBackToProject = () => {
    if (projectId) {
      navigate(`/project/${projectId}`);
    } else {
      navigate('/dashboard');
    }
  };

  const handleSignOut = () => {
    signOut();
    navigate('/');
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
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="font-rubik">
                      <User className="h-4 w-4 mr-2" />
                      {user.email}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
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
