# Payment Webhook Integration Guide

## 🔍 Problem Identified

The current frontend webhook handler **will not work** because:

1. **Webhooks are server-to-server calls** - Payable IPG calls your backend, not frontend
2. **Frontend cannot receive HTTP callbacks** - Browsers cannot listen for external HTTP requests
3. **Localhost testing limitation** - Webhooks require publicly accessible URLs

## ✅ Correct Implementation Required

### 1. Backend Webhook Endpoint

Your backend needs to implement a webhook endpoint:

```typescript
// Backend: /api/payments/webhook
app.post('/api/payments/webhook', async (req, res) => {
  const webhookData = req.body;
  
  console.log('🔔 [WEBHOOK] Received Payable notification:', webhookData);
  
  try {
    if (webhookData.statusCode === 1 && webhookData.statusMessage === 'SUCCESS') {
      // Handle successful payment
      if (webhookData.paymentType === 3) {
        // Tokenization - save token
        await saveTokenToDatabase({
          tokenId: webhookData.token.tokenId,
          customerRefNo: webhookData.customerRefNo,
          salonId: extractSalonId(webhookData.customerRefNo),
          maskedCardNo: webhookData.token.maskedCardNo,
          cardExpiry: webhookData.token.exp,
          cardScheme: webhookData.paymentScheme,
          cardHolderName: webhookData.cardHolderName,
          nickname: webhookData.token.nickname,
          isDefaultCard: webhookData.token.defaultCard === 1,
          tokenStatus: 'ACTIVE',
          payableMerchantId: webhookData.merchantId,
          payableCustomerId: webhookData.customerId
        });
      }
      
      // Save transaction (both tokenization and regular payments)
      await saveTransactionToDatabase({
        invoiceId: webhookData.invoiceNo,
        payableOrderId: webhookData.payableOrderId,
        payableTransactionId: webhookData.payableTransactionId,
        salonId: extractSalonId(webhookData.customerRefNo),
        amount: parseFloat(webhookData.payableAmount),
        currencyCode: webhookData.payableCurrency,
        paymentType: webhookData.paymentType === 3 ? 'TOKENIZATION' : 'ONE_TIME_PAYMENT',
        paymentMethod: 'CARD',
        paymentScheme: webhookData.paymentScheme,
        cardHolderName: webhookData.cardHolderName,
        maskedCardNo: webhookData.cardNumber || webhookData.token?.maskedCardNo,
        status: 'SUCCESS',
        statusCode: webhookData.statusCode,
        statusMessage: webhookData.statusMessage,
        checkValue: webhookData.checkValue,
        custom1: webhookData.custom1,
        custom2: webhookData.custom2
      });
    } else {
      // Handle failed payment
      await saveTransactionToDatabase({
        invoiceId: webhookData.invoiceNo,
        payableOrderId: webhookData.payableOrderId,
        payableTransactionId: webhookData.payableTransactionId,
        salonId: extractSalonId(webhookData.customerRefNo),
        amount: parseFloat(webhookData.payableAmount || '0'),
        currencyCode: webhookData.payableCurrency || 'LKR',
        paymentType: webhookData.paymentType === 3 ? 'TOKENIZATION' : 'ONE_TIME_PAYMENT',
        paymentMethod: 'CARD',
        status: 'FAILED',
        statusCode: webhookData.statusCode,
        statusMessage: webhookData.statusMessage
      });
    }
    
    // Always return 200 status to acknowledge receipt
    res.status(200).json({ Status: 200 });
  } catch (error) {
    console.error('❌ [WEBHOOK] Error processing webhook:', error);
    // Still return 200 to prevent retries
    res.status(200).json({ Status: 200 });
  }
});
```

### 2. Payable IPG Configuration

Configure your Payable IPG with:
- **notifyUrl**: `https://yourdomain.com/api/payments/webhook`
- **returnUrl**: `https://yourdomain.com/payment-success`

### 3. Frontend Notification System

Since frontend can't receive webhooks directly, we implemented a polling system:

```typescript
// Frontend: polls backend for status updates
paymentNotificationService.startPaymentStatusPolling(invoiceId, (status) => {
  if (status.status === 'SUCCESS') {
    showToast('success', 'Payment Successful', 'Your payment has been processed.');
    loadSavedCards(); // Refresh UI
  } else if (status.status === 'FAILED') {
    showToast('error', 'Payment Failed', 'Payment could not be processed.');
  }
});
```

## 🚀 Implementation Steps

### Step 1: Backend Webhook Setup
1. Create `/api/payments/webhook` endpoint in your backend
2. Implement token saving logic using `/api/payments/tokens/save`
3. Implement transaction saving logic using `/api/payments/transactions/save`
4. Deploy backend to publicly accessible URL

### Step 2: Payable IPG Configuration
1. Update Payable IPG settings with your webhook URL
2. Set notifyUrl to `https://yourdomain.com/api/payments/webhook`
3. Test with Payable's sandbox environment

### Step 3: Frontend Integration
1. Use the polling service for status updates ✅ (Already implemented)
2. Remove client-side webhook handler ✅ (Already implemented)
3. Test the complete flow

## 🔗 Payment Flow

### Add Card Flow:
```
1. Frontend → Payable IPG (Tokenization)
2. User completes payment on Payable
3. Payable → Backend Webhook (/api/payments/webhook)
4. Backend → Save token (/api/payments/tokens/save)
5. Backend → Save transaction (/api/payments/transactions/save)
6. Frontend → Polls for status → UI Update
```

### Regular Payment Flow:
```
1. Frontend → Payable IPG (One-time payment)
2. User completes payment on Payable
3. Payable → Backend Webhook (/api/payments/webhook)
4. Backend → Save transaction (/api/payments/transactions/save)
5. Frontend → Polls for status → UI Update
```

## ⚠️ Important Notes

1. **Testing**: Webhooks cannot be tested on localhost - use ngrok or deploy to test
2. **Security**: Validate webhook signatures to ensure requests come from Payable
3. **Reliability**: Always return 200 status to prevent webhook retries
4. **Logging**: Log all webhook data for debugging and audit trails

## 📋 Current Status

✅ **Frontend**: Updated to use polling instead of client-side webhooks
✅ **API Integration**: Backend service ready for webhook data
⚠️ **Backend Webhook**: Needs to be implemented in your backend server
⚠️ **Deployment**: Backend needs to be deployed for webhook testing

The frontend is now correctly implemented. The next step is implementing the backend webhook endpoint using the provided code structure.