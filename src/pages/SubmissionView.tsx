import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePaymentDetail } from '@/hooks/usePaymentDetail';
import { supabase } from '@/integrations/supabase/client';

const SubmissionView = () => {
  const navigate = useNavigate();
  const { paymentId } = useParams<{ paymentId: string }>();

  const { payment, loading, error, refetch } = usePaymentDetail(paymentId || '', true);
  const { toast } = useToast();

  const [isProjectUser, setIsProjectUser] = useState(false);
  const [userChecked, setUserChecked] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      if (userChecked) return;

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setIsProjectUser(!!user);
      } catch (err) {
        console.error('Error checking user:', err);
        setIsProjectUser(false);
      } finally {
        setUserChecked(true);
      }
    };

    checkUser();
  }, [userChecked]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">Cargando estado de pago...</div>
        </div>
      </div>
    );
  }

  if (!payment || !payment.projectData) {
    return (
      <div className="min-h-screen bg-slate-50 font-rubik">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <p className="text-gloster-gray mb-4">{error || 'Estado de pago no encontrado.'}</p>
            <Button onClick={() => navigate('/')} className="mt-4">
              Volver al Inicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-rubik">
      <div className="bg-white border-b border-gloster-gray/20 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => (isProjectUser ? navigate(`/project/${payment.Project}`) : navigate('/'))}
            className="flex items-center text-gloster-gray hover:text-slate-800 text-sm font-rubik"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isProjectUser ? 'Volver al Proyecto' : 'Volver al Inicio'}
          </Button>

          <h1 className="text-xl font-bold text-slate-800 font-rubik">Detalle Estado de Pago</h1>

          <div /> {/* Placeholder para alinear el título en el centro */}
        </div>
      </div>

      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Información General</h2>
          <p>
            <strong>Nombre:</strong> {payment.Name}
          </p>
          <p>
            <strong>Mes:</strong> {payment.Mes} - <strong>Año:</strong> {payment.Año}
          </p>
          <p>
            <strong>Total:</strong> {payment.Total.toLocaleString('es-CL', { style: 'currency', currency: payment.projectData.Currency || 'CLP' })}
          </p>
          <p>
            <strong>Estado:</strong> {payment.Status}
          </p>
          <p>
            <strong>Fecha de Vencimiento:</strong> {payment.ExpiryDate}
          </p>
          {payment.Notes && (
            <p>
              <strong>Notas:</strong> {payment.Notes}
            </p>
          )}
        </section>

        <section className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Datos del Proyecto</h2>
          <p>
            <strong>Nombre del Proyecto:</strong> {payment.projectData.Name}
          </p>
          <p>
            <strong>Ubicación:</strong> {payment.projectData.Location}
          </p>
          <p>
            <strong>Presupuesto:</strong>{' '}
            {payment.projectData.Budget
              ? payment.projectData.Budget.toLocaleString('es-CL', { style: 'currency', currency: payment.projectData.Currency || 'CLP' })
              : 'No disponible'}
          </p>

          <h3 className="mt-4 font-semibold">Mandante</h3>
          {payment.projectData.Owner ? (
            <>
              <p>
                <strong>Empresa:</strong> {payment.projectData.Owner.CompanyName}
              </p>
              <p>
                <strong>Contacto:</strong> {payment.projectData.Owner.ContactName}
              </p>
              <p>
                <strong>Email:</strong> {payment.projectData.Owner.ContactEmail}
              </p>
              {payment.projectData.Owner.ContactPhone && (
                <p>
                  <strong>Teléfono:</strong> {payment.projectData.Owner.ContactPhone}
                </p>
              )}
            </>
          ) : (
            <p>No hay datos del mandante disponibles.</p>
          )}

          <h3 className="mt-4 font-semibold">Contratista</h3>
          {payment.projectData.Contratista ? (
            <>
              <p>
                <strong>Empresa:</strong> {payment.projectData.Contratista.CompanyName}
              </p>
              <p>
                <strong>Contacto:</strong> {payment.projectData.Contratista.ContactName}
              </p>
              <p>
                <strong>Email:</strong> {payment.projectData.Contratista.ContactEmail}
              </p>
              {payment.projectData.Contratista.RUT && (
                <p>
                  <strong>RUT:</strong> {payment.projectData.Contratista.RUT}
                </p>
              )}
              {payment.projectData.Contratista.ContactPhone && (
                <p>
                  <strong>Teléfono:</strong> {payment.projectData.Contratista.ContactPhone}
                </p>
              )}
              {payment.projectData.Contratista.Adress && (
                <p>
                  <strong>Dirección:</strong> {payment.projectData.Contratista.Adress}
                </p>
              )}
            </>
          ) : (
            <p>No hay datos del contratista disponibles.</p>
          )}
        </section>

        {payment.URL && (
          <section className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-lg font-semibold mb-4">Documento del Estado de Pago</h2>
            <a
              href={payment.URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gloster-yellow hover:underline font-semibold"
            >
              Ver documento
            </a>
          </section>
        )}
      </main>
    </div>
  );
};

export default SubmissionView;
