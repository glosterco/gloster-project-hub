
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, User, BarChart3, Home, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const PageHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signOut, loading } = useAuth();
  const [contractorInfo, setContractorInfo] = useState<{
    ContactName: string;
    CompanyName: string;
  } | null>(null);
  const [hasMultipleRoles, setHasMultipleRoles] = useState(false);

  useEffect(() => {
    const fetchContractorInfo = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;

        const { data: contractorData, error } = await supabase
          .from('Contratistas')
          .select('ContactName, CompanyName')
          .eq('auth_user_id', user.id)
          .maybeSingle();

        if (!error && contractorData) {
          setContractorInfo(contractorData);
        }
        
        // Check for multiple roles
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('role_type')
          .eq('auth_user_id', user.id);
        
        setHasMultipleRoles((userRoles?.length || 0) > 1);
      } catch (error) {
        console.error('Error fetching contractor info:', error);
      }
    };

    fetchContractorInfo();
  }, []);

  const handleLogout = async () => {
    console.log('Attempting logout...');
    
    const { error } = await signOut();
    
    if (!error) {
      // Navigation will be handled by the auth state change listener in Index.tsx
      console.log('Logout successful, redirecting to login');
      navigate('/');
    }
  };

  const displayName = contractorInfo 
    ? `${contractorInfo.ContactName} - ${contractorInfo.CompanyName}`
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
            <h1 className="text-xl font-bold text-slate-800 font-rubik">Gloster</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Navigation Buttons */}
            <div className="flex items-center space-x-2">
              <Button 
                variant={location.pathname === '/dashboard' || location.pathname === '/dashboard-mandante' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => navigate('/dashboard')}
                className="font-rubik"
              >
                <Home className="h-4 w-4 mr-1" />
                Dashboard
              </Button>
              <Button 
                variant={location.pathname === '/executive-summary' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => navigate('/executive-summary')}
                className="font-rubik text-xs"
              >
                <BarChart3 className="h-3 w-3 mr-1" />
                Resumen
              </Button>
            </div>
            
            {hasMultipleRoles ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-gloster-gray hover:text-slate-800">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-rubik">{displayName}</span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white z-50">
                  <DropdownMenuItem 
                    onClick={() => navigate('/role-selection')}
                    className="cursor-pointer font-rubik"
                  >
                    Cambiar de rol
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2 text-gloster-gray">
                <User className="h-4 w-4" />
                <span className="text-sm font-rubik">{displayName}</span>
              </div>
            )}
            
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

export default PageHeader;
