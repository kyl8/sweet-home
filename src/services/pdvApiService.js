import { API_ENDPOINTS } from '../constants/firebaseCollections';
import { logger } from '../utils/logger';

export const pdvApiService = {
  finishSale: async (saleDocument, userData, customerName, paymentMethod) => {
    try {
      if (!saleDocument) {
        throw new Error('Sale document is required');
      }

      const token = sessionStorage.getItem('jwt_token');
      if (!token) {
        throw new Error('JWT token not found. User may not be authenticated.');
      }

      const payload = {
        payer: { nome: customerName || 'Cliente' },
        receiver: { nome: 'Sweet Home' },
        payment_type: paymentMethod,
        items: saleDocument.items,
        subtotal: saleDocument.subtotal,
        itemDiscountsTotal: saleDocument.itemDiscountsTotal,
        globalDiscountPercent: saleDocument.globalDiscountPercent,
        globalDiscountAmount: saleDocument.globalDiscountAmount,
        totalAmount: saleDocument.totalAmount,
        description: `Venda ${saleDocument.id}`
      };

      logger.info('Sending sale to API', { saleId: saleDocument.id, paymentMethod, hasToken: !!token });

      const response = await fetch(API_ENDPOINTS.SALES_FINISH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      logger.info('API Response status', { status: response.status, statusText: response.statusText });

      if (!response.ok) {
        let errorMessage = 'Falha ao processar venda no servidor';
        try {
          const errorData = await response.json();
          errorMessage = errorData.msg || errorMessage;
        } catch (e) {
          const textError = await response.text();
          logger.error('API returned non-JSON error', { text: textError.substring(0, 200) });
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `comprovante_${saleDocument.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      logger.info('Sale processed and receipt downloaded', { saleId: saleDocument.id });
      return { success: true };
    } catch (error) {
      logger.error('Error finishing sale', { error: error.message });
      throw error;
    }
  }
};
