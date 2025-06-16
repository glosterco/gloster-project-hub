
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, MapPin, Building2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProjectWithDetails } from '@/hooks/useProjectsWithDetails';

interface ProjectsGridProps {
  projects: ProjectWithDetails[];
}

export const ProjectsGrid = ({ projects }: ProjectsGridProps) => {
  const navigate = useNavigate();

  const formatCurrency = (amount: number, currency?: string) => {
    const currencySymbol = currency === 'USD' ? 'USD' : currency === 'UF' ? 'UF' : '$';
    
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
      }).format(amount);
    } else if (currency === 'UF') {
      return `${amount.toLocaleString('es-CL')} UF`;
    } else {
      return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0,
      }).format(amount);
    }
  };

  const getProjectProgress = (project: ProjectWithDetails) => {
    if (!project.EstadosPago || project.EstadosPago.length === 0) return 0;
    
    const totalPayments = project.EstadosPago.length;
    const completedPayments = project.EstadosPago.filter(payment => 
      payment.Status === 'aprobado' || payment.Completion === true
    ).length;
    
    return Math.round((completedPayments / totalPayments) * 100);
  };

  const getProjectStatus = (project: ProjectWithDetails) => {
    if (!project.EstadosPago || project.EstadosPago.length === 0) return 'Sin estados de pago';
    
    const pendingPayments = project.EstadosPago.filter(payment => 
      payment.Status === 'pendiente'
    ).length;
    
    if (pendingPayments > 0) {
      return `${pendingPayments} pendiente${pendingPayments > 1 ? 's' : ''}`;
    }
    
    const progress = getProjectProgress(project);
    if (progress === 100) {
      return 'Completado';
    }
    
    return 'En progreso';
  };

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="mx-auto h-12 w-12 text-gloster-gray/50 mb-4" />
        <h3 className="text-lg font-medium text-gloster-gray mb-2 font-rubik">No hay proyectos disponibles</h3>
        <p className="text-gloster-gray/70 font-rubik">Los proyectos aparecerán aquí una vez que sean creados.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => {
        const progress = getProjectProgress(project);
        const status = getProjectStatus(project);
        
        return (
          <Card 
            key={project.id} 
            className="hover:shadow-xl transition-all duration-300 cursor-pointer border-gloster-gray/20 hover:border-gloster-gray/50 h-full"
            onClick={() => navigate(`/project/${project.id}`)}
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <CardTitle className="text-lg font-semibold text-slate-800 font-rubik line-clamp-2">
                  {project.Name}
                </CardTitle>
                <Badge variant="secondary" className="bg-gloster-gray/20 text-gloster-gray border-gloster-gray/30 shrink-0">
                  {project.Status ? 'activo' : 'inactivo'}
                </Badge>
              </div>
              <p className="text-gloster-gray text-sm font-rubik line-clamp-2">
                {project.Description}
              </p>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-gloster-gray mt-0.5 shrink-0" />
                  <span className="text-sm text-gloster-gray font-rubik line-clamp-1">
                    {project.Location}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-gloster-gray shrink-0" />
                  <span className="text-sm text-gloster-gray font-rubik line-clamp-1">
                    {project.Owner?.CompanyName}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gloster-gray font-rubik">Progreso:</span>
                  <span className="text-xs font-semibold text-slate-800 font-rubik">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2 bg-gloster-gray/20 [&>div]:bg-gloster-yellow" />
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gloster-gray font-rubik">Valor:</span>
                  <span className="text-sm font-semibold text-slate-800 font-rubik">
                    {formatCurrency(project.Budget || 0, project.Currency)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gloster-gray font-rubik">Estado:</span>
                  <span className="text-xs font-medium text-slate-800 font-rubik">
                    {status}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gloster-gray/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800 font-rubik">Ver detalles</span>
                  <ChevronRight className="h-4 w-4 text-gloster-gray" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
