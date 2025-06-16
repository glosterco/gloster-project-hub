
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Building2, MapPin, Calendar, DollarSign, User, Clock } from 'lucide-react';
import { ProjectWithDetails } from '@/hooks/useProjectsWithDetails';

interface ProjectsGridProps {
  projects: ProjectWithDetails[];
}

export const ProjectsGrid = ({ projects }: ProjectsGridProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateProgress = (estadosPago: any[]) => {
    const total = estadosPago.length;
    const completed = estadosPago.filter(ep => ep.Completion).length;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aprobado':
        return 'bg-green-500';
      case 'Pendiente':
        return 'bg-yellow-500';
      case 'Programado':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => {
        const progress = calculateProgress(project.EstadosPago);
        const nextPayment = project.EstadosPago.find(ep => !ep.Completion);
        
        return (
          <Card key={project.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    {project.Name}
                  </CardTitle>
                  <CardDescription className="mt-2 line-clamp-2">
                    {project.Description}
                  </CardDescription>
                </div>
                <Badge variant={project.Status ? "default" : "secondary"}>
                  {project.Status ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Location and Budget */}
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="h-4 w-4" />
                  <span>{project.Location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <DollarSign className="h-4 w-4" />
                  <span className="font-semibold">{formatCurrency(project.Budget)}</span>
                </div>
              </div>

              {/* Project Details */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{project.Duration} meses</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>Cada {project.ExpiryRate} días</span>
                </div>
              </div>

              {/* Contractor and Owner */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Contratista:</span>
                  <span className="text-gray-600">{project.Contratista?.CompanyName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Mandante:</span>
                  <span className="text-gray-600">{project.Owner?.CompanyName}</span>
                </div>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Progreso Estados de Pago</span>
                  <span className="text-gray-600">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="text-xs text-gray-500">
                  {project.EstadosPago.filter(ep => ep.Completion).length} de {project.EstadosPago.length} estados completados
                </div>
              </div>

              {/* Next Payment */}
              {nextPayment && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-sm font-medium text-gray-700 mb-1">Próximo Estado de Pago</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{nextPayment.Name}</span>
                    <Badge className={getStatusColor(nextPayment.Status)}>
                      {nextPayment.Status}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Vence: {new Date(nextPayment.ExpiryDate).toLocaleDateString('es-CL')}
                  </div>
                </div>
              )}

              {/* Requirements */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Requerimientos:</div>
                <div className="flex flex-wrap gap-1">
                  {project.Requierment?.slice(0, 3).map((req, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {req}
                    </Badge>
                  ))}
                  {project.Requierment?.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{project.Requierment.length - 3} más
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
