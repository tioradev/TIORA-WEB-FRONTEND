import React, { useState } from 'react';
import { paymentService, PaymentRequest } from '../../services/paymentService';
import { CreditCard, TestTube, ShoppingCart } from 'lucide-react';

const PayableIPGTest: React.FC = () => {
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<string>('');

  const testOneTimePayment = async () => {
    setProcessing(true);
    setResult('');
    
    try {
      const paymentRequest: PaymentRequest = {
        amount: '100.00',
        invoiceId: paymentService.generateInvoiceId(),
        orderDescription: 'Test One-Time Payment - Salon Services',
        customerFirstName: 'John',
        customerLastName: 'Doe',
        customerEmail: 'john.doe@example.com',
        customerMobilePhone: '0715117264',
        customerPhone: '0115117264',
        paymentType: '1', // One-time payment
        billingAddressStreet: '123 Galle Road',
        billingAddressCity: 'Colombo',
<<<<<<< HEAD
        billingAddressCountry: 'LKA',
        billingAddressStateProvince: 'Western',
        billingAddressPostcodeZip: '00300',
        custom1: 'payment',
=======
        billingAddressCountry: 'LK',
        billingAddressStateProvince: 'Western',
        billingAddressPostcodeZip: '00300',
        custom1: 'test_payment',
>>>>>>> 804b2cc135593007e567ebfad89b61cf1df1f8d5
        custom2: 'salon_services'
      };

      await paymentService.processOneTimePayment(paymentRequest);
      setResult('✅ One-time payment initiated successfully! Redirecting to payment gateway...');
    } catch (error) {
      console.error('Payment error:', error);
      setResult(`❌ Payment failed: ${error}`);
    } finally {
      setProcessing(false);
    }
  };

  const testTokenizePayment = async () => {
    setProcessing(true);
    setResult('');
    
    try {
      const paymentRequest: PaymentRequest = {
        amount: '50.00',
        invoiceId: paymentService.generateInvoiceId(),
        orderDescription: 'Test Tokenize Payment - Save Card for Future',
        customerFirstName: 'Jane',
        customerLastName: 'Smith',
        customerEmail: 'jane.smith@example.com',
        customerMobilePhone: '0771234567',
        customerPhone: '0111234567',
        customerRefNo: `CUST_${Date.now()}`,
        paymentType: '3', // Tokenize payment
        isSaveCard: '1',
        doFirstPayment: '1',
        billingAddressStreet: '456 Kandy Road',
        billingAddressCity: 'Kandy',
<<<<<<< HEAD
        billingAddressCountry: 'LKA',
        billingAddressStateProvince: 'Central',
        billingAddressPostcodeZip: '20000',
        custom1: 'tokenize',
=======
        billingAddressCountry: 'LK',
        billingAddressStateProvince: 'Central',
        billingAddressPostcodeZip: '20000',
        custom1: 'tokenize_test',
>>>>>>> 804b2cc135593007e567ebfad89b61cf1df1f8d5
        custom2: 'card_saving'
      };

      await paymentService.processTokenizePayment(paymentRequest);
      setResult('✅ Tokenize payment initiated successfully! Card will be saved for future use.');
    } catch (error) {
      console.error('Tokenize error:', error);
      setResult(`❌ Tokenize payment failed: ${error}`);
    } finally {
      setProcessing(false);
    }
  };

  const testZeroAmountTokenize = async () => {
    setProcessing(true);
    setResult('');
    
    try {
      const paymentRequest: PaymentRequest = {
        amount: '0.00',
        invoiceId: paymentService.generateInvoiceId(),
        orderDescription: 'Test Zero Amount - Card Tokenization Only',
        customerFirstName: 'Mike',
        customerLastName: 'Johnson',
        customerEmail: 'mike.johnson@example.com',
        customerMobilePhone: '0759876543',
        customerRefNo: `CUST_${Date.now()}`,
        paymentType: '3', // Tokenize payment
        isSaveCard: '1',
        doFirstPayment: '0', // No initial payment
        billingAddressStreet: '789 Colombo Road',
        billingAddressCity: 'Gampaha',
<<<<<<< HEAD
        billingAddressCountry: 'LKA',
        billingAddressStateProvince: 'Western',
        billingAddressPostcodeZip: '11000',
        custom1: 'zero_tokenize',
=======
        billingAddressCountry: 'LK',
        billingAddressStateProvince: 'Western',
        billingAddressPostcodeZip: '11000',
        custom1: 'zero_amount_test',
>>>>>>> 804b2cc135593007e567ebfad89b61cf1df1f8d5
        custom2: 'tokenize_only'
      };

      await paymentService.processTokenizePayment(paymentRequest);
      setResult('✅ Zero amount tokenization initiated! Card will be saved without charge.');
    } catch (error) {
      console.error('Zero amount tokenize error:', error);
      setResult(`❌ Zero amount tokenization failed: ${error}`);
    } finally {
      setProcessing(false);
    }
  };

  const configStatus = paymentService.getConfigStatus();

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payable IPG Integration Test</h2>
        <p className="text-gray-600">Test the Payable IPG payment gateway integration</p>
      </div>

      {/* Configuration Status */}
      <div className={`mb-6 p-4 rounded-lg border-2 ${
        configStatus.isConfigured 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <div className="flex items-center space-x-2">
          <TestTube className={`w-5 h-5 ${
            configStatus.isConfigured ? 'text-green-600' : 'text-red-600'
          }`} />
          <span className={`font-semibold ${
            configStatus.isConfigured ? 'text-green-900' : 'text-red-900'
          }`}>
            Configuration Status: {configStatus.isConfigured ? 'Ready' : 'Incomplete'}
          </span>
        </div>
        <p className={`text-sm mt-1 ${
          configStatus.isConfigured ? 'text-green-700' : 'text-red-700'
        }`}>
          {configStatus.isConfigured 
            ? `Test Mode: ${configStatus.testMode ? 'Enabled' : 'Disabled'}`
            : `Missing: ${configStatus.missingFields.join(', ')}`
          }
        </p>
      </div>

      {/* Test Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={testOneTimePayment}
          disabled={processing || !configStatus.isConfigured}
          className="flex flex-col items-center p-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors duration-200"
        >
          <CreditCard className="w-8 h-8 mb-2" />
          <span className="font-semibold">One-Time Payment</span>
          <span className="text-sm opacity-90">Rs. 100.00</span>
        </button>

        <button
          onClick={testTokenizePayment}
          disabled={processing || !configStatus.isConfigured}
          className="flex flex-col items-center p-6 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors duration-200"
        >
          <ShoppingCart className="w-8 h-8 mb-2" />
          <span className="font-semibold">Tokenize Payment</span>
          <span className="text-sm opacity-90">Rs. 50.00 + Save Card</span>
        </button>

        <button
          onClick={testZeroAmountTokenize}
          disabled={processing || !configStatus.isConfigured}
          className="flex flex-col items-center p-6 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors duration-200"
        >
          <TestTube className="w-8 h-8 mb-2" />
          <span className="font-semibold">Zero Amount</span>
          <span className="text-sm opacity-90">Tokenize Only</span>
        </button>
      </div>

      {/* Result Display */}
      {result && (
        <div className={`p-4 rounded-lg border-2 ${
          result.startsWith('✅') 
            ? 'bg-green-50 border-green-200 text-green-900' 
            : 'bg-red-50 border-red-200 text-red-900'
        }`}>
          <pre className="whitespace-pre-wrap font-mono text-sm">{result}</pre>
        </div>
      )}

      {processing && (
        <div className="flex items-center justify-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Processing payment...</span>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Test Instructions:</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>One-Time Payment:</strong> Regular payment without saving card details</li>
          <li>• <strong>Tokenize Payment:</strong> Payment with card tokenization for future use</li>
          <li>• <strong>Zero Amount:</strong> Save card without charging (tokenize only)</li>
          <li>• Use test card details provided by Payable IPG in sandbox mode</li>
          <li>• Check webhook notifications for payment confirmations</li>
        </ul>
      </div>
    </div>
  );
};

export default PayableIPGTest;
