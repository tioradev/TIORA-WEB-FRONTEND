import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { paymentService, PaymentRequest } from '../../services/paymentService';
import { webhookHandler } from '../../services/webhookHandler';
import { webSocketPaymentService, PaymentStatusEvent, TokenSavedEvent } from '../../services/webSocketPaymentService';
import { testEnvironmentVariables } from '../../utils/environmentTest';
import { getCurrentConfig } from '../../config/environment';
import Toast from '../shared/Toast';
import { useAuth } from '../../contexts/AuthContext';

interface SavedCard {
  id: number;
  tokenId: string;
  customerRefNo: string;
  salonId: number;
  maskedCardNo: string;
  cardExpiry: string | null;
  cardScheme: string;
  cardHolderName: string;
  nickname: string | null;
  isDefaultCard: boolean;
  tokenStatus: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
}

interface AppointmentCharge {
  id: string;
  salonId: string;
  date: string;
  appointmentCount: number;
  chargePerAppointment: number;
  totalCharge: number;
  status: 'pending' | 'paid' | 'failed';
  scheduledAt: Date;
  paidAt?: Date;
  paymentMethod?: string;
}

interface PaymentOption {
  type: 'saved_card' | 'new_card';
  cardData?: SavedCard;
}

const PaymentBilling: React.FC = () => {
  // Get salon owner data from auth context
  const { salon } = useAuth();
  
  // Payable IPG Integration States
  const [payableConfig] = useState(paymentService.getConfigStatus());
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [redirectingToIPG, setRedirectingToIPG] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string>(''); // Will be set based on salon data
  
  // Toast states
  const [toasts, setToasts] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
  }>>([]);

  // Load saved cards on component mount
  useEffect(() => {
    // Set consistent customer ID based on salon data (alphanumeric only)
    if (salon?.salonId) {
      const customerId = `SALON${salon.salonId}`;
      setSelectedCustomer(customerId);
    } else if (salon?.ownerEmail) {
      // Fallback to email-based ID if salon ID not available (alphanumeric only)
      const customerId = `SALON${salon.ownerEmail.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}`;
      setSelectedCustomer(customerId);
    } else {
      // Final fallback (alphanumeric only)
      setSelectedCustomer('SALONCUSTOMER001');
    }
  }, [salon]);

  useEffect(() => {
    if (payableConfig.isConfigured && selectedCustomer) {
      loadSavedCards();
    }
    
    // Initialize WebSocket connection
    const initializeWebSocket = async () => {
      if (!salon?.salonId) {
        console.log('⚠️ [PAYMENT] No salon ID available, skipping WebSocket connection');
        return;
      }
      
      try {
        await webSocketPaymentService.connect(salon.salonId.toString());
        console.log('✅ [PAYMENT] WebSocket connected for real-time notifications');
        
        // Subscribe to token saved events for automatic card refresh
        webSocketPaymentService.subscribeToTokenEvents((event: TokenSavedEvent) => {
          console.log('🔔 [PAYMENT] Token saved via WebSocket:', event.tokenId, 'refreshing cards...');
          setTimeout(() => loadSavedCards(), 1000);
        });
        
      } catch (error) {
        console.error('❌ [PAYMENT] Failed to connect WebSocket:', error);
        showToast('warning', 'Real-time notifications unavailable', 'You may need to refresh manually');
      }
    };
    
    // Listen for webhook events (fallback for direct Payable events)
    const handleTokenizationSuccess = () => {
      console.log('🔔 [PAYMENT] Tokenization successful, refreshing cards...');
      setTimeout(() => loadSavedCards(), 2000); // Small delay to ensure backend processing
    };
    
    const handlePaymentSuccess = () => {
      console.log('🔔 [PAYMENT] Payment successful, refreshing data...');
      // Refresh both cards and pending charges
      setTimeout(() => {
        loadSavedCards();
        // In a real app, you'd also refresh the pending charges data
      }, 2000);
    };
    
    const handlePaymentFailure = (event: CustomEvent) => {
      console.log('🔔 [PAYMENT] Payment failed:', event.detail);
      showToast('error', 'Payment Failed', 'Your payment could not be processed. Please try again.');
    };
    
    // Initialize WebSocket
    initializeWebSocket();
    
    // Add event listeners
    window.addEventListener('payable-tokenization-success', handleTokenizationSuccess);
    window.addEventListener('payable-payment-success', handlePaymentSuccess);
    window.addEventListener('payable-payment-failure', handlePaymentFailure as EventListener);
    
    // Cleanup
    return () => {
      window.removeEventListener('payable-tokenization-success', handleTokenizationSuccess);
      window.removeEventListener('payable-payment-success', handlePaymentSuccess);
      window.removeEventListener('payable-payment-failure', handlePaymentFailure as EventListener);
      
      // Disconnect WebSocket
      webSocketPaymentService.disconnect();
    };
  }, [selectedCustomer, payableConfig.isConfigured]);

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Test environment configuration
  const handleTestEnvironment = () => {
    try {
      const result = testEnvironmentVariables();
      showToast(
        result.isValid ? 'success' : 'warning', 
        'Environment Test', 
        `Environment: ${result.environment}, WebSocket: ${result.wsUrl}`
      );
    } catch (error) {
      console.error('Environment test error:', error);
      showToast('error', 'Environment Test Failed', 'Check console for details');
    }
  };

  const loadSavedCards = async () => {
    if (!selectedCustomer || !salon?.salonId) return;
    
    setLoadingCards(true);
    setError(null);
    
    try {
      console.log('🔄 [PAYMENT] Loading saved cards from backend API for salon:', salon.salonId);
      
      // Get the authentication token
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      console.log('🔐 [PAYMENT] Using auth token:', token.substring(0, 20) + '...');
      
      // Call the new API endpoint with authentication
      const response = await fetch(`${getCurrentConfig().API_BASE_URL}/payments/tokens`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setSavedCards(data.tokens || []);
      console.log('✅ [PAYMENT] Successfully loaded', data.tokens?.length || 0, 'saved cards from backend API');
    } catch (error) {
      console.error('Failed to load saved cards:', error);
      
      if (error instanceof Error && error.message.includes('Authentication')) {
        setError('Authentication failed. Please log in again.');
        showToast('error', 'Authentication Error', 'Your session has expired. Please log in again.');
      } else {
        setError('Failed to load saved cards. Please try again.');
        showToast('error', 'Failed to load saved cards', 'Please check the console for debugging information.');
      }
      setSavedCards([]);
    } finally {
      setLoadingCards(false);
    }
  };

  // Function to delete saved card
  const handleDeleteSavedCard = async (tokenId: string) => {
    if (!window.confirm('Are you sure you want to delete this saved card?')) {
      return;
    }

    try {
      setProcessingPayment(true);
      const success = await paymentService.deleteSavedCard(tokenId);
      
      if (success) {
        showToast('success', 'Card Deleted', 'Saved card deleted successfully.');
        loadSavedCards(); // Reload the cards list
      } else {
        showToast('error', 'Delete Failed', 'Failed to delete saved card.');
      }
    } catch (error) {
      console.error('Delete card error:', error);
      showToast('error', 'Delete Failed', 'Unable to delete saved card.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Function to edit saved card
  const handleEditSavedCard = async (
    tokenId: string, 
    nickname?: string, 
    setAsDefault?: boolean
  ) => {
    try {
      setProcessingPayment(true);
      const success = await paymentService.editSavedCard(
        tokenId, 
        nickname, 
        setAsDefault ? 1 : 0
      );
      
      if (success) {
        showToast('success', 'Card Updated', 'Saved card updated successfully.');
        loadSavedCards(); // Reload the cards list
      } else {
        showToast('error', 'Update Failed', 'Failed to update saved card.');
      }
    } catch (error) {
      console.error('Edit card error:', error);
      showToast('error', 'Update Failed', 'Unable to update saved card.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Real appointment charges data - TODO: Replace with API call
  const [appointmentCharges, setAppointmentCharges] = useState<AppointmentCharge[]>([
    {
      id: '1',
      salonId: 'salon1',
      date: new Date().toISOString().split('T')[0], // Today's date
      appointmentCount: 12,
      chargePerAppointment: 50,
      totalCharge: 600,
      status: 'pending',
      scheduledAt: new Date(),
    },
    {
      id: '2',
      salonId: 'salon1',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
      appointmentCount: 8,
      chargePerAppointment: 50,
      totalCharge: 400,
      status: 'paid',
      scheduledAt: new Date(Date.now() - 86400000),
      paidAt: new Date(Date.now() - 86400000 + 300000),
      paymentMethod: 'Payable IPG',
    },
  ]);

  // Calculate active cards from saved cards
  const activeCards = savedCards.filter(card => card.tokenStatus === 'ACTIVE').length;
  
  // Appointment charge metrics
  const pendingCharges = appointmentCharges.filter(charge => charge.status === 'pending');
  const totalPendingAmount = pendingCharges.reduce((sum, charge) => sum + charge.totalCharge, 0);
  const todayCharges = appointmentCharges.filter(charge => charge.date === new Date().toISOString().split('T')[0]);
  const todayIncome = todayCharges.reduce((sum, charge) => charge.status === 'paid' ? sum + charge.totalCharge : sum, 0);
  const monthlyIncome = appointmentCharges
    .filter(charge => charge.status === 'paid' && new Date(charge.date).getMonth() === new Date().getMonth())
    .reduce((sum, charge) => sum + charge.totalCharge, 0);

  // CRUD Functions
  const handleAddCard = async () => {
    if (!payableConfig.isConfigured) {
      showToast('warning', 'Payment Gateway Not Configured', 'Please configure Payable IPG in environment settings.');
      return;
    }

    if (!selectedCustomer) {
      showToast('error', 'Customer ID Missing', 'Unable to determine customer ID. Please try again.');
      return;
    }

    try {
      setProcessingPayment(true);
      setRedirectingToIPG(true);
      setError(null);
      
      // Generate invoice ID for tracking
      const invoiceId = paymentService.generateInvoiceId();
      
      // Create tokenization payment request (zero amount to save card only)
      const paymentRequest: PaymentRequest = {
        amount: '0.00', // Zero amount for card tokenization only
        currencyCode: 'LKR',
        invoiceId,
        orderDescription: 'Add Payment Card - Tokenization Only',
        customerFirstName: salon?.ownerFirstName || 'Salon',
        customerLastName: salon?.ownerLastName || 'Owner',
        customerEmail: salon?.ownerEmail || 'owner@salon.com',
        customerMobilePhone: salon?.ownerPhone?.startsWith('+') ? salon.ownerPhone : `+94${salon?.ownerPhone?.replace(/^0/, '') || '771234567'}`,
        customerRefNo: selectedCustomer,
        paymentType: '3', // Tokenize payment
        isSaveCard: '1', // Save card for future use
        doFirstPayment: '0', // No initial payment
        billingAddressStreet: 'N/A',
        billingAddressCity: salon?.district || 'Colombo',
        billingAddressCountry: 'LKA',
        billingAddressStateProvince: 'Western',
        billingAddressPostcodeZip: salon?.postalCode || '00100'
      };

      console.log('🔍 [PAYMENT] Add card with customer ID:', selectedCustomer);

      // Subscribe to payment status via WebSocket
      webSocketPaymentService.subscribeToPayment(invoiceId, (status: PaymentStatusEvent) => {
        console.log('🔔 [PAYMENT] Payment status update via WebSocket:', status);
        
        if (status.status === 'SUCCESS') {
          showToast('success', 'Card Added Successfully', 'Your payment card has been saved for future use.');
          loadSavedCards(); // Refresh the cards list
        } else if (status.status === 'FAILED') {
          showToast('error', 'Card Addition Failed', 'Unable to save your payment card. Please try again.');
        }
        setRedirectingToIPG(false);
      });
      
      showToast('info', 'Redirecting to Payment Gateway', 'Please wait while we redirect you to add your payment card...');
      
      // Add a small delay before redirecting
      setTimeout(async () => {
        await paymentService.processTokenizePayment(paymentRequest);
      }, 1500);
      
    } catch (error) {
      console.error('Add card error:', error);
      setError('Failed to add card. Please try again.');
      showToast('error', 'Add Card Failed', 'Unable to add payment card. Please try again.');
      setRedirectingToIPG(false);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handlePayPendingCharges = async () => {
    if (!payableConfig.isConfigured) {
      showToast('warning', 'Payment Gateway Not Configured', 'Please configure Payable IPG in environment settings.');
      return;
    }

    const totalAmount = totalPendingAmount.toFixed(2);
    if (totalAmount === '0.00') {
      showToast('info', 'No Pending Charges', 'There are no pending charges to pay.');
      return;
    }

    // Check if there are saved cards
    const activeCards = savedCards.filter(card => card.tokenStatus === 'ACTIVE');
    if (activeCards.length > 0) {
      setShowPaymentOptions(true);
      return;
    }

    // No saved cards, proceed with new card payment
    await handlePayWithNewCard();
  };

  const handlePayWithNewCard = async () => {
    const totalAmount = totalPendingAmount.toFixed(2);
    
    try {
      setProcessingPayment(true);
      setLoadingPayment(true);
      setRedirectingToIPG(true);
      setError(null);
      
      // Generate invoice ID for tracking
      const invoiceId = paymentService.generateInvoiceId();
      
      // Create payment request for Payable IPG
      const paymentRequest: PaymentRequest = {
        amount: totalAmount,
        currencyCode: 'LKR',
        invoiceId,
        orderDescription: `Salon Appointment Charges - ${pendingCharges.length} charges`,
        customerFirstName: salon?.ownerFirstName || 'Salon',
        customerLastName: salon?.ownerLastName || 'Owner',
        customerEmail: salon?.ownerEmail || 'owner@salon.com',
        customerMobilePhone: salon?.ownerPhone?.startsWith('+') ? salon.ownerPhone : `+94${salon?.ownerPhone?.replace(/^0/, '') || '771234567'}`,
        customerRefNo: selectedCustomer || `SALON${Date.now()}`,
        paymentType: '1',
        billingAddressStreet: 'N/A',
        billingAddressCity: salon?.district || 'Colombo',
        billingAddressCountry: 'LKA',
        billingAddressStateProvince: 'Western',
        billingAddressPostcodeZip: salon?.postalCode || '00100'
      };

      // Subscribe to payment status via WebSocket
      webSocketPaymentService.subscribeToPayment(invoiceId, (status: PaymentStatusEvent) => {
        console.log('🔔 [PAYMENT] Payment status update via WebSocket:', status);
        
        if (status.status === 'SUCCESS') {
          showToast('success', 'Payment Successful', `Successfully paid Rs. ${totalAmount} for appointment charges.`);
        } else if (status.status === 'FAILED') {
          showToast('error', 'Payment Failed', 'Unable to process payment. Please try again.');
        }
        setRedirectingToIPG(false);
      });

      showToast('info', 'Redirecting to Payment Gateway', 'Please wait while we redirect you to the payment gateway...');
      
      // Add a small delay before redirecting
      setTimeout(async () => {
        await paymentService.processOneTimePayment(paymentRequest);
      }, 1500);
      
    } catch (error) {
      console.error('Payment error:', error);
      setError('Failed to process payment. Please try again.');
      showToast('error', 'Payment Failed', 'Unable to process payment. Please try again.');
      setRedirectingToIPG(false);
    } finally {
      setProcessingPayment(false);
      setLoadingPayment(false);
    }
  };  // Function to pay with saved card
  const handlePayWithSavedCard = async (tokenId: string) => {
    if (!payableConfig.isConfigured) {
      showToast('warning', 'Payment Gateway Not Configured', 'Please configure Payable IPG first.');
      return;
    }

    const totalAmount = totalPendingAmount.toFixed(2);
    if (totalAmount === '0.00') {
      showToast('info', 'No Pending Charges', 'There are no pending charges to pay.');
      return;
    }

    try {
      setProcessingPayment(true);
      setRedirectingToIPG(true);
      
      const invoiceId = paymentService.generateInvoiceId();
      const orderDescription = `Salon Appointment Charges - ${pendingCharges.length} charges`;
      
      // Subscribe to payment status via WebSocket
      webSocketPaymentService.subscribeToPayment(invoiceId, (status: PaymentStatusEvent) => {
        console.log('🔔 [PAYMENT] Saved card payment status update via WebSocket:', status);
        
        if (status.status === 'SUCCESS') {
          showToast('success', 'Payment Successful', `Successfully paid Rs. ${totalAmount} for appointment charges.`);
          // Update charges to paid status
          setAppointmentCharges(appointmentCharges.map(charge =>
            charge.status === 'pending'
              ? {
                  ...charge,
                  status: 'paid' as const,
                  paidAt: new Date(),
                  paymentMethod: 'Payable IPG'
                }
              : charge
          ));
        } else if (status.status === 'FAILED') {
          showToast('error', 'Payment Failed', 'Unable to process payment with saved card.');
        }
        setRedirectingToIPG(false);
      });

      showToast('info', 'Processing Payment with Saved Card', 'Please wait while we process your payment...');

      // Use the paymentService method that follows PAYable API guidelines
      await paymentService.payWithSavedCard(
        selectedCustomer, // customerId
        tokenId,         // tokenId
        totalAmount,     // amount
        invoiceId,       // invoiceId
        orderDescription, // orderDescription
        'https://salon.run.place:8090/api/v1/payments/webhook', // webhookUrl
        'payment',       // custom1
        'salon_charges'  // custom2
      );
      
    } catch (error) {
      console.error('Saved card payment error:', error);
      showToast('error', 'Payment Failed', 'Unable to process payment with saved card.');
      setRedirectingToIPG(false);
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment & Billing</h2>
          <p className="text-gray-600">Manage payment cards and appointment charges</p>
        </div>
        <div className="flex space-x-3">
          {pendingCharges.length > 0 && (
            <button
              onClick={handlePayPendingCharges}
              disabled={processingPayment}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 disabled:from-gray-400 disabled:to-gray-500 rounded-lg transition-all duration-200"
            >
              {processingPayment ? (
                <>
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4" />
                  <span>Pay Pending (Rs. {totalPendingAmount.toFixed(2)})</span>
                </>
              )}
            </button>
          )}
          <button
            onClick={handleAddCard}
            disabled={processingPayment}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 rounded-lg transition-all duration-200"
          >
            {processingPayment ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add Payment Card</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Income</p>
              <p className="text-2xl font-bold text-green-600">Rs. {todayIncome.toFixed(2)}</p>
              <p className="text-xs text-gray-500">From appointment charges</p>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Income</p>
              <p className="text-2xl font-bold text-blue-600">Rs. {monthlyIncome.toFixed(2)}</p>
              <p className="text-xs text-gray-500">This month's total</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-amber-600">Rs. {totalPendingAmount.toFixed(2)}</p>
              <p className="text-xs text-gray-500">{pendingCharges.length} charges pending</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Cards</p>
              <p className="text-2xl font-bold text-gray-900">{activeCards}</p>
              <p className="text-xs text-gray-500">Payment methods</p>
            </div>
            <CreditCard className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Payable IPG Configuration Status */}
      <div className={`rounded-xl border-2 p-6 ${
        payableConfig.isConfigured 
          ? 'bg-green-50 border-green-200' 
          : 'bg-amber-50 border-amber-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {payableConfig.isConfigured ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <AlertCircle className="w-6 h-6 text-amber-600" />
            )}
            <div>
              <h3 className={`font-semibold ${
                payableConfig.isConfigured ? 'text-green-900' : 'text-amber-900'
              }`}>
                Payable IPG Payment Gateway
              </h3>
              <p className={`text-sm ${
                payableConfig.isConfigured ? 'text-green-700' : 'text-amber-700'
              }`}>
                {payableConfig.isConfigured 
                  ? `Configured and ready for payments (${payableConfig.testMode ? 'Test Mode' : 'Live Mode'})`
                  : `Missing configuration: ${payableConfig.missingFields.join(', ')}`
                }
              </p>
              <div className="mt-2 text-xs text-gray-600">
                <div>Merchant Key: 42F77B3164786C34</div>
                <div>Stored Merchant ID: {webhookHandler.getStoredMerchantId() || 'Not available (will be set after first tokenization)'}</div>
              </div>
            </div>
          </div>
          {!payableConfig.isConfigured && (
            <button
              onClick={() => showToast('info', 'Environment Configuration', 'Please add PAYABLE_MERCHANT_KEY, PAYABLE_MERCHANT_TOKEN, PAYABLE_BUSINESS_KEY, and PAYABLE_BUSINESS_TOKEN to your .env file.')}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors duration-200"
            >
              Setup Guide
            </button>
          )}
        </div>
      </div>

      {/* Saved Cards Section */}
      {payableConfig.isConfigured && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Payable IPG Saved Cards</h3>
            <div className="flex space-x-3">
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 mb-1">Customer ID (Alphanumeric)</label>
                <input
                  type="text"
                  placeholder="Alphanumeric Customer ID"
                  value={selectedCustomer}
                  readOnly
                  className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={loadSavedCards}
                disabled={!selectedCustomer || loadingCards}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors duration-200 self-end"
              >
                {loadingCards ? 'Loading...' : 'Refresh Cards'}
              </button>
              <button
                onClick={handleTestEnvironment}
                className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 self-end text-sm"
                title="Test WebSocket and API URLs"
              >
                Test URLs
              </button>
            </div>
          </div>
          
          {/* Error State */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}
          
          {/* Loading State */}
          {loadingCards && (
            <div className="mb-4 p-8 text-center">
              <div className="inline-flex items-center space-x-2 text-gray-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                <span>Loading saved cards...</span>
              </div>
            </div>
          )}
          
          {/* Payment Processing State */}
          {(processingPayment || loadingPayment) && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <p className="text-blue-800">
                  {processingPayment ? 'Processing payment...' : 'Preparing payment...'}
                </p>
              </div>
            </div>
          )}
          
          {!loadingCards && savedCards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedCards.map((card) => (
                <div key={card.tokenId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-900">{card.maskedCardNo}</span>
                    </div>
                    {card.isDefaultCard && (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Expires:</span>
                      <span>{card.cardExpiry}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Scheme:</span>
                      <span>{card.cardScheme}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={`font-medium ${
                        card.tokenStatus === 'ACTIVE' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {card.tokenStatus}
                      </span>
                    </div>
                    {card.nickname && (
                      <div className="flex justify-between">
                        <span>Nickname:</span>
                        <span>{card.nickname}</span>
                      </div>
                    )}
                  </div>
                  
                  {card.tokenStatus === 'ACTIVE' && pendingCharges.length > 0 && (
                    <button
                      onClick={() => handlePayWithSavedCard(card.tokenId)}
                      disabled={processingPayment}
                      className="w-full mt-3 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors duration-200 text-sm"
                    >
                      {processingPayment ? 'Processing...' : `Pay Rs. ${totalPendingAmount.toFixed(2)}`}
                    </button>
                  )}
                  
                  {/* Card Management Buttons */}
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => handleEditSavedCard(card.tokenId, card.nickname || undefined, !card.isDefaultCard)}
                      disabled={processingPayment}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors duration-200 text-sm flex items-center justify-center space-x-1"
                    >
                      <Edit className="w-3 h-3" />
                      <span>{card.isDefaultCard ? 'Remove Default' : 'Set Default'}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSavedCard(card.tokenId)}
                      disabled={processingPayment}
                      className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors duration-200 text-sm flex items-center justify-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : !loadingCards && selectedCustomer ? (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p>No saved cards found for this customer</p>
            </div>
          ) : !loadingCards ? (
            <div className="text-center py-8 text-gray-500">
              <p>Customer ID will be automatically generated based on your salon profile. Click "Refresh Cards" to check for saved cards.</p>
            </div>
          ) : null}
        </div>
      )}

      {/* Overview Content */}
      <div className="space-y-6">
        {/* Pending Payments Alert */}
        {pendingCharges.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
                <div>
                  <h3 className="font-semibold text-amber-900">Pending Appointment Charges</h3>
                  <p className="text-amber-700">
                    You have {pendingCharges.length} pending charges totaling Rs. {totalPendingAmount.toFixed(2)}
                  </p>
                </div>
              </div>
              <button
                onClick={handlePayPendingCharges}
                disabled={processingPayment}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-500 transition-colors duration-200 flex items-center space-x-2"
              >
                {processingPayment ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Pay Now</span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Automated Payment Scheduler */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full transform translate-x-16 -translate-y-16"></div>
          <div className="relative flex items-center space-x-4">
            <div className="p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-blue-900 mb-2">Automated Payment Schedule</h3>
              <p className="text-blue-700 text-base leading-relaxed">
                System automatically charges Rs. 50.00 per appointment daily at 10:00 PM. 
                <br />
                <span className="font-semibold">Today's charge: Rs. {todayCharges.reduce((sum, charge) => sum + charge.totalCharge, 0).toFixed(2)} for {todayCharges.reduce((sum, charge) => sum + charge.appointmentCount, 0)} appointments.</span>
              </p>
            </div>
          </div>
        </div>

        {/* Daily Income Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Income Breakdown</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Today's Appointments</span>
              <span className="font-semibold text-gray-900">
                {todayCharges.reduce((sum, charge) => sum + charge.appointmentCount, 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Charge per Appointment</span>
              <span className="font-semibold text-gray-900">Rs. 50.00</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Today's Income</span>
              <span className="font-semibold text-green-600">Rs. {todayIncome.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-gray-600">Scheduler Time</span>
              <span className="font-semibold text-gray-900">10:00 PM Daily</span>
            </div>
          </div>
        </div>

      </div>
      {/* End Overview Content */}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-4">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={removeToast}
          />
        ))}
      </div>

      {/* Loading Spinner Overlay */}
      {redirectingToIPG && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Redirecting to Payment Gateway</h3>
            <p className="text-gray-600">Please wait while we redirect you to PAYable IPG...</p>
            <div className="mt-4 text-sm text-gray-500">
              This may take a few moments. Please do not close this window.
            </div>
          </div>
        </div>
      )}

      {/* Payment Options Modal */}
      {showPaymentOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Choose Payment Method</h3>
              <button
                onClick={() => setShowPaymentOptions(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <AlertCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <div>
                    <h4 className="font-medium text-amber-900">Pending Payment</h4>
                    <p className="text-amber-700">Total amount: Rs. {totalPendingAmount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Saved Cards</h4>
              <div className="space-y-3">
                {savedCards.filter(card => card.tokenStatus === 'ACTIVE').map((card) => (
                  <div key={card.tokenId} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-5 h-5 text-gray-600" />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">{card.maskedCardNo}</span>
                            <span className="text-sm text-gray-500">{card.cardScheme}</span>
                            {card.isDefaultCard && (
                              <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">{card.cardHolderName}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowPaymentOptions(false);
                          handlePayWithSavedCard(card.tokenId);
                        }}
                        disabled={processingPayment}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors duration-200"
                      >
                        Pay Rs. {totalPendingAmount.toFixed(2)}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowPaymentOptions(false);
                    handlePayWithNewCard();
                  }}
                  disabled={processingPayment}
                  className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Pay with New Card</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentBilling;