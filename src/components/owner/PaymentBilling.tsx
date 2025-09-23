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
  X,
} from 'lucide-react';
import { paymentService, PaymentRequest } from '../../services/paymentService';
import { webSocketPaymentService, PaymentStatusEvent, TokenSavedEvent } from '../../services/webSocketPaymentService';
import { getCurrentConfig } from '../../config/environment';
import Toast from '../shared/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';

interface SavedCard {
  tokenId: string;
  maskedCardNo: string;
  exp: string;
  reference: string;
  nickname: string;
  cardScheme: string;
  tokenStatus: string;
  defaultCard: number;
  // Additional fields for UI display
  cardHolderName?: string; // We can derive or set a default
  isDefaultCard?: boolean; // Convert from defaultCard number
}

interface BranchStats {
  branchId: number;
  branchName: string;
  appointmentCount: number;
  pendingAmount: number;
  historicalPendingAmount: number;
}

interface BranchIncomeStats {
  branchId: number;
  branchName: string;
  appointmentRevenue: number;
  serviceCharges: number;
  netIncome: number;
}

interface BranchMonthlyStats {
  branchId: number;
  branchName: string;
  monthlyAppointments: number;
  monthlyRevenue: number;
  monthlyServiceCharges: number;
  monthlyNetIncome: number;
  paidServiceCharges: number;
  pendingServiceCharges: number;
}

interface AnalyticsData {
  salonId: number;
  analyticsDate: string;
  totalPendingAmount: number;
  todayStats: {
    totalAppointments: number;
    branchStats: BranchStats[];
  };
  todayIncome: {
    totalAppointmentRevenue: number;
    totalServiceCharges: number;
    netIncome: number;
    branchIncomeStats: BranchIncomeStats[];
  };
  monthlyIncome: {
    monthYear: string;
    totalMonthlyRevenue: number;
    totalMonthlyServiceCharges: number;
    totalMonthlyNetIncome: number;
    branchMonthlyStats: BranchMonthlyStats[];
  };
  serviceCharge: number;
}

const PaymentBilling: React.FC = () => {
  // Get salon owner data from auth context
  const { salon } = useAuth();
  
  // Payable IPG Integration States
  const [payableConfig] = useState(paymentService.getConfigStatus());
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [payableMerchantId, setPayableMerchantId] = useState<string>('');
  const [payableCustomerId, setPayableCustomerId] = useState<string>('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [loadingCards, setLoadingCards] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [redirectingToIPG, setRedirectingToIPG] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string>(''); // Will be set based on salon data
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [, setIsLoadingAnalytics] = useState(false);
  const [saveCardOption, setSaveCardOption] = useState(false);
  const [deleteCardModal, setDeleteCardModal] = useState<{
    isOpen: boolean;
    cardInfo: string;
    tokenId: string;
  }>({
    isOpen: false,
    cardInfo: '',
    tokenId: ''
  });
  
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
    
    // Load analytics data when component mounts
    loadAnalyticsData();
    
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
      showToast('success', 'Card Saved', 'Your payment card has been securely saved for future use.');
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
      console.log('🔄 [PAYMENT] Loading Payable customer info and saved cards for salon:', salon.salonId);
      
      // Get the authentication token
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.');
      }
      
      console.log('🔐 [PAYMENT] Using auth token:', token.substring(0, 20) + '...');
      
      // Step 1: Get Payable Merchant ID and Customer ID from backend
      console.log('📋 [PAYMENT] Step 1: Getting Payable customer info from backend...');
      const customerInfoResponse = await fetch(`${getCurrentConfig().API_BASE_URL}/payments/tokens/salon/${salon.salonId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!customerInfoResponse.ok) {
        if (customerInfoResponse.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(`HTTP Error: ${customerInfoResponse.status} ${customerInfoResponse.statusText}`);
      }

      const customerInfo = await customerInfoResponse.json();
      console.log('✅ [PAYMENT] Backend customer info response:', customerInfo);
      
      if (!customerInfo.success || !customerInfo.payableMerchantId || !customerInfo.payableCustomerId) {
        throw new Error('Invalid customer information received from backend.');
      }

      // Store Payable IDs for later use
      setPayableMerchantId(customerInfo.payableMerchantId);
      setPayableCustomerId(customerInfo.payableCustomerId);
      
      console.log('🔑 [PAYMENT] Retrieved Payable IDs:');
      console.log('🔑 [PAYMENT] - Merchant ID:', customerInfo.payableMerchantId);
      console.log('🔑 [PAYMENT] - Customer ID:', customerInfo.payableCustomerId);

      // Step 2: Get JWT token for Payable API
      console.log('📋 [PAYMENT] Step 2: Getting JWT token for Payable API...');
      const jwtToken = await paymentService.getJwtToken();
      
      // Step 3: Get saved cards from Payable API
      console.log('📋 [PAYMENT] Step 3: Getting saved cards from Payable API...');
      const payableCardsResponse = await paymentService.listSavedCards(
        customerInfo.payableMerchantId,
        customerInfo.payableCustomerId,
        jwtToken
      );
      
      console.log('✅ [PAYMENT] Payable API response:', payableCardsResponse);

      if (payableCardsResponse && payableCardsResponse.tokenizedCardList && Array.isArray(payableCardsResponse.tokenizedCardList)) {
        // Transform Payable API response to our SavedCard interface
        const transformedCards: SavedCard[] = payableCardsResponse.tokenizedCardList.map((card: any) => ({
          tokenId: card.tokenId.trim(),
          maskedCardNo: card.maskedCardNo,
          exp: card.exp,
          reference: card.reference || '',
          nickname: card.nickname || '',
          cardScheme: card.cardScheme,
          tokenStatus: card.tokenStatus,
          defaultCard: card.defaultCard,
          cardHolderName: card.nickname || 'Card Holder', // Use nickname as cardholder name or default
          isDefaultCard: card.defaultCard === 1
        }));

        setSavedCards(transformedCards);
        console.log('✅ [PAYMENT] Successfully loaded', transformedCards.length, 'saved cards from Payable API');
        console.log('✅ [PAYMENT] Card token IDs:', transformedCards.map((card: SavedCard) => `"${card.tokenId}"`));
      } else {
        console.log('⚠️ [PAYMENT] No saved cards found in Payable API response');
        setSavedCards([]);
      }
      
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

  const loadAnalyticsData = async () => {
    if (!salon?.salonId) {
      console.warn('🟡 [ANALYTICS] No salon ID available, skipping analytics loading');
      return;
    }

    setIsLoadingAnalytics(true);
    try {
      console.log('🔄 [ANALYTICS] Loading payment analytics for salon:', salon.salonId);
      const data = await apiService.getPaymentAnalytics(salon.salonId);
      console.log('📊 [ANALYTICS] Retrieved analytics data:', data);
      setAnalyticsData(data);
    } catch (error: any) {
      console.error('❌ [ANALYTICS] Error loading analytics data:', error);
      // Don't show error to user, just log it - this is not critical for payment functionality
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  // Function to delete saved card
  const handleDeleteSavedCard = async (tokenId: string) => {
    const selectedCard = savedCards.find(card => card.tokenId === tokenId);
    const cardInfo = selectedCard ? `${selectedCard.cardScheme} ending in ${selectedCard.maskedCardNo.slice(-4)}` : 'this card';
    
    // Open delete confirmation modal
    setDeleteCardModal({
      isOpen: true,
      cardInfo,
      tokenId
    });
  };

  // Function to confirm card deletion
  const confirmDeleteCard = async () => {
    const { tokenId, cardInfo } = deleteCardModal;
    
    // Validate that we have the required Payable IDs
    if (!payableMerchantId || !payableCustomerId) {
      showToast('error', 'Missing Information', 'Payable IDs not available. Please refresh the page.');
      setDeleteCardModal({ isOpen: false, cardInfo: '', tokenId: '' });
      return;
    }

    try {
      setProcessingPayment(true);
      setDeleteCardModal({ isOpen: false, cardInfo: '', tokenId: '' });
      console.log('🗑️ [PAYMENT] Deleting card with token ID:', tokenId);
      
      const success = await paymentService.deleteSavedCard(payableMerchantId, payableCustomerId, tokenId);
      
      if (success) {
        showToast('success', 'Card Deleted', `${cardInfo} has been successfully removed from your account.`);
        loadSavedCards(); // Reload the cards list
      } else {
        showToast('error', 'Delete Failed', 'Failed to delete saved card. Please try again.');
      }
    } catch (error) {
      console.error('Delete card error:', error);
      showToast('error', 'Delete Failed', 'Unable to delete saved card. Please check your connection and try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Function to cancel card deletion
  const cancelDeleteCard = () => {
    setDeleteCardModal({ isOpen: false, cardInfo: '', tokenId: '' });
  };

  // Function to edit saved card
  const handleEditSavedCard = async (
    tokenId: string, 
    nickname?: string, 
    setAsDefault?: boolean
  ) => {
    // Validate that we have the required Payable IDs
    if (!payableMerchantId || !payableCustomerId) {
      showToast('error', 'Missing Information', 'Payable IDs not available. Please refresh the page.');
      return;
    }

    try {
      setProcessingPayment(true);
      console.log('✏️ [PAYMENT] Editing card with token ID:', tokenId);
      
      const success = await paymentService.editSavedCard(
        payableMerchantId,
        payableCustomerId,
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

  // Calculate active cards from saved cards
  const activeCards = savedCards.filter(card => card.tokenStatus === 'SUCCESS').length;
  
  // Get analytics data or use defaults
  const totalPendingAmount = analyticsData?.totalPendingAmount ?? 0;
  const todayIncome = analyticsData?.todayIncome?.netIncome ?? 0;
  const monthlyIncome = analyticsData?.monthlyIncome?.totalMonthlyNetIncome ?? 0;
  const todayAppointments = analyticsData?.todayStats?.totalAppointments ?? 0;
  const serviceCharge = analyticsData?.serviceCharge ?? 50;

  const pendingCharges = totalPendingAmount > 0 ? [{
    id: 'pending-total',
    salonId: salon?.salonId?.toString() || '',
    date: new Date().toISOString().split('T')[0],
    appointmentCount: todayAppointments,
    chargePerAppointment: serviceCharge,
    totalCharge: totalPendingAmount,
    status: 'pending' as const,
    scheduledAt: new Date(),
  }] : [];

  const todayCharges = [{
    id: 'today-total',
    salonId: salon?.salonId?.toString() || '',
    date: new Date().toISOString().split('T')[0],
    appointmentCount: todayAppointments,
    chargePerAppointment: serviceCharge,
    totalCharge: todayIncome,
    status: 'paid' as const,
    scheduledAt: new Date(),
    paidAt: new Date(),
    paymentMethod: 'Various'
  }];

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

    // If cards are still loading, wait for them to load first
    if (loadingCards) {
      showToast('info', 'Loading Payment Methods', 'Please wait while we load your saved payment methods...');
      
      // Wait for cards to finish loading (with timeout)
      let waitTime = 0;
      const maxWaitTime = 10000; // 10 seconds max
      const checkInterval = 500; // Check every 500ms
      
      while (loadingCards && waitTime < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waitTime += checkInterval;
      }
      
      if (loadingCards) {
        showToast('warning', 'Loading Timeout', 'Payment methods are taking too long to load. Proceeding with new card payment.');
        await handlePayWithNewCard();
        return;
      }
    }

    // Check if there are saved cards
    const activeCards = savedCards.filter(card => card.tokenStatus === 'SUCCESS');
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
        orderDescription: `Salon Service Charges - Rs. ${totalPendingAmount.toFixed(2)}`,
        customerFirstName: salon?.ownerFirstName || 'Salon',
        customerLastName: salon?.ownerLastName || 'Owner',
        customerEmail: salon?.ownerEmail || 'owner@salon.com',
        customerMobilePhone: salon?.ownerPhone?.startsWith('+') ? salon.ownerPhone : `+94${salon?.ownerPhone?.replace(/^0/, '') || '771234567'}`,
        customerRefNo: selectedCustomer || `SALON${Date.now()}`,
        paymentType: saveCardOption ? '3' : '1', // '3' for tokenize (save card), '1' for one-time
        isSaveCard: saveCardOption ? '1' : '0', // Save card option
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
          showToast('success', 'Payment Successful', `Successfully paid Rs. ${totalAmount} for service charges.`);
          // Refresh analytics data after successful payment
          setTimeout(() => loadAnalyticsData(), 2000);
        } else if (status.status === 'FAILED') {
          showToast('error', 'Payment Failed', 'Unable to process payment. Please try again.');
        }
        setRedirectingToIPG(false);
      });

      showToast('info', 'Redirecting to Payment Gateway', 'Please wait while we redirect you to the payment gateway...');
      
      // Add a small delay before redirecting
      setTimeout(async () => {
        if (saveCardOption) {
          // Use tokenize payment to save card during payment
          await paymentService.processTokenizePayment(paymentRequest);
        } else {
          // Use regular one-time payment
          await paymentService.processOneTimePayment(paymentRequest);
        }
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
  const handlePayWithSavedCard = async (selectedTokenId: string) => {
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
      const orderDescription = `Salon Service Charges - Rs. ${totalPendingAmount.toFixed(2)}`;
      
      // Subscribe to payment status via WebSocket
      webSocketPaymentService.subscribeToPayment(invoiceId, (status: PaymentStatusEvent) => {
        console.log('🔔 [PAYMENT] Saved card payment status update via WebSocket:', status);
        
        if (status.status === 'SUCCESS') {
          showToast('success', 'Payment Successful', `Successfully paid Rs. ${totalAmount} for service charges.`);
          // Refresh analytics data after successful payment
          setTimeout(() => loadAnalyticsData(), 2000);
        } else if (status.status === 'FAILED') {
          showToast('error', 'Payment Failed', 'Unable to process payment with saved card.');
        }
        setRedirectingToIPG(false);
      });

      showToast('info', 'Processing Payment with Saved Card', 'Please wait while we process your payment...');

      console.log('� [PAYMENT] Starting saved card payment with selected tokenId:', selectedTokenId);
      
      // Use the correct flow to get current valid token ID:
      // Step 1: Get JWT token  
      // Step 2: Call Payable /listCard API to get current valid cards
      // Step 3: Find matching card and use current valid tokenId
      // Step 4: Make payment with current valid tokenId
      
      // Find the selected card to get the Payable IDs
      const selectedCard = savedCards.find(card => card.tokenId === selectedTokenId);
      if (!selectedCard) {
        throw new Error('Selected card not found. Please refresh and try again.');
      }

      console.log('💳 [PAYMENT] Using stored Payable IDs:');
      console.log('💳 [PAYMENT] - Payable Merchant ID:', payableMerchantId);
      console.log('💳 [PAYMENT] - Payable Customer ID:', payableCustomerId);
      console.log('💳 [PAYMENT] - Database Token ID (may be outdated):', selectedTokenId);

      // Validate that we have the required Payable IDs
      if (!payableMerchantId || !payableCustomerId) {
        throw new Error('Payable IDs not available. Please refresh the page and try again.');
      }

      console.log('� [PAYMENT] Starting saved card payment - using existing card data');
      console.log('� [PAYMENT] - Payable Merchant ID:', payableMerchantId);
      console.log('💳 [PAYMENT] - Payable Customer ID:', payableCustomerId);
      console.log('💳 [PAYMENT] - Selected Token ID:', selectedTokenId);

      // Get JWT token for payment
      console.log('🔑 [PAYMENT] Getting JWT token for payment...');
      const jwtToken = await paymentService.getJwtToken();

      // Make payment directly with the selected token ID (no need to re-fetch cards)
      console.log('💰 [PAYMENT] Making payment with selected token ID:', selectedTokenId);
      await paymentService.payWithSavedCardUsingToken(
        payableMerchantId, // Use stored Payable Merchant ID
        payableCustomerId, // Use stored Payable Customer ID
        selectedTokenId,  // Use selected token ID from cards list
        totalAmount,      // amount  
        invoiceId,        // invoiceId
        orderDescription, // orderDescription
        jwtToken,         // JWT token
        'https://salon.run.place:8090/api/v1/payments/webhook', // webhookUrl
        'PAYMENT',        // custom1
        'SALONCHARGES'    // custom2
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
              {totalPendingAmount > 0 ? (
                <button
                  onClick={handlePayPendingCharges}
                  disabled={processingPayment || loadingCards}
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
              ) : (
                <div className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="font-semibold">All Payments Paid</span>
                </div>
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
                <p className="text-xs text-gray-500 mt-1">From service charges</p>
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
                <p className="text-xs text-gray-500 mt-1">
                  {totalPendingAmount > 0 ? `Rs. ${totalPendingAmount.toFixed(2)} pending` : 'All paid up'}
                </p>
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
                            {card.exp}
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
          
          {/* Payment Action Buttons */}
          {totalPendingAmount > 0 && (
            <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Pay?</h3>
                <p className="text-gray-600">Choose how you'd like to pay your pending amount of <span className="font-semibold text-purple-600">Rs. {totalPendingAmount.toFixed(2)}</span></p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pay One Time Button */}
                <button
                  onClick={() => {
                    setSaveCardOption(false);
                    handlePayWithNewCard();
                  }}
                  disabled={processingPayment}
                  className="flex flex-col items-center justify-center p-6 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">Pay One Time</h4>
                  <p className="text-sm text-gray-600 text-center mb-3">Quick payment without saving card details</p>
                  <span className="text-blue-600 font-medium">Rs. {totalPendingAmount.toFixed(2)}</span>
                </button>
                
                {/* Pay & Save Card Button */}
                <button
                  onClick={() => {
                    setSaveCardOption(true);
                    handlePayWithNewCard();
                  }}
                  disabled={processingPayment}
                  className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group shadow-lg"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3 group-hover:bg-white/30 transition-colors">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-lg font-semibold mb-1">Pay & Save Card</h4>
                  <p className="text-sm text-purple-100 text-center mb-3">Pay now and save for future payments</p>
                  <span className="text-white font-medium">Rs. {totalPendingAmount.toFixed(2)}</span>
                </button>
              </div>
              
              {processingPayment && (
                <div className="mt-4 flex items-center justify-center space-x-2 text-purple-600">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                  <span className="font-medium">Processing payment...</span>
                </div>
              )}
            </div>
          )}
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
                  {todayAppointments}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <span className="text-gray-600 font-medium">Service Charge per Appointment</span>
                <span className="font-bold text-gray-900 text-lg">Rs. {serviceCharge.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
                <span className="text-green-700 font-medium">Today's Income</span>
                <span className="font-bold text-green-600 text-lg">Rs. {todayIncome.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
                <span className="text-blue-700 font-medium">Monthly Income</span>
                <span className="font-bold text-blue-600 text-lg">Rs. {monthlyIncome.toFixed(2)}</span>
              </div>
              <div className="pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="text-gray-600 font-medium">Data Updated</span>
                <span className="font-semibold text-gray-900">
                  {analyticsData?.analyticsDate || new Date().toISOString().split('T')[0]}
                </span>
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
                  <X className="w-6 h-6" />
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
                    {savedCards.filter(card => card.tokenStatus === 'SUCCESS').map((card) => (
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
                                <span>Expires {card.exp}</span>
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
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Card Confirmation Modal */}
      {deleteCardModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl max-w-md w-full mx-4">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Payment Card</h3>
                </div>
                <button
                  onClick={cancelDeleteCard}
                  disabled={processingPayment}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              
              {/* Content */}
              <div className="mb-6">
                <p className="text-gray-700 mb-3">
                  Are you sure you want to permanently delete <strong>{deleteCardModal.cardInfo}</strong>?
                </p>
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-red-700">
                      <p className="font-medium mb-1">This action cannot be undone</p>
                      <p>You will need to add the card again if you want to use it for future payments.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={cancelDeleteCard}
                  disabled={processingPayment}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-300 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteCard}
                  disabled={processingPayment}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  {processingPayment ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Card</span>
                    </>
                  )}
                </button>
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