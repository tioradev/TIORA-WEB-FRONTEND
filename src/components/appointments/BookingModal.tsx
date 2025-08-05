import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, ChevronRight, Plus, Minus, DollarSign, Users } from 'lucide-react';
import { mockBarbers, mockServices, mockAppointments } from '../../data/mockData';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastProvider';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBook: (booking: any) => void;
  editingAppointment?: any;
  userRole?: 'reception' | 'owner' | 'super-admin';
}

interface SelectedService {
  id: string;
  name: string;
  duration: number;
  price: number;
  discountPrice?: number;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onBook, editingAppointment, userRole = 'owner' }) => {
  const { getSalonId } = useAuth();
  const { showSuccess, showError } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedGender, setSelectedGender] = useState<'MALE' | 'FEMALE' | null>(null);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [formData, setFormData] = useState({
    customerName: editingAppointment?.customerName || '',
    customerPhone: editingAppointment?.customerPhone?.startsWith('+94') 
      ? editingAppointment.customerPhone 
      : '+94' + (editingAppointment?.customerPhone || ''),
    selectedServices: editingAppointment?.selectedServices || [] as SelectedService[],
    date: editingAppointment?.date || '',
    barberId: editingAppointment?.barberId || '',
    timeSlot: editingAppointment?.timeSlot || '',
  });

  const [availableBarbers, setAvailableBarbers] = useState<any[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);

  const allTimeSlots = [
    '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
    '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM'
  ];

  // Calculate total amount and duration
  const totalAmount = formData.selectedServices.reduce((sum: number, service: SelectedService) => 
    sum + (service.discountPrice || service.price), 0
  );
  const totalDuration = formData.selectedServices.reduce((sum: number, service: SelectedService) => 
    sum + service.duration, 0
  );

  // Load services based on gender selection
  const loadServices = async (gender: 'MALE' | 'FEMALE') => {
    try {
      setLoadingServices(true);
      const salonId = getSalonId();
      
      if (!salonId) {
        showError('Authentication Error', 'Salon ID not found. Please ensure you are logged in.');
        return;
      }

      console.log('🔄 [BOOKING] Loading services for gender:', gender, 'salonId:', salonId);
      
      const response = await apiService.getBookingServices(salonId, gender);
      
      console.log('📡 [BOOKING] Services response:', response);
      
      if (response.success !== false && response.services) {
        console.log('✅ [BOOKING] Services loaded successfully:', response.services.length, 'services');
        setAvailableServices(response.services);
        showSuccess('Services loaded', `${response.services.length} services available for ${gender === 'MALE' ? 'Gents' : 'Ladies'}`);
      } else {
        const errorMessage = response.message || 'Failed to load services';
        showError('Loading failed', errorMessage);
        setAvailableServices([]);
      }
    } catch (error) {
      console.error('❌ [BOOKING] Error loading services:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showError('Loading failed', `Error loading services: ${errorMessage}`);
      setAvailableServices([]);
    } finally {
      setLoadingServices(false);
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (!editingAppointment) {
        setCurrentStep(0); // Start with gender selection
        setSelectedGender(null);
        setAvailableServices([]);
        setFormData({
          customerName: '',
          customerPhone: '+94',
          selectedServices: [],
          date: '',
          barberId: '',
          timeSlot: '',
        });
      } else {
        // When editing, convert single service to selectedServices array
        let selectedServices: SelectedService[] = [];
        
        if (editingAppointment.selectedServices && editingAppointment.selectedServices.length > 0) {
          // If the appointment already has selectedServices array (new format)
          selectedServices = editingAppointment.selectedServices;
        } else if (editingAppointment.serviceId && editingAppointment.serviceName) {
          // Convert single service to array format (legacy format)
          const service = mockServices.find(s => s.id === editingAppointment.serviceId);
          if (service) {
            selectedServices = [{
              id: editingAppointment.serviceId,
              name: editingAppointment.serviceName,
              duration: service.duration,
              price: service.price,
              discountPrice: service.discountPrice
            }];
          }
        }

        setCurrentStep(0); // Start with gender selection for editing too
        setFormData({
          customerName: editingAppointment.customerName || '',
          customerPhone: editingAppointment.customerPhone?.startsWith('+94') ? editingAppointment.customerPhone : '+94' + (editingAppointment.customerPhone || ''),
          selectedServices: selectedServices,
          date: editingAppointment.date || '',
          barberId: editingAppointment.barberId || '',
          timeSlot: editingAppointment.timeSlot || '',
        });
      }
    }
  }, [isOpen, editingAppointment]);

  // Update available barbers when services are selected
  useEffect(() => {
    if (formData.selectedServices.length > 0) {
      // Get all required skills from selected services
      const allRequiredSkills = formData.selectedServices.flatMap((selectedService: SelectedService) => {
        const service = mockServices.find((s: any) => s.id === selectedService.id);
        return service?.requiredSkills || [];
      });
      
      // Filter barbers who have all required skills
      const qualifiedBarbers = mockBarbers.filter((barber: any) => 
        barber.isActive && 
        allRequiredSkills.every((skill: string) => 
          barber.specializedArea.toLowerCase().includes(skill.toLowerCase())
        )
      );
      
      setAvailableBarbers(qualifiedBarbers.length > 0 ? qualifiedBarbers : mockBarbers.filter((b: any) => b.isActive));
    } else {
      setAvailableBarbers(mockBarbers.filter(b => b.isActive));
    }
  }, [formData.selectedServices]);

  // Update available time slots when date and barber are selected
  useEffect(() => {
    if (formData.date && (formData.barberId || userRole === 'reception') && totalDuration > 0) {
      // If no barber is selected (reception mode), show all available time slots
      if (formData.barberId === 'no-barber' || (userRole === 'reception' && !formData.barberId)) {
        const slotsNeeded = Math.ceil(totalDuration / 30);
        const available = allTimeSlots.filter((_slot: string, index: number) => {
          return index + slotsNeeded <= allTimeSlots.length;
        });
        setAvailableTimeSlots(available);
        return;
      }

      // Get existing appointments for this barber on this date
      const existingAppointments = mockAppointments.filter(
        app => app.barberId === formData.barberId && 
               app.date === formData.date &&
               app.status !== 'cancelled'
      );

      // Calculate unavailable slots based on existing appointments
      const unavailableSlots = new Set<string>();
      
      existingAppointments.forEach(appointment => {
        const appointmentService = mockServices.find(s => s.id === appointment.serviceId);
        if (appointmentService) {
          const startIndex = allTimeSlots.indexOf(appointment.timeSlot);
          const slotsNeeded = Math.ceil(appointmentService.duration / 30);
          
          // Mark slots as unavailable
          for (let i = 0; i < slotsNeeded; i++) {
            if (startIndex + i < allTimeSlots.length) {
              unavailableSlots.add(allTimeSlots[startIndex + i]);
            }
          }
        }
      });

      // Filter available slots based on total duration of selected services
      const slotsNeeded = Math.ceil(totalDuration / 30);
      
      const available = allTimeSlots.filter((_slot: string, index: number) => {
        // Check if this slot and required consecutive slots are available
        for (let i = 0; i < slotsNeeded; i++) {
          if (index + i >= allTimeSlots.length || unavailableSlots.has(allTimeSlots[index + i])) {
            return false;
          }
        }
        return true;
      });

      setAvailableTimeSlots(available);
    }
  }, [formData.date, formData.barberId, totalDuration, userRole]);

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleServiceToggle = (service: any) => {
    const isSelected = formData.selectedServices.some((s: SelectedService) => s.id === service.id);
    
    if (isSelected) {
      // Remove service
      setFormData({
        ...formData,
        selectedServices: formData.selectedServices.filter((s: SelectedService) => s.id !== service.id)
      });
    } else {
      // Add service
      const selectedService: SelectedService = {
        id: service.id,
        name: service.name,
        duration: service.duration,
        price: service.price,
        discountPrice: service.discountPrice,
      };
      setFormData({
        ...formData,
        selectedServices: [...formData.selectedServices, selectedService]
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.selectedServices.length > 0) {
      let barberName = 'To be assigned';
      let barberId = formData.barberId;
      
      // Handle case when a specific barber is selected
      if (formData.barberId && formData.barberId !== 'no-barber') {
        const selectedBarber = mockBarbers.find(b => b.id === formData.barberId);
        if (selectedBarber) {
          barberName = `${selectedBarber.firstName} ${selectedBarber.lastName}`;
        }
      } else if (formData.barberId === 'no-barber' || !formData.barberId) {
        // Handle case when no barber is selected (reception mode)
        barberId = 'no-barber';
        barberName = 'To be assigned';
      }

      const bookingData = {
        ...formData,
        id: editingAppointment?.id || Date.now().toString(),
        customerId: editingAppointment?.customerId || `c${Date.now()}`,
        barberId: barberId,
        barberName: barberName,
        serviceName: formData.selectedServices.map((s: SelectedService) => s.name).join(', '),
        serviceId: formData.selectedServices[0].id, // Primary service for compatibility
        amount: totalAmount,
        finalAmount: totalAmount,
        duration: totalDuration,
        status: editingAppointment?.status || 'booked',
        paymentStatus: editingAppointment?.paymentStatus || 'pending',
        createdAt: editingAppointment?.createdAt || new Date(),
      };
      
      onBook(bookingData);
      onClose();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return selectedGender !== null;
      case 1: return formData.selectedServices.length > 0;
      case 2: return formData.date !== '';
      case 3: return formData.timeSlot !== '' && formData.customerName !== '' && formData.customerPhone.length >= 12; // +94 + 9 digits
      default: return false;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 0: return 'Select Category';
      case 1: return 'Select Services';
      case 2: return 'Choose Date & Barber';
      case 3: return 'Time Slot & Customer Details';
      default: return 'Book Appointment';
    }
  };

  // Function to check if a step can be accessed
  const canAccessStep = (step: number) => {
    switch (step) {
      case 0: return true; // Always accessible - gender selection
      case 1: return selectedGender !== null; // Need gender selected
      case 2: return selectedGender !== null && formData.selectedServices.length > 0; // Need gender and services selected
      case 3: return selectedGender !== null && formData.selectedServices.length > 0 && formData.date; // Need gender, services and date
      default: return false;
    }
  };

  // Function to handle step click navigation
  const handleStepClick = (step: number) => {
    if (canAccessStep(step)) {
      setCurrentStep(step);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] min-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {editingAppointment ? 'Edit Appointment' : 'Book New Appointment'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{getStepTitle()}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            {[0, 1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <button
                  type="button"
                  onClick={() => handleStepClick(step)}
                  disabled={!canAccessStep(step)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${
                    step <= currentStep 
                      ? 'bg-blue-500 text-white' 
                      : canAccessStep(step)
                        ? 'bg-gray-200 text-gray-600 hover:bg-gray-300 cursor-pointer'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {step === 0 ? <Users className="w-4 h-4" /> : step}
                </button>
                {step < 3 && (
                  <ChevronRight className={`w-4 h-4 ${
                    step < currentStep ? 'text-blue-500' : 'text-gray-300'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Step 0: Select Gender */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div>
                <label className="block text-lg font-medium text-gray-900 mb-4">Select Service Category</label>
                <p className="text-sm text-gray-600 mb-6">Choose whether this appointment is for Gents or Ladies services.</p>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGender('MALE');
                      loadServices('MALE');
                    }}
                    className={`p-6 border-2 rounded-xl transition-all duration-200 ${
                      selectedGender === 'MALE'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                        selectedGender === 'MALE' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Users className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Gents</h3>
                      <p className="text-sm text-gray-600">Services for male customers</p>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGender('FEMALE');
                      loadServices('FEMALE');
                    }}
                    className={`p-6 border-2 rounded-xl transition-all duration-200 ${
                      selectedGender === 'FEMALE'
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                        selectedGender === 'FEMALE' ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        <Users className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Ladies</h3>
                      <p className="text-sm text-gray-600">Services for female customers</p>
                    </div>
                  </button>
                </div>
                
                {loadingServices && (
                  <div className="mt-4 text-center">
                    <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-lg">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                      <span className="text-sm text-blue-700">Loading services...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 1: Select Services */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose Services 
                  {selectedGender && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {selectedGender === 'MALE' ? 'Gents' : 'Ladies'}
                    </span>
                  )}
                </label>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {availableServices.length > 0 ? availableServices.filter((service: any) => service.is_active !== false).map((service: any) => {
                    const isSelected = formData.selectedServices.some((s: SelectedService) => s.id === service.id.toString());
                    return (
                      <div
                        key={service.id}
                        onClick={() => handleServiceToggle({
                          id: service.id.toString(),
                          name: service.name,
                          duration: service.duration_minutes || 60,
                          price: service.price || 0,
                          discountPrice: service.discount_price,
                          description: service.description
                        })}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isSelected 
                                  ? 'border-blue-500 bg-blue-500' 
                                  : 'border-gray-300'
                              }`}>
                                {isSelected && <Plus className="w-3 h-3 text-white" />}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{service.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                  <span className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{service.duration_minutes || 60} min</span>
                                  </span>
                                  <span className="flex items-center space-x-1">
                                    <DollarSign className="w-3 h-3" />
                                    <span>
                                      {service.discount_price ? (
                                        <>
                                          <span className="font-medium">Rs. {service.discount_price}</span>
                                          <span className="line-through ml-1">Rs. {service.price}</span>
                                        </>
                                      ) : (
                                        <span className="font-medium">Rs. {service.price}</span>
                                      )}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }) : (
                    <div className="text-center py-8 text-gray-500">
                      {selectedGender ? 'No services available for the selected category.' : 'Please select a category first.'}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Services Summary */}
              {formData.selectedServices.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">Selected Services ({formData.selectedServices.length})</h4>
                  <div className="space-y-2">
                    {formData.selectedServices.map((service: SelectedService) => (
                      <div key={service.id} className="flex items-center justify-between text-sm">
                        <span className="text-blue-700">{service.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-600">{service.duration} min</span>
                          <span className="font-semibold text-blue-900">
                            Rs. {service.discountPrice || service.price}
                          </span>
                          <button
                            type="button"
                          onClick={() => handleServiceToggle(service)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-blue-200 flex justify-between font-semibold text-blue-900">
                      <span>Total: {totalDuration} minutes</span>
                      <span>Rs. {totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Date */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, date: new Date().toISOString().split('T')[0] })}
                    className="px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition-colors duration-200 text-sm font-medium"
                  >
                    Select Today
                  </button>
                </div>
              </div>
              
              {formData.selectedServices.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">Selected Services Summary</h4>
                  <div className="mt-2 space-y-1">
                    {formData.selectedServices.map((service: SelectedService) => (
                      <p key={service.id} className="text-sm text-blue-700">
                        {service.name} - {service.duration} min - Rs. {service.discountPrice || service.price}
                      </p>
                    ))}
                    <div className="pt-2 border-t border-blue-200 font-semibold text-blue-900">
                      Total: {totalDuration} minutes • Rs. {totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Select Barber */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Choose Barber</label>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {availableBarbers.map(barber => (
                    <div
                      key={barber.id}
                      onClick={() => setFormData({ ...formData, barberId: barber.id })}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        formData.barberId === barber.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{barber.firstName} {barber.lastName}</h4>
                          <p className="text-sm text-gray-600">{barber.specializedArea}</p>
                          <p className="text-xs text-gray-500">{barber.experience} years experience</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Continue Without Barber option for reception */}
                  {userRole === 'reception' && (
                    <div
                      onClick={() => setFormData({ ...formData, barberId: 'no-barber' })}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        formData.barberId === 'no-barber'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-orange-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">Continue Without Barber</h4>
                          <p className="text-sm text-orange-600">Assign barber later</p>
                          <p className="text-xs text-gray-500">Barber will be assigned when customer arrives</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Time Slot & Customer Details */}
          {currentStep === 4 && (
            <div className="space-y-4">
              {/* Service & Cost Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-blue-900 flex items-center space-x-2">
                    <DollarSign className="w-5 h-5" />
                    <span>Booking Summary</span>
                  </h4>
                </div>
                <div className="space-y-2">
                  {formData.selectedServices.map((service: SelectedService, index: number) => (
                    <div key={service.id} className="flex justify-between items-center text-sm">
                      <span className="text-blue-700">
                        {index + 1}. {service.name} ({service.duration} min)
                      </span>
                      <span className="font-semibold text-blue-900">
                        Rs. {(service.discountPrice || service.price).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-blue-300 flex justify-between items-center font-bold text-blue-900">
                    <span>Total ({totalDuration} minutes)</span>
                    <span className="text-lg">Rs. {totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Available Time Slots</label>
                <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto">
                  {availableTimeSlots.map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setFormData({ ...formData, timeSlot: slot })}
                      className={`p-2 text-sm border rounded-lg transition-all duration-200 ${
                        formData.timeSlot === slot
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
                {availableTimeSlots.length === 0 && (
                  <p className="text-sm text-red-600 mt-2">No available time slots for this date and barber.</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter customer name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 bg-gray-100 px-2 py-1 rounded text-sm font-medium">
                    +94
                  </div>
                  <input
                    type="tel"
                    value={formData.customerPhone.replace('+94', '')}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 9); // Only numbers, max 9 digits
                      setFormData({ ...formData, customerPhone: '+94' + value });
                    }}
                    className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="771234567"
                    maxLength={9}
                    pattern="[0-9]{9}"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Enter 9 digits after +94</p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex space-x-3 pt-6 border-t border-gray-100 mt-6">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                Back
              </button>
            )}
            
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!canProceed()}
                className={`flex-1 px-4 py-3 rounded-lg transition-all duration-200 ${
                  canProceed()
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={!canProceed()}
                className={`flex-1 px-4 py-3 rounded-lg transition-all duration-200 ${
                  canProceed()
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {editingAppointment ? 'Update' : 'Book'} Appointment (Rs. {totalAmount.toFixed(2)})
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;