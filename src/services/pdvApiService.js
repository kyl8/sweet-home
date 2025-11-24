import { API_ENDPOINTS } from '../constants/firebaseCollections';
import { logger } from '../utils/logger';

export const pdvApiService = {
  finishSale: async (saleData, token) => {
    try {
      const response = await fetch(API_ENDPOINTS.SALES_FINISH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(saleData),
        credentials: 'include'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.msg || 'Falha ao finalizar venda');
      }

      const blob = await response.blob();
      return blob;
    } catch (error) {
      logger.error('PDV finishSale falhou', { error: error.message });
      throw error;
    }
  }
};
