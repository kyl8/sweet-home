export const isDevelopment = import.meta.env.MODE === 'development';

export const getAuthConfig = () => {
  return {
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    jwtExpiryMinutes: parseInt(import.meta.env.VITE_JWT_EXPIRY_MINUTES || '60'),
  };
};
