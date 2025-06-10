
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface PageHeaderProps {
  title: string;
  showUserInfo?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, showUserInfo = true }) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente",
    });
    navigate('/');
  };

  return (
    <header className="bg-gloster-white border-b border-gloster-gray/20 shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png" 
              alt="Gloster Logo" 
              className="w-8 h-8"
            />
            <h1 className="text-xl font-bold text-slate-800 font-rubik">{title}</h1>
          </div>
          
          {showUserInfo && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-gloster-gray">
                <User className="h-4 w-4" />
                <span className="text-sm font-rubik">Juan Pérez - Subcontratista</span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="text-gloster-gray hover:text-slate-800 border-gloster-gray/30 font-rubik"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
