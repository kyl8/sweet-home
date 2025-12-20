const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const LOG_LEVEL_NAMES = {
  0: 'DEBUG',
  1: 'INFO',
  2: 'WARN',
  3: 'ERROR'
};

const getCurrentLogLevel = () => {
  const envLevel = import.meta.env.VITE_LOG_LEVEL || 'info';
  return LOG_LEVELS[envLevel.toUpperCase()] || LOG_LEVELS.INFO;
};

const formatMessage = (level, message, data) => {
  const timestamp = new Date().toISOString();
  return {
    timestamp,
    level: LOG_LEVEL_NAMES[level],
    message,
    ...(data && { data })
  };
};

const shouldLog = (level) => level >= getCurrentLogLevel();

const isDevelopment = import.meta.env.MODE === 'development';

const sanitizeForLogging = (message, data = {}) => {
  const sanitized = {};
  
  const sensitiveKeys = [
    'password', 'token', 'access_token', 'jwt', 'secret',
    'apiKey', 'privateKey', 'publicKey', 'credential',
    'ssn', 'creditCard', 'cvv', 'authorization'
  ];

  for (const [key, value] of Object.entries(data)) {
    const keyLower = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sensitive => keyLower.includes(sensitive));
    
    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'string' && value.length > 200) {
      sanitized[key] = value.substring(0, 100) + '...';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForLogging('', value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

export const logger = {
  info: (message, data = {}) => {
    const sanitized = sanitizeForLogging(message, data);
    console.log(`[INFO] ${message}`, sanitized);
  },

  warn: (message, data = {}) => {
    const sanitized = sanitizeForLogging(message, data);
    console.warn(`[WARN] ${message}`, sanitized);
  },

  error: (message, data = {}) => {
    const sanitized = sanitizeForLogging(message, data);
    
    if (isDevelopment) {
      console.error(`[ERROR] ${message}`, sanitized);
    } else {
      console.error(`[ERROR] ${message}`);
    }
  },

  debug: (message, data = {}) => {
    if (!isDevelopment) return;
    
    const sanitized = sanitizeForLogging(message, data);
    console.debug(`[DEBUG] ${message}`, sanitized);
  }
};
