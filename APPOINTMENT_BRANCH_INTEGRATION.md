# Branch ID Integration for Appointment Booking

## Summary
Added support for including `branchId` in appointment booking requests to support multi-branch salon operations.

## Changes Made

### 1. API Service Layer (`src/services/api.ts`)
- **Interface Update**: Added optional `branchId?: number` field to `CreateAppointmentRequest` interface
- **Documentation**: Added comment explaining the field is for multi-branch salon support

### 2. Booking Modal Component (`src/components/appointments/BookingModal.tsx`)
- **Context Integration**: Added `getBranchId` from `useAuth()` hook
- **Request Body**: Updated appointment creation to include `branchId: getBranchId() || undefined`
- **Logging**: Added console log to show branch ID being included in requests

## Technical Implementation

### Request Body Structure
```typescript
interface CreateAppointmentRequest {
  salonId: number;
  branchId?: number;        // NEW: Optional branch ID
  serviceIds: number[];
  employeeId: number;
  appointmentDate: string;
  estimatedEndTime: string;
  servicePrice: number;
  discountAmount?: number;
  customerFirstName: string;
  customerLastName: string;
  customerPhone: string;
  customerGender: 'MALE' | 'FEMALE' | 'OTHER';
}
```

### Branch ID Resolution Logic
The branch ID is resolved through the AuthContext's `getBranchId()` function:
- For **Reception users**: Returns the employee's assigned `branchId`
- For **Salon owners**: Returns the salon's `defaultBranchId`
- **Fallback**: Returns `null` if no branch is found

### API Endpoint
- **URL**: `POST http://localhost:8090/api/v1/appointments`
- **Body**: Now includes `branchId` field when available
- **Backward Compatibility**: Field is optional, maintaining compatibility with single-branch operations

## Usage Example

When a reception user books an appointment, the request will now include:

```json
{
  "salonId": 123,
  "branchId": 456,
  "serviceIds": [1, 2],
  "employeeId": 789,
  "appointmentDate": "2024-08-15T14:00:00",
  "estimatedEndTime": "2024-08-15T15:00:00",
  "servicePrice": 50.00,
  "discountAmount": 0.00,
  "customerFirstName": "John",
  "customerLastName": "Doe",
  "customerPhone": "+94771234567",
  "customerGender": "MALE"
}
```

## Benefits
1. **Multi-branch Support**: Enables proper appointment tracking per branch
2. **Role-based Branch Assignment**: Automatic branch ID resolution based on user context
3. **Backward Compatibility**: Optional field doesn't break existing single-branch implementations
4. **Audit Trail**: Better appointment tracking and reporting per branch

## Testing Recommendations
1. Test appointment booking as reception user in multi-branch salon
2. Verify branch ID appears in request body via browser DevTools
3. Test appointment booking as salon owner to ensure default branch ID is used
4. Verify console logs show correct branch ID resolution
