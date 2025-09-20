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
   * Pay with saved card using PAYable API directly
   * Follows PAYable documentation for tokenize payment
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
      console.log('💳 [PAYMENT] Paying with saved card via PAYable API');
      
      // Step 1: Generate JWT Access Token
      const basicAuth = btoa(`${payableConfig.businessKey}:${payableConfig.businessToken}`);
      const apiBaseUrl = payableConfig.testMode 
        ? 'https://sandboxipgpayment.payable.lk' 
        : 'https://ipgpayment.payable.lk';
      
      console.log('🔑 [PAYMENT] Generating JWT access token...');
      const authResponse = await fetch(`${apiBaseUrl}/ipg/v2/auth/tokenize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`
        },
        body: JSON.stringify({
          grant_type: 'client_credentials'
        })
      });

      if (!authResponse.ok) {
        throw new Error(`Auth failed: ${authResponse.status} ${authResponse.statusText}`);
      }

      const authData = await authResponse.json();
      const accessToken = authData.accessToken;
      
      if (!accessToken) {
        throw new Error('Failed to obtain access token');
      }

      console.log('✅ [PAYMENT] JWT access token obtained');

      // Step 2: Generate checkValue for saved card payment
      const merchantToken = CryptoJS.SHA512(payableConfig.merchantToken).toString().toUpperCase();
      const checkValue = CryptoJS.SHA512(
        `${payableConfig.merchantKey}|${invoiceId}|${amount}|LKR|${customerId}|${tokenId}|${merchantToken}`
      ).toString().toUpperCase();

      // Step 3: Make payment with saved card
      const paymentData = {
        merchantId: payableConfig.merchantKey,
        customerId,
        tokenId,
        invoiceId,
        amount,
        currencyCode: 'LKR',
        checkValue,
        webhookUrl: webhookUrl || 'https://salon.run.place:8090/api/v1/payments/webhook',
        custom1: custom1 || '',
        custom2: custom2 || ''
      };

      console.log('💳 [PAYMENT] Processing payment with saved card...');
      console.log('💳 [PAYMENT] Merchant ID:', paymentData.merchantId);
      console.log('💳 [PAYMENT] Customer ID:', paymentData.customerId);
      console.log('💳 [PAYMENT] Token ID:', paymentData.tokenId);
      console.log('💳 [PAYMENT] Amount:', paymentData.amount);

      const paymentResponse = await fetch(`${apiBaseUrl}/ipg/v2/tokenize/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(paymentData)
      });

      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json().catch(() => ({}));
        throw new Error(`Payment failed: ${paymentResponse.status} ${paymentResponse.statusText} - ${JSON.stringify(errorData)}`);
      }

      const paymentResult = await paymentResponse.json();
      console.log('✅ [PAYMENT] Payment with saved card successful:', paymentResult);

      // Handle the response - typically PAYable will redirect or provide status
      if (paymentResult.redirectUrl) {
        window.location.href = paymentResult.redirectUrl;
      } else if (paymentResult.success) {
        console.log('✅ [PAYMENT] Payment processed successfully');
      } else {
        throw new Error(paymentResult.error || 'Payment failed');
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
