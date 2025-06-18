
import { useState, useEffect } from 'react';
import { PaymentState } from '@/hooks/useProjectDetail';

export const usePaymentStateManager = (paymentStates: PaymentState[]) => {
  const [managedStates, setManagedStates] = useState<PaymentState[]>([]);

  useEffect(() => {
    if (!paymentStates || paymentStates.length === 0) {
      setManagedStates([]);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Sort payment states by expiry date
    const sortedStates = [...paymentStates].sort((a, b) => 
      new Date(a.ExpiryDate).getTime() - new Date(b.ExpiryDate).getTime()
    );

    // Find the closest date to today (future or past)
    let closestState = sortedStates[0];
    let minDifference = Math.abs(new Date(sortedStates[0].ExpiryDate).getTime() - today.getTime());

    sortedStates.forEach(state => {
      const stateDate = new Date(state.ExpiryDate);
      const difference = Math.abs(stateDate.getTime() - today.getTime());
      
      if (difference < minDifference) {
        minDifference = difference;
        closestState = state;
      }
    });

    // Ensure the closest state is always pending
    const updatedStates = sortedStates.map(state => ({
      ...state,
      Status: state.id === closestState.id ? 'Pendiente' : state.Status,
      Completion: state.id === closestState.id ? false : state.Completion
    }));

    setManagedStates(updatedStates);
  }, [paymentStates]);

  return managedStates;
};
