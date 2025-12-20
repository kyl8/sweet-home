import { logger } from '../utils/logger';
import { costCalculationService } from './costCalculationService';
import { firestoreService } from './firestoreService';
import { FIRESTORE_COLLECTIONS } from '../constants/firebaseCollections';

export const salesService = {
  createSaleDocument: (cart, sweets, recipes, ingredients, userData, saleOptions) => {
    try {
      if (!Array.isArray(cart) || cart.length === 0) {
        throw new Error('Carrinho vazio');
      }

      const items = cart.map(item => {
        const sweet = sweets.find(s => s.id === item.id);
        const cost = costCalculationService.calculateSweetCost(item.id, recipes, ingredients);
        
        return {
          sweetId: item.id,
          sweetName: item.name,
          quantity: item.quantity,
          priceAtSale: item.price,
          subtotal: item.price * item.quantity,
          itemDiscount: item.itemDiscount || 0,
          discountedAmount: (item.price * item.quantity) * ((item.itemDiscount || 0) / 100),
          cost: cost,
          costTotal: cost * item.quantity
        };
      });

      const itemDiscountsTotal = items.reduce((sum, item) => sum + item.discountedAmount, 0);
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      const globalDiscountPercent = saleOptions?.discountPercent || 0;
      const globalDiscountAmount = subtotal * (globalDiscountPercent / 100);
      const totalAmount = saleOptions?.orderTotal || (subtotal - itemDiscountsTotal - globalDiscountAmount);

      const totalCost = items.reduce((sum, item) => sum + item.costTotal, 0);
      const totalProfit = totalAmount - totalCost;

      const saleDocument = {
        id: `sale_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        timestamp: Date.now(),
        items: items,
        itemDiscountsTotal: itemDiscountsTotal,
        subtotal: subtotal,
        globalDiscountPercent: globalDiscountPercent,
        globalDiscountAmount: globalDiscountAmount,
        totalAmount: totalAmount,
        totalCost: totalCost,
        totalProfit: totalProfit,
        operatorName: userData?.username || 'Operador',
        operatorId: userData?.id || 'anonymous',
        status: 'pending'
      };

      logger.info('Sale document created', { saleId: saleDocument.id, itemsCount: items.length });
      return saleDocument;
    } catch (error) {
      logger.error('Error creating sale document', { error: error.message });
      throw error;
    }
  },

  validateSale: (saleDocument, sweets) => {
    try {
      if (!saleDocument || !saleDocument.items || saleDocument.items.length === 0) {
        return { isValid: false, error: 'Documento de venda invalido' };
      }

      for (const item of saleDocument.items) {
        const sweet = sweets.find(s => s.id === item.sweetId);
        if (!sweet) {
          return { isValid: false, error: `Doce ${item.sweetId} nao encontrado` };
        }
        if (sweet.stock < item.quantity) {
          return { isValid: false, error: `Estoque insuficiente para ${sweet.name}` };
        }
      }

      if (saleDocument.totalAmount <= 0) {
        return { isValid: false, error: 'Total da venda deve ser maior que zero' };
      }

      return { isValid: true };
    } catch (error) {
      logger.error('Error validating sale', { error: error.message });
      return { isValid: false, error: error.message };
    }
  },

  finalizeSale: async (saleDocument, cart, sweets, userData) => {
    try {
      const updatePromises = [];

      for (const item of cart) {
        const sweet = sweets.find(s => s.id === item.id);
        if (sweet) {
          const newStock = Math.max(0, sweet.stock - item.quantity);
          updatePromises.push(
            firestoreService.updateDocument(
              FIRESTORE_COLLECTIONS.SWEETS,
              item.id,
              { stock: newStock },
              userData?.id || 'anonymous'
            )
          );
        }
      }

      const saleData = {
        ...saleDocument,
        status: 'completed'
      };

      updatePromises.push(
        firestoreService.addDocument(
          FIRESTORE_COLLECTIONS.SALES,
          saleData,
          userData?.id || 'anonymous'
        )
      );

      const results = await Promise.all(updatePromises);
      logger.info('Sale finalized successfully', { saleId: saleDocument.id });
      
      return { success: true, saleId: saleDocument.id };
    } catch (error) {
      logger.error('Error finalizing sale', { error: error.message });
      throw error;
    }
  }
};
