const CACHE_PREFIX = 'sweethome_cache_'
const CACHE_EXPIRY = 30 * 60 * 1000

export const cacheService = {
  set: (key, data, expiryMs = CACHE_EXPIRY) => {
    const cacheData = {
      value: data,
      expiry: Date.now() + expiryMs
    }
    try {
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(cacheData))
    } catch (e) {
      console.warn('Falha ao armazenar no cache', e)
    }
  },

  get: (key) => {
    try {
      const cached = localStorage.getItem(CACHE_PREFIX + key)
      if (!cached) return null

      const { value, expiry } = JSON.parse(cached)
      if (Date.now() > expiry) {
        localStorage.removeItem(CACHE_PREFIX + key)
        return null
      }
      return value
    } catch (e) {
      return null
    }
  },

  remove: (key) => {
    localStorage.removeItem(CACHE_PREFIX + key)
  },

  clear: () => {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(CACHE_PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  }
}
