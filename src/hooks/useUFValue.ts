
import { useState, useEffect } from 'react';

interface UFData {
  value: number;
  date: string;
  loading: boolean;
  error: string | null;
}

export const useUFValue = (): UFData => {
  const [ufData, setUfData] = useState<UFData>({
    value: 0,
    date: '',
    loading: true,
    error: null
  });

  useEffect(() => {
    const fetchUFValue = async () => {
      try {
        setUfData(prev => ({ ...prev, loading: true, error: null }));
        
        // Usar API del SII para obtener valor actual de la UF
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        
        const response = await fetch(`https://api.sbif.cl/api-sbifv3/recursos_api/uf/${year}/${month}?apikey=279759d7e4c8b5d4f1c28eb9c1fcfb75e4ddd0e7&formato=json`);
        
        if (!response.ok) {
          // Fallback a una API alternativa si la del SII no funciona
          const fallbackResponse = await fetch(`https://mindicador.cl/api/uf`);
          if (!fallbackResponse.ok) {
            throw new Error('No se pudo obtener el valor de la UF');
          }
          
          const fallbackData = await fallbackResponse.json();
          setUfData({
            value: fallbackData.valor,
            date: fallbackData.fecha,
            loading: false,
            error: null
          });
          return;
        }
        
        const data = await response.json();
        // Obtener el valor más reciente
        const latestUF = data.UFs[data.UFs.length - 1];
        
        setUfData({
          value: parseFloat(latestUF.Valor.replace(',', '.')),
          date: latestUF.Fecha,
          loading: false,
          error: null
        });
        
      } catch (error) {
        console.error('Error fetching UF value:', error);
        // Usar valor de respaldo actual (aproximado)
        setUfData({
          value: 37500, // Valor aproximado actual de la UF
          date: new Date().toISOString().split('T')[0],
          loading: false,
          error: 'No se pudo obtener el valor actualizado de la UF. Usando valor aproximado.'
        });
      }
    };

    fetchUFValue();
  }, []);

  return ufData;
};
