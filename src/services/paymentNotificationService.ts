/**
 * Payment Notification Service
 * Handles frontend notification of payment status changes since webhooks are server-side only
 */

import { backendPaymentService } from './backendPaymentService';

interface PaymentStatus {
  invoiceId: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  timestamp: number;
}

class PaymentNotificationService {
  private pollingInterval: number = 3000; // 3 seconds
  private maxPollingTime: number = 300000; // 5 minutes
  private activePolls: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Start polling for payment status after initiating payment
   */
  startPaymentStatusPolling(invoiceId: string, onStatusChange: (status: PaymentStatus) => void): void {
    console.log('🔄 [PAYMENT POLLING] Starting status polling for invoice:', invoiceId);
    
    const startTime = Date.now();
    
    const poll = async () => {
      try {
        // Check if we've exceeded max polling time
        if (Date.now() - startTime > this.maxPollingTime) {
          console.log('⏰ [PAYMENT POLLING] Max polling time reached for invoice:', invoiceId);
          this.stopPaymentStatusPolling(invoiceId);
          onStatusChange({
            invoiceId,
            status: 'PENDING',
            timestamp: Date.now()
          });
          return;
        }

        // Query backend for transaction status
        const transactions = await backendPaymentService.getPaymentTransactions();
        const transaction = transactions.transactions.find(t => t.invoiceId === invoiceId);
        
        if (transaction) {
          console.log('✅ [PAYMENT POLLING] Found transaction status:', transaction.status);
          
          // Stop polling and notify
          this.stopPaymentStatusPolling(invoiceId);
          onStatusChange({
            invoiceId,
            status: transaction.status,
            timestamp: Date.now()
          });
        } else {
          // Continue polling
          const timeoutId = setTimeout(poll, this.pollingInterval);
          this.activePolls.set(invoiceId, timeoutId);
        }
      } catch (error) {
        console.error('❌ [PAYMENT POLLING] Error checking payment status:', error);
        // Continue polling on error
        const timeoutId = setTimeout(poll, this.pollingInterval);
        this.activePolls.set(invoiceId, timeoutId);
      }
    };

    // Start polling
    poll();
  }

  /**
   * Stop polling for payment status
   */
  stopPaymentStatusPolling(invoiceId: string): void {
    const timeoutId = this.activePolls.get(invoiceId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.activePolls.delete(invoiceId);
      console.log('🛑 [PAYMENT POLLING] Stopped polling for invoice:', invoiceId);
    }
  }

  /**
   * Stop all active polling
   */
  stopAllPolling(): void {
    for (const [invoiceId, timeoutId] of this.activePolls) {
      clearTimeout(timeoutId);
      console.log('🛑 [PAYMENT POLLING] Stopped polling for invoice:', invoiceId);
    }
    this.activePolls.clear();
  }

  /**
   * Check if polling is active for an invoice
   */
  isPollingActive(invoiceId: string): boolean {
    return this.activePolls.has(invoiceId);
  }
}

export const paymentNotificationService = new PaymentNotificationService();