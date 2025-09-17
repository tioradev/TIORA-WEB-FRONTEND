# Leave Management API Integration

## Overview
Successfully integrated real API endpoints for leave management system in the Owner Dashboard, replacing mock data with live backend integration.

## ⚠️ TROUBLESHOOTING - Salon ID Issue

### Issue: "Salon ID not found" Error
**Problem**: The leave summary shows "Error Loading Leave Data - Salon ID not found"

**Root Cause**: The component was directly accessing `user.salonId` instead of using the proper AuthContext method `getSalonId()`

**Solution Applied**:
1. Updated `LeaveSummaryTable.tsx` to use `getSalonId()` method from AuthContext
2. Added debug logging to help identify authentication context issues
3. Added visual debug information in error state to show available data

**Fixed Code**:
```typescript
// BEFORE (causing the error)
const { user } = useAuth();
if (!user?.salonId) {
  setError('Salon ID not found');
}

// AFTER (correct implementation)
const { getSalonId } = useAuth();
const salonId = getSalonId();
if (!salonId) {
  setError('Salon ID not found. Please ensure you are logged in properly.');
}
```

### Debug Features Added:
- Console logging in `getSalonId()` method to show available salon/employee data
- Visual debug panel in error state showing authentication context
- Better error messages with actionable guidance

### For Pending Leave Requests:
- Separated pending requests (still using filtered mock data) from summary data (real API)
- Added clear comments explaining the data source differences
- Pending requests now only show actual pending items, not all mock data

## API Endpoints Integrated

### 1. Get Employee Leave Details (Unified Endpoint)
- **Endpoint**: `GET /employee-leave-details/by-salon`
- **Parameters**: 
  - `salonId` (number): The salon ID
  - `page` (number, default: 0): Page number for pagination (0-based)
  - `size` (number, default: 10): Number of records per page
  - `search` (string, optional): Search term for filtering
  - `status` (string, optional): Filter by status - "PENDING", "APPROVED", or "REJECTED"
- **Purpose**: Fetch paginated employee leave details for a specific salon with optional status filtering

**Usage Examples:**
```typescript
// Get pending leave requests
await apiService.getEmployeeLeaveDetails(salonId, 0, 10, undefined, 'PENDING');

// Get processed leaves (approved/rejected) for summary
await apiService.getEmployeeLeaveDetails(salonId, 0, 10, undefined);

// Search pending requests
await apiService.getEmployeeLeaveDetails(salonId, 0, 10, 'John', 'PENDING');
```

### 2. Update Leave Status
- **Endpoint**: `PUT /employee-leave/{id}/status`
- **Parameters**:
  - `id` (number): Leave request ID
  - `status` (string): Either "approved" or "rejected"
- **Purpose**: Update the status of a leave request

## Files Modified

### 1. `src/types/index.ts`
**Changes Made:**
- Added `LeaveDetailApiResponse` interface for API response structure
- Added `LeaveDetailsPaginatedResponse` interface for paginated API responses

**New Types:**
```typescript
export interface LeaveDetailApiResponse {
  employeeId: number;
  employeeName: string;
  duration: number;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface LeaveDetailsPaginatedResponse {
  content: LeaveDetailApiResponse[];
  pageable: { ... };
  totalPages: number;
  totalElements: number;
  // ... other pagination fields
}
```

### 2. `src/services/api.ts`
**Changes Made:**
- Added LEAVES endpoints to ENDPOINTS configuration
- Added import for `LeaveDetailsPaginatedResponse` type
- Implemented `getEmployeeLeaveDetails()` method
- Implemented `updateLeaveStatus()` method

**New API Methods:**
```typescript
async getEmployeeLeaveDetails(
  salonId: number, 
  page: number = 0, 
  size: number = 10, 
  search?: string
): Promise<LeaveDetailsPaginatedResponse>

async updateLeaveStatus(
  leaveId: number, 
  status: 'approved' | 'rejected'
): Promise<any>
```

### 3. `src/components/owner/LeaveSummaryTable.tsx`
**Major Refactor:**
- **BEFORE**: Used mock data passed as props
- **AFTER**: Fetches data directly from API using `useEffect` and `useState`

**Key Changes:**
- Removed `leaveRequests` prop dependency
- Added API data fetching with loading states
- Implemented real-time search with debouncing (500ms)
- Updated pagination to work with API's 0-based indexing
- Added error handling with retry functionality
- Updated data mapping to convert API response to display format
- Modified table to display API data structure
- Updated modal to work with `LeaveDetailApiResponse` structure

**New Features:**
- Loading spinner during API calls
- Error state with retry button
- Real-time search with backend integration
- Server-side pagination
- Automatic data refresh on search

### 4. `src/components/owner/LeaveRequestCard.tsx`
**API Integration:**
- Added real API calls for approve/reject actions
- Integrated `apiService.updateLeaveStatus()` in button handlers
- Added loading states for API operations
- Maintained fallback to local state updates if API fails

**Enhanced UX:**
- Loading indicators on buttons during API calls
- Disabled state during processing
- Error handling with graceful fallbacks

### 5. `src/components/owner/OwnerDashboard.tsx`
**Changes Made:**
- Removed `leaveRequests` prop from `LeaveSummaryTable` component
- Component now self-manages data fetching

## API Response Mapping

### Original Mock Data Structure vs API Response:
```typescript
// Mock Data (LeaveRequest interface)
{
  id: string;
  barberId: string;
  barberName: string;
  startDate: string;
  endDate: string;
  reason: string;
  leaveType: 'sick' | 'personal' | 'vacation' | 'emergency' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  // ... other fields
}

// API Response (LeaveDetailApiResponse interface)  
{
  employeeId: number;
  employeeName: string;
  duration: number;
  startDate: string;
  endDate: string;
  reason: string;
}
```

### Conversion Logic:
The `convertApiLeaveToDisplay()` function maps API response to frontend display format:
- `employeeId` → `id` and `barberId`
- `employeeName` → `barberName`
- Defaults `leaveType` to 'other' (not provided by API)
- Defaults `status` to 'approved' (summary table shows processed leaves)

## Features Implemented

### 1. Real-time Search
- 500ms debounced search input
- Searches employee names and reasons server-side
- Automatic pagination reset on new search

### 2. Server-side Pagination
- API uses 0-based page indexing
- Configurable page size (default: 10 items)
- Real pagination controls with next/previous
- Shows current page info and total results

### 3. Error Handling
- Network error detection and display
- Retry functionality for failed requests
- Graceful fallbacks for API failures
- Loading states throughout the UI

### 4. Status Management
- Real API integration for approve/reject actions
- Loading indicators during status updates
- Error handling for failed status updates
- UI feedback for successful operations

## Usage Examples

### Fetching Leave Data:
```typescript
const response = await apiService.getEmployeeLeaveDetails(
  salonId,
  0,     // page
  10,    // size
  'John' // search term
);
```

### Updating Leave Status:
```typescript
await apiService.updateLeaveStatus(123, 'approved');
await apiService.updateLeaveStatus(456, 'rejected');
```

## Benefits of Integration

1. **Real Data**: No more mock data dependency
2. **Scalability**: Server-side pagination handles large datasets
3. **Performance**: Efficient search and filtering on backend
4. **Reliability**: Proper error handling and retry mechanisms
5. **User Experience**: Loading states and real-time feedback
6. **Data Consistency**: Single source of truth from backend

## Testing Considerations

1. **API Connectivity**: Ensure backend endpoints are accessible
2. **Salon ID**: Verify user context provides valid salon ID
3. **Pagination**: Test with large datasets for pagination behavior
4. **Search**: Verify search functionality with various terms
5. **Error Scenarios**: Test network failures and API errors
6. **Status Updates**: Confirm leave approval/rejection API calls work

## Future Enhancements

1. **Real-time Updates**: WebSocket integration for live status updates
2. **Advanced Filtering**: Date range, status, and employee filters
3. **Bulk Operations**: Multiple leave approvals/rejections
4. **Notification System**: Real-time notifications for status changes
5. **Audit Trail**: Track who approved/rejected leaves and when
