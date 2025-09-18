# Payable IPG Payment Gateway Integration

## Overview
This implementation integrates the Payable IPG payment gateway into the salon management system, allowing for secure online payment processing for appointment charges and other salon services.

## Features Implemented

### ✅ Core Payment Processing
- **One-time Payments**: Direct payment processing for appointment charges
- **Card Tokenization**: Save customer cards for future payments
- **Saved Card Payments**: Pay with previously saved cards
- **Webhook Validation**: Secure payment confirmation handling
- **Environment Configuration**: Configurable test/live mode settings

### ✅ Security Features
- **CheckValue Generation**: SHA512-based payment verification
- **Token Management**: Secure card tokenization using customer reference numbers
- **Webhook Signature Validation**: Verify payment notifications authenticity
- **Environment Variables**: Secure credential management

### ✅ User Interface
- **Payment Configuration Status**: Visual indication of gateway setup status
- **Saved Cards Management**: Display and manage customer saved cards
- **Real-time Payment Processing**: Loading states and progress indicators
- **Toast Notifications**: User-friendly success/error messaging
- **Responsive Design**: Mobile-friendly payment interface

## Configuration

### Environment Variables
Add these variables to your `.env` file:

```bash
# Payable IPG Merchant Credentials
VITE_PAYABLE_MERCHANT_KEY=your_merchant_key_here
VITE_PAYABLE_MERCHANT_TOKEN=your_merchant_token_here

# Payable IPG Business Credentials
VITE_PAYABLE_BUSINESS_KEY=your_business_key_here
VITE_PAYABLE_BUSINESS_TOKEN=your_business_token_here

# Test Mode (set to 'false' for production)
VITE_PAYABLE_TEST_MODE=true
```

### Getting Payable IPG Credentials
1. Sign up for a Payable IPG merchant account
2. Complete the merchant verification process
3. Access your dashboard to get credentials:
   - Merchant Key
   - Merchant Token
   - Business Key (for advanced features)
   - Business Token (for advanced features)

## Implementation Details

### File Structure
```
src/
├── config/
│   └── payableConfig.ts          # Environment configuration
├── services/
│   └── paymentService.ts         # Core payment service
├── components/
│   └── owner/
│       └── PaymentBilling.tsx    # Enhanced payment UI
└── types/
    └── payable-ipg-js.d.ts       # TypeScript definitions
```

### Key Components

#### PaymentService (`src/services/paymentService.ts`)
- **Singleton Pattern**: Ensures single payment service instance
- **CheckValue Generation**: Secure payment verification
- **Payment Processing**: One-time and tokenized payments
- **Card Management**: Retrieve and manage saved cards
- **Webhook Validation**: Verify payment notifications

#### PaymentBilling Component (`src/components/owner/PaymentBilling.tsx`)
- **Enhanced UI**: Payable IPG status and saved cards display
- **Real-time Processing**: Loading states and progress indicators
- **Error Handling**: Comprehensive error messaging
- **Toast Notifications**: User feedback system

### Payment Flow

#### One-time Payment
1. User clicks "Pay Pending Charges"
2. System validates Payable IPG configuration
3. Creates payment request with customer details
4. Generates secure checkValue
5. Redirects to Payable IPG payment gateway
6. Webhook confirms payment completion

#### Saved Card Payment
1. User loads saved cards by customer ID
2. Selects a saved card for payment
3. System processes payment using card token
4. Updates appointment charges status
5. Displays success/error notification

#### Card Tokenization
1. Customer completes first payment with card saving enabled
2. Payable IPG tokenizes the card details
3. Token stored with customer reference
4. Future payments use secure token instead of card details

## API Endpoints

### Payable IPG Integration
- **Payment Processing**: Uses `payablePayment()` function from SDK
- **Saved Cards**: `GET /ipg/v2/tokenize/listCard`
- **Token Payment**: `POST /ipg/v2/tokenize/pay`
- **Webhook**: `POST /api/payment/webhook` (your implementation)

### URL Configuration
- **Payment Gateway Sandbox**: `https://sandboxipgpayment.payable.lk/ipg/sandbox`
- **Payment Gateway Live**: `https://ipgpayment.payable.lk`
- **API Base Sandbox**: `https://sandboxipgpayment.payable.lk`
- **API Base Live**: `https://ipgpayment.payable.lk`
- **Redirect URLs**: Configurable success/failure pages

## Security Considerations

### CheckValue Generation
```typescript
// For regular payments
const checkValue = SHA512(`${merchantKey}|${invoiceId}|${amount}|${currency}|${hashedToken}`)

// For tokenized payments
const checkValue = SHA512(`${merchantKey}|${invoiceId}|${amount}|${currency}|${customerRefNo}|${hashedToken}`)
```

### Webhook Validation
```typescript
const calculatedCheckValue = SHA512(
  `${merchantKey}|${payableOrderId}|${payableTransactionId}|${amount}|${currency}|${invoiceNo}|${statusCode}|${hashedToken}`
);
return calculatedCheckValue === receivedCheckValue;
```

### Token Security
- Merchant tokens are SHA512 hashed before use
- Customer reference numbers used for card tokenization
- Webhook signatures validated for payment confirmation

## Testing

### Test Mode Configuration
- Set `VITE_PAYABLE_TEST_MODE=true` in environment
- Use test merchant credentials
- Test cards provided by Payable IPG
- No real money transactions

### Production Deployment
- Set `VITE_PAYABLE_TEST_MODE=false`
- Use live merchant credentials
- Implement webhook endpoint security
- Monitor transaction logs

## Webhook Implementation

### Required Webhook Endpoint
Create a webhook endpoint to handle payment notifications:

```typescript
// Backend webhook endpoint (example)
POST /api/payment/webhook
{
  "merchantKey": "MERCHANT_123",
  "payableOrderId": "ORDER_456",
  "payableTransactionId": "TXN_789",
  "payableAmount": "1000.00",
  "payableCurrency": "LKR",
  "invoiceNo": "INV123",
  "statusCode": "2", // 2 = Success
  "checkValue": "calculated_hash"
}
```

### Webhook Validation
Always validate webhook signatures and update database accordingly.

## Error Handling

### Common Issues
1. **Configuration Missing**: Environment variables not set
2. **Invalid Credentials**: Wrong merchant keys/tokens
3. **Network Errors**: Payment gateway connectivity issues
4. **Validation Failures**: CheckValue mismatches

### Error Responses
- Configuration errors shown in UI with setup guidance
- Payment failures displayed with user-friendly messages
- Network issues handled with retry mechanisms
- Webhook validation failures logged for security

## Support

### Debugging
- Check browser console for payment service logs
- Verify environment variables are loaded correctly
- Test with Payable IPG sandbox environment first
- Monitor webhook delivery and validation

### Resources
- [Payable IPG Documentation](https://payable.lk/docs)
- [Integration Guide](https://payable.lk/integration)
- [API Reference](https://payable.lk/api)

## Future Enhancements

### Planned Features
- **Recurring Payments**: Subscription-based billing
- **Multi-currency Support**: International payments
- **Payment Analytics**: Detailed transaction reporting
- **Customer Portal**: Self-service payment management
- **Mobile Payments**: QR code and mobile wallet integration

### Performance Optimizations
- Payment caching for faster processing
- Bulk payment processing for multiple charges
- Real-time payment status updates
- Enhanced error recovery mechanisms

## Conclusion

This Payable IPG integration provides a comprehensive payment solution for the salon management system with enterprise-grade security, user-friendly interface, and robust error handling. The implementation supports both test and production environments with complete webhook validation and card tokenization capabilities.
