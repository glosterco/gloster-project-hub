
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/utils/currencyUtils';
import { ProjectDetail } from '@/hooks/useProjectDetail';

interface ProjectHeaderProps {
  project: ProjectDetail;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({ project }) => {
  const navigate = useNavigate();

  return (
    <div className="mb-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/dashboard')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Volver al Dashboard
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 font-rubik">
            {project.Name}
          </h1>
          <p className="text-slate-600 mt-2 flex items-center">
            <MapPin className="h-4 w-4 mr-1" />
            {project.Location}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gloster-yellow">
            {formatCurrency(project.Budget || 0, project.Currency)}
          </p>
          <p className="text-slate-600">Presupuesto Total</p>
        </div>
      </div>
    </div>
  );
};

export default ProjectHeader;
