import { firestoreService } from './firestoreService';
import { FIRESTORE_COLLECTIONS } from '../constants/firebaseCollections';
import { logger } from '../utils/logger';

export const salesService = {
  validateSaleItem: (item) => {
    if (!item.sweetId || !item.quantity || !item.priceAtSale) {
      return {
        isValid: false,
        error: 'Item de venda incompleto'
      };
    }

    if (item.quantity <= 0) {
      return {
        isValid: false,
        error: 'Quantidade deve ser maior que zero'
      };
    }

    if (item.priceAtSale < 0) {
      return {
        isValid: false,
        error: 'Preço não pode ser negativo'
      };
    }

    return { isValid: true };
  },

  validateSale: (sale, sweets) => {
    if (!sale.items || sale.items.length === 0) {
      return {
        isValid: false,
        error: 'Venda sem itens'
      };
    }

    for (const item of sale.items) {
      const validation = salesService.validateSaleItem(item);
      if (!validation.isValid) {
        return validation;
      }

      const sweet = sweets.find(s => s.id === item.sweetId);
      if (!sweet) {
        return {
          isValid: false,
          error: `Produto ${item.sweetId} não encontrado`
        };
      }

      if (sweet.stock < item.quantity) {
        return {
          isValid: false,
          error: `Estoque insuficiente de "${sweet.name}". Disponível: ${sweet.stock}, Solicitado: ${item.quantity}`
        };
      }
    }

    if (!sale.totalAmount || sale.totalAmount < 0) {
      return {
        isValid: false,
        error: 'Total de venda inválido'
      };
    }

    if (!sale.operatorId) {
      return {
        isValid: false,
        error: 'Operador não identificado'
      };
    }

    return { isValid: true };
  },

  calculateItemCost: (sweetId, recipes, ingredients) => {
    const recipe = recipes.find(r => r.id === sweetId);
    if (!recipe) return 0;

    return recipe.ingredients.reduce((totalCost, recipeIngredient) => {
      const ingredient = ingredients.find(i => i.id === recipeIngredient.ingredientId);
      if (!ingredient) return totalCost;

      const itemCost = recipeIngredient.quantityInBaseUnit * (ingredient.costPerBaseUnit || 0);
      return totalCost + itemCost;
    }, 0);
  },

  createSaleDocument: (cartItems, sweets, recipes, ingredients, userData) => {
    const now = new Date();
    const items = cartItems.map(item => {
      const sweet = sweets.find(s => s.id === item.id);
      const costAtSale = salesService.calculateItemCost(item.id, recipes, ingredients);

      return {
        sweetId: item.id,
        sweetName: sweet.name,
        quantity: item.quantity,
        priceAtSale: item.price,
        costAtSale,
        subtotal: item.price * item.quantity
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
    const totalCost = items.reduce((sum, item) => sum + (item.costAtSale * item.quantity), 0);
    const totalProfit = totalAmount - totalCost;

    return {
      date: now.toISOString(),
      timestamp: now.getTime(),
      items,
      totalAmount,
      totalCost,
      totalProfit,
      operatorId: userData.id,
      operatorName: userData.username,
      status: 'completed'
    };
  },

  finalizeSale: async (saleDocument, cartItems, sweets, userData) => {
    try {
      logger.info('Iniciando finalização de venda', { itemCount: cartItems.length });

      const saleId = `sale_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      await firestoreService.addDocument(
        FIRESTORE_COLLECTIONS.SALES,
        saleDocument,
        userData.id
      );

      logger.info('Venda salva no Firestore', { saleId });

      for (const item of cartItems) {
        const sweet = sweets.find(s => s.id === item.id);
        if (!sweet) continue;

        const newStock = sweet.stock - item.quantity;
        
        await firestoreService.updateDocument(
          FIRESTORE_COLLECTIONS.SWEETS,
          item.id,
          { stock: Math.max(0, newStock) },
          userData.id
        );

        logger.info(`Estoque atualizado: ${sweet.name}`, {
          anteriormente: sweet.stock,
          agora: newStock,
          quantidade_vendida: item.quantity
        });
      }

      logger.info('Venda finalizada com sucesso', { saleId });
      return { success: true, saleId };

    } catch (error) {
      logger.error('Erro ao finalizar venda', { error: error.message });
      throw new Error(`Falha ao processar venda: ${error.message}`);
    }
  }
};
