import { API_ENDPOINTS } from '../constants/firebaseCollections';
import { logger } from '../utils/logger';

export const authService = {
  login: async (username, password) => {
    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Login falhou');
      }

      const userData = {
        id: data.access_token.split('.')[1],
        username: data.username,
        email: data.email
      };

      return {
        access_token: data.access_token,
        user: userData
      };
    } catch (error) {
      logger.error('Auth login falhou', { error: error.message });
      throw error;
    }
  },

  register: async (username, email, password, confirmPassword) => {
    try {
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, confirm_password: confirmPassword }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Registro falhou');
      }

      return data;
    } catch (error) {
      logger.error('Auth register falhou', { error: error.message });
      throw error;
    }
  },

  getDashboard: async (token) => {
    try {
      const response = await fetch(API_ENDPOINTS.DASHBOARD, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Falha ao buscar dados do dashboard');
      }

      return await response.json();
    } catch (error) {
      logger.error('Falha ao buscar dados do dashboard', { error: error.message });
      throw error;
    }
  }
};
