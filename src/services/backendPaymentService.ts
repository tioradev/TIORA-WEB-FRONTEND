/**
 * Backend API service for payment operations
 * Handles communication with the backend payment APIs
 */

// API Response Types
export interface PaymentConfigResponse {
  merchantKey: string;
  businessKey: string;
  testMode: boolean;
  currency: string;
  supportedPaymentMethods: string[];
}

export interface SavedTokenResponse {
  id: number;
  tokenId: string;
  customerId: number;
  salonId: number;
  maskedCardNo: string;
  cardExpiry: string;
  cardScheme: string;
  cardHolderName: string;
  nickname?: string;
  isDefaultCard: boolean;
  tokenStatus: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  createdAt: string;
  lastUsedAt?: string;
}

export interface PaymentTransactionResponse {
  id: number;
  invoiceId: string;
  payableOrderId: string;
  payableTransactionId: string;
  customerId: number;
  salonId: number;
  appointmentId?: string;
  amount: number;
  currencyCode: string;
  paymentType: string;
  paymentMethod: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  statusMessage: string;
  createdAt: string;
  processedAt?: string;
}

// Request Types
export interface SaveTokenRequest {
  tokenId: string;
  customerRefNo: string;
  customerId: number;
  salonId: number;
  maskedCardNo: string;
  cardExpiry: string;
  cardScheme: string;
  cardHolderName: string;
  nickname?: string;
  isDefaultCard: boolean;
  tokenStatus: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  reference?: string;
  payableMerchantId: string;
  payableCustomerId: string;
}

export interface SaveTransactionRequest {
  invoiceId: string;
  payableOrderId: string;
  payableTransactionId: string;
  customerId: number;
  salonId: number;
  appointmentId?: string;
  amount: number;
  currencyCode: string;
  paymentType: string;
  paymentMethod: string;
  paymentScheme?: string;
  cardHolderName?: string;
  maskedCardNo?: string;
  paymentTokenId?: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  statusCode: number;
  statusMessage: string;
  gatewayResponse?: string;
  checkValue?: string;
  custom1?: string;
  custom2?: string;
  orderDescription?: string;
  notifyUrl?: string;
  returnUrl?: string;
}

class BackendPaymentService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('authToken');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API Error ${response.status}: ${errorData}`);
    }

    return response.json();
  }

  /**
   * Get payment configuration
   */
  async getPaymentConfig(): Promise<PaymentConfigResponse> {
    console.log('🔄 [BACKEND API] Getting payment config');
    return this.makeRequest<PaymentConfigResponse>('/payments/config');
  }

  /**
   * Save payment token after successful tokenization
   */
  async savePaymentToken(tokenData: SaveTokenRequest): Promise<{ success: boolean; tokenId: string }> {
    console.log('🔄 [BACKEND API] Saving payment token:', tokenData);
    return this.makeRequest('/payments/tokens/save', {
      method: 'POST',
      body: JSON.stringify(tokenData),
    });
  }

  /**
   * Get saved payment tokens for a customer
   */
  async getSavedTokens(customerId: number, salonId: number): Promise<{ tokens: SavedTokenResponse[]; total: number }> {
    console.log('🔄 [BACKEND API] Getting saved tokens for customer:', customerId, 'salon:', salonId);
    return this.makeRequest(
      `/payments/tokens?customerId=${customerId}&salonId=${salonId}`
    );
  }

  /**
   * Save payment transaction details
   */
  async savePaymentTransaction(transactionData: SaveTransactionRequest): Promise<{ success: boolean; transactionId: string }> {
    console.log('🔄 [BACKEND API] Saving payment transaction:', transactionData);
    return this.makeRequest('/payments/transactions/save', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  }

  /**
   * Get payment transactions
   */
  async getPaymentTransactions(customerId?: number, salonId?: number): Promise<{ transactions: PaymentTransactionResponse[]; total: number }> {
    const params = new URLSearchParams();
    if (customerId) params.append('customerId', customerId.toString());
    if (salonId) params.append('salonId', salonId.toString());
    
    const queryString = params.toString();
    const endpoint = `/payments/transactions${queryString ? `?${queryString}` : ''}`;
    
    console.log('🔄 [BACKEND API] Getting payment transactions:', endpoint);
    return this.makeRequest(endpoint);
  }

  /**
   * @deprecated - No longer used. Frontend calls Payable directly, webhook saves transaction data.
   * Create transaction record before payment (for tracking)
   */
  async initializeTransaction(data: {
    invoiceId: string;
    customerId: number;
    salonId: number;
    amount: number;
    paymentType: string;
    orderDescription: string;
    appointmentChargeIds?: number[];
  }): Promise<{ success: boolean; transactionId: string }> {
    console.log('🔄 [BACKEND API] Initializing transaction:', data);
    
    const transactionData: SaveTransactionRequest = {
      invoiceId: data.invoiceId,
      payableOrderId: '', // Will be filled by webhook
      payableTransactionId: '', // Will be filled by webhook
      customerId: data.customerId,
      salonId: data.salonId,
      amount: data.amount,
      currencyCode: 'LKR',
      paymentType: data.paymentType,
      paymentMethod: 'CARD',
      status: 'PENDING',
      statusCode: 0,
      statusMessage: 'Payment initiated',
      orderDescription: data.orderDescription,
    };

    return this.savePaymentTransaction(transactionData);
  }

  /**
   * @deprecated - No longer used. Webhook saves complete transaction data directly.
   * Update transaction status (typically called by webhook)
   */
  async updateTransactionStatus(
    invoiceId: string, 
    status: 'SUCCESS' | 'FAILED' | 'CANCELLED',
    payableData?: {
      payableOrderId: string;
      payableTransactionId: string;
      statusCode: number;
      statusMessage: string;
      paymentScheme?: string;
      cardHolderName?: string;
      maskedCardNo?: string;
    }
  ): Promise<{ success: boolean }> {
    const endpoint = '/payments/transactions/update';
    
    const data = {
      invoiceId,
      status,
      payableOrderId: payableData?.payableOrderId,
      payableTransactionId: payableData?.payableTransactionId,
      statusCode: payableData?.statusCode,
      statusMessage: payableData?.statusMessage,
      paymentScheme: payableData?.paymentScheme,
      cardHolderName: payableData?.cardHolderName,
      maskedCardNo: payableData?.maskedCardNo,
      processedAt: new Date().toISOString()
    };
    
    console.log(`📝 [BACKEND API] Updating transaction status for invoice ${invoiceId}:`, data);
    
    try {
      const response = await this.makeRequest(endpoint, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      console.log(`✅ [BACKEND API] Transaction status updated successfully:`, response);
      return { success: true };
    } catch (error) {
      console.error(`❌ [BACKEND API] Failed to update transaction status:`, error);
      // Return success anyway to avoid breaking the webhook flow
      return { success: false };
    }
  }
}

export const backendPaymentService = new BackendPaymentService();
export type { SavedTokenResponse as BackendSavedCard };