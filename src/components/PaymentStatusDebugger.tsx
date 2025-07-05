import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentStatusDebuggerProps {
  projectId: string;
}

const PaymentStatusDebugger: React.FC<PaymentStatusDebuggerProps> = ({ projectId }) => {
  const [debugInfo, setDebugInfo] = useState<any[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);

  useEffect(() => {
    if (!projectId || !isMonitoring) return;

    let intervalId: NodeJS.Timeout;

    const monitorPaymentStatus = async () => {
      try {
        console.log('🔍 DEBUGGER: Monitoring payment status...');
        
        const { data, error } = await supabase
          .from('Estados de pago')
          .select('id, Name, Status')
          .eq('Project', parseInt(projectId))
          .order('id');

        if (!error && data) {
          const timestamp = new Date().toISOString();
          console.log(`🕐 DEBUGGER [${timestamp}] Payment Status Check:`, data);
          
          setDebugInfo(prev => {
            const newEntry = {
              timestamp,
              data: data.map(p => ({ id: p.id, name: p.Name, status: p.Status }))
            };
            
            // Keep last 5 entries
            const updated = [...prev.slice(-4), newEntry];
            
            // Check for status changes
            if (prev.length > 0) {
              const lastEntry = prev[prev.length - 1];
              newEntry.data.forEach((payment: any) => {
                const lastPayment = lastEntry.data.find((p: any) => p.id === payment.id);
                if (lastPayment && lastPayment.status !== payment.status) {
                  console.log(`🚨 STATUS CHANGE DETECTED: "${payment.name}" changed from "${lastPayment.status}" to "${payment.status}"`);
                }
              });
            }
            
            return updated;
          });
        } else if (error) {
          console.error('❌ DEBUGGER DB error:', error);
        }
      } catch (error) {
        console.error('❌ DEBUGGER error:', error);
      }
    };

    // Check every 1 second
    intervalId = setInterval(monitorPaymentStatus, 1000);
    monitorPaymentStatus(); // Initial check

    return () => {
      clearInterval(intervalId);
    };
  }, [projectId, isMonitoring]);

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg max-w-md max-h-96 overflow-auto text-xs z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">🔍 Payment Status Monitor</h3>
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
      {debugInfo.map((info, index) => (
        <div key={index} className="mb-2 border-b border-gray-600 pb-2">
          <div className="text-yellow-300 text-xs">{info.timestamp}</div>
          {info.data.map((payment: any) => (
            <div key={payment.id} className="text-green-300 text-xs">
              {payment.name}: {payment.status}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default PaymentStatusDebugger;
