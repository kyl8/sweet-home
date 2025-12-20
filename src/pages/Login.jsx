import React, { useState } from 'react';
import { API_ENDPOINTS } from '../constants/firebaseCollections';
import { isDevelopment } from '../constants/authConfig';
import { validators } from '../utils/validators';
import { logger } from '../utils/logger';
import { sanitizeInput } from '../utils/sanitizer';
import { useToast } from '../hooks/useToast';
import { authService } from '../services/authService';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';

const LoginPage = ({ onLogin, onNavigate }) => {
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleAdminLogin = () => {
    logger.info('Login de administrador detectado');
    const adminData = {
      access_token: 'admin_dev_token_' + Date.now(),
      user: {
        id: 'admin_user',
        username: 'admin',
        email: 'admin@dev.local'
      }
    };
    sessionStorage.setItem('jwt_token', adminData.access_token);
    sessionStorage.setItem('userData', JSON.stringify(adminData.user));
    toast.success('Bem-vindo!', 'Login de administrador realizado');
    onLogin(adminData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const sanitizedUsername = sanitizeInput(username, { maxLength: 50 });

    if (isDevelopment && sanitizedUsername === 'admin' && password === 'admin123') {
      handleAdminLogin();
      return;
    }

    setIsLoading(true);
    
    try {
      const data = await authService.login(sanitizedUsername, password);

      sessionStorage.setItem('jwt_token', data.access_token);
      sessionStorage.setItem('userData', JSON.stringify(data.user));
      
      logger.info('Login bem-sucedido');
      toast.success('Bem-vindo!', 'Login realizado com sucesso');
      onLogin(data);

    } catch (err) {
      toast.error('Erro no login', err.message || 'Falha ao conectar');
      logger.error('Erro de login', { error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!username.trim()) {
      errors.username = 'Usuario e obrigatorio';
    } else if (!validators.isValidUsername(username)) {
      errors.username = 'O usuario deve ter entre 3 e 50 caracteres';
    }
    
    if (!password) {
      errors.password = 'Senha e obrigatoria';
    } else if (username !== 'admin' && !validators.isValidPassword(password)) {
      errors.password = 'A senha deve ter: 8+ chars, maiuscula, minuscula, numero e caractere especial';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return (
    <div className="auth-container">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 m-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">Bem-vindo</h2>
        <p className="text-center text-gray-500 mb-8">Faca login para continuar</p>
        
        {isDevelopment && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6 text-sm">
            <p className="font-semibold">Modo Desenvolvedor</p>
            <p>Use admin / admin123</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Nome de usuario
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (validationErrors.username) {
                  setValidationErrors(prev => { const { username, ...rest } = prev; return rest; });
                }
              }}
              disabled={isLoading}
              className={`shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 ${
                validationErrors.username ? 'border-red-500 focus:ring-red-400' : 'focus:ring-pink-400'
              }`}
              placeholder="Usuário"
              autoComplete="username"
              maxLength="50"
            />
            {validationErrors.username && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.username}</p>
            )}
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (validationErrors.password) {
                  setValidationErrors(prev => { const { password, ...rest } = prev; return rest; });
                }
              }}
              disabled={isLoading}
              className={`shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 ${
                validationErrors.password ? 'border-red-500 focus:ring-red-400' : 'focus:ring-pink-400'
              }`}
              placeholder="Senha"
              autoComplete="current-password"
              maxLength="256"
            />
            {validationErrors.password && (
              <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Nao tem conta? {' '}
          <button
            type="button"
            onClick={() => onNavigate('register')}
            className="font-bold text-pink-500 hover:text-pink-700"
          >
            Registre-se
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;