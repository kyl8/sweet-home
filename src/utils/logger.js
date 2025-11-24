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

export const logger = {
  debug: (message, data) => {
    if (shouldLog(LOG_LEVELS.DEBUG)) {
      console.debug(formatMessage(LOG_LEVELS.DEBUG, message, data));
    }
  },
  
  info: (message, data) => {
    if (shouldLog(LOG_LEVELS.INFO)) {
      console.info(formatMessage(LOG_LEVELS.INFO, message, data));
    }
  },
  
  warn: (message, data) => {
    if (shouldLog(LOG_LEVELS.WARN)) {
      console.warn(formatMessage(LOG_LEVELS.WARN, message, data));
    }
  },
  
  error: (message, data) => {
    if (shouldLog(LOG_LEVELS.ERROR)) {
      console.error(formatMessage(LOG_LEVELS.ERROR, message, data));
    }
  }
};
