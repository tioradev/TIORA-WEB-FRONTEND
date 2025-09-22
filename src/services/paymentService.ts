import CryptoJS from 'crypto-js';
import { payablePayment } from 'payable-ipg-js';
import { payableConfig, validatePayableConfig } from './payableConfig';
import { webhookHandler } from './webhookHandler';
import { apiService } from './api';
import { getCurrentConfig } from '../config/environment';

export interface PaymentRequest {
  amount: string;
  currencyCode: string; // Added missing currency code
  invoiceId: string;
  orderDescription: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerMobilePhone: string;
  customerRefNo?: string;
  paymentType?: '1' | '2' | '3'; // 1=ONE_TIME, 2=RECURRING, 3=TOKENIZE
  isSaveCard?: '0' | '1';
  doFirstPayment?: '0' | '1';
  
  // Required billing fields
  billingAddressStreet: string;
  billingAddressCity: string;
  billingAddressCountry: string;
  
  // Optional billing fields
  customerPhone?: string;
  billingCompanyName?: string;
  billingAddressStreet2?: string;
  billingAddressPostcodeZip?: string;
  billingAddressStateProvince?: string;
  
  // Optional shipping fields
  shippingContactFirstName?: string;
  shippingContactLastName?: string;
  shippingContactMobilePhone?: string;
  shippingContactPhone?: string;
  shippingContactEmail?: string;
  shippingCompanyName?: string;
  shippingAddressStreet?: string;
  shippingAddressStreet2?: string;
  shippingAddressCity?: string;
  shippingAddressStateProvince?: string;
  shippingAddressCountry?: string;
  shippingAddressPostcodeZip?: string;
  
  // Custom fields
  custom1?: string;
  custom2?: string;
  
  // Recurring payment fields (for paymentType = '2')
  startDate?: string;
  endDate?: string;
  recurringAmount?: string;
  interval?: 'MONTHLY' | 'ANNUALLY';
  isRetry?: string;
  retryAttempts?: string;
}

export interface SavedCard {
  tokenId: string;
  maskedCardNo: string;
  exp: string;
  nickname?: string;
  defaultCard: number;
  tokenStatus: string;
}

export interface PayableTransaction {
  id: string;
  payableOrderId: string;
  payableTransactionId: string;
  invoiceId: string;
  amount: string;
  currency: string;
  status: 'pending' | 'success' | 'failed';
  paymentMethod: string;
  customerName: string;
  customerEmail: string;
  createdAt: Date;
  paidAt?: Date;
  appointmentId?: string;
  chargeId?: string; // Links to AppointmentCharge
}

// Salon Billing Interfaces
export interface SalonBillingRequest {
  salonId: number;
  billingDate: string;
  totalAmount: string;
  currency: string;
  appointmentCount: number;
  description: string;
}

export interface PaymentDataResponse {
  success: boolean;
  message: string;
  invoiceId: string;
  paymentData: {
    merchantKey: string;
    merchantId: string;
    invoiceId: string;
    amount: string;
    currency: string;
    customerId: string;
    customerRefNo: string;
    notifyUrl: string;
    returnUrl: string;
    checkValue: string;
    testMode: boolean;
    custom1: string;
    custom2: string;
    orderDescription: string;
    customerFirstName: string;
    customerLastName: string;
    customerEmail: string;
    customerMobilePhone: string;
    billingAddressStreet: string;
    billingAddressCity: string;
    billingAddressCountry: string;
    paymentType: string;
    currencyCode: string;
    logoUrl: string;
  };
}

export interface BillingStatusResponse {
  success: boolean;
  salonId: number;
  billingDate: string;
  isPaid: boolean;
  message: string;
}

export class PaymentService {
  private static instance: PaymentService;
  
  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Generate check value for regular one-time payments
   */
  public getCheckValue(
    merchantKey: string,
    invoiceId: string,
    amount: string,
    currency: string,
    merchantToken: string
  ): string {
    const mToken = CryptoJS.SHA512(merchantToken).toString().toUpperCase();
    const txt = `${merchantKey}|${invoiceId}|${amount}|${currency}|${mToken}`;
    const checkValue = CryptoJS.SHA512(txt).toString().toUpperCase();
    
    // Debug logging for checkValue generation
    console.log('🔍 [PAYMENT] One-time payment checkValue generation:', {
      merchantKey,
      invoiceId,
      amount,
      currency,
      inputString: `${merchantKey}|${invoiceId}|${amount}|${currency}|[HASHED_TOKEN]`,
      checkValue
    });
    
    return checkValue;
  }

  /**
   * Generate check value for tokenize payments
   */
  public getCheckValueToken(
    merchantKey: string,
    invoiceId: string,
    amount: string,
    currency: string,
    customerRefNo: string,
    merchantToken: string
  ): string {
    const mToken = CryptoJS.SHA512(merchantToken).toString().toUpperCase();
    const txt = `${merchantKey}|${invoiceId}|${amount}|${currency}|${customerRefNo}|${mToken}`;
    const checkValue = CryptoJS.SHA512(txt).toString().toUpperCase();
    
    // Debug logging for tokenization checkValue generation
    console.log('🔍 [PAYMENT] Tokenization checkValue generation:', {
      merchantKey,
      invoiceId,
      amount,
      currency,
      customerRefNo,
      inputString: `${merchantKey}|${invoiceId}|${amount}|${currency}|${customerRefNo}|[HASHED_TOKEN]`,
      checkValue
    });
    
    return checkValue;
  }

  /**
   * Generate invoice ID
   */
  public generateInvoiceId(): string {
  // Generate a 20-character invoice ID using timestamp and random string
  const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
  const random = Math.random().toString(36).substring(2, 9).toUpperCase(); // 7 chars
  return `INV${timestamp}${random}`.substring(0, 20); // Ensure max 20 chars
  }

  /**
   * Generate payment data for salon billing - Backend provides PAYable configuration
   */
  public async generateSalonBillingPaymentData(request: SalonBillingRequest): Promise<PaymentDataResponse> {
    try {
      console.log('💳 [SALON BILLING] Generating payment data for salon billing');
      
      const response = await fetch(`${getCurrentConfig().API_BASE_URL}/payments/salon-billing/generate-payment-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          salonId: request.salonId,
          billingDate: request.billingDate,
          totalAmount: request.totalAmount,
          currency: request.currency,
          appointmentCount: request.appointmentCount,
          description: request.description
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log('✅ [SALON BILLING] Payment data generated successfully');
        return data;
      } else {
        throw new Error(data.message || 'Failed to generate payment data');
      }
    } catch (error) {
      console.error('❌ [SALON BILLING] Failed to generate payment data:', error);
      throw error;
    }
  }

  /**
   * Process salon billing payment using PAYable SDK directly
   * Frontend → Generate Payment Data → PAYable SDK → Webhook → Backend
   */
  public async processSalonBillingPayment(request: SalonBillingRequest): Promise<void> {
    try {
      console.log('💳 [SALON BILLING] Initiating salon billing payment');
      
      // Step 1: Get payment data from backend
      const paymentDataResponse = await this.generateSalonBillingPaymentData(request);
      
      if (!paymentDataResponse.success || !paymentDataResponse.paymentData) {
        throw new Error('Failed to generate payment data');
      }

      const paymentData = paymentDataResponse.paymentData;

      // Step 2: Use PAYable SDK with the generated payment data
      console.log('💳 [SALON BILLING] Calling PAYable SDK with payment data');
      console.log('💳 [SALON BILLING] Invoice ID:', paymentData.invoiceId);
      console.log('💳 [SALON BILLING] Customer ID:', paymentData.customerId);
      console.log('💳 [SALON BILLING] Amount:', paymentData.amount);

      // Call PAYable SDK directly from frontend
      payablePayment(paymentData, paymentData.testMode);
      
    } catch (error) {
      console.error('❌ [SALON BILLING] Failed to process salon billing payment:', error);
      throw error;
    }
  }

  /**
   * Get saved cards for a salon - Now uses backend API
   */
  public async getSavedCards(salonId: number): Promise<SavedCard[]> {
    try {
      console.log('💳 [PAYMENT] Getting saved cards via backend API');
      
      const response = await apiService.getPaymentTokens(salonId);
      
      if (response.success && response.tokens) {
        console.log('✅ [PAYMENT] Retrieved saved cards:', response.tokens.length);
        return response.tokens;
      } else {
        console.log('ℹ️ [PAYMENT] No saved cards found');
        return [];
      }
    } catch (error) {
      console.error('❌ [PAYMENT] Failed to get saved cards:', error);
      throw error;
    }
  }

  /**
   * Get JWT access token for Payable API authentication
   */
  public async getJwtToken(): Promise<string> {
    try {
      // Verify credentials are loaded
      if (!payableConfig.businessKey || !payableConfig.businessToken) {
        throw new Error('Business credentials not configured. Please check environment variables.');
      }
      
      const credentials = `${payableConfig.businessKey}:${payableConfig.businessToken}`;
      const basicAuth = btoa(credentials);
      const apiBaseUrl = payableConfig.testMode 
        ? 'https://sandboxipgpayment.payable.lk' 
        : 'https://ipgpayment.payable.lk';
      
      console.log('🔑 [PAYMENT] Getting JWT access token...');
      
      const authResponse = await fetch(`${apiBaseUrl}/ipg/v2/auth/tokenize`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': basicAuth, // Direct base64, no "Basic" prefix
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'client_credentials'
        })
      });

      if (!authResponse.ok) {
        let errorText;
        try {
          const errorData = await authResponse.json();
          errorText = JSON.stringify(errorData);
          console.error('❌ [PAYMENT] Auth error (JSON):', errorData);
        } catch (e) {
          errorText = await authResponse.text();
          console.error('❌ [PAYMENT] Auth error (Text):', errorText);
        }
        throw new Error(`Authentication failed: ${authResponse.status} ${authResponse.statusText} - ${errorText}`);
      }

      const authData = await authResponse.json();
      const accessToken = authData.accessToken || authData.access_token || authData.token;
      
      if (!accessToken) {
        throw new Error('No access token received from authentication');
      }

      console.log('✅ [PAYMENT] JWT access token obtained:', accessToken.substring(0, 20) + '...');
      return accessToken;
      
    } catch (error) {
      console.error('❌ [PAYMENT] Error getting JWT token:', error);
      throw error;
    }
  }

  /**
   * Pay with saved card using existing JWT token (bypasses auth step)
   */
  public async payWithSavedCardUsingToken(
    customerId: string,
    tokenId: string,
    amount: string,
    invoiceId: string,
    orderDescription: string,
    jwtToken: string,
    webhookUrl?: string,
    custom1?: string,
    custom2?: string
  ): Promise<void> {
    try {
      console.log('💳 [PAYMENT] Paying with saved card using existing JWT token');
      console.log('🔑 [PAYMENT] Using provided JWT token:', jwtToken.substring(0, 20) + '...');
      
      // Verify credentials are loaded for checkValue generation
      if (!payableConfig.merchantKey || !payableConfig.merchantToken) {
        throw new Error('Merchant credentials not configured. Please check environment variables.');
      }
      
      const apiBaseUrl = payableConfig.testMode 
        ? 'https://sandboxipgpayment.payable.lk' 
        : 'https://ipgpayment.payable.lk';

      // Generate checkValue using the correct Payable ID values
      // UPPERCASE(SHA512[merchantId|invoiceId|amount|currencyCode|customerId|tokenId|UPPERCASE(SHA512[merchantToken])])
      const merchantToken = CryptoJS.SHA512(payableConfig.merchantToken).toString().toUpperCase();
      const merchantId = 'ce2cb8ee-6076-11f0-b4da-9ff2e85b9b44';
      const customerId = '4bc90b4b-9470-11f0-9628-7bdb5498779c';
      const checkValueString = `${merchantId}|${invoiceId}|${amount}|LKR|${customerId}|${tokenId}|${merchantToken}`;
      const checkValue = CryptoJS.SHA512(checkValueString).toString().toUpperCase();

      console.log('🔐 [PAYMENT] CheckValue generation:');
      console.log('🔐 [PAYMENT] Merchant ID:', merchantId);
      console.log('🔐 [PAYMENT] Customer ID:', customerId);
      console.log('🔐 [PAYMENT] Merchant Token (SHA512):', merchantToken.substring(0, 20) + '...');
      console.log('🔐 [PAYMENT] CheckValue string:', checkValueString);
      console.log('🔐 [PAYMENT] CheckValue (SHA512):', checkValue.substring(0, 20) + '...');

      // Process payment with saved card token using correct Payable values
      const paymentData: any = {
        merchantId: 'ce2cb8ee-6076-11f0-b4da-9ff2e85b9b44', // Use correct Payable merchant ID value
        customerId: '4bc90b4b-9470-11f0-9628-7bdb5498779c', // Use correct Payable customer ID value
        tokenId,
        invoiceId,
        amount,
        currencyCode: 'LKR',
        checkValue,
        webhookUrl: webhookUrl || 'https://salon.run.place:8090/api/v1/payments/webhook'
      };

      // Add optional custom fields
      if (custom1) paymentData.custom1 = custom1;
      if (custom2) paymentData.custom2 = custom2;

      console.log('📋 [PAYMENT] Payment data prepared:');
      console.log('📋 [PAYMENT] - Merchant ID:', paymentData.merchantId);
      console.log('📋 [PAYMENT] - Customer ID:', paymentData.customerId);
      console.log('📋 [PAYMENT] - Token ID:', paymentData.tokenId);
      console.log('📋 [PAYMENT] - Invoice ID:', paymentData.invoiceId);
      console.log('📋 [PAYMENT] - Amount:', paymentData.amount);
      console.log('📋 [PAYMENT] - Currency:', paymentData.currencyCode);
      console.log('📋 [PAYMENT] - CheckValue:', paymentData.checkValue?.substring(0, 20) + '...');
      console.log('📋 [PAYMENT] - Webhook URL:', paymentData.webhookUrl);
      console.log('📋 [PAYMENT] - Custom1:', paymentData.custom1);
      console.log('📋 [PAYMENT] - Custom2:', paymentData.custom2);

      // Use Bearer token authentication as required by the API
      const authorizationHeader = `Bearer ${jwtToken}`;
      console.log('🔑 [PAYMENT] Using Bearer token authentication for /tokenize/pay endpoint');
      console.log('🔑 [PAYMENT] Bearer token:', authorizationHeader.substring(0, 50) + '...');

      // For saved card payments, use /tokenize/pay endpoint with Bearer token authentication
      console.log('🔍 [PAYMENT] Making saved card payment with Bearer token auth (CORRECT METHOD)...');
      
      let paymentResponse = await fetch(`${apiBaseUrl}/ipg/v2/tokenize/pay`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authorizationHeader, // Use Bearer token
          'Accept': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      console.log('📤 [PAYMENT] Request sent to (BEARER TOKEN AUTH):', `${apiBaseUrl}/ipg/v2/tokenize/pay`);
      console.log('📤 [PAYMENT] Authentication method used: Bearer Token (CORRECT)');
      console.log('📤 [PAYMENT] Request headers:', {
        'Content-Type': 'application/json',
        'Authorization': authorizationHeader.substring(0, 50) + '...',
        'Accept': 'application/json'
      });
      console.log('📤 [PAYMENT] Full request payload:', JSON.stringify(paymentData, null, 2));
      
      console.log('📥 [PAYMENT] Payment response status:', paymentResponse.status, paymentResponse.statusText);
      console.log('📥 [PAYMENT] Payment response headers:', Object.fromEntries(paymentResponse.headers.entries()));

      if (!paymentResponse.ok) {
        let errorData;
        try {
          const responseText = await paymentResponse.text();
          try {
            errorData = JSON.parse(responseText);
            console.error('❌ [PAYMENT] Payment response error (JSON):', errorData);
          } catch (e) {
            errorData = { error: responseText };
            console.error('❌ [PAYMENT] Payment response error (Text):', responseText);
          }
        } catch (e) {
          errorData = { error: 'Could not read response body' };
          console.error('❌ [PAYMENT] Could not read response body:', e);
        }
        
        // Enhanced error logging for debugging
        console.error('❌ [PAYMENT] Full error details:', {
          status: paymentResponse.status,
          statusText: paymentResponse.statusText,
          url: paymentResponse.url,
          headers: Object.fromEntries(paymentResponse.headers.entries()),
          errorData: errorData
        });
        throw new Error(`Payment failed: ${paymentResponse.status} ${paymentResponse.statusText} - ${JSON.stringify(errorData)}`);
      }

      const paymentResult = await paymentResponse.json();
      console.log('✅ [PAYMENT] Payment with saved card successful:', paymentResult);

      // Handle the response based on Payable API specification
      if (paymentResult.redirectUrl) {
        // Redirect user to complete payment if needed
        window.location.href = paymentResult.redirectUrl;
      } else if (paymentResult.success || paymentResult.status === 'SUCCESS') {
        console.log('✅ [PAYMENT] Payment processed successfully');
        // Payment completed successfully
      } else {
        throw new Error(paymentResult.error || paymentResult.message || 'Payment failed');
      }
      
    } catch (error) {
      console.error('❌ [PAYMENT] Error paying with saved card using token:', error);
      throw error;
    }
  }

  /**
   * Pay with saved card using Payable API directly
   * Step 1: Get access token using Basic Auth
   * Step 2: Use access token to process payment with saved card token
   */
  public async payWithSavedCard(
    customerId: string,
    tokenId: string,
    amount: string,
    invoiceId: string,
    orderDescription: string,
    webhookUrl?: string,
    custom1?: string,
    custom2?: string
  ): Promise<void> {
    try {
      console.log('💳 [PAYMENT] Paying with saved card via Payable API');
      
      // Verify credentials are loaded
      if (!payableConfig.businessKey || !payableConfig.businessToken) {
        throw new Error('Business credentials not configured. Please check environment variables.');
      }
      
      console.log('✅ [PAYMENT] Business credentials verified');
      
      // Step 1: Generate Basic Auth token and get JWT Access Token
      const credentials = `${payableConfig.businessKey}:${payableConfig.businessToken}`;
      const basicAuth = btoa(credentials);
      const apiBaseUrl = payableConfig.testMode 
        ? 'https://sandboxipgpayment.payable.lk' 
        : 'https://ipgpayment.payable.lk';
      
      console.log('🔑 [PAYMENT] Generating JWT access token...');
      console.log('🔑 [PAYMENT] Business Key:', payableConfig.businessKey);
      console.log('🔑 [PAYMENT] Business Token:', payableConfig.businessToken?.substring(0, 8) + '...');
      console.log('🔑 [PAYMENT] Credentials String:', credentials.substring(0, 20) + '...');
      console.log('🔑 [PAYMENT] Basic Auth (base64):', basicAuth.substring(0, 20) + '...');
      console.log('🔑 [PAYMENT] Authorization Header:', `Basic ${basicAuth}`);
      console.log('🔑 [PAYMENT] API Base URL:', apiBaseUrl);
      
      // Call the correct tokenize auth endpoint with direct base64 (no "Basic" prefix)
      console.log('📡 [PAYMENT] Making auth request to:', `${apiBaseUrl}/ipg/v2/auth/tokenize`);
      console.log('📡 [PAYMENT] Request headers (Direct base64 format):', {
        'Content-Type': 'application/json',
        'Authorization': basicAuth.substring(0, 20) + '...'
      });
      console.log('📡 [PAYMENT] Request body:', JSON.stringify({ grant_type: 'client_credentials' }, null, 2));
      
      const authResponse = await fetch(`${apiBaseUrl}/ipg/v2/auth/tokenize`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': basicAuth, // Direct base64, no "Basic" prefix
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'client_credentials'
        })
      });

      console.log('📥 [PAYMENT] Auth response status:', authResponse.status, authResponse.statusText);
      console.log('📥 [PAYMENT] Auth response headers:', Object.fromEntries(authResponse.headers.entries()));
      
      if (!authResponse.ok) {
        let errorText;
        try {
          const errorData = await authResponse.json();
          errorText = JSON.stringify(errorData);
          console.error('❌ [PAYMENT] Auth error (JSON):', errorData);
        } catch (e) {
          errorText = await authResponse.text();
          console.error('❌ [PAYMENT] Auth error (Text):', errorText);
        }
        throw new Error(`Auth failed: ${authResponse.status} ${authResponse.statusText} - ${errorText}`);
      }

      const authData = await authResponse.json();
      console.log('✅ [PAYMENT] Auth response data:', authData);
      
      // Extract access token and additional info
      const accessToken = authData.accessToken || authData.access_token || authData.token;
      const tokenType = authData.tokenType || 'Bearer';
      const expiresIn = authData.expiresIn || '300';
      
      if (!accessToken) {
        throw new Error('Failed to obtain access token from response: ' + JSON.stringify(authData));
      }

      console.log('✅ [PAYMENT] JWT access token obtained:', accessToken.substring(0, 20) + '...');
      console.log('✅ [PAYMENT] Token type:', tokenType);
      console.log('✅ [PAYMENT] Token expires in:', expiresIn, 'seconds');
      console.log('✅ [PAYMENT] Token environment:', authData.environment);

      // Step 2: Generate checkValue using the correct format
      // UPPERCASE(SHA512[merchantId|invoiceId|amount|currencyCode|customerId|tokenId|UPPERCASE(SHA512[merchantToken])])
      const merchantToken = CryptoJS.SHA512(payableConfig.merchantToken).toString().toUpperCase();
      const checkValueString = `${payableConfig.merchantKey}|${invoiceId}|${amount}|LKR|${customerId}|${tokenId}|${merchantToken}`;
      const checkValue = CryptoJS.SHA512(checkValueString).toString().toUpperCase();

      console.log('🔐 [PAYMENT] CheckValue generation:');
      console.log('🔐 [PAYMENT] Merchant Key:', payableConfig.merchantKey);
      console.log('🔐 [PAYMENT] Merchant Token (SHA512):', merchantToken.substring(0, 20) + '...');
      console.log('🔐 [PAYMENT] CheckValue string:', checkValueString);
      console.log('🔐 [PAYMENT] CheckValue (SHA512):', checkValue.substring(0, 20) + '...');

      // Step 3: Process payment with saved card token using correct parameter names
      const paymentData: any = {
        merchantId: payableConfig.merchantKey,  // Use merchantKey as merchantId
        customerId,
        tokenId,
        invoiceId,
        amount,
        currencyCode: 'LKR',
        checkValue,
        webhookUrl: webhookUrl || 'https://salon.run.place:8090/api/v1/payments/webhook'
      };

      // Only include custom fields if they have valid values
      if (custom1 && custom1.trim() !== '') {
        paymentData.custom1 = custom1.trim();
      }
      if (custom2 && custom2.trim() !== '') {
        paymentData.custom2 = custom2.trim();
      }

      console.log('💳 [PAYMENT] Processing payment with saved card...');
      console.log('💳 [PAYMENT] Payment data:', {
        merchantId: paymentData.merchantId,
        customerId: paymentData.customerId,
        tokenId: paymentData.tokenId,
        invoiceId: paymentData.invoiceId,
        amount: paymentData.amount,
        currencyCode: paymentData.currencyCode,
        checkValue: paymentData.checkValue?.substring(0, 20) + '...',
        webhookUrl: paymentData.webhookUrl,
        custom1: paymentData.custom1,
        custom2: paymentData.custom2
      });

      // Use the tokenType from the response for proper authorization header
      const authorizationHeader = `${tokenType} ${accessToken}`;
      console.log('🔑 [PAYMENT] Authorization header format:', authorizationHeader.substring(0, 30) + '...');

      // For saved card payments, use /tokenize/pay endpoint with JWT Bearer authentication
      console.log('🔍 [PAYMENT] Making saved card payment with JWT Bearer token authentication (FIXED ENDPOINT)...');
      
      let paymentResponse = await fetch(`${apiBaseUrl}/ipg/v2/tokenize/pay`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authorizationHeader,
          'Accept': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      let authMethod = 'JWT Bearer Token';

      console.log('📤 [PAYMENT] Request sent to (FIXED):', `${apiBaseUrl}/ipg/v2/tokenize/pay`);
      console.log('📤 [PAYMENT] Authentication method used:', authMethod);
      console.log('📤 [PAYMENT] Request headers:', {
        'Content-Type': 'application/json',
        'Authorization': authorizationHeader.substring(0, 30) + '...',
        'Accept': 'application/json'
      });
      console.log('📤 [PAYMENT] Full request payload:', JSON.stringify(paymentData, null, 2));

      console.log('📤 [PAYMENT] Request sent to (DUPLICATE LOG):', `${apiBaseUrl}/ipg/v2/tokenize/pay`);
      console.log('📤 [PAYMENT] Request headers:', {
        'Content-Type': 'application/json',
        'Authorization': authorizationHeader.substring(0, 30) + '...',
        'Accept': 'application/json'
      });
      console.log('📤 [PAYMENT] Full request payload:', JSON.stringify(paymentData, null, 2));
      
      console.log('📥 [PAYMENT] Payment response status:', paymentResponse.status, paymentResponse.statusText);
      console.log('📥 [PAYMENT] Payment response headers:', Object.fromEntries(paymentResponse.headers.entries()));

      if (!paymentResponse.ok) {
        let errorData;
        try {
          const responseText = await paymentResponse.text();
          try {
            errorData = JSON.parse(responseText);
            console.error('❌ [PAYMENT] Payment response error (JSON):', errorData);
          } catch (e) {
            errorData = { error: responseText };
            console.error('❌ [PAYMENT] Payment response error (Text):', responseText);
          }
        } catch (e) {
          errorData = { error: 'Could not read response body' };
          console.error('❌ [PAYMENT] Could not read response body:', e);
        }
        
        // Enhanced error logging for debugging
        console.error('❌ [PAYMENT] Full error details:', {
          status: paymentResponse.status,
          statusText: paymentResponse.statusText,
          url: paymentResponse.url,
          headers: Object.fromEntries(paymentResponse.headers.entries()),
          errorData: errorData
        });
        throw new Error(`Payment failed: ${paymentResponse.status} ${paymentResponse.statusText} - ${JSON.stringify(errorData)}`);
      }

      const paymentResult = await paymentResponse.json();
      console.log('✅ [PAYMENT] Payment with saved card successful:', paymentResult);

      // Handle the response based on Payable API specification
      if (paymentResult.redirectUrl) {
        // Redirect user to complete payment if needed
        window.location.href = paymentResult.redirectUrl;
      } else if (paymentResult.success || paymentResult.status === 'SUCCESS') {
        console.log('✅ [PAYMENT] Payment processed successfully');
        // Payment completed successfully
      } else {
        throw new Error(paymentResult.error || paymentResult.message || 'Payment failed');
      }
      
    } catch (error) {
      console.error('❌ [PAYMENT] Error paying with saved card:', error);
      throw error;
    }
  }

  /**
   * Delete a saved card - Now uses backend API
   */
  public async deleteSavedCard(tokenId: string): Promise<boolean> {
    try {
      console.log('🗑️ [PAYMENT] Deleting saved card via backend API');
      
      const response = await apiService.deletePaymentToken(tokenId);
      
      if (response.success) {
        console.log('✅ [PAYMENT] Card deleted successfully');
        return true;
      } else {
        console.error('❌ [PAYMENT] Failed to delete card:', response.error);
        return false;
      }
    } catch (error) {
      console.error('❌ [PAYMENT] Error deleting saved card:', error);
      return false;
    }
  }

  /**
   * Edit saved card (nickname, default status) - Now uses backend API
   */
  public async editSavedCard(
    tokenId: string, 
    nickName?: string, 
    isDefaultCard?: number
  ): Promise<boolean> {
    try {
      console.log('✏️ [PAYMENT] Editing saved card via backend API');
      
      const response = await apiService.updatePaymentToken(tokenId, {
        nickName: nickName || '',
        isDefaultCard: isDefaultCard || 0
      });
      
      if (response.success) {
        console.log('✅ [PAYMENT] Card updated successfully');
        return true;
      } else {
        console.error('❌ [PAYMENT] Failed to update card:', response.error);
        return false;
      }
    } catch (error) {
      console.error('❌ [PAYMENT] Error editing saved card:', error);
      return false;
    }
  }

  /**
   * Validate webhook response
   */
  public validateWebhook(webhookData: any): boolean {
    try {
      const merchantToken = CryptoJS.SHA512(payableConfig.merchantToken).toString().toUpperCase();
      const calculatedCheckValue = CryptoJS.SHA512(
        `${webhookData.merchantKey}|${webhookData.payableOrderId}|${webhookData.payableTransactionId}|${webhookData.payableAmount}|${webhookData.payableCurrency}|${webhookData.invoiceNo}|${webhookData.statusCode}|${merchantToken}`
      ).toString().toUpperCase();

      return calculatedCheckValue === webhookData.checkValue;
    } catch (error) {
      console.error('❌ [PAYMENT] Error validating webhook:', error);
      return false;
    }
  }

  /**
   * Get current configuration status
   */
  public getConfigStatus(): { isConfigured: boolean; testMode: boolean; missingFields: string[] } {
    const validation = validatePayableConfig();
    return {
      isConfigured: validation.isValid,
      testMode: payableConfig.testMode,
      missingFields: validation.missingFields
    };
  }

  /**
   * Get payment status for an appointment - Now uses backend API
   */
  public async getPaymentStatus(appointmentId: string): Promise<any> {
    try {
      console.log('💳 [PAYMENT] Getting payment status via backend API');
      
      const response = await apiService.getPaymentStatus(appointmentId);
      
      if (response.success) {
        console.log('✅ [PAYMENT] Retrieved payment status:', response.status);
        return response;
      } else {
        console.error('❌ [PAYMENT] Failed to get payment status:', response.error);
        return null;
      }
    } catch (error) {
      console.error('❌ [PAYMENT] Error getting payment status:', error);
      return null;
    }
  }

  /**
   * Get default payment token for a salon - Now uses backend API
   */
  public async getDefaultPaymentToken(salonId: number): Promise<any> {
    try {
      console.log('💳 [PAYMENT] Getting default payment token via backend API');
      
      const response = await apiService.getDefaultPaymentToken(salonId);
      
      if (response.success && response.token) {
        console.log('✅ [PAYMENT] Retrieved default payment token');
        return response.token;
      } else {
        console.log('ℹ️ [PAYMENT] No default payment token found');
        return null;
      }
    } catch (error) {
      console.error('❌ [PAYMENT] Error getting default payment token:', error);
      return null;
    }
  }

  /**
   * Check salon billing status for a specific date
   */
  public async checkSalonBillingStatus(salonId: number, billingDate: string): Promise<BillingStatusResponse> {
    try {
      console.log('💳 [SALON BILLING] Checking billing status for salon:', salonId, 'date:', billingDate);
      
      const response = await fetch(`${getCurrentConfig().API_BASE_URL}/payments/salon-billing/billing-status/${salonId}?date=${billingDate}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('✅ [SALON BILLING] Billing status retrieved:', data.isPaid ? 'PAID' : 'PENDING');
      return data;
      
    } catch (error) {
      console.error('❌ [SALON BILLING] Failed to check billing status:', error);
      throw error;
    }
  }

  /**
   * Process payment with card tokenization (for adding new cards)
   * This is direct PAYable SDK integration for card management
   */
  public async processTokenizePayment(request: PaymentRequest): Promise<void> {
    try {
      console.log('💳 [CARD MANAGEMENT] Processing tokenize payment to add new card');
      console.log('🔍 [PAYMENT] Customer Ref:', request.customerRefNo);
      
      const merchantToken = CryptoJS.SHA512(payableConfig.merchantToken).toString().toUpperCase();
      
      // Generate checkValue for tokenization (includes customerRefNo)
      const checkValue = CryptoJS.SHA512(
        `${payableConfig.merchantKey}|${request.invoiceId}|${request.amount}|${request.currencyCode}|${request.customerRefNo}|${merchantToken}`
      ).toString().toUpperCase();

      // Create tokenization payment object
      const tokenizePayment = {
        checkValue,
        orderDescription: request.orderDescription || 'Card tokenization',
        invoiceId: request.invoiceId,
        logoUrl: 'https://salon.run.place/images/logo.png', // Default logo
        notifyUrl: 'https://salon.run.place:8090/api/v1/payments/webhook', // Fixed: Use main webhook endpoint
        returnUrl: `${window.location.origin}/payment/success`, // Frontend success page
        merchantKey: payableConfig.merchantKey,
        customerFirstName: request.customerFirstName,
        customerLastName: request.customerLastName,
        customerMobilePhone: request.customerMobilePhone,
        customerPhone: request.customerPhone || '',
        customerEmail: request.customerEmail,
        billingCompanyName: request.billingCompanyName || '',
        billingAddressStreet: request.billingAddressStreet,
        billingAddressStreet2: request.billingAddressStreet2 || '',
        billingAddressCity: request.billingAddressCity,
        billingAddressStateProvince: request.billingAddressStateProvince || '',
        billingAddressCountry: request.billingAddressCountry || 'LKA',
        billingAddressPostcodeZip: request.billingAddressPostcodeZip || '',
        amount: request.amount,
        currencyCode: request.currencyCode,
        paymentType: '3', // Tokenize payment
        isSaveCard: '1', // Save card
        customerRefNo: request.customerRefNo, // Customer reference for tokenization
        doFirstPayment: request.doFirstPayment || '1', // Charge immediately
        custom1: request.custom1 || '',
        custom2: request.custom2 || ''
      };

      console.log('💳 [CARD MANAGEMENT] Calling PAYable SDK for card tokenization');
      console.log('💳 [CARD MANAGEMENT] Payment Type:', tokenizePayment.paymentType);
      console.log('💳 [CARD MANAGEMENT] Customer Ref:', tokenizePayment.customerRefNo);
      console.log('💳 [CARD MANAGEMENT] Invoice ID:', tokenizePayment.invoiceId);

      // Call PAYable SDK directly for tokenization
      payablePayment(tokenizePayment, payableConfig.testMode);
      
    } catch (error) {
      console.error('❌ [CARD MANAGEMENT] Failed to process tokenize payment:', error);
      throw error;
    }
  }

  /**
   * Process one-time payment (regular payment without tokenization)
   */
  public async processOneTimePayment(request: PaymentRequest): Promise<void> {
    try {
      console.log('💳 [PAYMENT] Processing one-time payment');
      console.log('🔍 [PAYMENT] Invoice ID:', request.invoiceId);
      
      const merchantToken = CryptoJS.SHA512(payableConfig.merchantToken).toString().toUpperCase();
      
      // Generate checkValue for one-time payment (no customerRefNo)
      const checkValue = CryptoJS.SHA512(
        `${payableConfig.merchantKey}|${request.invoiceId}|${request.amount}|${request.currencyCode}|${merchantToken}`
      ).toString().toUpperCase();

      // Create one-time payment object
      const oneTimePayment = {
        checkValue,
        orderDescription: request.orderDescription || 'One-time payment',
        invoiceId: request.invoiceId,
        logoUrl: 'https://salon.run.place/images/logo.png', // Default logo
        notifyUrl: 'https://salon.run.place:8090/api/v1/payments/webhook', // Fixed: Use main webhook endpoint
        returnUrl: `${window.location.origin}/payment/success`, // Frontend success page
        merchantKey: payableConfig.merchantKey,
        customerFirstName: request.customerFirstName,
        customerLastName: request.customerLastName,
        customerMobilePhone: request.customerMobilePhone,
        customerPhone: request.customerPhone || '',
        customerEmail: request.customerEmail,
        billingCompanyName: request.billingCompanyName || '',
        billingAddressStreet: request.billingAddressStreet,
        billingAddressStreet2: request.billingAddressStreet2 || '',
        billingAddressCity: request.billingAddressCity,
        billingAddressStateProvince: request.billingAddressStateProvince || '',
        billingAddressCountry: request.billingAddressCountry || 'LKA',
        billingAddressPostcodeZip: request.billingAddressPostcodeZip || '',
        amount: request.amount,
        currencyCode: request.currencyCode,
        paymentType: '1', // One-time payment
        isSaveCard: request.isSaveCard || '0', // Don't save card by default
        custom1: request.custom1 || '',
        custom2: request.custom2 || ''
      };

      console.log('💳 [PAYMENT] Calling PAYable SDK for one-time payment');
      console.log('💳 [PAYMENT] Payment Type:', oneTimePayment.paymentType);
      console.log('💳 [PAYMENT] Invoice ID:', oneTimePayment.invoiceId);

      // Call PAYable SDK directly for one-time payment
      payablePayment(oneTimePayment, payableConfig.testMode);
      
    } catch (error) {
      console.error('❌ [PAYMENT] Failed to process one-time payment:', error);
      throw error;
    }
  }

  /**
   * Calculate daily charges for salon billing
   */
  public calculateDailyCharges(appointments: any[], serviceChargePerAppointment: number): number {
    return appointments.length * serviceChargePerAppointment;
  }

  /**
   * Get today's date in YYYY-MM-DD format
   */
  public getTodayDateString(): string {
    return new Date().toISOString().split('T')[0];
  }
}

export const paymentService = PaymentService.getInstance();
