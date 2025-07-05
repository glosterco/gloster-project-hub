
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PaymentStatusMonitorProps {
  projectId: string;
}

interface AuditLog {
  id: number;
  payment_id: number;
  old_status: string;
  new_status: string;
  changed_by: string;
  changed_at: string;
  operation: string;
}

const PaymentStatusMonitor: React.FC<PaymentStatusMonitorProps> = ({ projectId }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(true);

  useEffect(() => {
    if (!projectId || !isMonitoring) return;

    let intervalId: NodeJS.Timeout;

    const checkAuditLogs = async () => {
      try {
        console.log('🔍 MONITOR: Checking audit logs...');
        
        const { data, error } = await supabase
          .from('payment_audit_log')
          .select('*')
          .order('changed_at', { ascending: false })
          .limit(10);

        if (!error && data) {
          setAuditLogs(data);
          
          // Alert on new changes
          data.forEach(log => {
            if (new Date(log.changed_at).getTime() > Date.now() - 5000) {
              console.log(`🚨 RECENT CHANGE DETECTED: Payment ${log.payment_id} changed from "${log.old_status}" to "${log.new_status}" by ${log.changed_by}`);
            }
          });
        }
      } catch (error) {
        console.error('❌ MONITOR error:', error);
      }
    };

    // Check every 2 seconds
    intervalId = setInterval(checkAuditLogs, 2000);
    checkAuditLogs(); // Initial check

    return () => {
      clearInterval(intervalId);
    };
  }, [projectId, isMonitoring]);

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
      {auditLogs.length === 0 ? (
        <div className="text-green-300">No changes detected</div>
      ) : (
        auditLogs.map((log) => (
          <div key={log.id} className="mb-2 border-b border-gray-600 pb-2">
            <div className="text-yellow-300 text-xs">{new Date(log.changed_at).toLocaleString()}</div>
            <div className="text-red-300 text-xs">
              Payment {log.payment_id}: {log.old_status} → {log.new_status}
            </div>
            <div className="text-gray-300 text-xs">
              By: {log.changed_by} | Op: {log.operation}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default PaymentStatusMonitor;
