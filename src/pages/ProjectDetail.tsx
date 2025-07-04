
import React from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useProjectDetail } from '@/hooks/useProjectDetail';
import DynamicPageHeader from '@/components/DynamicPageHeader';
import ProjectHeader from '@/components/project/ProjectHeader';
import ProjectInfo from '@/components/project/ProjectInfo';
import PaymentStatesList from '@/components/project/PaymentStatesList';
import ContactCard from '@/components/project/ContactCard';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { project, loading, refetch } = useProjectDetail(id || '');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <DynamicPageHeader pageType="projects" />
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Cargando detalles del proyecto...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <DynamicPageHeader pageType="projects" />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-gloster-gray mb-4">
              Proyecto no encontrado.
            </p>
            <Button onClick={() => navigate('/dashboard')} className="mt-4">
              Volver al Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <DynamicPageHeader pageType="projects" />
      
      <div className="container mx-auto px-6 py-8">
        <ProjectHeader project={project} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ProjectInfo project={project} />
            <PaymentStatesList 
              payments={project.EstadosPago} 
              projectCurrency={project.Currency} 
            />
          </div>

          <div className="space-y-6">
            <ContactCard 
              title="Información del Mandante" 
              contact={project.Owner} 
            />
            <ContactCard 
              title="Información del Contratista" 
              contact={project.Contratista} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
