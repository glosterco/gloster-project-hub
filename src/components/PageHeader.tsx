
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  showBackButton?: boolean;
  onBack?: () => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({ showBackButton = false, onBack }) => {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {showBackButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Volver</span>
            </Button>
          )}
          <div className="flex items-center space-x-2">
            <img
              src="/lovable-uploads/8d7c313a-28e4-405f-a69a-832a4962a83f.png"
              alt="Gloster Logo"
              className="h-8 w-auto"
            />
            <h1 className="text-xl font-bold text-slate-800 font-rubik">Gloster</h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageHeader;
