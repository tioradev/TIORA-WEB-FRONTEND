
export interface PayableConfig {
  merchantKey: string;
  merchantToken: string;
  merchantId?: string;
  businessKey: string;
  businessToken: string;
  testMode: boolean;
  baseUrl?: string;
  defaultCurrency?: string;
}

// Fallback config if API fails
const fallbackConfig: PayableConfig = {
  merchantKey: "42F77B3164786C34",
  merchantToken: "1106D897CA1BB439EB3359E2DAB59392",
  merchantId: undefined,
  businessKey: "29F534A06D907BE7",
  businessToken: "D05E2673036A57FC688100673064DA15",
  testMode: true,
  baseUrl: "https://sandboxipgpayment.payable.lk",
  defaultCurrency: "LKR"
};

let configCache: PayableConfig | null = null;
let cacheExpiry = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Export cached config for webhook validation
export let cachedConfig: PayableConfig | null = null;

export const getPayableConfig = async (): Promise<PayableConfig> => {
  // Use cached config if valid
  if (configCache && Date.now() < cacheExpiry) {
    return configCache;
  }
  try {
    const token = localStorage.getItem('authToken');
    if (!token) throw new Error('No auth token found');
    
    // Use environment configuration for API URL
    const { getCurrentConfig } = await import('../config/environment');
    const config = getCurrentConfig();
    // Remove /api/v1 from base URL and add /api/payments/config
    const baseUrl = config.API_BASE_URL.replace('/api/v1', '');
    const apiUrl = `${baseUrl}/api/payments/config`;
    
    console.log('🔧 [PAYABLE] Fetching config from:', apiUrl);
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'Authorization': `Bearer ${token}`
      }
    });
    if (!response.ok) throw new Error(`Failed to fetch payment config: ${response.status}`);
    const apiConfig = await response.json();
    console.log('✅ [PAYABLE] Config received:', apiConfig);
    // Map API response to PayableConfig
    configCache = {
      merchantKey: apiConfig.merchantKey,
      merchantToken: apiConfig.merchantToken,
      merchantId: apiConfig.merchantKey, // fallback
      businessKey: apiConfig.businessKey,
      businessToken: apiConfig.businessToken,
      testMode: apiConfig.testMode,
      baseUrl: apiConfig.baseUrl,
      defaultCurrency: apiConfig.defaultCurrency
    };
    console.log('🔧 [PAYABLE] Mapped config - baseUrl:', configCache.baseUrl, 'testMode:', configCache.testMode);
    cacheExpiry = Date.now() + CACHE_DURATION;
    cachedConfig = configCache; // Update cached config for webhook validation
    return configCache;
  } catch (error) {
    console.warn('⚠️ [PAYABLE] Failed to load config from API, using fallback:', error);
    cachedConfig = fallbackConfig; // Update cached config even for fallback
    return fallbackConfig;
  }
};

// Legacy export for backward compatibility
export const payableConfig: PayableConfig = fallbackConfig;

export const payableUrls = {
  // Payment gateway URLs (used by payable-ipg-js SDK)
  gateway: {
    sandbox: "https://sandboxipgpayment.payable.lk/ipg/sandbox",
    live: "https://ipgpayment.payable.lk"
  },
  // API base URLs (for direct API calls like saved cards)
  api: {
    sandbox: "https://sandboxipgpayment.payable.lk",
    live: "https://ipgpayment.payable.lk"
  }
};

// Validation function to ensure all required config is present
export const validatePayableConfig = async (): Promise<{ isValid: boolean; missingFields: string[]; config: PayableConfig }> => {
  const config = await getPayableConfig();
  const missingFields: string[] = [];
  
  if (!config.merchantKey || config.merchantKey === "YOUR_MERCHANT_KEY") {
    missingFields.push('merchantKey');
  }
  
  if (!config.merchantToken || config.merchantToken === "YOUR_MERCHANT_TOKEN") {
    missingFields.push('merchantToken');
  }
  
  // Business credentials are required for tokenization
  if (!config.businessKey || config.businessKey === "YOUR_BUSINESS_KEY") {
    missingFields.push('businessKey');
  }
  
  if (!config.businessToken || config.businessToken === "YOUR_BUSINESS_TOKEN") {
    missingFields.push('businessToken');
  }
  
  // All credentials are required for full functionality
  const isValid = config.merchantKey !== "YOUR_MERCHANT_KEY" && 
                  config.merchantToken !== "YOUR_MERCHANT_TOKEN" &&
                  config.businessKey !== "YOUR_BUSINESS_KEY" &&
                  config.businessToken !== "YOUR_BUSINESS_TOKEN" &&
                  config.merchantKey.length > 0 && 
                  config.merchantToken.length > 0 &&
                  config.businessKey.length > 0 &&
                  config.businessToken.length > 0;
  
  return {
    isValid,
    missingFields,
    config
  };
};
