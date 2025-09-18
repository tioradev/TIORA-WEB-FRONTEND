import CryptoJS from 'crypto-js';
import { payablePayment } from 'payable-ipg-js';
import { payableConfig, validatePayableConfig, payableUrls } from './payableConfig';

export interface PaymentRequest {
  amount: string;
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

export class PaymentService {
  private static instance: PaymentService;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;
  
  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Validate configuration before any operations
   */
  private validateConfig(): void {
    const validation = validatePayableConfig();
    if (!validation.isValid) {
      throw new Error(`Payable configuration incomplete. Missing: ${validation.missingFields.join(', ')}`);
    }
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
   * Process one-time payment (paymentType = '1')
   */
  public async processOneTimePayment(request: PaymentRequest): Promise<void> {
    this.validateConfig();
    
    const invoiceId = request.invoiceId || this.generateInvoiceId();
    
    const checkValue = this.getCheckValue(
      payableConfig.merchantKey,
      invoiceId,
      request.amount,
      'LKR',
      payableConfig.merchantToken
    );

    const payment = {
      checkValue,
      orderDescription: request.orderDescription,
      invoiceId,
  logoUrl: 'https://firebasestorage.googleapis.com/v0/b/tiora-firebase.firebasestorage.app/o/logo%2FTiora%20gold.png?alt=media&token=2814af13-f96a-40e9-a3a5-6ba02ae0c3e3',
      notifyUrl: `${window.location.origin}/api/webhook/payment`,
      returnUrl: `${window.location.origin}/payment/success`,
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
  billingAddressCountry: 'LKA',
      billingAddressPostcodeZip: request.billingAddressPostcodeZip || '',
      amount: request.amount,
      currencyCode: 'LKR',
      paymentType: '1' // One-time payment
    };

    console.log('🔄 [PAYMENT] Processing one-time payment:', { 
      invoiceId, 
      amount: request.amount, 
      testMode: payableConfig.testMode 
    });
    
    payablePayment(payment, payableConfig.testMode);
  }

  /**
   * Process payment with card tokenization (paymentType = '3')
   */
  public async processTokenizePayment(request: PaymentRequest): Promise<void> {
    this.validateConfig();
    
    const invoiceId = request.invoiceId || this.generateInvoiceId();
    const customerRefNo = request.customerRefNo || `CUST${Date.now()}`;
    
    const checkValue = this.getCheckValueToken(
      payableConfig.merchantKey,
      invoiceId,
      request.amount,
      'LKR',
      customerRefNo,
      payableConfig.merchantToken
    );

    // Debug the checkValue generation
    console.log('🔍 [PAYMENT] CheckValue generation for tokenization:', {
      merchantKey: payableConfig.merchantKey,
      invoiceId,
      amount: request.amount,
      currency: 'LKR',
      customerRefNo,
      merchantToken: 'HIDDEN',
      generatedCheckValue: checkValue
    });

    const payment = {
      checkValue,
      orderDescription: request.orderDescription,
      invoiceId,
  logoUrl: 'https://firebasestorage.googleapis.com/v0/b/tiora-firebase.firebasestorage.app/o/logo%2FTiora%20gold.png?alt=media&token=2814af13-f96a-40e9-a3a5-6ba02ae0c3e3',
      notifyUrl: `${window.location.origin}/api/webhook/payment`,
      returnUrl: `${window.location.origin}/payment/success`,
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
  billingAddressCountry: 'LKA',
      billingAddressPostcodeZip: request.billingAddressPostcodeZip || '',
      amount: request.amount,
      currencyCode: 'LKR',
      paymentType: '3', // Tokenize payment
      isSaveCard: request.isSaveCard || '1',
      customerRefNo,
      doFirstPayment: request.doFirstPayment || '1'
    };

    console.log('� [PAYMENT] Tokenization debug info:', { 
      invoiceId, 
      customerRefNo, 
      merchantKey: payableConfig.merchantKey,
      amount: request.amount,
      testMode: payableConfig.testMode,
      customerEmail: request.customerEmail,
      paymentType: payment.paymentType
    });
    
    console.log('�🔄 [PAYMENT] Processing tokenize payment:', { 
      invoiceId, 
      customerRefNo, 
      amount: request.amount,
      testMode: payableConfig.testMode 
    });
    
    payablePayment(payment, payableConfig.testMode);
  }

  /**
   * Get saved cards for a customer
   */
  public async getSavedCards(customerId: string): Promise<SavedCard[]> {
    this.validateConfig();
    
    try {
      const merchantToken = CryptoJS.SHA512(payableConfig.merchantToken).toString().toUpperCase();
      const checkValue = CryptoJS.SHA512(`${payableConfig.merchantKey}|${customerId}|${merchantToken}`).toString().toUpperCase();
      
      const rootUrl = payableConfig.testMode ? 
        payableUrls.api.sandbox : 
        payableUrls.api.live;

      // Debug logging
      console.log('🔍 [PAYMENT] getSavedCards debug info:', {
        merchantId: payableConfig.merchantKey,
        customerId,
        checkValue,
        rootUrl,
        apiUrl: `${rootUrl}/ipg/v2/tokenize/listCard`,
        testMode: payableConfig.testMode
      });
      
      const requestBody = {
        merchantId: payableConfig.merchantKey,
        customerId,
        checkValue
      };

      console.log('📤 [PAYMENT] List cards request:', requestBody);
      
      const response = await fetch(`${rootUrl}/ipg/v2/tokenize/listCard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 [PAYMENT] List cards response status:', response.status);
      
      if (!response.ok) {
        console.error('❌ [PAYMENT] HTTP Error:', response.status, response.statusText);
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('🔄 [PAYMENT] Get saved cards response:', data);
      
      if (data.success) {
        return data.cards || [];
      } else {
        throw new Error(data.error || 'Failed to fetch saved cards');
      }
    } catch (error) {
      console.error('❌ [PAYMENT] Error fetching saved cards:', error);
      return [];
    }
  }

  /**
   * Pay with saved card using JWT authentication
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
    this.validateConfig();
    
    try {
      const accessToken = await this.getAccessToken();
      const merchantToken = CryptoJS.SHA512(payableConfig.merchantToken).toString().toUpperCase();
      const checkValue = CryptoJS.SHA512(
        `${payableConfig.merchantKey}|${invoiceId}|${amount}|LKR|${customerId}|${tokenId}|${merchantToken}`
      ).toString().toUpperCase();
      
      const rootUrl = payableConfig.testMode ? 
        payableUrls.api.sandbox : 
        payableUrls.api.live;
      
      const response = await fetch(`${rootUrl}/ipg/v2/tokenize/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          merchantId: payableConfig.merchantKey,
          invoiceId,
          amount,
          currencyCode: 'LKR',
          customerId,
          tokenId,
          orderDescription,
          checkValue,
          webhookUrl: webhookUrl || `${window.location.origin}/api/webhook/payment`,
          custom1: custom1 || '',
          custom2: custom2 || ''
        })
      });

      const data = await response.json();
      
      console.log('🔄 [PAYMENT] Pay with saved card response:', data);
      
      if (data.success) {
        console.log('✅ [PAYMENT] Payment with saved card successful:', data);
        // Handle success - redirect or update UI
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          window.location.href = `/payment/success?transaction=${data.payableTransactionId}`;
        }
      } else {
        throw new Error(data.error || 'Payment failed');
      }
    } catch (error) {
      console.error('❌ [PAYMENT] Error paying with saved card:', error);
      throw error;
    }
  }

  /**
   * Delete a saved card
   */
  public async deleteSavedCard(customerId: string, tokenId: string): Promise<boolean> {
    this.validateConfig();
    
    try {
      const merchantToken = CryptoJS.SHA512(payableConfig.merchantToken).toString().toUpperCase();
      const checkValue = CryptoJS.SHA512(
        `${payableConfig.merchantKey}|${customerId}|${tokenId}|${merchantToken}`
      ).toString().toUpperCase();
      
      const rootUrl = payableConfig.testMode ? 
        payableUrls.api.sandbox : 
        payableUrls.api.live;
      
      const response = await fetch(`${rootUrl}/ipg/v2/tokenize/deleteCard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantId: payableConfig.merchantKey,
          customerId,
          tokenId,
          checkValue
        })
      });

      const data = await response.json();
      
      console.log('🔄 [PAYMENT] Delete saved card response:', data);
      
      return data.success || false;
    } catch (error) {
      console.error('❌ [PAYMENT] Error deleting saved card:', error);
      return false;
    }
  }

  /**
   * Edit saved card (nickname, default status)
   */
  public async editSavedCard(
    customerId: string, 
    tokenId: string, 
    nickName?: string, 
    isDefaultCard?: number
  ): Promise<boolean> {
    this.validateConfig();
    
    try {
      const accessToken = await this.getAccessToken();
      const merchantToken = CryptoJS.SHA512(payableConfig.merchantToken).toString().toUpperCase();
      const checkValue = CryptoJS.SHA512(
        `${payableConfig.merchantKey}|${customerId}|${tokenId}|${merchantToken}`
      ).toString().toUpperCase();
      
      const rootUrl = payableConfig.testMode ? 
        payableUrls.api.sandbox : 
        payableUrls.api.live;
      
      const response = await fetch(`${rootUrl}/ipg/v2/tokenize/editCard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          merchantId: payableConfig.merchantKey,
          customerId,
          tokenId,
          nickName: nickName || '',
          isDefaultCard: isDefaultCard || 0,
          checkValue
        })
      });

      const data = await response.json();
      
      console.log('🔄 [PAYMENT] Edit saved card response:', data);
      
      return data.success || false;
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
   * Generate JWT access token for advanced features
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    this.validateConfig();
    
    try {
      // Create Basic Auth token: base64(businessKey:businessToken)
      const basicAuthToken = btoa(`${payableConfig.businessKey}:${payableConfig.businessToken}`);
      
      const rootUrl = payableConfig.testMode ? 
        payableUrls.api.sandbox : 
        payableUrls.api.live;
      
      const response = await fetch(`${rootUrl}/ipg/v2/auth/tokenize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': basicAuthToken
        },
        body: JSON.stringify({
          grant_type: 'client_credentials'
        })
      });

      const data = await response.json();
      
      if (data.accessToken) {
        this.accessToken = data.accessToken;
        // Set expiry to 50 minutes from now (tokens usually expire in 1 hour)
        this.tokenExpiry = new Date(Date.now() + 50 * 60 * 1000);
        return data.accessToken;
      } else {
        throw new Error(data.error || 'Failed to get access token');
      }
    } catch (error) {
      console.error('❌ [PAYMENT] Error getting access token:', error);
      throw new Error('Failed to authenticate with payment gateway');
    }
  }
}

export const paymentService = PaymentService.getInstance();
