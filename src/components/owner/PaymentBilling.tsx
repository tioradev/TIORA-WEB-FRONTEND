import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Edit,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Eye,
  EyeOff,
  X,
  Shield,
  Settings,
  Lock,
  Save,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { paymentService, PaymentRequest, SavedCard } from '../../services/paymentService';
import Toast from '../shared/Toast';

interface CardPaymentMethod {
  id: string;
  salonId: string;
  cardType: 'visa' | 'mastercard' | 'amex' | 'discover';
  cardHolderName: string;
  cardNumber: string; // Last 4 digits only for display
  expiryMonth: string;
  expiryYear: string;
  cvv: string; // Encrypted/masked
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  isDefault: boolean;
  isActive: boolean;
  processingFee: number; // Percentage
  merchantId?: string;
  createdAt: Date;
  lastUsed?: Date;
  totalTransactions: number;
  totalAmount: number;
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
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CardPaymentMethod | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Payable IPG Integration States
  const [payableConfig] = useState(paymentService.getConfigStatus());
  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  
  // Toast states
  const [toasts, setToasts] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
  }>>([]);

  // Load saved cards on component mount
  useEffect(() => {
    if (payableConfig.isConfigured && selectedCustomer) {
      loadSavedCards();
    }
  }, [selectedCustomer, payableConfig.isConfigured]);

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const loadSavedCards = async () => {
    if (!selectedCustomer) return;
    
    try {
      const cards = await paymentService.getSavedCards(selectedCustomer);
      setSavedCards(cards);
    } catch (error) {
      console.error('Failed to load saved cards:', error);
      showToast('error', 'Failed to load saved cards', 'Please try again later.');
    }
  };

  // Function to delete saved card
  const handleDeleteSavedCard = async (customerId: string, tokenId: string) => {
    if (!window.confirm('Are you sure you want to delete this saved card?')) {
      return;
    }

    try {
      setProcessingPayment(true);
      const success = await paymentService.deleteSavedCard(customerId, tokenId);
      
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
    customerId: string, 
    tokenId: string, 
    nickname?: string, 
    setAsDefault?: boolean
  ) => {
    try {
      setProcessingPayment(true);
      const success = await paymentService.editSavedCard(
        customerId, 
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

  const [paymentMethods, setPaymentMethods] = useState<CardPaymentMethod[]>([
    {
      id: '1',
      salonId: 'salon1',
      cardType: 'visa',
      cardHolderName: 'Elite Hair Studio LLC',
      cardNumber: '****1234',
      expiryMonth: '12',
      expiryYear: '2025',
      cvv: '***',
      billingAddress: {
        street: '123 Galle Road',
        city: 'Colombo',
        state: 'Western',
        zipCode: '00300',
        country: 'Sri Lanka'
      },
      isDefault: true,
      isActive: true,
      processingFee: 2.9,
      merchantId: 'MERCHANT_123',
      createdAt: new Date('2023-01-15'),
      lastUsed: new Date('2024-01-14'),
      totalTransactions: 245,
      totalAmount: 15420
    },
    {
      id: '2',
      salonId: 'salon1',
      cardType: 'mastercard',
      cardHolderName: 'Elite Hair Studio LLC',
      cardNumber: '****5678',
      expiryMonth: '08',
      expiryYear: '2026',
      cvv: '***',
      billingAddress: {
        street: '123 Galle Road',
        city: 'Colombo',
        state: 'Western',
        zipCode: '00300',
        country: 'Sri Lanka'
      },
      isDefault: false,
      isActive: true,
      processingFee: 3.2,
      merchantId: 'MERCHANT_456',
      createdAt: new Date('2023-06-20'),
      lastUsed: new Date('2024-01-10'),
      totalTransactions: 89,
      totalAmount: 5680
    }
  ]);

  // Mock appointment charges data
  const [appointmentCharges, setAppointmentCharges] = useState<AppointmentCharge[]>([
    {
      id: '1',
      salonId: 'salon1',
      date: '2024-01-15',
      appointmentCount: 12,
      chargePerAppointment: 50,
      totalCharge: 600,
      status: 'pending',
      scheduledAt: new Date('2024-01-15T22:00:00'),
    },
    {
      id: '2',
      salonId: 'salon1',
      date: '2024-01-14',
      appointmentCount: 8,
      chargePerAppointment: 50,
      totalCharge: 400,
      status: 'paid',
      scheduledAt: new Date('2024-01-14T22:00:00'),
      paidAt: new Date('2024-01-14T22:05:00'),
      paymentMethod: 'Visa ****1234',
    },
    {
      id: '3',
      salonId: 'salon1',
      date: '2024-01-13',
      appointmentCount: 15,
      chargePerAppointment: 50,
      totalCharge: 750,
      status: 'paid',
      scheduledAt: new Date('2024-01-13T22:00:00'),
      paidAt: new Date('2024-01-13T22:03:00'),
      paymentMethod: 'Visa ****1234',
    },
  ]);

  const cardTypes = [
    { value: 'visa', label: 'Visa', color: 'from-blue-500 to-blue-600' },
    { value: 'mastercard', label: 'Mastercard', color: 'from-red-500 to-orange-500' },
    { value: 'amex', label: 'American Express', color: 'from-green-500 to-green-600' },
    { value: 'discover', label: 'Discover', color: 'from-purple-500 to-purple-600' },
  ];

  const filteredCards = paymentMethods.filter(card =>
    card.cardHolderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.cardNumber.includes(searchTerm)
  );

  // Calculate metrics
  const activeCards = paymentMethods.filter(card => card.isActive).length;
  
  // Appointment charge metrics
  const pendingCharges = appointmentCharges.filter(charge => charge.status === 'pending');
  const totalPendingAmount = pendingCharges.reduce((sum, charge) => sum + charge.totalCharge, 0);
  const todayCharges = appointmentCharges.filter(charge => charge.date === new Date().toISOString().split('T')[0]);
  const todayIncome = todayCharges.reduce((sum, charge) => charge.status === 'paid' ? sum + charge.totalCharge : sum, 0);
  const monthlyIncome = appointmentCharges
    .filter(charge => charge.status === 'paid' && new Date(charge.date).getMonth() === new Date().getMonth())
    .reduce((sum, charge) => sum + charge.totalCharge, 0);

  // CRUD Functions
  const handleAddCard = (cardData: Omit<CardPaymentMethod, 'id' | 'salonId' | 'createdAt' | 'totalTransactions' | 'totalAmount'>) => {
    const newCard: CardPaymentMethod = {
      ...cardData,
      id: Date.now().toString(),
      salonId: 'salon1',
      createdAt: new Date(),
      totalTransactions: 0,
      totalAmount: 0,
    };
    setPaymentMethods([...paymentMethods, newCard]);
    setShowAddCardModal(false);
    alert('Payment card added successfully!');
  };

  const handleEditCard = (cardData: Omit<CardPaymentMethod, 'id' | 'salonId' | 'createdAt' | 'totalTransactions' | 'totalAmount'>) => {
    if (editingCard) {
      setPaymentMethods(paymentMethods.map(card =>
        card.id === editingCard.id
          ? { ...card, ...cardData }
          : card
      ));
      setEditingCard(null);
      setShowAddCardModal(false);
      alert('Payment card updated successfully!');
    }
  };

  const handleDeleteCard = (cardId: string) => {
    const card = paymentMethods.find(c => c.id === cardId);
    if (window.confirm(`Are you sure you want to delete the card ending in ${card?.cardNumber}?`)) {
      setPaymentMethods(paymentMethods.filter(card => card.id !== cardId));
      alert('Payment card deleted successfully!');
    }
  };

  const handleToggleStatus = (cardId: string) => {
    setPaymentMethods(paymentMethods.map(card =>
      card.id === cardId
        ? { ...card, isActive: !card.isActive }
        : card
    ));
  };

  const handleSetDefault = (cardId: string) => {
    setPaymentMethods(paymentMethods.map(card => ({
      ...card,
      isDefault: card.id === cardId
    })));
    alert('Default payment card updated!');
  };

  const handlePayPendingCharges = async () => {
    if (!payableConfig.isConfigured) {
      showToast('warning', 'Payment Gateway Not Configured', 'Please configure Payable IPG in environment settings.');
      return;
    }

    const defaultCard = paymentMethods.find(card => card.isDefault && card.isActive);
    if (!defaultCard) {
      showToast('warning', 'No Default Payment Method', 'Please set a default payment card first.');
      return;
    }

    const totalAmount = totalPendingAmount.toFixed(2);
    const confirmMessage = `Pay Rs. ${totalAmount} for ${pendingCharges.length} pending charges using Payable IPG?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      setProcessingPayment(true);
      
      // Create payment request for Payable IPG
      const paymentRequest: PaymentRequest = {
        amount: totalAmount,
        invoiceId: paymentService.generateInvoiceId(),
        orderDescription: `Salon Appointment Charges - ${pendingCharges.length} charges`,
        customerFirstName: defaultCard.cardHolderName.split(' ')[0] || 'Salon',
        customerLastName: defaultCard.cardHolderName.split(' ').slice(1).join(' ') || 'Owner',
        customerEmail: 'owner@salon.com', // You can get this from auth context
        customerMobilePhone: '+94771234567', // You can get this from user profile
        customerRefNo: `SALON_${Date.now()}`,
        paymentType: '1', // One-time payment
        billingAddressStreet: defaultCard.billingAddress.street,
        billingAddressCity: defaultCard.billingAddress.city,
  billingAddressCountry: 'LKA',
  billingAddressStateProvince: defaultCard.billingAddress.state || 'Western',
  billingAddressPostcodeZip: defaultCard.billingAddress.zipCode || '00100',
  custom1: 'charges',
        custom2: pendingCharges.map(c => c.id).join(',')
      };

      // Process payment through Payable IPG
      await paymentService.processOneTimePayment(paymentRequest);
      
      showToast('success', 'Payment Initiated', 'Redirecting to Payable IPG payment gateway...');
      
      // Note: The actual payment completion will be handled by webhook
      // For now, we'll simulate success after redirect
      
    } catch (error) {
      console.error('Payment error:', error);
      showToast('error', 'Payment Failed', 'Unable to process payment. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Function to pay with saved card
  const handlePayWithSavedCard = async (customerId: string, tokenId: string) => {
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
      
      const invoiceId = paymentService.generateInvoiceId();
      const orderDescription = `Salon Appointment Charges - ${pendingCharges.length} charges`;
      
      await paymentService.payWithSavedCard(
        customerId,
        tokenId,
        totalAmount,
        invoiceId,
        orderDescription
      );
      
      showToast('success', 'Payment Successful', 'Payment processed successfully!');
      
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
      
    } catch (error) {
      console.error('Saved card payment error:', error);
      showToast('error', 'Payment Failed', 'Unable to process payment with saved card.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const getCardTypeColor = (cardType: string) => {
    const type = cardTypes.find(t => t.value === cardType);
    return type?.color || 'from-gray-500 to-gray-600';
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
            onClick={() => {
              setEditingCard(null);
              setShowAddCardModal(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 rounded-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add Payment Card</span>
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
              <input
                type="text"
                placeholder="Customer ID"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={loadSavedCards}
                disabled={!selectedCustomer}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors duration-200"
              >
                Load Cards
              </button>
            </div>
          </div>
          
          {savedCards.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedCards.map((card) => (
                <div key={card.tokenId} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-900">{card.maskedCardNo}</span>
                    </div>
                    {card.defaultCard === 1 && (
                      <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                        Default
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Expires:</span>
                      <span>{card.exp}</span>
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
                      onClick={() => handlePayWithSavedCard(selectedCustomer, card.tokenId)}
                      disabled={processingPayment}
                      className="w-full mt-3 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors duration-200 text-sm"
                    >
                      {processingPayment ? 'Processing...' : `Pay Rs. ${totalPendingAmount.toFixed(2)}`}
                    </button>
                  )}
                  
                  {/* Card Management Buttons */}
                  <div className="flex space-x-2 mt-3">
                    <button
                      onClick={() => handleEditSavedCard(selectedCustomer, card.tokenId, card.nickname, card.defaultCard !== 1)}
                      disabled={processingPayment}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors duration-200 text-sm flex items-center justify-center space-x-1"
                    >
                      <Edit className="w-3 h-3" />
                      <span>{card.defaultCard === 1 ? 'Remove Default' : 'Set Default'}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSavedCard(selectedCustomer, card.tokenId)}
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
          ) : selectedCustomer ? (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p>No saved cards found for this customer</p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>Enter a customer ID to view saved cards</p>
            </div>
          )}
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

        {/* Payment Cards Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Payment Cards</h3>
            <button
              onClick={() => {
                setEditingCard(null);
                setShowAddCardModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 rounded-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Add Payment Card</span>
            </button>
          </div>

          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search payment cards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Payment Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map((card) => (
              <div key={card.id} className="relative">
                {/* Card Display */}
                <div className={`bg-gradient-to-br ${getCardTypeColor(card.cardType)} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-200`}>
                  {card.isDefault && (
                    <div className="absolute top-4 right-4">
                      <span className="bg-white bg-opacity-20 text-white text-xs font-medium px-2 py-1 rounded-full">
                        Default
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-6">
                    <CreditCard className="w-6 h-6" />
                    <span className="text-lg font-semibold capitalize">{card.cardType}</span>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-white text-opacity-80 text-sm">Card Number</p>
                      <p className="text-xl font-mono tracking-wider">{card.cardNumber}</p>
                    </div>
                    
                    <div className="flex justify-between">
                      <div>
                        <p className="text-white text-opacity-80 text-xs">Expires</p>
                        <p className="text-sm font-medium">{card.expiryMonth}/{card.expiryYear}</p>
                      </div>
                      <div>
                        <p className="text-white text-opacity-80 text-xs">CVV</p>
                        <p className="text-sm font-medium">{card.cvv}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-white text-opacity-80 text-xs">Cardholder</p>
                      <p className="text-sm font-medium">{card.cardHolderName}</p>
                    </div>
                  </div>
                </div>

                {/* Card Info */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      card.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {card.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Transactions</p>
                      <p className="font-semibold text-gray-900">{card.totalTransactions}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Amount</p>
                      <p className="font-semibold text-gray-900">Rs. {card.totalAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Processing Fee</p>
                      <p className="font-semibold text-gray-900">{card.processingFee}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Last Used</p>
                      <p className="font-semibold text-gray-900">
                        {card.lastUsed ? card.lastUsed.toLocaleDateString() : 'Never'}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                    {!card.isDefault && (
                      <button
                        onClick={() => handleSetDefault(card.id)}
                        className="flex-1 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 text-sm"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingCard(card);
                        setShowAddCardModal(true);
                      }}
                      className="flex-1 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors duration-200 text-sm"
                    >
                      <Edit className="w-4 h-4 inline mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(card.id)}
                      className={`flex-1 px-3 py-2 rounded-lg transition-colors duration-200 text-sm ${
                        card.isActive 
                          ? 'text-amber-600 hover:bg-amber-50' 
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {card.isActive ? <EyeOff className="w-4 h-4 inline mr-1" /> : <Eye className="w-4 h-4 inline mr-1" />}
                      {card.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      className="flex-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 text-sm"
                    >
                      <Trash2 className="w-4 h-4 inline mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCards.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payment cards found</h3>
              <p className="text-gray-600">Add your first payment card to start processing payments.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Card Modal */}
      {showAddCardModal && (
        <CardModal
          isOpen={showAddCardModal}
          onClose={() => {
            setShowAddCardModal(false);
            setEditingCard(null);
          }}
          onSave={editingCard ? handleEditCard : handleAddCard}
          editingCard={editingCard}
          cardTypes={cardTypes}
        />
      )}

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
    </div>
  );
};

// Card Modal Component
interface CardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: Omit<CardPaymentMethod, 'id' | 'salonId' | 'createdAt' | 'totalTransactions' | 'totalAmount'>) => void;
  editingCard: CardPaymentMethod | null;
  cardTypes: any[];
}

const CardModal: React.FC<CardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCard,
  cardTypes
}) => {
  const [formData, setFormData] = useState({
    cardType: editingCard?.cardType || 'visa',
    cardHolderName: editingCard?.cardHolderName || '',
    cardNumber: editingCard ? editingCard.cardNumber : '',
    expiryMonth: editingCard?.expiryMonth || '',
    expiryYear: editingCard?.expiryYear || '',
    cvv: editingCard ? editingCard.cvv : '',
    billingAddress: editingCard?.billingAddress || {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'Sri Lanka'
    },
    isDefault: editingCard?.isDefault || false,
    isActive: editingCard?.isActive ?? true,
    processingFee: editingCard?.processingFee || 2.9,
    merchantId: editingCard?.merchantId || '',
    lastUsed: editingCard?.lastUsed,
  });

  const [showCardNumber, setShowCardNumber] = useState(false);
  const [showCVV, setShowCVV] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mask card number for display (show only last 4 digits)
    const maskedCardNumber = editingCard 
      ? formData.cardNumber 
      : `****${formData.cardNumber.slice(-4)}`;
    
    // Mask CVV
    const maskedCVV = editingCard ? formData.cvv : '***';
    
    onSave({
      ...formData,
      cardNumber: maskedCardNumber,
      cvv: maskedCVV,
    } as any);
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    // Add spaces every 4 digits
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900">
            {editingCard ? 'Edit Payment Card' : 'Add New Payment Card'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Card Information */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <span>Card Information</span>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Type</label>
                <select
                  value={formData.cardType}
                  onChange={(e) => setFormData({ ...formData, cardType: e.target.value as any })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  {cardTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Processing Fee (%)</label>
                <input
                  type="number"
                  value={formData.processingFee}
                  onChange={(e) => setFormData({ ...formData, processingFee: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  min="0"
                  max="10"
                  step="0.1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
              <input
                type="text"
                value={formData.cardHolderName}
                onChange={(e) => setFormData({ ...formData, cardHolderName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter cardholder name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
              <div className="relative">
                <input
                  type={showCardNumber ? "text" : "password"}
                  value={formData.cardNumber}
                  onChange={(e) => setFormData({ ...formData, cardNumber: formatCardNumber(e.target.value) })}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                  placeholder={editingCard ? "****1234" : "1234 5678 9012 3456"}
                  maxLength={19}
                  required={!editingCard}
                />
                <button
                  type="button"
                  onClick={() => setShowCardNumber(!showCardNumber)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCardNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Month</label>
                <select
                  value={formData.expiryMonth}
                  onChange={(e) => setFormData({ ...formData, expiryMonth: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Month</option>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = (i + 1).toString().padStart(2, '0');
                    return (
                      <option key={month} value={month}>{month}</option>
                    );
                  })}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Year</label>
                <select
                  value={formData.expiryYear}
                  onChange={(e) => setFormData({ ...formData, expiryYear: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Year</option>
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = (new Date().getFullYear() + i).toString();
                    return (
                      <option key={year} value={year}>{year}</option>
                    );
                  })}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                <div className="relative">
                  <input
                    type={showCVV ? "text" : "password"}
                    value={formData.cvv}
                    onChange={(e) => setFormData({ ...formData, cvv: e.target.value })}
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono"
                    placeholder={editingCard ? "***" : "123"}
                    maxLength={4}
                    required={!editingCard}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCVV(!showCVV)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCVV ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <span>Billing Address</span>
            </h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
              <input
                type="text"
                value={formData.billingAddress.street}
                onChange={(e) => setFormData({
                  ...formData,
                  billingAddress: { ...formData.billingAddress, street: e.target.value }
                })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.billingAddress.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    billingAddress: { ...formData.billingAddress, city: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                <input
                  type="text"
                  value={formData.billingAddress.state}
                  onChange={(e) => setFormData({
                    ...formData,
                    billingAddress: { ...formData.billingAddress, state: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ZIP/Postal Code</label>
                <input
                  type="text"
                  value={formData.billingAddress.zipCode}
                  onChange={(e) => setFormData({
                    ...formData,
                    billingAddress: { ...formData.billingAddress, zipCode: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  value={formData.billingAddress.country}
                  onChange={(e) => setFormData({
                    ...formData,
                    billingAddress: { ...formData.billingAddress, country: e.target.value }
                  })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="Sri Lanka">Sri Lanka</option>
                  <option value="India">India</option>
                  <option value="United States">United States</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                </select>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center space-x-2">
              <Settings className="w-5 h-5 text-purple-600" />
              <span>Card Settings</span>
            </h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Merchant ID</label>
              <input
                type="text"
                value={formData.merchantId}
                onChange={(e) => setFormData({ ...formData, merchantId: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Optional merchant identifier"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label className="text-sm font-medium text-gray-700">Set as default payment method</label>
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <label className="text-sm font-medium text-gray-700">Enable this payment method</label>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Lock className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Security Notice</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Your card information is encrypted and stored securely. We never store your full card number or CVV.
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{editingCard ? 'Update' : 'Add'} Payment Card</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentBilling;