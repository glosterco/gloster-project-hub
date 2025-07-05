
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentSnapshot {
  id: number;
  Name: string;
  Status: string;
  timestamp: string;
  projectId: string;
}

const GlobalPaymentMonitor: React.FC = () => {
  const [snapshots, setSnapshots] = useState<PaymentSnapshot[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [previousStates, setPreviousStates] = useState<{[key: string]: string}>({});
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // Detectar cambios en la URL para saber qué proyecto monitorear
  useEffect(() => {
    const updateCurrentProject = () => {
      const path = window.location.pathname;
      const projectMatch = path.match(/\/project\/(\d+)/);
      const newProjectId = projectMatch ? projectMatch[1] : null;
      
      if (newProjectId !== currentProjectId) {
        console.log('🎯 GLOBAL MONITOR: Project changed from', currentProjectId, 'to', newProjectId);
        setCurrentProjectId(newProjectId);
        // Limpiar estados previos cuando cambie de proyecto
        setPreviousStates({});
      }
    };

    updateCurrentProject();
    window.addEventListener('popstate', updateCurrentProject);
    
    // También escuchar cambios programáticos de rutas
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    
    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      setTimeout(updateCurrentProject, 0);
    };
    
    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      setTimeout(updateCurrentProject, 0);
    };

    return () => {
      window.removeEventListener('popstate', updateCurrentProject);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [currentProjectId]);

  useEffect(() => {
    if (!currentProjectId || !isMonitoring) return;

    let intervalId: NodeJS.Timeout;

    const monitorPaymentChanges = async () => {
      try {
        console.log('🔍 GLOBAL MONITOR: Checking project', currentProjectId);
        
        const { data, error } = await supabase
          .from('Estados de pago')
          .select('id, Name, Status')
          .eq('Project', parseInt(currentProjectId))
          .order('id');

        if (!error && data) {
          const timestamp = new Date().toISOString();
          const currentStates: {[key: string]: string} = {};
          const changes: PaymentSnapshot[] = [];
          
          data.forEach(payment => {
            const key = `${currentProjectId}-${payment.id}`;
            currentStates[key] = payment.Status || 'Sin Estado';
            
            // Check if status changed from previous check
            if (previousStates[key] && 
                previousStates[key] !== currentStates[key]) {
              console.log(`🚨 GLOBAL MONITOR: "${payment.Name}" changed from "${previousStates[key]}" to "${currentStates[key]}" in project ${currentProjectId}`);
              
              changes.push({
                id: payment.id,
                Name: payment.Name,
                Status: `${previousStates[key]} → ${currentStates[key]}`,
                timestamp,
                projectId: currentProjectId
              });
            }
          });
          
          if (changes.length > 0) {
            setSnapshots(prev => [...changes, ...prev.slice(0, 19)]);
          }
          
          setPreviousStates(prev => ({ ...prev, ...currentStates }));
        } else if (error) {
          console.error('❌ GLOBAL MONITOR DB error:', error);
        }
      } catch (error) {
        console.error('❌ GLOBAL MONITOR error:', error);
      }
    };

    // Check every 1 second para capturar cambios rápidos
    intervalId = setInterval(monitorPaymentChanges, 1000);
    monitorPaymentChanges(); // Initial check

    return () => {
      clearInterval(intervalId);
    };
  }, [currentProjectId, isMonitoring, previousStates]);

  // No mostrar el monitor si no estamos en una página de proyecto
  if (!currentProjectId) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-red-900 text-white p-4 rounded-lg max-w-md max-h-96 overflow-auto text-xs z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">🌐 Global Payment Monitor</h3>
        <button 
          onClick={() => setIsMonitoring(!isMonitoring)}
          className={`px-2 py-1 rounded text-xs ${isMonitoring ? 'bg-red-600' : 'bg-green-600'}`}
        >
          {isMonitoring ? 'STOP' : 'START'}
        </button>
      </div>
      <div className="mb-2 text-yellow-300">
        Proyecto: {currentProjectId} | Monitor: {isMonitoring ? 'ACTIVO' : 'PAUSADO'}
      </div>
      <div className="mb-2 text-blue-300 text-xs">
        ✨ Este monitor persiste entre navegaciones
      </div>
      {snapshots.length === 0 ? (
        <div className="text-green-300">No se han detectado cambios</div>
      ) : (
        snapshots.map((snapshot, index) => (
          <div key={`${snapshot.projectId}-${snapshot.id}-${index}`} className="mb-2 border-b border-gray-600 pb-2">
            <div className="text-yellow-300 text-xs">
              {new Date(snapshot.timestamp).toLocaleString()}
            </div>
            <div className="text-red-300 text-xs">
              P{snapshot.projectId}: {snapshot.Name}
            </div>
            <div className="text-orange-300 text-xs font-bold">
              {snapshot.Status}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default GlobalPaymentMonitor;
