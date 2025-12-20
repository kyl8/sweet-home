const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const API_ENDPOINTS = {
  BASE_URL: API_BASE_URL,
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  DASHBOARD: `${API_BASE_URL}/api/auth/dashboard`,
  LOGOUT: `${API_BASE_URL}/api/auth/logout`,
  REFRESH: `${API_BASE_URL}/api/auth/refresh`,
  SALES_FINISH: `${API_BASE_URL}/api/sales/finish`
};

export const FIRESTORE_COLLECTIONS = {
  SWEETS: 'sweets',
  INGREDIENTS: 'ingredients',
  KITCHENWARE: 'kitchenware',
  SALES: 'sales',
  RECIPES: 'recipes'
};
