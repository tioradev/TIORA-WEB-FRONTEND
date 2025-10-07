// Environment Configuration
export const ENV_CONFIG = {
  // Current environment - automatically determined or fallback to production
  CURRENT_ENV: (import.meta.env.VITE_ENVIRONMENT || 'production') as 'development' | 'production',
  
  development: {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090/api/v1',
    WS_BASE_URL: import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8090',
    API_TIMEOUT: 10000,
    ENABLE_LOGGING: true,
  },
  
  production: {
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
    WS_BASE_URL: import.meta.env.VITE_WS_BASE_URL || '/ws',
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

// Helper function to get full webhook URL for external services
export const getWebhookUrl = (path: string = '/payments/webhook') => {
  const config = getCurrentConfig();
  const isDev = isDevelopment();
  
  console.log('🔗 [WEBHOOK] Environment detection:', {
    currentEnv: ENV_CONFIG.CURRENT_ENV,
    isDevelopment: isDev,
    config: config,
    viteEnv: import.meta.env.VITE_ENVIRONMENT
  });
  
  if (isDev) {
    // In development, use the full URL
    const url = `${config.API_BASE_URL}${path}`;
    console.log('🔗 [WEBHOOK] Development URL:', url);
    return url;
  } else {
    // In production, always use the production domain
    // This ensures external services like Payable can reach our webhook
    const url = `https://salon.publicvm.com/api/v1${path}`;
    console.log('🔗 [WEBHOOK] Production URL:', url);
    return url;
  }
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
