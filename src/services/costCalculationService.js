import { logger } from '../utils/logger';

export const costCalculationService = {
  calculateSweetCost: (sweetOrSweetId, recipes, ingredients) => {
    try {
      const sweetId = typeof sweetOrSweetId === 'object' && sweetOrSweetId !== null
        ? sweetOrSweetId.id
        : sweetOrSweetId;

      const recipe = recipes.find(r => r.id === sweetId);

      if (!recipe) {
        logger.warn(`Receita não encontrada para o doce ID ${sweetId}`);
        return 0;
      }

      const totalCost = recipe.ingredients.reduce((currentTotal, recipeIngredient) => {
        const ingredientData = ingredients.find(i => String(i.id) === String(recipeIngredient.ingredientId));

        if (!ingredientData || typeof ingredientData.costPerBaseUnit !== 'number') {
          logger.warn(`Dados de custo não encontrados para o ingrediente ID ${recipeIngredient.ingredientId}`);
          return currentTotal;
        }

        const costOfThisIngredient = recipeIngredient.quantityInBaseUnit * ingredientData.costPerBaseUnit;
        return currentTotal + costOfThisIngredient;
      }, 0);

      return Math.round(totalCost * 10000) / 10000;
    } catch (error) {
      logger.error('Erro ao calcular custo do doce', { error: error.message });
      return 0;
    }
  },

  calculateProfitMargin: (price, cost) => {
    if (price <= 0) return 0;
    return ((price - cost) / price) * 100;
  },

  calculateProfit: (price, cost) => {
    return Math.max(0, price - cost);
  }
};
