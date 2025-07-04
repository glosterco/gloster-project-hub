
import React from 'react';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { ProjectDetail } from '@/hooks/useProjectDetail';

interface ProjectInfoProps {
  project: ProjectDetail;
}

const ProjectInfo: React.FC<ProjectInfoProps> = ({ project }) => {
  return (
    <Card className="p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4">Información del Proyecto</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-gloster-gray mr-3" />
          <div>
            <p className="font-medium">Fecha de Inicio</p>
            <p className="text-slate-600">{project.StartDate || 'No definida'}</p>
          </div>
        </div>
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-gloster-gray mr-3" />
          <div>
            <p className="font-medium">Duración</p>
            <p className="text-slate-600">{project.Duration ? `${project.Duration} meses` : 'No definida'}</p>
          </div>
        </div>
      </div>
      {project.Description && (
        <div className="mt-4">
          <p className="font-medium">Descripción</p>
          <p className="text-slate-600 mt-1">{project.Description}</p>
        </div>
      )}
    </Card>
  );
};

export default ProjectInfo;
