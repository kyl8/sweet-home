import { API_ENDPOINTS } from '../constants/firebaseCollections';
import { logger } from '../utils/logger';
import { sanitizeInput, sanitizeEmail } from '../utils/sanitizer';

const JWT_COOKIE_NAME = 'auth_token';
const USER_DATA_KEY = 'user_data';

export const authService = {
  login: async (username, password) => {
    if (!username || !password) {
      throw new Error('Username e senha são obrigatórios');
    }

    if (typeof username !== 'string' || typeof password !== 'string') {
      throw new Error('Dados de login inválidos');
    }

    try {
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: sanitizeInput(username, { maxLength: 50 }),
          password: password.substring(0, 256) 
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        logger.warn('Login falhou', { status: response.status });
        throw new Error(data.msg || 'Login falhou');
      }

      if (data.user) {
        sessionStorage.setItem(USER_DATA_KEY, JSON.stringify({
          id: data.user.id,
          username: data.user.username,
          email: data.user.email
        }));
      }

      logger.info('Login bem-sucedido para usuario', { userId: data.user?.id });
      return data;
    } catch (error) {
      logger.error('Erro no login', { error: error.message });
      throw error;
    }
  },

  register: async (username, email, password, confirmPassword) => {
    if (!username || !email || !password || !confirmPassword) {
      throw new Error('Todos os campos são obrigatórios');
    }

    if (password !== confirmPassword) {
      throw new Error('Senhas não coincidem');
    }

    try {
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: sanitizeInput(username, { maxLength: 50 }),
          email: email.substring(0, 256), // Apenas limitar tamanho
          password: password.substring(0, 256), 
          confirm_password: confirmPassword.substring(0, 256) 
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || 'Registro falhou');
      }

      logger.info('Registro bem-sucedido');
      return data;
    } catch (error) {
      logger.error('Erro no registro', { error: error.message });
      throw error;
    }
  },

  getDashboard: async () => {
    try {
      const response = await fetch(API_ENDPOINTS.DASHBOARD, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (!response.ok) {
        if (response.status === 401) {
          authService.logout();
          throw new Error('Sessão expirada');
        }
        throw new Error('Falha ao buscar dados');
      }

      return await response.json();
    } catch (error) {
      logger.error('Erro ao buscar dashboard', { error: error.message });
      throw error;
    }
  },

  logout: async () => {
    try {
      await fetch(`${API_ENDPOINTS.BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      logger.warn('Erro ao logout do servidor', { error: error.message });
    } finally {
      sessionStorage.removeItem(USER_DATA_KEY);
      logger.info('Logout realizado');
    }
  },

  getStoredUser: () => {
    const userData = sessionStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  },

  isAuthenticated: () => {
    return !!sessionStorage.getItem(USER_DATA_KEY);
  }
};
