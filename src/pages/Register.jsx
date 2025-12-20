import React, { useState } from 'react';
import { API_ENDPOINTS } from '../constants/firebaseCollections';
import { validators } from '../utils/validators';
import { logger } from '../utils/logger';
import { sanitizeInput } from '../utils/sanitizer';
import PasswordStrengthMeter from '../components/PasswordStrengthMeter';
import { useToast } from '../hooks/useToast';

const RegisterPage = ({ onRegister, onNavigate }) => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Usuário é obrigatório';
    } else if (!validators.isValidUsername(formData.username)) {
      newErrors.username = 'O usuário deve ter entre 3 e 50 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!validators.isValidEmail(formData.email)) {
      newErrors.email = 'Formato de email inválido';
    }


    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: sanitizeInput(formData.username),
          email: formData.email,
          password: formData.password, 
          confirmPassword: formData.confirmPassword
        }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.msg || 'Falha no registro';
        setErrors({ submit: errorMessage });
        logger.warn('Falha no registro', { status: response.status });
        return;
      }
      else {
        logger.info('Registro bem-sucedido');
        onRegister(data);
        toast.success('Registro bem-sucedido! Entre para logar.');
        onNavigate('login');
        return;
      }
      
    } catch (error) {
      setErrors({ submit: 'Erro de rede ou servidor indisponível' });
      logger.error('Erro no registro', { error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const renderErrorMessage = (field) => {
    if (errors[field]) {
      return <p className="text-red-500 text-sm mt-1">{errors[field]}</p>;
    }
    return null;
  };

  return (
    <div className="auth-container">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 m-4">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Criar Conta</h2>
        
        <form onSubmit={handleSubmit}>
          {errors.submit && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
              {errors.submit}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Usuário
            </label>
            <input
              id="username"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={isLoading}
              className={`shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 ${
                errors.username ? 'border-red-500 focus:ring-red-400' : 'focus:ring-pink-400'
              }`}
              placeholder="Usuariomuitolegal123"
            />
            {renderErrorMessage('username')}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              className={`shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 ${
                errors.email ? 'border-red-500 focus:ring-red-400' : 'focus:ring-pink-400'
              }`}
              placeholder="seu@email.com"
            />
            {renderErrorMessage('email')}
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Senha
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              className={`shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 ${
                errors.password ? 'border-red-500 focus:ring-red-400' : 'focus:ring-pink-400'
              }`}
              placeholder="Senhamuitodificil321"
            />
            {renderErrorMessage('password')}
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
              Confirmar Senha
            </label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
              className={`shadow-inner appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 ${
                errors.confirmPassword ? 'border-red-500 focus:ring-red-400' : 'focus:ring-pink-400'
              }`}
              placeholder="Senhamuitodificil321"
            />
            {renderErrorMessage('confirmPassword')}
            <PasswordStrengthMeter password={formData.password} />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            onClick={handleSubmit}
            className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300"
          >
            {isLoading ? 'Criando conta...' : 'Registrar'}
          </button>
        </form>

        <p className="text-center text-gray-600 mt-6">
          Já tem uma conta?{' '}
          <button
            type="button"
            onClick={() => onNavigate('login')}
            className="font-bold text-pink-500 hover:text-pink-700"
          >
            Entrar
          </button>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;