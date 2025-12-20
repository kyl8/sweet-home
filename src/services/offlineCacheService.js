const CACHE_KEY_PREFIX = 'pdv_cache_';
const CACHE_EXPIRY_KEY = 'pdv_cache_expiry_';
const CACHE_DURATION = 30 * 60 * 1000;

export const offlineCacheService = {
  set: (key, data) => {
    try {
      const cacheData = {
        value: data,
        expiry: Date.now() + CACHE_DURATION
      };
      localStorage.setItem(CACHE_KEY_PREFIX + key, JSON.stringify(cacheData));
    } catch (e) {
      console.warn('Falha ao armazenar no cache', e);
    }
  },

  get: (key) => {
    try {
      const cached = localStorage.getItem(CACHE_KEY_PREFIX + key);
      if (!cached) return null;

      const { value, expiry } = JSON.parse(cached);
      if (Date.now() > expiry) {
        localStorage.removeItem(CACHE_KEY_PREFIX + key);
        return null;
      }
      return value;
    } catch (e) {
      return null;
    }
  },

  remove: (key) => {
    localStorage.removeItem(CACHE_KEY_PREFIX + key);
  },

  clear: () => {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(CACHE_KEY_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  },

  isExpired: (key) => {
    try {
      const cached = localStorage.getItem(CACHE_KEY_PREFIX + key);
      if (!cached) return true;

      const { expiry } = JSON.parse(cached);
      return Date.now() > expiry;
    } catch (e) {
      return true;
    }
  }
};
