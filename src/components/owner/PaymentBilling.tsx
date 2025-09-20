import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { paymentService, PaymentRequest } from '../../services/paymentService';
import { webSocketPaymentService, PaymentStatusEvent, TokenSavedEvent } from '../../services/webSocketPaymentService';
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
    
    // Add page refresh when user returns from external payment gateway
    const handleVisibilityChange = () => {
      if (!document.hidden && (redirectingToIPG || processingPayment)) {
        console.log('🔄 [PAYMENT] User returned from external payment gateway, refreshing page...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    };

    // Add event listener for page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
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
      document.removeEventListener('visibilitychange', handleVisibilityChange);
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
      
      // Call the new API endpoint with authentication and salonId as path variable
      const response = await fetch(`${getCurrentConfig().API_BASE_URL}/payments/tokens/salon/${salon.salonId}`, {
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
        'PAYMENT',       // custom1 - alphanumeric only
        'SALONCHARGES'   // custom2 - alphanumeric only, no underscores
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment & Billing</h1>
              <p className="text-lg text-gray-600">Manage your payment methods and billing efficiently</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {pendingCharges.length > 0 && (
                <button
                  onClick={handlePayPendingCharges}
                  disabled={processingPayment}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 disabled:from-gray-400 disabled:to-gray-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  {processingPayment ? (
                    <>
                      <Clock className="w-5 h-5 animate-spin" />
                      <span className="font-semibold">Processing...</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-5 h-5" />
                      <span className="font-semibold">Pay Pending (Rs. {totalPendingAmount.toFixed(2)})</span>
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleAddCard}
                disabled={processingPayment}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
              >
                {processingPayment ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin" />
                    <span className="font-semibold">Processing...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span className="font-semibold">Add Payment Card</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Today's Income</p>
                <p className="text-3xl font-bold text-green-600">Rs. {todayIncome.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">From appointment charges</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Monthly Income</p>
                <p className="text-3xl font-bold text-blue-600">Rs. {monthlyIncome.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">This month's total</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Calendar className="w-8 h-8 text-blue-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pending Payments</p>
                <p className="text-3xl font-bold text-amber-600">Rs. {totalPendingAmount.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">{pendingCharges.length} charges pending</p>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active Cards</p>
                <p className="text-3xl font-bold text-gray-900">{activeCards}</p>
                <p className="text-xs text-gray-500 mt-1">Payment methods</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <CreditCard className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Saved Cards Section */}
        {payableConfig.isConfigured && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Your Payment Cards</h3>
              <p className="text-gray-600">Securely manage your saved payment methods</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedCards.map((card) => (
                <div key={card.tokenId} className="relative group">
                  {/* Credit Card Design */}
                  <div className="relative w-full h-48 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    {/* Card Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                    
                    {/* Default Card Badge */}
                    {card.isDefaultCard && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                        Default
                      </div>
                    )}
                    
                    {/* Card Content */}
                    <div className="relative h-full p-6 flex flex-col justify-between text-white">
                      {/* Top Section */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <CreditCard className="w-6 h-6 text-white/90" />
                          <span className="text-sm font-medium text-white/90">
                            {card.cardScheme}
                          </span>
                        </div>
                        <div className="text-xs bg-white/10 px-2 py-1 rounded">
                          {card.tokenStatus}
                        </div>
                      </div>
                      
                      {/* Card Number */}
                      <div className="text-center">
                        <div className="text-lg font-mono tracking-widest text-white/95 mb-2">
                          {card.maskedCardNo}
                        </div>
                      </div>
                      
                      {/* Bottom Section */}
                      <div className="flex items-end justify-between">
                        <div>
                          <div className="text-xs text-white/70 uppercase tracking-wide mb-1">
                            Cardholder
                          </div>
                          <div className="text-sm font-semibold text-white/95 truncate max-w-[150px]">
                            {card.cardHolderName}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-white/70 uppercase tracking-wide mb-1">
                            Expires
                          </div>
                          <div className="text-sm font-semibold text-white/95">
                            {card.cardExpiry}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Card Management Options */}
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={() => handleEditSavedCard(card.tokenId, card.nickname || undefined, !card.isDefaultCard)}
                      disabled={processingPayment}
                      className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-300 transition-colors duration-200 text-sm flex items-center justify-center space-x-1"
                    >
                      <Edit className="w-3 h-3" />
                      <span>{card.isDefaultCard ? 'Remove Default' : 'Set Default'}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSavedCard(card.tokenId)}
                      disabled={processingPayment}
                      className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 disabled:bg-red-200 transition-colors duration-200 text-sm flex items-center justify-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : !loadingCards && selectedCustomer ? (
            <div className="text-center py-12 text-gray-500">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-600 mb-2">No payment cards yet</h4>
              <p className="text-gray-500 mb-4">Add your first payment card to get started</p>
              <button
                onClick={handleAddCard}
                disabled={processingPayment}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 rounded-lg transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Add Your First Card</span>
              </button>
            </div>
          ) : !loadingCards ? (
            <div className="text-center py-8 text-gray-500">
              <p>Loading your payment cards...</p>
            </div>
          ) : null}
        </div>
      )}

        {/* Overview Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Automated Payment Scheduler */}
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/20 to-indigo-200/20 rounded-full transform translate-x-16 -translate-y-16"></div>
            <div className="relative">
              <div className="flex items-center space-x-4 mb-4">
                <div className="p-4 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-2xl">
                  <Calendar className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-blue-900">Automated Payment Schedule</h3>
                </div>
              </div>
              <p className="text-blue-700 text-base leading-relaxed">
                System automatically charges <span className="font-semibold">Rs. 50.00 per appointment</span> daily at 10:00 PM.
              </p>
              <div className="mt-4 p-4 bg-white/50 rounded-xl">
                <p className="text-blue-800 font-semibold">
                  Today's charge: Rs. {todayCharges.reduce((sum, charge) => sum + charge.totalCharge, 0).toFixed(2)} for {todayCharges.reduce((sum, charge) => sum + charge.appointmentCount, 0)} appointments
                </p>
              </div>
            </div>
          </div>

          {/* Daily Income Overview */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 hover:shadow-lg transition-shadow duration-300">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Daily Income Breakdown</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-600 font-medium">Today's Appointments</span>
                <span className="font-bold text-gray-900 text-lg">
                  {todayCharges.reduce((sum, charge) => sum + charge.appointmentCount, 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-600 font-medium">Charge per Appointment</span>
                <span className="font-bold text-gray-900 text-lg">Rs. 50.00</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
                <span className="text-green-700 font-medium">Today's Income</span>
                <span className="font-bold text-green-600 text-lg">Rs. {todayIncome.toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="text-gray-600 font-medium">Scheduler Time</span>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Choose Payment Method</h3>
                  <p className="text-gray-600 mt-1">Select how you'd like to pay</p>
                </div>
                <button
                  onClick={() => setShowPaymentOptions(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <AlertCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="px-8 py-6">
              {/* Amount Summary */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-amber-100 rounded-full">
                        <AlertTriangle className="w-6 h-6 text-amber-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-amber-900">Payment Amount</h4>
                        <p className="text-amber-700">Total pending charges</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-amber-900">Rs. {totalPendingAmount.toFixed(2)}</div>
                      <div className="text-sm text-amber-700">{pendingCharges.length} charges</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Saved Cards Section */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-purple-600" />
                    <span>Your Saved Cards</span>
                  </h4>
                  <div className="space-y-4">
                    {savedCards.filter(card => card.tokenStatus === 'ACTIVE').map((card) => (
                      <div key={card.tokenId} className="group border border-gray-200 rounded-xl p-6 hover:border-purple-300 hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-white to-gray-50">
                        <div className="flex items-center justify-between">
                          {/* Card Info */}
                          <div className="flex items-center space-x-4">
                            <div className="p-3 bg-gray-100 group-hover:bg-purple-100 rounded-xl transition-colors">
                              <CreditCard className="w-6 h-6 text-gray-600 group-hover:text-purple-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="text-lg font-semibold text-gray-900">{card.maskedCardNo}</span>
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                  {card.cardScheme}
                                </span>
                                {card.isDefaultCard && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                    Default Card
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span className="font-medium">{card.cardHolderName}</span>
                                <span>Expires {card.cardExpiry}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Pay Button */}
                          <div className="ml-4">
                            <button
                              onClick={() => {
                                setShowPaymentOptions(false);
                                handlePayWithSavedCard(card.tokenId);
                              }}
                              disabled={processingPayment}
                              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg min-w-[140px]"
                            >
                              {processingPayment ? (
                                <div className="flex items-center justify-center space-x-2">
                                  <Clock className="w-4 h-4 animate-spin" />
                                  <span>Processing...</span>
                                </div>
                              ) : (
                                <span>Pay Rs. {totalPendingAmount.toFixed(2)}</span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* New Card Payment Option */}
                <div className="pt-6 border-t border-gray-200">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                      <Plus className="w-5 h-5 text-purple-600" />
                      <span>Pay with New Card</span>
                    </h4>
                    <div className="border border-dashed border-gray-300 rounded-xl p-6 hover:border-purple-300 hover:bg-purple-50/30 transition-all duration-300">
                      <div className="text-center">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mb-4">
                          <Plus className="w-8 h-8 text-purple-600" />
                        </div>
                        <h5 className="text-lg font-semibold text-gray-900 mb-2">Add New Payment Card</h5>
                        <p className="text-gray-600 mb-6">Securely add and use a new payment method</p>
                        <button
                          onClick={() => {
                            setShowPaymentOptions(false);
                            handlePayWithNewCard();
                          }}
                          disabled={processingPayment}
                          className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg"
                        >
                          {processingPayment ? (
                            <div className="flex items-center justify-center space-x-2">
                              <Clock className="w-4 h-4 animate-spin" />
                              <span>Processing...</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center space-x-2">
                              <Plus className="w-5 h-5" />
                              <span>Pay Rs. {totalPendingAmount.toFixed(2)} with New Card</span>
                            </div>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default PaymentBilling;