import { logger } from './logger';

export const validators = {
  isValidEmail: (email) => {
    if (typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email) && email.length <= 254;
    
    if (!isValid) {
      logger.warn('Email invalido', { email: email.substring(0, 20) });
    }
    
    return isValid;
  },

  isValidUsername: (username) => {
    if (typeof username !== 'string') return false;
    const minLen = 3, maxLen = 50;
    const regex = /^[a-zA-Z0-9_-]{3,50}$/;
    
    const isValid = username.length >= minLen && 
                    username.length <= maxLen && 
                    regex.test(username) &&
                    !/^\d/.test(username);
    
    if (!isValid) {
      logger.warn('Username invalido');
    }
    
    return isValid;
  },

  isValidPassword: (password) => {
    if (typeof password !== 'string') return false;
    
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[@$!%*?&#^()_+=\-[\]{};:'",.<>?/|\\`~]/.test(password);
    
    const isValid = password.length >= minLength && 
                    hasUppercase && 
                    hasLowercase && 
                    hasNumber && 
                    hasSpecial;
    
    if (!isValid) {
      logger.warn('Senha nao atende aos criterios de seguranca');
    }
    
    return isValid;
  },

  isValidPrice: (price) => {
    if (typeof price !== 'number' && typeof price !== 'string') return false;
    
    const num = parseFloat(price);
    const isValid = !isNaN(num) && num > 0 && num < 1000000;
    
    if (!isValid) {
      logger.warn('Preco invalido', { price });
    }
    
    return isValid;
  },

  isValidNumber: (num) => {
    if (typeof num !== 'number' && typeof num !== 'string') return false;
    
    const parsed = parseFloat(num);
    const isValid = !isNaN(parsed) && parsed >= 0;
    
    if (!isValid) {
      logger.warn('Numero invalido', { num });
    }
    
    return isValid;
  },

  isValidDate: (dateString) => {
    if (typeof dateString !== 'string') return false;
    
    const date = new Date(dateString);
    const isValid = !isNaN(date.getTime()) && date > new Date('2000-01-01');
    
    if (!isValid) {
      logger.warn('Data invalida', { dateString });
    }
    
    return isValid;
  },

  isValidSweetName: (name) => {
    if (typeof name !== 'string') return false;
    
    const isValid = name.length >= 2 && name.length <= 100 && !/[<>"/\\]/.test(name);
    
    if (!isValid) {
      logger.warn('Nome de doce invalido');
    }
    
    return isValid;
  },

  isValidStock: (stock) => {
    if (typeof stock !== 'number' && typeof stock !== 'string') return false;
    
    const num = parseInt(stock, 10);
    const isValid = !isNaN(num) && num >= 0 && num <= 999999;
    
    if (!isValid) {
      logger.warn('Estoque invalido', { stock });
    }
    
    return isValid;
  },

  isValidPercentage: (percent) => {
    if (typeof percent !== 'number' && typeof percent !== 'string') return false;
    
    const num = parseFloat(percent);
    const isValid = !isNaN(num) && num >= 0 && num <= 100;
    
    if (!isValid) {
      logger.warn('Percentual invalido', { percent });
    }
    
    return isValid;
  }
};
