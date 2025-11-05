import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Calendar, DollarSign } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import LicitacionForm from '@/components/LicitacionForm';
import { useToast } from '@/hooks/use-toast';

interface Licitacion {
  id: string;
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  fechaCierre: string;
  presupuestoEstimado: number;
  estado: 'abierta' | 'cerrada' | 'en_evaluacion';
}

const Licitaciones = () => {
  const { toast } = useToast();
  const [licitaciones, setLicitaciones] = useState<Licitacion[]>([]);
  const [showForm, setShowForm] = useState(false);

  const handleNuevaLicitacion = () => {
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    // Aquí se podría refrescar la lista de licitaciones
    setShowForm(false);
  };

  const getEstadoBadgeColor = (estado: Licitacion['estado']) => {
    switch (estado) {
      case 'abierta':
        return 'bg-green-100 text-green-800';
      case 'cerrada':
        return 'bg-gray-100 text-gray-800';
      case 'en_evaluacion':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground font-rubik mb-2">
            Gestión de Licitaciones
          </h1>
          <p className="text-muted-foreground">
            Crea y administra procesos de licitación para nuevos subcontratos
          </p>
        </div>

        <div className="mb-6">
          <Button 
            onClick={handleNuevaLicitacion}
            className="font-rubik"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Licitación
          </Button>
        </div>

        {licitaciones.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2 font-rubik">
                No hay licitaciones activas
              </h3>
              <p className="text-muted-foreground text-center mb-6">
                Comienza creando tu primera licitación para gestionar procesos de subcontratación
              </p>
              <Button onClick={handleNuevaLicitacion}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Primera Licitación
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {licitaciones.map((licitacion) => (
              <Card key={licitacion.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="font-rubik">{licitacion.nombre}</CardTitle>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoBadgeColor(licitacion.estado)}`}>
                      {licitacion.estado.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <CardDescription>{licitacion.descripcion}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Inicio: {new Date(licitacion.fechaInicio).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Cierre: {new Date(licitacion.fechaCierre).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <DollarSign className="h-4 w-4 mr-2" />
                      <span>Presupuesto: ${licitacion.presupuestoEstimado.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      Ver Detalles
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      Gestionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <LicitacionForm
          open={showForm}
          onOpenChange={setShowForm}
          onSuccess={handleFormSuccess}
        />
      </div>
    </div>
  );
};

export default Licitaciones;
