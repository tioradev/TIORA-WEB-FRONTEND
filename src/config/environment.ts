// Environment Configuration
export const ENV_CONFIG = {
  // Current environment - change this to switch between environments
  CURRENT_ENV: 'development' as 'development' | 'production',
  
  development: {
    API_BASE_URL: 'http://localhost:8090/api/v1',
    API_TIMEOUT: 10000,
    ENABLE_LOGGING: true,
  },
  
  production: {
    API_BASE_URL: 'https://your-production-domain.com/api/v1', // TODO: Update with actual production URL
    API_TIMEOUT: 30000,
    ENABLE_LOGGING: false,
  }
};

// Get current environment configuration
export const getCurrentConfig = () => {
  return ENV_CONFIG[ENV_CONFIG.CURRENT_ENV];
};

// Helper function to check if we're in development
export const isDevelopment = () => {
  return ENV_CONFIG.CURRENT_ENV === 'development';
};

// Helper function to check if we're in production
export const isProduction = () => {
  return ENV_CONFIG.CURRENT_ENV === 'production';
};

// Console logging helper that respects environment
export const envLog = {
  info: (...args: any[]) => {
    if (getCurrentConfig().ENABLE_LOGGING) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    if (getCurrentConfig().ENABLE_LOGGING) {
      console.error(...args);
    }
  },
  warn: (...args: any[]) => {
    if (getCurrentConfig().ENABLE_LOGGING) {
      console.warn(...args);
    }
  }
};
