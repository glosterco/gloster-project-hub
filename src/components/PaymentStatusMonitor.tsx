
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentStatusMonitorProps {
  projectId: string;
}

interface PaymentSnapshot {
  id: number;
  Name: string;
  Status: string;
  timestamp: string;
}

const PaymentStatusMonitor: React.FC<PaymentStatusMonitorProps> = ({ projectId }) => {
  const [snapshots, setSnapshots] = useState<PaymentSnapshot[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [previousStates, setPreviousStates] = useState<{[key: number]: string}>({});

  useEffect(() => {
    if (!projectId || !isMonitoring) return;

    let intervalId: NodeJS.Timeout;

    const monitorPaymentChanges = async () => {
      try {
        console.log('🔍 MONITOR: Checking payment status changes...');
        
        const { data, error } = await supabase
          .from('Estados de pago')
          .select('id, Name, Status')
          .eq('Project', parseInt(projectId))
          .order('id');

        if (!error && data) {
          const timestamp = new Date().toISOString();
          const currentStates: {[key: number]: string} = {};
          const changes: PaymentSnapshot[] = [];
          
          data.forEach(payment => {
            currentStates[payment.id] = payment.Status || 'Sin Estado';
            
            // Check if status changed from previous check
            if (previousStates[payment.id] && 
                previousStates[payment.id] !== currentStates[payment.id]) {
              console.log(`🚨 STATUS CHANGE DETECTED: "${payment.Name}" changed from "${previousStates[payment.id]}" to "${currentStates[payment.id]}"`);
              
              changes.push({
                id: payment.id,
                Name: payment.Name,
                Status: `${previousStates[payment.id]} → ${currentStates[payment.id]}`,
                timestamp
              });
            }
          });
          
          if (changes.length > 0) {
            setSnapshots(prev => [...changes, ...prev.slice(0, 9)]);
          }
          
          setPreviousStates(currentStates);
        } else if (error) {
          console.error('❌ MONITOR DB error:', error);
        }
      } catch (error) {
        console.error('❌ MONITOR error:', error);
      }
    };

    // Check every 2 seconds
    intervalId = setInterval(monitorPaymentChanges, 2000);
    monitorPaymentChanges(); // Initial check

    return () => {
      clearInterval(intervalId);
    };
  }, [projectId, isMonitoring, previousStates]);

  return (
    <div className="fixed top-4 right-4 bg-red-900 text-white p-4 rounded-lg max-w-md max-h-96 overflow-auto text-xs z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">🚨 Payment Change Monitor</h3>
        <button 
          onClick={() => setIsMonitoring(!isMonitoring)}
          className={`px-2 py-1 rounded text-xs ${isMonitoring ? 'bg-red-600' : 'bg-green-600'}`}
        >
          {isMonitoring ? 'STOP' : 'START'}
        </button>
      </div>
      <div className="mb-2 text-yellow-300">
        Project: {projectId} | Monitoring: {isMonitoring ? 'ON' : 'OFF'}
      </div>
      {snapshots.length === 0 ? (
        <div className="text-green-300">No changes detected</div>
      ) : (
        snapshots.map((snapshot, index) => (
          <div key={`${snapshot.id}-${index}`} className="mb-2 border-b border-gray-600 pb-2">
            <div className="text-yellow-300 text-xs">{new Date(snapshot.timestamp).toLocaleString()}</div>
            <div className="text-red-300 text-xs">
              {snapshot.Name}: {snapshot.Status}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default PaymentStatusMonitor;
