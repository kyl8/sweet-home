export const FIRESTORE_COLLECTIONS = {
  SWEETS: 'sweets',
  INGREDIENTS: 'ingredients',
  RECIPES: 'recipes',
  KITCHENWARE: 'kitchenware',
  SALES: 'sales',
  TEST: 'test'
};

export const API_ENDPOINTS = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  LOGIN: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/login`,
  REGISTER: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/register`,
  DASHBOARD: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/dashboard`,
  SALES_FINISH: `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/sales/finish`
};
