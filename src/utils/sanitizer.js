import { logger } from './logger';

export const sanitizeHtml = (dirty) => {
  if (!dirty || typeof dirty !== 'string') return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return dirty.replace(/[&<>"']/g, (char) => map[char]);
};

export const sanitizeInput = (input, options = {}) => {
  if (typeof input !== 'string') {
    logger.warn('sanitizeInput recebeu non-string', { type: typeof input });
    return '';
  }

  const {
    maxLength = 500,
    allowedSpecialChars = '-_.,áéíóúàâãôõç',
    removeHtml = true
  } = options;

  let sanitized = input.trim().substring(0, maxLength);

  if (removeHtml) {
    sanitized = sanitized
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '')
      .replace(/&gt;/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }

  const regex = new RegExp(`[^a-zA-Z0-9\\s${allowedSpecialChars}]`, 'g');
  sanitized = sanitized.replace(regex, '');

  return sanitized;
};

export const sanitizeEmail = (email) => {
  if (typeof email !== 'string') return '';
  
  const sanitized = email
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9@._-]/g, '')
    .substring(0, 254);
  
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sanitized)) {
    return '';
  }
  
  return sanitized;
};

export const sanitizeFilename = (filename) => {
  if (typeof filename !== 'string') return 'file';
  
  const sanitized = filename
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255)
    .replace(/\.{2,}/g, '.')
    .replace(/^\.+/, '');
  
  return sanitized || 'file';
};

export const sanitizePath = (path) => {
  if (typeof path !== 'string') return '';
  
  return path
    .replace(/\.\./g, '')
    .replace(/[\\]/g, '/')
    .replace(/^\/+/, '')
    .substring(0, 1000);
};

export const sanitizeUrl = (url) => {
  if (typeof url !== 'string') return null;

  try {
    const urlObj = new URL(url);
    
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }
    
    return urlObj.toString();
  } catch (e) {
    logger.warn('Invalid URL provided', { error: e.message });
    return null;
  }
};
