# API Endpoints Updated - Branch ID Integration

## Summary
Updated the Reception Dashboard API endpoints to include branch ID parameter as requested.

## Updated API Endpoints

### 1. **All Appointments**
- **New**: `GET /api/v1/appointments/salon/{salonId}/branch/{branchId}`
- **Fallback**: `GET /api/v1/appointments/salon/{salonId}` (when branchId not provided)

### 2. **Pending Payments**
- **New**: `GET /api/v1/appointments/salon/{salonId}/branch/{branchId}/pending-payments`
- **Fallback**: `GET /api/v1/appointments/salon/{salonId}/pending-payments` (when branchId not provided)

### 3. **Today's Appointments**
- **New**: `GET /api/v1/appointments/salon/{salonId}/branch/{branchId}/today`
- **Fallback**: `GET /api/v1/appointments/salon/{salonId}/today` (when branchId not provided)

## Changes Made

### API Service (`src/services/api.ts`)

#### 1. **Updated ENDPOINTS Configuration**
```typescript
APPOINTMENTS: {
  BY_SALON: '/appointments/salon', // GET /appointments/salon/{salon_id}/branch/{branchId}
  TODAY_BY_SALON: '/appointments/salon', // GET /appointments/salon/{salonId}/branch/{branchId}/today
  PENDING_PAYMENTS_BY_SALON: '/appointments/salon', // GET /appointments/salon/{salon_id}/branch/{branchId}/pending-payments
  // ... other endpoints
}
```

#### 2. **Updated Methods with Branch Support**

**`getTodayAppointments(salonId, branchId?)`**
- Added optional `branchId` parameter
- Constructs endpoint with branch path when branchId provided
- Falls back to original endpoint when branchId not provided

**`getPendingPaymentAppointments(salonId, branchId?)`**
- Added optional `branchId` parameter
- Constructs endpoint with branch path when branchId provided
- Falls back to original endpoint when branchId not provided

**`getAllAppointmentsForSalon(salonId, branchId?)`**
- Added optional `branchId` parameter
- Constructs endpoint with branch path when branchId provided
- Falls back to original endpoint when branchId not provided

#### 3. **Updated Dashboard Helper Methods**
- `getTodayAppointmentsForDashboard(salonId, branchId?)`
- `getPendingPaymentAppointmentsForDashboard(salonId, branchId?)`

### Reception Dashboard (`src/components/reception/ReceptionDashboard.tsx`)

#### 1. **Added Branch ID Support**
- Imported `getBranchId` from AuthContext
- Added branchId extraction in all loading functions

#### 2. **Updated API Calls**
- `loadAppointments()`: Now passes branchId to `getAllAppointmentsForSalon()`
- `loadTodayAppointments()`: Now passes branchId to `getTodayAppointments()`
- `loadPendingPayments()`: Now passes branchId to `getPendingPaymentAppointments()`

#### 3. **Enhanced Logging**
- All functions now log both salonId and branchId for debugging

## Backward Compatibility

✅ **Maintains backward compatibility**: All methods accept optional `branchId` parameter and fall back to original endpoints when not provided.

## Branch ID Resolution

The system gets branchId from AuthContext using the `getBranchId()` function which:
1. First checks employee's branchId (for reception staff)
2. Falls back to salon's defaultBranchId (for salon owners)
3. Returns null if neither is available

## API Call Examples

### With Branch ID
```
GET /api/v1/appointments/salon/123/branch/456
GET /api/v1/appointments/salon/123/branch/456/today
GET /api/v1/appointments/salon/123/branch/456/pending-payments
```

### Without Branch ID (Fallback)
```
GET /api/v1/appointments/salon/123
GET /api/v1/appointments/salon/123/today
GET /api/v1/appointments/salon/123/pending-payments
```

## Testing

To test the changes:
1. **Check browser console logs** - should show both salonId and branchId being passed
2. **Verify API calls in Network tab** - should see the new endpoint URLs with branch paths
3. **Test with different user types**:
   - Reception users should use their assigned branchId
   - Salon owners should use the salon's defaultBranchId

The changes are now ready and should correctly use the updated API endpoints with branch ID support.
