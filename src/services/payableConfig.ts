export interface PayableConfig {
  merchantKey: string;
  merchantToken: string;
  businessKey: string;
  businessToken: string;
  testMode: boolean;
}

export const payableConfig: PayableConfig = {
  merchantKey: import.meta.env.VITE_PAYABLE_MERCHANT_KEY || "42F77B3164786C34",
  merchantToken: import.meta.env.VITE_PAYABLE_MERCHANT_TOKEN || "1106D897CA1BB439EB3359E2DAB59392",
  businessKey: import.meta.env.VITE_PAYABLE_BUSINESS_KEY || "YOUR_BUSINESS_KEY",
  businessToken: import.meta.env.VITE_PAYABLE_BUSINESS_TOKEN || "YOUR_BUSINESS_TOKEN",
  testMode: true // Set to test mode
};

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
export const validatePayableConfig = (): { isValid: boolean; missingFields: string[] } => {
  const missingFields: string[] = [];
  
  if (!payableConfig.merchantKey || payableConfig.merchantKey === "YOUR_MERCHANT_KEY") {
    missingFields.push('VITE_PAYABLE_MERCHANT_KEY');
  }
  
  if (!payableConfig.merchantToken || payableConfig.merchantToken === "YOUR_MERCHANT_TOKEN") {
    missingFields.push('VITE_PAYABLE_MERCHANT_TOKEN');
  }
  
  // Business credentials are optional for basic merchant functionality
  if (!payableConfig.businessKey || payableConfig.businessKey === "YOUR_BUSINESS_KEY") {
    missingFields.push('VITE_PAYABLE_BUSINESS_KEY');
  }
  
  if (!payableConfig.businessToken || payableConfig.businessToken === "YOUR_BUSINESS_TOKEN") {
    missingFields.push('VITE_PAYABLE_BUSINESS_TOKEN');
  }
  
  // For basic merchant operations, only merchant credentials are required
  const merchantConfigValid = payableConfig.merchantKey !== "YOUR_MERCHANT_KEY" && 
                              payableConfig.merchantToken !== "YOUR_MERCHANT_TOKEN" &&
                              payableConfig.merchantKey.length > 0 && 
                              payableConfig.merchantToken.length > 0;
  
  return {
    isValid: merchantConfigValid, // Only require merchant credentials for basic functionality
    missingFields: merchantConfigValid ? [] : missingFields.filter(field => field.includes('MERCHANT'))
  };
};
