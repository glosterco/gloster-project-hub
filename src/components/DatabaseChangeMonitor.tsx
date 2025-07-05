
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentChange {
  id: number;
  payment_id: number;
  payment_name: string;
  old_status: string | null;
  new_status: string | null;
  project_id: number;
  timestamp: string;
  source: 'realtime' | 'polling' | 'navigation';
}

interface PaymentState {
  id: number;
  Name: string;
  Status: string;
  Project: number;
}

const DatabaseChangeMonitor: React.FC = () => {
  const [changes, setChanges] = useState<PaymentChange[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [currentProject, setCurrentProject] = useState<number | null>(null);
  const [lastKnownStates, setLastKnownStates] = useState<{[key: string]: string}>({});

  // Detectar proyecto actual desde URL
  useEffect(() => {
    const detectProject = () => {
      const path = window.location.pathname;
      const match = path.match(/\/project\/(\d+)/);
      const projectId = match ? parseInt(match[1]) : null;
      
      if (projectId !== currentProject) {
        console.log('🎯 DATABASE MONITOR: Project changed to', projectId);
        setCurrentProject(projectId);
        // NO limpiar estados al cambiar proyecto - queremos mantener historia
      }
    };

    detectProject();
    
    // Escuchar cambios de navegación
    const handleNavigation = () => {
      setTimeout(detectProject, 100);
    };
    
    window.addEventListener('popstate', handleNavigation);
    
    // Override de funciones de navegación
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      handleNavigation();
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      handleNavigation();
    };

    return () => {
      window.removeEventListener('popstate', handleNavigation);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [currentProject]);

  // Configurar suscripción realtime a cambios en Estados de pago
  useEffect(() => {
    if (!isActive) return;

    console.log('🔥 DATABASE MONITOR: Setting up realtime subscription');
    
    const channel = supabase
      .channel('payment-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Estados de pago'
        },
        (payload) => {
          console.log('🚨 REALTIME CHANGE DETECTED:', payload);
          
          const oldRecord = payload.old as PaymentState;
          const newRecord = payload.new as PaymentState;
          
          if (oldRecord?.Status !== newRecord?.Status) {
            const change: PaymentChange = {
              id: Date.now(),
              payment_id: newRecord.id,
              payment_name: newRecord.Name,
              old_status: oldRecord?.Status || null,
              new_status: newRecord.Status,
              project_id: newRecord.Project,
              timestamp: new Date().toISOString(),
              source: 'realtime'
            };
            
            console.log('🎉 STATUS CHANGE CAPTURED:', change);
            setChanges(prev => [change, ...prev.slice(0, 19)]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'Estados de pago'
        },
        (payload) => {
          console.log('🆕 NEW PAYMENT STATE:', payload);
          
          const newRecord = payload.new as PaymentState;
          const change: PaymentChange = {
            id: Date.now(),
            payment_id: newRecord.id,
            payment_name: newRecord.Name,
            old_status: null,
            new_status: newRecord.Status,
            project_id: newRecord.Project,
            timestamp: new Date().toISOString(),
            source: 'realtime'
          };
          
          setChanges(prev => [change, ...prev.slice(0, 19)]);
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status);
      });

    return () => {
      console.log('🔌 Unsubscribing from realtime');
      supabase.removeChannel(channel);
    };
  }, [isActive]);

  // Monitor adicional por polling para capturar cambios que realtime pueda perder
  useEffect(() => {
    if (!isActive || !currentProject) return;

    const pollForChanges = async () => {
      try {
        const { data, error } = await supabase
          .from('Estados de pago')
          .select('id, Name, Status, Project')
          .eq('Project', currentProject);

        if (!error && data) {
          data.forEach(payment => {
            const key = `${payment.Project}-${payment.id}`;
            const currentStatus = payment.Status || 'Sin Estado';
            const previousStatus = lastKnownStates[key];
            
            if (previousStatus && previousStatus !== currentStatus) {
              console.log('🔍 POLLING DETECTED CHANGE:', {
                payment: payment.Name,
                from: previousStatus,
                to: currentStatus
              });
              
              const change: PaymentChange = {
                id: Date.now(),
                payment_id: payment.id,
                payment_name: payment.Name,
                old_status: previousStatus,
                new_status: currentStatus,
                project_id: payment.Project,
                timestamp: new Date().toISOString(),
                source: 'polling'
              };
              
              setChanges(prev => [change, ...prev.slice(0, 19)]);
            }
            
            setLastKnownStates(prev => ({
              ...prev,
              [key]: currentStatus
            }));
          });
        }
      } catch (error) {
        console.error('❌ Polling error:', error);
      }
    };

    // Poll inicial
    pollForChanges();
    
    // Poll cada 3 segundos
    const interval = setInterval(pollForChanges, 3000);
    
    return () => clearInterval(interval);
  }, [currentProject, isActive, lastKnownStates]);

  if (!currentProject) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg max-w-md max-h-96 overflow-auto text-xs z-50 border-2 border-red-500">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold text-red-400">🔥 DB CHANGE MONITOR</h3>
        <div className="flex gap-2">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <button 
            onClick={() => setIsActive(!isActive)}
            className={`px-2 py-1 rounded text-xs ${isActive ? 'bg-red-600' : 'bg-green-600'}`}
          >
            {isActive ? 'STOP' : 'START'}
          </button>
        </div>
      </div>
      
      <div className="mb-2 text-yellow-300">
        Proyecto: {currentProject} | Realtime + Polling ACTIVO
      </div>
      
      <div className="mb-2 text-blue-300 text-xs">
        ⚡ Monitor persistente con detección en tiempo real
      </div>
      
      <div className="mb-2 text-green-300 text-xs">
        📊 Cambios capturados: {changes.length}
      </div>
      
      {changes.length === 0 ? (
        <div className="text-gray-400 text-xs">
          Esperando cambios automáticos en la BD...
        </div>
      ) : (
        <div className="space-y-2">
          {changes.slice(0, 10).map((change) => (
            <div key={change.id} className="border border-gray-600 p-2 rounded">
              <div className="text-red-300 text-xs">
                {new Date(change.timestamp).toLocaleTimeString()}
              </div>
              <div className="text-white text-xs font-bold">
                {change.payment_name}
              </div>
              <div className="text-orange-300 text-xs">
                {change.old_status || 'NULL'} → {change.new_status || 'NULL'}
              </div>
              <div className="text-purple-300 text-xs">
                Fuente: {change.source} | P{change.project_id}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-2 pt-2 border-t border-gray-600">
        <button 
          onClick={() => setChanges([])}
          className="w-full bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-xs"
        >
          Limpiar Historia
        </button>
      </div>
    </div>
  );
};

export default DatabaseChangeMonitor;
