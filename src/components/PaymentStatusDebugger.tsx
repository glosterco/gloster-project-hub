
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentStatusDebuggerProps {
  projectId: string;
}

const PaymentStatusDebugger: React.FC<PaymentStatusDebuggerProps> = ({ projectId }) => {
  const [debugInfo, setDebugInfo] = useState<any[]>([]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const monitorPaymentStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('Estados de pago')
          .select('id, Name, Status, updated_at')
          .eq('Project', parseInt(projectId))
          .order('id');

        if (!error && data) {
          const timestamp = new Date().toISOString();
          console.log(`🕐 MONITOR [${timestamp}] Payment Status Check:`, data);
          
          setDebugInfo(prev => [...prev.slice(-10), { // Keep last 10 entries
            timestamp,
            data: data.map(p => ({ id: p.id, name: p.Name, status: p.Status }))
          }]);
        }
      } catch (error) {
        console.error('❌ Monitor error:', error);
      }
    };

    // Check every 2 seconds to catch any modifications
    intervalId = setInterval(monitorPaymentStatus, 2000);
    monitorPaymentStatus(); // Initial check

    return () => {
      clearInterval(intervalId);
    };
  }, [projectId]);

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg max-w-md max-h-96 overflow-auto text-xs">
      <h3 className="font-bold mb-2">🔍 Payment Status Monitor</h3>
      {debugInfo.map((info, index) => (
        <div key={index} className="mb-2 border-b border-gray-600 pb-2">
          <div className="text-yellow-300">{info.timestamp}</div>
          {info.data.map((payment: any) => (
            <div key={payment.id} className="text-green-300">
              {payment.name}: {payment.status}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default PaymentStatusDebugger;
