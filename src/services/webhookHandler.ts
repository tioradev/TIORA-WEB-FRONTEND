/**
 * Webhook handler for Payable IPG payment notifications
 * Now integrated with backend APIs
 */

import { backendPaymentService } from './backendPaymentService';

interface PayableWebhookResponse {
  merchantKey: string;
  payableOrderId: string;
  payableTransactionId: string;
  payableAmount: string;
  payableCurrency: string;
  invoiceNo: string;
  statusCode: number;
  statusMessage: string;
  paymentType: number;
  paymentMethod: number;
  paymentScheme: string;
  cardHolderName?: string;
  cardNumber?: string;
  checkValue: string;
  
  // Additional fields for tokenization payments
  customerRefNo?: string;
  paymentId?: string;
  merchantId?: string;  // This is what we need for API calls!
  customerId?: string;
  uid?: string;
  statusIndicator?: string;
  token?: {
    tokenId: string;
    maskedCardNo: string;
    exp: string;
    reference?: string;
    nickname?: string;
    tokenStatus: string;
    defaultCard: number;
  };
  custom1?: string;
  custom2?: string;
}

class WebhookHandler {
  /**
   * Handle incoming webhook from Payable IPG
   */
  public async handleWebhook(webhookData: PayableWebhookResponse): Promise<{ Status: number }> {
    console.log('🔔 [WEBHOOK] Received Payable IPG notification:', webhookData);
    
    try {
      // Store merchant ID if it's a tokenization payment
      if (webhookData.paymentType === 3 && webhookData.merchantId) {
        this.storeMerchantId(webhookData.merchantId);
        console.log('💾 [WEBHOOK] Stored merchant ID for API calls:', webhookData.merchantId);
      }
      
      // Handle successful payments
      if (webhookData.statusCode === 1 && webhookData.statusMessage === 'SUCCESS') {
        if (webhookData.paymentType === 3) {
          // Tokenization payment
          await this.handleTokenizationSuccess(webhookData);
        } else {
          // Regular payment
          await this.handlePaymentSuccess(webhookData);
        }
      } else {
        // Handle failed payments
        await this.handlePaymentFailure(webhookData);
      }
      
      // Always return 200 status to acknowledge receipt
      return { Status: 200 };
    } catch (error) {
      console.error('❌ [WEBHOOK] Error processing webhook:', error);
      // Still return 200 to acknowledge receipt
      return { Status: 200 };
    }
  }
  
  /**
   * Store merchant ID in localStorage for API calls
   */
  private storeMerchantId(merchantId: string): void {
    try {
      localStorage.setItem('payable_merchant_id', merchantId);
      console.log('✅ [WEBHOOK] Merchant ID stored successfully:', merchantId);
    } catch (error) {
      console.error('❌ [WEBHOOK] Failed to store merchant ID:', error);
    }
  }
  
  /**
   * Get stored merchant ID for API calls
   */
  public getStoredMerchantId(): string | null {
    try {
      return localStorage.getItem('payable_merchant_id');
    } catch (error) {
      console.error('❌ [WEBHOOK] Failed to retrieve merchant ID:', error);
      return null;
    }
  }
  
  /**
   * Handle successful tokenization payment
   */
  private async handleTokenizationSuccess(webhookData: PayableWebhookResponse): Promise<void> {
    console.log('🎉 [WEBHOOK] Tokenization successful:', {
      tokenId: webhookData.token?.tokenId,
      maskedCardNo: webhookData.token?.maskedCardNo,
      customerId: webhookData.customerId,
      merchantId: webhookData.merchantId
    });
    
    try {
      // Save token to backend database
      if (webhookData.token && webhookData.customerId) {
        const numericCustomerId = parseInt(webhookData.customerId) || 1;
        const salonId = this.extractSalonIdFromCustomerRefNo(webhookData.customerRefNo || '');
        
        await backendPaymentService.savePaymentToken({
          tokenId: webhookData.token.tokenId,
          customerRefNo: webhookData.customerRefNo || '',
          customerId: numericCustomerId,
          salonId,
          maskedCardNo: webhookData.token.maskedCardNo,
          cardExpiry: webhookData.token.exp,
          cardScheme: webhookData.paymentScheme,
          cardHolderName: webhookData.cardHolderName || '',
          nickname: webhookData.token.nickname,
          isDefaultCard: webhookData.token.defaultCard === 1,
          tokenStatus: 'ACTIVE',
          reference: webhookData.token.reference,
          payableMerchantId: webhookData.merchantId || '',
          payableCustomerId: webhookData.customerId
        });
        
        console.log('✅ [WEBHOOK] Token saved to backend database');
      }
      
      // Update transaction status in backend
      await backendPaymentService.updateTransactionStatus(
        webhookData.invoiceNo,
        'SUCCESS',
        {
          payableOrderId: webhookData.payableOrderId,
          payableTransactionId: webhookData.payableTransactionId,
          statusCode: webhookData.statusCode,
          statusMessage: webhookData.statusMessage,
          paymentScheme: webhookData.paymentScheme,
          cardHolderName: webhookData.cardHolderName,
          maskedCardNo: webhookData.token?.maskedCardNo
        }
      );
      
      // Trigger a refresh of saved cards if the payment page is open
      window.dispatchEvent(new CustomEvent('payable-tokenization-success', {
        detail: webhookData
      }));
    } catch (error) {
      console.error('❌ [WEBHOOK] Error saving tokenization data:', error);
    }
  }
  
  /**
   * Handle successful regular payment
   */
  private async handlePaymentSuccess(webhookData: PayableWebhookResponse): Promise<void> {
    console.log('🎉 [WEBHOOK] Payment successful:', {
      amount: webhookData.payableAmount,
      transactionId: webhookData.payableTransactionId,
      paymentScheme: webhookData.paymentScheme
    });
    
    try {
      // Update transaction status in backend
      await backendPaymentService.updateTransactionStatus(
        webhookData.invoiceNo,
        'SUCCESS',
        {
          payableOrderId: webhookData.payableOrderId,
          payableTransactionId: webhookData.payableTransactionId,
          statusCode: webhookData.statusCode,
          statusMessage: webhookData.statusMessage,
          paymentScheme: webhookData.paymentScheme,
          cardHolderName: webhookData.cardHolderName,
          maskedCardNo: webhookData.cardNumber
        }
      );
      
      console.log('✅ [WEBHOOK] Payment transaction updated in backend');
      
      // Trigger payment success event
      window.dispatchEvent(new CustomEvent('payable-payment-success', {
        detail: webhookData
      }));
    } catch (error) {
      console.error('❌ [WEBHOOK] Error updating payment transaction:', error);
    }
  }
  
  /**
   * Handle payment failure
   */
  private async handlePaymentFailure(webhookData: PayableWebhookResponse): Promise<void> {
    console.log('❌ [WEBHOOK] Payment failed:', {
      statusCode: webhookData.statusCode,
      statusMessage: webhookData.statusMessage,
      invoiceNo: webhookData.invoiceNo
    });
    
    try {
      // Update transaction status in backend
      await backendPaymentService.updateTransactionStatus(
        webhookData.invoiceNo,
        'FAILED',
        {
          payableOrderId: webhookData.payableOrderId,
          payableTransactionId: webhookData.payableTransactionId,
          statusCode: webhookData.statusCode,
          statusMessage: webhookData.statusMessage
        }
      );
      
      console.log('✅ [WEBHOOK] Failed payment transaction updated in backend');
      
      // Trigger payment failure event
      window.dispatchEvent(new CustomEvent('payable-payment-failure', {
        detail: webhookData
      }));
    } catch (error) {
      console.error('❌ [WEBHOOK] Error updating failed payment transaction:', error);
    }
  }
  
  /**
   * Extract salon ID from customer reference number
   * Assumes format like "SALON123" -> 123
   */
  private extractSalonIdFromCustomerRefNo(customerRefNo: string): number {
    const match = customerRefNo.match(/SALON(\d+)/);
    return match ? parseInt(match[1]) : 1; // Default to 1 if not found
  }
}

export const webhookHandler = new WebhookHandler();
export type { PayableWebhookResponse };
