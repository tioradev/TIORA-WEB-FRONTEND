# Reception Dashboard API Endpoint Updates

## Summary
Updated the Reception Dashboard to use the correct API endpoints as specified:

### API Endpoint Changes

1. **All Appointments**: `GET /api/v1/appointments/salon/{salon_id}`
2. **Pending Payments**: `GET /api/v1/appointments/salon/{salon_id}/pending-payments`
3. **Today's Appointments**: `GET /api/v1/appointments/salon/{salonId}/today`

### Files Modified

#### 1. `src/services/api.ts`
- **Updated ENDPOINTS configuration**:
  - Changed `APPOINTMENTS.TODAY` to use salon-specific endpoint
  - Changed `APPOINTMENTS.PENDING_PAYMENTS` to use salon-specific endpoint  
  - Added `APPOINTMENTS.BY_SALON` for all appointments

- **Updated Methods**:
  - `getTodayAppointments()`: Now uses `/appointments/salon/{salonId}/today`
  - `getPendingPaymentAppointments()`: Now uses `/appointments/salon/{salon_id}/pending-payments`
  - `getAllAppointmentsForSalon()`: Now uses `/appointments/salon/{salon_id}`
  - Removed deprecated methods: `getTodaysAppointmentsForSalon()` and `getPendingPaymentsForSalon()`

#### 2. `src/components/reception/ReceptionDashboard.tsx`
- **Added separate state management**:
  - `todayAppointments` state for today's appointments
  - `pendingPayments` state for pending payment appointments
  - Kept `appointments` state for all appointments

- **Added new loading functions**:
  - `loadTodayAppointments()`: Loads today's appointments using new endpoint
  - `loadPendingPayments()`: Loads pending payments using new endpoint
  - Updated `loadAppointments()`: Uses new all appointments endpoint

- **Enhanced data conversion**:
  - Added proper API response to frontend format conversion
  - Handles different appointment statuses and payment statuses correctly
  - Ensures salonId is correctly typed as string

- **Updated UI Logic**:
  - Stats cards now use appropriate state arrays
  - Search functionality works with each specific dataset
  - Daily income calculation combines all appointment sources
  - Event handlers search across all appointment arrays

- **Improved refresh functionality**:
  - `refreshAppointments()` now refreshes all three data sources
  - All success handlers trigger complete data refresh

### Benefits

1. **Accurate Data Loading**: Each section now loads data from the correct endpoint
2. **Better Performance**: Separate endpoints prevent over-fetching data
3. **Improved Reliability**: Specific endpoints reduce data inconsistencies
4. **Enhanced User Experience**: More accurate stats and real-time data updates

### Endpoint Usage

- **All Appointments Section**: Uses `GET /api/v1/appointments/salon/{salon_id}`
- **Pending Payments Section**: Uses `GET /api/v1/appointments/salon/{salon_id}/pending-payments`
- **Today's Appointments Section**: Uses `GET /api/v1/appointments/salon/{salonId}/today`

The dashboard now properly segregates different appointment types and loads them using their respective specialized endpoints, providing more accurate and efficient data management for the reception role.
