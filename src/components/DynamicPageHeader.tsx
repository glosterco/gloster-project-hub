
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProjectsWithDetails } from '@/hooks/useProjectsWithDetails';

interface DynamicPageHeaderProps {
  pageType: 'projects' | 'payments' | 'email';
  projectId?: string;
  paymentId?: string;
}

const DynamicPageHeader: React.FC<DynamicPageHeaderProps> = ({ 
  pageType, 
  projectId, 
  paymentId 
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut, loading } = useAuth();
  const { projects, contractor } = useProjectsWithDetails();

  const handleLogout = async () => {
    console.log('Attempting logout...');
    
    const { error } = await signOut();
    
    if (!error) {
      console.log('Logout successful, redirecting to login');
      navigate('/');
    }
  };

  const getPageTitle = () => {
    switch (pageType) {
      case 'projects':
        return 'Proyectos';
      case 'payments':
        if (projectId) {
          const project = projects.find(p => p.id === parseInt(projectId));
          return project ? `Estados de Pago - ${project.Name}` : 'Estados de Pago';
        }
        return 'Estados de Pago';
      case 'email':
        return 'Vista Previa de Email';
      default:
        return 'Dashboard';
    }
  };

  const getPageDescription = () => {
    switch (pageType) {
      case 'projects':
        return `${projects.length} proyecto${projects.length !== 1 ? 's' : ''} activo${projects.length !== 1 ? 's' : ''}`;
      case 'payments':
        if (projectId) {
          const project = projects.find(p => p.id === parseInt(projectId));
          return project ? `${project.EstadosPago.length} estado${project.EstadosPago.length !== 1 ? 's' : ''} de pago` : '';
        }
        return '';
      case 'email':
        return 'Previsualización del template de email';
      default:
        return '';
    }
  };

  const displayName = contractor 
    ? `${contractor.ContactName} - ${contractor.CompanyName}`
    : 'Usuario';

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
            <div>
              <h1 className="text-xl font-bold text-slate-800 font-rubik">
                {getPageTitle()}
              </h1>
              {getPageDescription() && (
                <p className="text-sm text-gloster-gray font-rubik">
                  {getPageDescription()}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-gloster-gray">
              <User className="h-4 w-4" />
              <span className="text-sm font-rubik">{displayName}</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              disabled={loading}
              className="text-gloster-gray hover:text-slate-800 border-gloster-gray/30 font-rubik"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {loading ? 'Cerrando...' : 'Cerrar Sesión'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DynamicPageHeader;
