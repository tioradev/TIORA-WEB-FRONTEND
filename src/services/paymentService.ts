import CryptoJS from 'crypto-js';
import { payableConfig, validatePayableConfig } from './payableConfig';
import { webhookHandler } from './webhookHandler';
import { apiService } from './api';

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
   * Process one-time payment (paymentType = '1') - Now uses backend API
   */
  public async processOneTimePayment(request: PaymentRequest): Promise<void> {
    try {
      console.log('💳 [PAYMENT] Initiating regular payment via backend API');
      
      const response = await apiService.initiateRegularPayment({
        amount: request.amount,
        invoiceId: request.invoiceId || this.generateInvoiceId(),
        orderDescription: request.orderDescription,
        customerFirstName: request.customerFirstName,
        customerLastName: request.customerLastName,
        customerEmail: request.customerEmail,
        customerMobilePhone: request.customerMobilePhone,
        customerPhone: request.customerPhone || '',
        billingAddressStreet: request.billingAddressStreet,
        billingAddressCity: request.billingAddressCity,
        billingAddressCountry: request.billingAddressCountry,
        billingCompanyName: request.billingCompanyName || '',
        billingAddressStreet2: request.billingAddressStreet2 || '',
        billingAddressPostcodeZip: request.billingAddressPostcodeZip || '',
        billingAddressStateProvince: request.billingAddressStateProvince || ''
      });

      // Backend handles checkValue generation and Payable API call
      // Response should contain the payment URL to redirect to
      if (response.paymentUrl) {
        console.log('✅ [PAYMENT] Backend initiated payment, redirecting to:', response.paymentUrl);
        window.location.href = response.paymentUrl;
      } else {
        throw new Error('Backend did not return payment URL');
      }
    } catch (error) {
      console.error('❌ [PAYMENT] Failed to initiate regular payment:', error);
      throw error;
    }
  }

  /**
   * Process payment with card tokenization (paymentType = '3') - Now uses backend API
   */
  public async processTokenizePayment(request: PaymentRequest): Promise<void> {
    try {
      console.log('💳 [PAYMENT] Initiating tokenize payment via backend API');
      
      const customerRefNo = request.customerRefNo || `CUST${Date.now()}`;
      
      const response = await apiService.initiateTokenizePayment({
        amount: request.amount,
        invoiceId: request.invoiceId || this.generateInvoiceId(),
        orderDescription: request.orderDescription,
        customerFirstName: request.customerFirstName,
        customerLastName: request.customerLastName,
        customerEmail: request.customerEmail,
        customerMobilePhone: request.customerMobilePhone,
        customerPhone: request.customerPhone || '',
        billingAddressStreet: request.billingAddressStreet,
        billingAddressCity: request.billingAddressCity,
        billingAddressCountry: request.billingAddressCountry,
        billingCompanyName: request.billingCompanyName || '',
        billingAddressStreet2: request.billingAddressStreet2 || '',
        billingAddressPostcodeZip: request.billingAddressPostcodeZip || '',
        billingAddressStateProvince: request.billingAddressStateProvince || '',
        customerRefNo,
        isSaveCard: request.isSaveCard || '1',
        doFirstPayment: request.doFirstPayment || '1'
      });

      // Backend handles checkValue generation and Payable API call
      // Response should contain the payment URL to redirect to
      if (response.paymentUrl) {
        console.log('✅ [PAYMENT] Backend initiated tokenize payment, redirecting to:', response.paymentUrl);
        window.location.href = response.paymentUrl;
      } else {
        throw new Error('Backend did not return payment URL');
      }
    } catch (error) {
      console.error('❌ [PAYMENT] Failed to initiate tokenize payment:', error);
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
   * Pay with saved card using JWT authentication - Now uses backend API
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
      console.log('💳 [PAYMENT] Paying with saved card via backend API');
      
      const response = await apiService.payWithToken({
        customerId,
        tokenId,
        amount,
        invoiceId,
        orderDescription,
        webhookUrl,
        custom1,
        custom2
      });

      // Backend handles checkValue generation and Payable API call
      if (response.success) {
        console.log('✅ [PAYMENT] Payment with saved card successful');
        if (response.redirectUrl) {
          window.location.href = response.redirectUrl;
        } else if (response.payableTransactionId) {
          window.location.href = `/payment/success?transaction=${response.payableTransactionId}`;
        }
      } else {
        throw new Error(response.error || 'Payment failed');
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
}

export const paymentService = PaymentService.getInstance();
