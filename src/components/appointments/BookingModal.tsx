import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, ChevronRight, Plus, Minus, DollarSign, Users } from 'lucide-react';
import { apiService, TimeSlot, CreateAppointmentRequest } from '../../services/api';
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
  const { getSalonId, getBranchId } = useAuth();
  const { showSuccess, showError } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedGender, setSelectedGender] = useState<'MALE' | 'FEMALE' | null>(null);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [formData, setFormData] = useState({
    customerFirstName: editingAppointment?.customerName?.split(' ')[0] || '',
    customerLastName: editingAppointment?.customerName?.split(' ').slice(1).join(' ') || '',
    customerPhone: editingAppointment?.customerPhone?.startsWith('+94') 
      ? editingAppointment.customerPhone 
      : '+94' + (editingAppointment?.customerPhone || ''),
    customerGender: selectedGender as 'MALE' | 'FEMALE' | 'OTHER' | null,
    selectedServices: editingAppointment?.selectedServices || [] as SelectedService[],
    date: editingAppointment?.date || '',
    barberId: editingAppointment?.barberId || '',
    timeSlot: editingAppointment?.timeSlot || '',
  });

  const [availableBarbers, setAvailableBarbers] = useState<any[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingBarbers, setLoadingBarbers] = useState(false);
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false);
  const [selectedBarberName, setSelectedBarberName] = useState<string>('');
  const [saving, setSaving] = useState(false);

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
          customerFirstName: '',
          customerLastName: '',
          customerPhone: '+94',
          customerGender: null as 'MALE' | 'FEMALE' | 'OTHER' | null,
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
          // Use available data from the appointment since we don't have access to service details
          selectedServices = [{
            // Use original service ID if available, otherwise use display ID
            id: editingAppointment.originalServiceId || editingAppointment.serviceId,
            name: editingAppointment.serviceName,
            duration: 60, // Default duration if not available
            price: editingAppointment.amount || 0,
            discountPrice: editingAppointment.discountAmount || undefined
          }];
        }

        setCurrentStep(0); // Start with gender selection for editing too
        
        // Try to determine gender from appointment data
        // This could be from customerGender field or inferred from service type
        let inferredGender: 'MALE' | 'FEMALE' | null = null;
        if (editingAppointment.customerGender === 'MALE' || editingAppointment.customerGender === 'FEMALE') {
          inferredGender = editingAppointment.customerGender;
        }
        // If no explicit gender, we'll let user select it again
        
        setSelectedGender(inferredGender);
        
        // If we have an inferred gender, load services for that gender
        if (inferredGender) {
          loadServices(inferredGender);
        }
        
        setFormData({
          customerFirstName: editingAppointment.customerName?.split(' ')[0] || '',
          customerLastName: editingAppointment.customerName?.split(' ').slice(1).join(' ') || '',
          customerPhone: editingAppointment.customerPhone?.startsWith('+94') ? editingAppointment.customerPhone : '+94' + (editingAppointment.customerPhone || ''),
          customerGender: inferredGender,
          selectedServices: selectedServices,
          date: editingAppointment.date || '',
          barberId: editingAppointment.originalEmployeeId || editingAppointment.barberId || '',
          timeSlot: editingAppointment.timeSlot || '',
        });
      }
    }
  }, [isOpen, editingAppointment]);

  // Update available barbers when services are selected and date is chosen
  useEffect(() => {
    const loadAvailableBarbers = async () => {
      if (formData.selectedServices.length > 0 && formData.date) {
        try {
          setLoadingBarbers(true);
          const salonId = getSalonId();
          if (!salonId) {
            console.error('No salon ID found');
            showError('Authentication Error', 'Salon ID not found. Please ensure you are logged in.');
            setAvailableBarbers([]);
            return;
          }

          // Extract service IDs from selected services, using original IDs if in edit mode
          const serviceIds = formData.selectedServices.map((service: SelectedService) => {
            // If editing and we have original service ID, use it for the first service
            // For multiple services, we'll need to use the display ID as fallback
            if (editingAppointment && editingAppointment.originalServiceId && service === formData.selectedServices[0]) {
              return editingAppointment.originalServiceId;
            }
            return service.id;
          });
          
          console.log('👥 [BOOKING] Loading available barbers for services:', serviceIds, 'date:', formData.date, 'gender:', selectedGender);
          
          // Call the availability API with customer gender
          const availableBarbers = await apiService.getAvailableBarbers(
            serviceIds,
            formData.date,
            salonId,
            selectedGender || undefined // Pass the selected gender from step 0, convert null to undefined
          );

          console.log('👥 [BOOKING] API Response - Available Barbers:', availableBarbers);

          if (availableBarbers && availableBarbers.length > 0) {
            // Convert API response to the format expected by the UI
            const convertedBarbers = availableBarbers.map(barber => ({
              id: barber.barber_id.toString(),
              name: barber.name,
              specializedArea: barber.specialties.join(', '),
              avatar: barber.image_url || '/default-avatar.png',
              isActive: barber.can_perform_services,
              experienceYears: barber.experience_years,
              rating: barber.ratings,
              specialties: barber.specialties,
              canPerformServices: barber.can_perform_services,
              servesGender: barber.serves_gender
            }));
            
            console.log('🔄 [BOOKING] Converted barbers for UI:', convertedBarbers);
            
            // Filter to only show barbers who can perform all services
            const qualifiedBarbers = convertedBarbers.filter(barber => barber.canPerformServices);
            const finalBarbers = qualifiedBarbers.length > 0 ? qualifiedBarbers : convertedBarbers;
            setAvailableBarbers(finalBarbers);
            
            console.log('✅ [BOOKING] Final qualified barbers:', finalBarbers);
            
            if (finalBarbers.length > 0) {
              showSuccess('Barbers loaded', `${finalBarbers.length} barber(s) available for selected services`);
            }
          } else {
            console.log('⚠️ [BOOKING] No available barbers from API');
            setAvailableBarbers([]);
            // Don't show error here as the UI will display "no barbers available" message
          }
        } catch (error) {
          console.error('❌ [BOOKING] Error loading available barbers:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
          showError('Loading failed', `Error loading barbers: ${errorMessage}`);
          setAvailableBarbers([]);
        } finally {
          setLoadingBarbers(false);
        }
      } else if (formData.selectedServices.length > 0 && !formData.date) {
        // If services are selected but no date yet, clear barbers
        setAvailableBarbers([]);
      } else {
        // No services selected, clear barbers
        setAvailableBarbers([]);
      }
    };

    loadAvailableBarbers();
  }, [formData.selectedServices, formData.date, selectedGender, getSalonId, showSuccess, showError]);

  // Update available time slots when date and barber are selected
  useEffect(() => {
    const loadAvailableTimeSlots = async () => {
      if (formData.date && formData.barberId && formData.selectedServices.length > 0) {
        // Skip API call for 'no-barber' option in reception mode
        if (formData.barberId === 'no-barber') {
          // Generate mock time slots for reception mode with proper 24-hour format
          const convertTo24HourFormat = (timeStr: string): string => {
            const [time, period] = timeStr.split(' ');
            const [hour, minute] = time.split(':');
            let hour24 = parseInt(hour);
            
            if (period === 'PM' && hour24 !== 12) {
              hour24 += 12;
            } else if (period === 'AM' && hour24 === 12) {
              hour24 = 0;
            }
            
            return `${hour24.toString().padStart(2, '0')}:${minute}`;
          };

          const mockTimeSlots: TimeSlot[] = allTimeSlots.map(slot => {
            const time24 = convertTo24HourFormat(slot);
            return {
              start_time: time24,
              end_time: time24,
              is_available: true,
              unavailable_reason: null
            };
          });
          
          console.log('🕐 [BOOKING] Mock time slots generated:', mockTimeSlots);
          console.log('🕐 [BOOKING] Sample mock time slot:', mockTimeSlots[0]);
          setAvailableTimeSlots(mockTimeSlots);
          return;
        }

        try {
          setLoadingTimeSlots(true);
          const salonId = getSalonId();
          if (!salonId) {
            console.error('No salon ID found');
            setAvailableTimeSlots([]);
            return;
          }

          // Extract service IDs from selected services, using original IDs if in edit mode
          const serviceIds = formData.selectedServices.map((service: SelectedService) => {
            // If editing and we have original service ID, use it for the first service
            // For multiple services, we'll need to use the display ID as fallback
            if (editingAppointment && editingAppointment.originalServiceId && service === formData.selectedServices[0]) {
              return editingAppointment.originalServiceId;
            }
            return service.id;
          });
          
          console.log('🔄 [BOOKING] Preparing to load time slots with parameters:');
          // Use original barber ID if available for edit mode
          const barberIdToUse = editingAppointment && editingAppointment.originalEmployeeId 
            ? editingAppointment.originalEmployeeId 
            : formData.barberId;
          console.log('👤 [BOOKING] Barber ID:', barberIdToUse, '(original:', editingAppointment?.originalEmployeeId, ', display:', formData.barberId, ')');
          console.log('🛠️ [BOOKING] Service IDs:', serviceIds);
          console.log('📅 [BOOKING] Date:', formData.date);
          console.log('🏪 [BOOKING] Salon ID:', salonId);
          console.log('🌐 [BOOKING] Expected endpoint: /api/v1/availability/time-slots');
          
          // Call the new time slots API with original IDs
          const response = await apiService.getAvailableTimeSlots(
            barberIdToUse,
            serviceIds,
            formData.date,
            salonId
          );

          console.log('🕐 [BOOKING] Time slots API response:', response);

          if (response.success && response.available_slots) {
            console.log('🕐 [BOOKING] Raw time slots from API:', response.available_slots);
            console.log('🕐 [BOOKING] Sample time slot format:', response.available_slots[0]);
            setAvailableTimeSlots(response.available_slots);
            
            // Store barber name for display
            if (response.barber_name) {
              setSelectedBarberName(response.barber_name);
            }

            // Show success message with availability info
            const availableCount = response.available_slots.filter(slot => slot.is_available).length;
            const totalCount = response.available_slots.length;
            showSuccess(
              '⏰ Time Slots Loaded', 
              `Found ${availableCount} available slots out of ${totalCount} total slots for ${response.barber_name || 'selected barber'}`
            );
          } else {
            // Handle different types of API errors based on the response
            const errorMessage = response.message || 'Failed to load time slots';
            console.error('❌ [BOOKING] Failed to load time slots:', errorMessage);
            
            if (errorMessage.includes('Invalid parameters') || errorMessage.includes('Service IDs cannot be empty')) {
              showError('⚠️ Invalid Request', 'Please ensure all services are properly selected and try again.');
            } else if (errorMessage.includes('Barber not found')) {
              showError('👤 Barber Not Found', 'The selected barber is not available. Please select a different barber.');
            } else if (errorMessage.includes('Service not found')) {
              showError('🛠️ Service Error', 'One or more selected services are not available. Please review your service selection.');
            } else if (errorMessage.includes('Salon not found')) {
              showError('🏪 Salon Error', 'Salon information could not be found. Please refresh and try again.');
            } else if (errorMessage.includes('No working hours') || errorMessage.includes('not available on this date')) {
              showError('📅 No Availability', 'The selected barber is not available on the chosen date. Please select a different date.');
            } else {
              showError('⏰ Time Slots Error', `Unable to load available time slots: ${errorMessage}`);
            }
            
            setAvailableTimeSlots([]);
          }
        } catch (error) {
          console.error('❌ [BOOKING] Error loading time slots:', error);
          
          // Handle network and other unexpected errors
          let errorMessage = 'An unexpected error occurred while loading time slots.';
          
          if (error instanceof Error) {
            if (error.message.includes('fetch')) {
              errorMessage = 'Network error: Unable to connect to the server. Please check your internet connection.';
            } else if (error.message.includes('timeout')) {
              errorMessage = 'Request timeout: The server is taking too long to respond. Please try again.';
            } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
              errorMessage = 'Authentication error: Please log in again and try.';
            } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
              errorMessage = 'Access denied: You do not have permission to access this resource.';
            } else if (error.message.includes('500')) {
              errorMessage = 'Server error: Please try again later or contact support if the problem persists.';
            } else {
              errorMessage = `Error: ${error.message}`;
            }
          }
          
          showError('🚫 Loading Failed', errorMessage);
          setAvailableTimeSlots([]);
        } finally {
          setLoadingTimeSlots(false);
        }
      } else {
        // Clear time slots if requirements not met
        setAvailableTimeSlots([]);
      }
    };

    loadAvailableTimeSlots();
  }, [formData.date, formData.barberId, formData.selectedServices, getSalonId]);

  const handleNext = () => {
    if (currentStep < 5) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.selectedServices.length === 0) {
      showError('No services selected', 'Please select at least one service');
      return;
    }

    if (!formData.customerFirstName || !formData.customerLastName || !formData.customerPhone) {
      showError('Missing customer details', 'Please provide customer first name, last name, and phone number');
      return;
    }

    if (!formData.customerGender) {
      showError('Missing customer gender', 'Please select customer gender');
      return;
    }

    if (!formData.timeSlot || !formData.date) {
      showError('Missing appointment details', 'Please select a date and time slot');
      return;
    }

    if (!formData.barberId) {
      showError('No barber selected', 'Please select a barber for the appointment');
      return;
    }

    try {
      setSaving(true);
      const salonId = getSalonId();
      
      if (!salonId) {
        showError('Salon not found', 'Unable to determine salon. Please try logging in again.');
        return;
      }

      // Use the separate first and last name fields
      const firstName = formData.customerFirstName.trim();
      const lastName = formData.customerLastName.trim();

      // Clean phone number (keep +94 prefix as required by new format)
      const cleanPhone = formData.customerPhone.startsWith('+94') 
        ? formData.customerPhone 
        : `+94${formData.customerPhone.replace('+94', '').trim()}`;

      // Convert service IDs to numbers
      const serviceIds = formData.selectedServices.map((service: SelectedService) => parseInt(service.id));

      // Convert barber ID to number
      const barberId = parseInt(formData.barberId);
      
      // Calculate total service price
      const totalServicePrice = formData.selectedServices.reduce((total: number, service: SelectedService) => total + service.price, 0);

      // Create full datetime string for backend (LocalDateTime format)
      // Convert 12-hour format to 24-hour format if needed
      const convertTo24Hour = (timeString: string): string => {
        console.log('🔄 [BOOKING] Converting time:', timeString);
        
        // Remove microseconds if present (e.g., 11:30:50.6540768 -> 11:30:50)
        if (timeString.includes('.')) {
          const withoutMicroseconds = timeString.split('.')[0];
          console.log('✂️ [BOOKING] Removed microseconds:', { original: timeString, cleaned: withoutMicroseconds });
          timeString = withoutMicroseconds;
        }
        
        // If it's already in 24-hour format with seconds (HH:mm:ss), return as is
        if (/^\d{1,2}:\d{2}:\d{2}$/.test(timeString)) {
          const parts = timeString.split(':');
          const result = `${parts[0].padStart(2, '0')}:${parts[1]}:${parts[2]}`;
          console.log('✅ [BOOKING] Already 24-hour with seconds:', result);
          return result;
        }
        
        // If it's already in 24-hour format (HH:mm), return with seconds
        if (/^\d{1,2}:\d{2}$/.test(timeString)) {
          // Ensure 2-digit hour format and add seconds
          const [hour, minute] = timeString.split(':');
          const result = `${hour.padStart(2, '0')}:${minute}:00`;
          console.log('✅ [BOOKING] Added seconds to 24-hour time:', result);
          return result;
        }
        
        // If it contains AM/PM, convert to 24-hour
        if (timeString.includes('AM') || timeString.includes('PM')) {
          const [time, period] = timeString.trim().split(' ');
          const [hour, minute] = time.split(':');
          let hour24 = parseInt(hour);
          
          console.log('🔄 [BOOKING] Converting AM/PM time:', { 
            originalTime: timeString, 
            timePart: time, 
            period: period,
            hourParsed: hour24,
            minute: minute 
          });
          
          if (period === 'PM' && hour24 !== 12) {
            hour24 += 12;
            console.log('🔄 [BOOKING] PM conversion (not 12): added 12 hours, result:', hour24);
          } else if (period === 'AM' && hour24 === 12) {
            hour24 = 0;
            console.log('🔄 [BOOKING] 12 AM conversion: changed to 0 hours');
          } else if (period === 'PM' && hour24 === 12) {
            console.log('🔄 [BOOKING] 12 PM conversion: keeping as 12');
          } else {
            console.log('🔄 [BOOKING] AM conversion (not 12): keeping hour as is:', hour24);
          }
          
          const result = `${hour24.toString().padStart(2, '0')}:${minute}:00`;
          console.log('✅ [BOOKING] Final 12-hour to 24-hour conversion:', { 
            input: timeString, 
            output: result,
            hourFinal: hour24,
            minuteFinal: minute
          });
          return result;
        }
        
        console.log('⚠️ [BOOKING] Using time as-is (no AM/PM detected):', timeString);
        return timeString;
      };

      const timeIn24Hour = convertTo24Hour(formData.timeSlot);
      
      // Ensure proper datetime format: YYYY-MM-DDTHH:mm:ss
      // This creates the appointment start time in local timezone
      const appointmentDateTime = `${formData.date}T${timeIn24Hour}`;
      
      // Debug: Check the exact format being generated
      console.log('🔍 [BOOKING] Debugging datetime format generation:', {
        formDataDate: formData.date,
        formDataDateType: typeof formData.date,
        formDataTimeSlot: formData.timeSlot,
        formDataTimeSlotType: typeof formData.timeSlot,
        convertedTime: timeIn24Hour,
        convertedTimeLength: timeIn24Hour?.length,
        dateTimeCombined: appointmentDateTime,
        dateTimeCombinedLength: appointmentDateTime.length,
        expectedFormat: 'YYYY-MM-DDTHH:mm:ss (length: 19)',
        actualFormat: appointmentDateTime,
        splitCheck: {
          datePart: formData.date,
          timePart: timeIn24Hour,
          hasCorrectDateFormat: /^\d{4}-\d{2}-\d{2}$/.test(formData.date),
          hasCorrectTimeFormat: /^\d{2}:\d{2}:\d{2}$/.test(timeIn24Hour)
        }
      });
      
      console.log('🔄 [BOOKING] Creating appointment start time:', {
        selectedDate: formData.date,
        selectedTimeSlot: formData.timeSlot,
        selectedTimeSlotType: typeof formData.timeSlot,
        convertedTo24Hour: timeIn24Hour,
        finalAppointmentDateTime: appointmentDateTime,
        currentRealTime: new Date().toISOString(),
        currentLocalTime: new Date().toLocaleString(),
        currentHour: new Date().getHours(),
        currentMinute: new Date().getMinutes(),
        currentFormattedTime: `${new Date().getHours().toString().padStart(2, '0')}:${new Date().getMinutes().toString().padStart(2, '0')}:${new Date().getSeconds().toString().padStart(2, '0')}`
      });
      
      // Calculate estimated end time based on total service duration
      // Example: If appointment starts at "2025-08-05T14:00:00" and total duration is 60 minutes,
      // the estimated end time will be "2025-08-05T15:00:00"
      const calculateEstimatedEndTime = (startDateTime: string, durationMinutes: number): string => {
        console.log('🔄 [BOOKING] Calculating end time:', { startDateTime, durationMinutes });
        
        // Remove microseconds from datetime if present
        let cleanStartDateTime = startDateTime;
        if (startDateTime.includes('.')) {
          const parts = startDateTime.split('.');
          cleanStartDateTime = parts[0];
          console.log('✂️ [BOOKING] Removed microseconds from datetime:', { 
            original: startDateTime, 
            cleaned: cleanStartDateTime 
          });
        }
        
        // Validate input format first
        if (!cleanStartDateTime || !cleanStartDateTime.includes('T')) {
          console.error('❌ [BOOKING] Invalid startDateTime format:', cleanStartDateTime);
          throw new Error(`Invalid startDateTime format: ${cleanStartDateTime}`);
        }
        
        // Parse the start datetime (which is already in local time format)
        const [datePart, timePart] = cleanStartDateTime.split('T');
        
        if (!datePart || !timePart) {
          console.error('❌ [BOOKING] Failed to split datetime:', { datePart, timePart });
          throw new Error(`Failed to parse datetime: ${startDateTime}`);
        }
        
        const [year, month, day] = datePart.split('-').map(Number);
        const [hour, minute, second] = timePart.split(':').map(Number);
        
        console.log('🔄 [BOOKING] Parsed datetime components:', { 
          year, month, day, hour, minute, second: second || 0,
          originalDateTime: startDateTime 
        });
        
        // Validate parsed components
        if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(minute)) {
          console.error('❌ [BOOKING] Invalid parsed components:', { year, month, day, hour, minute, second });
          throw new Error(`Invalid datetime components parsed from: ${startDateTime}`);
        }
        
        // Create a date object in local time (not UTC)
        // Note: month is 0-indexed in Date constructor
        const startDate = new Date(year, month - 1, day, hour, minute, second || 0);
        console.log('🔄 [BOOKING] Start date object created:', {
          startDate: startDate,
          startDateISO: startDate.toISOString(),
          startDateLocal: startDate.toLocaleString(),
          timestamp: startDate.getTime()
        });
        
        // Validate the created date
        if (isNaN(startDate.getTime())) {
          console.error('❌ [BOOKING] Invalid date object created from components:', { year, month: month-1, day, hour, minute, second });
          throw new Error(`Invalid date created from: ${startDateTime}`);
        }
        
        // Add the duration in minutes
        const endDate = new Date(startDate.getTime() + (durationMinutes * 60 * 1000));
        console.log('🔄 [BOOKING] End date object after adding duration:', {
          endDate: endDate,
          endDateISO: endDate.toISOString(),
          endDateLocal: endDate.toLocaleString(),
          durationAdded: durationMinutes,
          millisecondsAdded: durationMinutes * 60 * 1000,
          timeDifference: endDate.getTime() - startDate.getTime()
        });
        
        // Format back to ISO-like string but in local time
        const endYear = endDate.getFullYear();
        const endMonth = (endDate.getMonth() + 1).toString().padStart(2, '0');
        const endDay = endDate.getDate().toString().padStart(2, '0');
        const endHour = endDate.getHours().toString().padStart(2, '0');
        const endMinute = endDate.getMinutes().toString().padStart(2, '0');
        const endSecond = endDate.getSeconds().toString().padStart(2, '0');
        
        const result = `${endYear}-${endMonth}-${endDay}T${endHour}:${endMinute}:${endSecond}`;
        console.log('✅ [BOOKING] Calculated end time successfully:', {
          result: result,
          inputStart: startDateTime,
          durationMinutes: durationMinutes,
          calculationProcess: {
            startComponents: { year, month, day, hour, minute, second: second || 0 },
            endComponents: { endYear, endMonth, endDay, endHour, endMinute, endSecond },
            startTimestamp: startDate.getTime(),
            endTimestamp: endDate.getTime(),
            differenceMs: endDate.getTime() - startDate.getTime(),
            differenceMinutes: (endDate.getTime() - startDate.getTime()) / (1000 * 60)
          }
        });
        return result;
      };
      
      const estimatedEndTime = calculateEstimatedEndTime(appointmentDateTime, totalDuration);
      
      // Validate the datetime formats
      const isValidDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(appointmentDateTime);
      const isValidEndTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(estimatedEndTime);
      
      // Debug the exact format issue
      console.log('🔍 [BOOKING] Format validation debug:', {
        appointmentDateTime: appointmentDateTime,
        appointmentDateTimeLength: appointmentDateTime.length,
        appointmentDateTimeRegexTest: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(appointmentDateTime),
        estimatedEndTime: estimatedEndTime,
        estimatedEndTimeLength: estimatedEndTime.length,
        estimatedEndTimeRegexTest: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(estimatedEndTime),
        expectedFormat: 'YYYY-MM-DDTHH:mm:ss',
        expectedLength: 19
      });
      
      // Additional validation: end time should be after start time
      const startTime = new Date(appointmentDateTime);
      const endTime = new Date(estimatedEndTime);
      const isEndTimeAfterStart = endTime > startTime;
      
      console.log('✅ [BOOKING] Datetime validation:', {
        appointmentDateTime,
        estimatedEndTime,
        isValidDateTime,
        isValidEndTime,
        isEndTimeAfterStart,
        timeDifferenceMinutes: (endTime.getTime() - startTime.getTime()) / (1000 * 60)
      });
      
      console.log('🕐 [BOOKING] Date components:', {
        date: formData.date,
        originalTimeSlot: formData.timeSlot,
        originalTimeSlotType: typeof formData.timeSlot,
        convertedTime: timeIn24Hour,
        combinedDateTime: appointmentDateTime,
        totalDurationMinutes: totalDuration,
        estimatedEndTime: estimatedEndTime,
        isValidFormat: isValidDateTime,
        isValidEndTime: isValidEndTime,
        regexTest: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(appointmentDateTime),
        selectedServices: formData.selectedServices.map((s: SelectedService) => ({ name: s.name, duration: s.duration })),
        calculationBreakdown: {
          startTime: appointmentDateTime,
          durationToAdd: `${totalDuration} minutes`,
          endTime: estimatedEndTime,
          timeDifference: `${(new Date(`${estimatedEndTime}`).getTime() - new Date(`${appointmentDateTime}`).getTime()) / (1000 * 60)} minutes`
        }
      });

      if (!isValidDateTime) {
        showError('Invalid Date Format', `Generated datetime "${appointmentDateTime}" is not in the correct ISO format. Please try again.`);
        return;
      }
      
      if (!isValidEndTime) {
        showError('Invalid End Time Format', `Generated end time "${estimatedEndTime}" is not in the correct ISO format. Please try again.`);
        return;
      }
      
      if (!isEndTimeAfterStart) {
        showError('Invalid Time Calculation', `Estimated end time "${estimatedEndTime}" is not after start time "${appointmentDateTime}". Please check your service selections.`);
        return;
      }

      const appointmentData: CreateAppointmentRequest = {
        salonId: parseInt(salonId.toString()),
        branchId: getBranchId() || undefined, // Include branch ID from auth context
        serviceIds: serviceIds,
        employeeId: barberId,
        appointmentDate: appointmentDateTime,
        estimatedEndTime: estimatedEndTime,
        servicePrice: totalServicePrice,
        discountAmount: 0.00, // Can be enhanced later
        customerFirstName: firstName,
        customerLastName: lastName,
        customerPhone: cleanPhone,
        customerGender: formData.customerGender as 'MALE' | 'FEMALE' | 'OTHER'
      };

      console.log('🔄 [BOOKING] Creating appointment with data:', appointmentData);
      console.log('🏢 [BOOKING] Branch ID from context:', getBranchId());
      console.log('📅 [BOOKING] Appointment timing details:', {
        appointmentDate: appointmentData.appointmentDate,
        estimatedEndTime: appointmentData.estimatedEndTime,
        durationMinutes: totalDuration,
        serviceNames: formData.selectedServices.map((s: SelectedService) => s.name).join(', ')
      });

      const response = await apiService.createAppointment(appointmentData);

      console.log('📋 [BOOKING] API Response:', response);

      // Check for successful response - handle the actual API response format
      // Success indicators: response has 'id' field, or success=true, or status='SUCCESS'/'SCHEDULED'
      if (response.id || response.success === true || response.appointment_id || response.status === 'SUCCESS' || response.status === 'SCHEDULED') {
        const customerName = `${firstName} ${lastName}`;
        showSuccess(
          '✅ Appointment Booked Successfully!',
          `Appointment has been created for ${customerName}. Appointment Number: ${response.appointmentNumber || response.appointment_number || 'N/A'}`
        );

        // Create the booking data for local state update using actual response fields
        const bookingData = {
          id: response.id?.toString() || response.appointment_id?.toString() || `a${Date.now()}`,
          customerId: response.customerId?.toString() || response.customer_id?.toString() || `c${Date.now()}`,
          customerName: response.customerName || response.customer_name || customerName,
          customerPhone: response.customerPhone || formData.customerPhone,
          barberId: response.employeeId?.toString() || response.barber_id?.toString() || formData.barberId,
          barberName: response.employeeName || response.barber_name || selectedBarberName || 'Assigned Barber',
          selectedServices: formData.selectedServices,
          serviceName: response.serviceName || formData.selectedServices.map((s: SelectedService) => s.name).join(', '),
          serviceId: response.serviceId?.toString() || formData.selectedServices[0].id,
          date: formData.date,
          timeSlot: formData.timeSlot,
          amount: response.totalAmount || response.total_amount || totalAmount,
          finalAmount: response.totalAmount || response.total_amount || totalAmount,
          duration: response.total_duration_minutes || totalDuration,
          status: (response.status === 'SCHEDULED' ? 'scheduled' : response.status?.toLowerCase()) || 'booked',
          paymentStatus: response.paymentStatus?.toLowerCase() || 'pending',
          createdAt: new Date(response.createdDate || response.created_at || Date.now()),
          appointmentNumber: response.appointmentNumber || response.appointment_number || `APT${Date.now()}`
        };

        onBook(bookingData);
        onClose();
      } else {
        const errorMessage = response.message || 'Failed to create appointment. Please try again.';
        console.error('❌ [BOOKING] Booking failed:', errorMessage);
        showError('❌ Booking Failed', errorMessage);
      }
    } catch (error) {
      console.error('❌ [BOOKING] Error creating appointment:', error);
      let errorMessage = 'An unexpected error occurred while booking the appointment.';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      showError('Booking Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return selectedGender !== null;
      case 1: return formData.selectedServices.length > 0;
      case 2: return formData.date !== '';
      case 3: return formData.barberId !== '';
      case 4: return formData.timeSlot !== '';
      case 5: return formData.customerFirstName !== '' && formData.customerLastName !== '' && formData.customerPhone.length >= 12 && formData.customerGender !== null; // +94 + 9 digits
      default: return false;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 0: return 'Select Category';
      case 1: return 'Select Services';
      case 2: return 'Choose Date';
      case 3: return 'Select Barber';
      case 4: return 'Choose Time Slot';
      case 5: return 'Customer Details';
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
      case 4: return selectedGender !== null && formData.selectedServices.length > 0 && formData.date && formData.barberId; // Need barber selected
      case 5: return selectedGender !== null && formData.selectedServices.length > 0 && formData.date && formData.barberId && formData.timeSlot; // Need time slot selected
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
            {[0, 1, 2, 3, 4, 5].map((step) => (
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
                {step < 5 && (
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
                                          <span className="font-medium">Rs {service.discount_price}</span>
                                          <span className="line-through ml-1">Rs {service.price}</span>
                                        </>
                                      ) : (
                                        <span className="font-medium">Rs {service.price}</span>
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
                            Rs {service.discountPrice || service.price}
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
                      <span>Rs {totalAmount.toFixed(2)}</span>
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
                <p className="text-sm text-gray-600 mb-3">Choose a date from today up to 3 months in advance.</p>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    max={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, date: new Date().toISOString().split('T')[0] })}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] })}
                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                  >
                    Tomorrow
                  </button>
                </div>
              </div>
              
              {formData.selectedServices.length > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900">Selected Services Summary</h4>
                  <div className="mt-2 space-y-1">
                    {formData.selectedServices.map((service: SelectedService) => (
                      <p key={service.id} className="text-sm text-blue-700">
                        {service.name} - {service.duration} min - Rs {service.discountPrice || service.price}
                      </p>
                    ))}
                    <div className="pt-2 border-t border-blue-200 font-semibold text-blue-900">
                      Total: {totalDuration} minutes • Rs {totalAmount.toFixed(2)}
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
                
                {!formData.date ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Please select a date first to see available barbers</p>
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="mt-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Go back to select date
                    </button>
                  </div>
                ) : loadingBarbers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p className="text-gray-600">Loading available barbers...</p>
                    <p className="text-sm text-gray-500 mt-1">Please wait while we find barbers for your selected services</p>
                  </div>
                ) : availableBarbers.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Available Barbers</h3>
                    <p className="text-gray-600 mb-2">No service providers (barbers/stylists) found for the selected services and date.</p>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>This could be because:</p>
                      <ul className="list-disc list-inside space-y-1 max-w-md mx-auto">
                        <li>No barbers are assigned to this salon yet</li>
                        <li>All barbers are busy on the selected date</li>
                        <li>No barbers specialize in the selected services</li>
                        <li>Selected date is outside business hours</li>
                      </ul>
                    </div>
                    <div className="mt-6 space-x-3">
                      <button
                        onClick={() => setCurrentStep(2)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Try Different Date
                      </button>
                      <button
                        onClick={() => setCurrentStep(1)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Change Services
                      </button>
                    </div>
                  </div>
                ) : (
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
                            <h4 className="font-medium text-gray-900">{barber.firstName || barber.name}</h4>
                            <p className="text-sm text-gray-600">{barber.specializedArea}</p>
                            <p className="text-xs text-gray-500">
                              {barber.experienceYears || barber.experience} years experience
                              {barber.rating && (
                                <span className="ml-2">
                                  ⭐ {barber.rating}/5
                                </span>
                              )}
                            </p>
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
                )}
              </div>
            </div>
          )}

          {/* Step 4: Select Time Slot */}
          {currentStep === 4 && (
            <div className="space-y-6">
              {/* Barber Selection Dropdown */}
              <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-lg border border-green-200">
                <label className="block text-lg font-semibold text-green-900 mb-3">
                  Select Barber
                </label>
                <select
                  value={formData.barberId}
                  onChange={(e) => {
                    const newBarberId = e.target.value;
                    console.log('🔄 [BOOKING] Barber changed:', {
                      previousBarber: formData.barberId,
                      newBarber: newBarberId,
                      availableBarbers: availableBarbers
                    });
                    
                    // Update the selected barber name for display
                    const selectedBarber = availableBarbers.find(b => b.id === newBarberId);
                    if (selectedBarber) {
                      setSelectedBarberName(selectedBarber.firstName || selectedBarber.name);
                    } else if (newBarberId === 'no-barber') {
                      setSelectedBarberName('No specific barber');
                    }
                    
                    // Update form data and reset time slot selection
                    setFormData({ 
                      ...formData, 
                      barberId: newBarberId,
                      timeSlot: '' // Reset time slot when barber changes
                    });
                    
                    // Clear current time slots to force reload
                    setAvailableTimeSlots([]);
                  }}
                  className="w-full p-3 border border-green-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Choose a barber...</option>
                  {availableBarbers.map(barber => (
                    <option key={barber.id} value={barber.id}>
                      {barber.firstName || barber.name} - {barber.specializedArea} 
                      ({barber.experienceYears || barber.experience} years exp)
                      {barber.rating && ` ⭐ ${barber.rating}/5`}
                    </option>
                  ))}
                  {userRole === 'reception' && (
                    <option value="no-barber">Continue Without Barber (Assign Later)</option>
                  )}
                </select>
                
                {formData.barberId && formData.barberId !== 'no-barber' && (
                  <div className="mt-3 p-3 bg-green-100 rounded-lg">
                    <p className="text-green-800 font-medium">
                      Selected: {selectedBarberName}
                    </p>
                    <p className="text-green-600 text-sm">
                      Time slots will be loaded based on this barber's availability
                    </p>
                  </div>
                )}
                
                {formData.barberId === 'no-barber' && (
                  <div className="mt-3 p-3 bg-orange-100 rounded-lg">
                    <p className="text-orange-800 font-medium">
                      No specific barber selected
                    </p>
                    <p className="text-orange-600 text-sm">
                      Barber will be assigned when customer arrives
                    </p>
                  </div>
                )}
              </div>

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
                        Rs {(service.discountPrice || service.price).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-blue-300 flex justify-between items-center font-bold text-blue-900">
                    <span>Total ({totalDuration} minutes)</span>
                    <span className="text-lg">Rs {totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Selected Date Info */}
              {formData.date && (
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">Appointment Date</h4>
                  <p className="text-purple-700">{formData.date}</p>
                </div>
              )}

              {/* Time Slots Selection */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-2">
                  Available Time Slots
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  {formData.date && `Select your preferred time slot for ${new Date(formData.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
                </p>
                
                {!formData.barberId ? (
                  <div className="text-center py-8 bg-gray-50 rounded-xl">
                    <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">Please select a barber first to see available time slots</p>
                  </div>
                ) : loadingTimeSlots ? (
                  <div className="flex items-center justify-center py-12 bg-gray-50 rounded-xl">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600 font-medium">Loading available time slots...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Available Time Slots */}
                    {availableTimeSlots.filter(slot => {
                      if (!slot.is_available) return false;
                      
                      // If selected date is today, filter out past time slots
                      const today = new Date().toISOString().split('T')[0];
                      if (formData.date === today) {
                        const currentTime = new Date();
                        const currentHour = currentTime.getHours();
                        const currentMinute = currentTime.getMinutes();
                        
                        // Parse slot time (assuming format like "14:30" or "14:30:00")
                        const [slotHour, slotMinute] = slot.start_time.split(':').map(Number);
                        
                        // Add 30 minute buffer for current time
                        const slotTimeInMinutes = slotHour * 60 + slotMinute;
                        const currentTimeInMinutes = currentHour * 60 + currentMinute + 30; // 30 min buffer
                        
                        return slotTimeInMinutes >= currentTimeInMinutes;
                      }
                      
                      return true;
                    }).length > 0 ? (
                      <div>
                        <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          Available Times
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          {availableTimeSlots.filter(slot => {
                            if (!slot.is_available) return false;
                            
                            // If selected date is today, filter out past time slots
                            const today = new Date().toISOString().split('T')[0];
                            if (formData.date === today) {
                              const currentTime = new Date();
                              const currentHour = currentTime.getHours();
                              const currentMinute = currentTime.getMinutes();
                              
                              const [slotHour, slotMinute] = slot.start_time.split(':').map(Number);
                              const slotTimeInMinutes = slotHour * 60 + slotMinute;
                              const currentTimeInMinutes = currentHour * 60 + currentMinute + 30;
                              
                              return slotTimeInMinutes >= currentTimeInMinutes;
                            }
                            
                            return true;
                          }).map(slot => {
                            const formatTime = (timeStr: string) => {
                              const [hour, minute] = timeStr.split(':').map(Number);
                              const period = hour >= 12 ? 'PM' : 'AM';
                              const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                              return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
                            };
                            
                            return (
                              <button
                                key={slot.start_time}
                                type="button"
                                onClick={() => {
                                  console.log('🔄 [BOOKING] Time slot selected:', {
                                    selectedSlotStartTime: slot.start_time,
                                    selectedSlotFormatted: formatTime(slot.start_time),
                                    currentDateTime: new Date().toISOString(),
                                    currentLocalTime: new Date().toLocaleString(),
                                    slotData: slot
                                  });
                                  setFormData({ ...formData, timeSlot: slot.start_time });
                                }}
                                className={`group relative p-4 text-center border-2 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                                  formData.timeSlot === slot.start_time
                                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 text-blue-700 shadow-lg'
                                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700'
                                }`}
                              >
                                <div className="font-semibold text-lg">
                                  {formatTime(slot.start_time)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {totalDuration} minutes
                                </div>
                                {formData.timeSlot === slot.start_time && (
                                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                    ✓
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}
                    
                    {/* Unavailable Time Slots */}
                    {availableTimeSlots.filter(slot => !slot.is_available).length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-sm font-semibold text-red-600 mb-3 flex items-center">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          Unavailable Times
                        </h4>
                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                          {availableTimeSlots.filter(slot => !slot.is_available).map(slot => {
                            const formatTime = (timeStr: string) => {
                              const [hour, minute] = timeStr.split(':').map(Number);
                              const period = hour >= 12 ? 'PM' : 'AM';
                              const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
                              return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
                            };
                            
                            return (
                              <div
                                key={`unavailable-${slot.start_time}`}
                                className="p-2 text-center border border-gray-200 rounded-lg bg-gray-50 text-gray-400 cursor-not-allowed"
                                title={slot.unavailable_reason || 'Not available'}
                              >
                                <div className="text-sm line-through">
                                  {formatTime(slot.start_time)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {!loadingTimeSlots && availableTimeSlots.filter(slot => {
                  if (!slot.is_available) return false;
                  
                  const today = new Date().toISOString().split('T')[0];
                  if (formData.date === today) {
                    const currentTime = new Date();
                    const currentHour = currentTime.getHours();
                    const currentMinute = currentTime.getMinutes();
                    
                    const [slotHour, slotMinute] = slot.start_time.split(':').map(Number);
                    const slotTimeInMinutes = slotHour * 60 + slotMinute;
                    const currentTimeInMinutes = currentHour * 60 + currentMinute + 30;
                    
                    return slotTimeInMinutes >= currentTimeInMinutes;
                  }
                  
                  return true;
                }).length === 0 && (
                  <div className="text-center py-8 bg-yellow-50 rounded-xl border border-yellow-200">
                    <div className="text-yellow-600 mb-2">
                      ⚠️ No available time slots
                    </div>
                    <p className="text-sm text-yellow-700">
                      {formData.date === new Date().toISOString().split('T')[0] 
                        ? 'All remaining time slots for today are unavailable. Please select a different date.'
                        : 'No available time slots for this date and barber. Please select a different date or barber.'
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 5: Customer Details */}
          {currentStep === 5 && (
            <div className="space-y-4">
              {/* Booking Summary */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-900 mb-3">Final Booking Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Date:</span>
                    <span className="font-medium text-green-900">{formData.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Time:</span>
                    <span className="font-medium text-green-900">{formData.timeSlot}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Barber:</span>
                    <span className="font-medium text-green-900">
                      {formData.barberId === 'no-barber' ? 'Will be assigned' : selectedBarberName || 'Selected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Total Amount:</span>
                    <span className="font-bold text-green-900 text-lg">Rs {totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.customerFirstName}
                      onChange={(e) => setFormData({ ...formData, customerFirstName: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.customerLastName}
                      onChange={(e) => setFormData({ ...formData, customerLastName: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, customerGender: 'MALE' });
                    }}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      formData.customerGender === 'MALE'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, customerGender: 'FEMALE' });
                    }}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      formData.customerGender === 'FEMALE'
                        ? 'border-pink-500 bg-pink-50 text-pink-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Female
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, customerGender: 'OTHER' });
                    }}
                    className={`p-3 rounded-lg border transition-all duration-200 ${
                      formData.customerGender === 'OTHER'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    Other
                  </button>
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
            
            {currentStep < 5 ? (
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
                {currentStep === 4 ? 'Continue to Customer Details' : 'Next'}
              </button>
            ) : (
              <button
                type="submit"
                disabled={!canProceed() || saving}
                className={`flex-1 px-4 py-3 rounded-lg transition-all duration-200 ${
                  canProceed() && !saving
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {saving ? 'Booking...' : `${editingAppointment ? 'Update' : 'Book'} Appointment (Rs ${totalAmount.toFixed(2)})`}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;