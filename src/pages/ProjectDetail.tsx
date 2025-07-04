import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, MapPin, User, Building2, Phone, Mail, FileText, Eye, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProjectDetail } from '@/hooks/useProjectDetail';
import { formatCurrency } from '@/utils/currencyUtils';
import DynamicPageHeader from '@/components/DynamicPageHeader';

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

  // PASO 2: Usar status real de la base de datos en lugar de calcular
  const getPaymentStatusBadge = (status: string | null) => {
    const realStatus = status || 'programado';
    
    switch (realStatus.toLowerCase()) {
      case 'aprobado':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aprobado</Badge>;
      case 'rechazado':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rechazado</Badge>;
      case 'enviado':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Enviado</Badge>;
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>;
      case 'programado':
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Programado</Badge>;
    }
  };

  const getActionButton = (payment: any) => {
    const status = payment.Status?.toLowerCase() || 'programado';
    
    switch (status) {
      case 'programado':
      case 'pendiente':
        return (
          <Button
            size="sm"
            onClick={() => navigate(`/payment/${payment.id}`)}
            className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black"
          >
            <FileText className="h-4 w-4 mr-2" />
            Completar
          </Button>
        );
      case 'enviado':
      case 'aprobado':
      case 'rechazado':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/submission?paymentId=${payment.id}`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Detalles
          </Button>
        );
      default:
        return (
          <Button
            size="sm"
            onClick={() => navigate(`/payment/${payment.id}`)}
            className="bg-gloster-yellow hover:bg-gloster-yellow/90 text-black"
          >
            <FileText className="h-4 w-4 mr-2" />
            Gestionar
          </Button>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <DynamicPageHeader pageType="projects" />
      
      <div className="container mx-auto px-6 py-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
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

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Estados de Pago</h2>
              <div className="space-y-4">
                {project.EstadosPago.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{payment.Name}</h3>
                        {getPaymentStatusBadge(payment.Status)}
                      </div>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600">
                        <span>{payment.Mes} {payment.Año}</span>
                        <span>•</span>
                        <span>{formatCurrency(payment.Total || 0, project.Currency)}</span>
                        {payment.ExpiryDate && (
                          <>
                            <span>•</span>
                            <span>Vence: {payment.ExpiryDate}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="ml-4">
                      {getActionButton(payment)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Información del Mandante</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 text-gloster-gray mr-3" />
                  <div>
                    <p className="font-medium">Empresa</p>
                    <p className="text-slate-600">{project.Owner?.CompanyName || 'No disponible'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gloster-gray mr-3" />
                  <div>
                    <p className="font-medium">Contacto</p>
                    <p className="text-slate-600">{project.Owner?.ContactName || 'No disponible'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gloster-gray mr-3" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-slate-600">{project.Owner?.ContactEmail || 'No disponible'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gloster-gray mr-3" />
                  <div>
                    <p className="font-medium">Teléfono</p>
                    <p className="text-slate-600">{project.Owner?.ContactPhone || 'No disponible'}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Información del Contratista</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Building2 className="h-5 w-5 text-gloster-gray mr-3" />
                  <div>
                    <p className="font-medium">Empresa</p>
                    <p className="text-slate-600">{project.Contratista?.CompanyName || 'No disponible'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <User className="h-5 w-5 text-gloster-gray mr-3" />
                  <div>
                    <p className="font-medium">Contacto</p>
                    <p className="text-slate-600">{project.Contratista?.ContactName || 'No disponible'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Mail className="h-5 w-5 text-gloster-gray mr-3" />
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-slate-600">{project.Contratista?.ContactEmail || 'No disponible'}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gloster-gray mr-3" />
                  <div>
                    <p className="font-medium">Teléfono</p>
                    <p className="text-slate-600">{project.Contratista?.ContactPhone || 'No disponible'}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
