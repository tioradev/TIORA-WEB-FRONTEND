# Employee Image Upload and Details Management Fixes

## Issues Addressed

### 1. Image Naming Issue
**Problem**: Firebase storage was using original filenames with timestamp, making file management difficult.

**Solution**: Updated `imageUploadService.ts` to use consistent naming pattern:
- **Employee profiles**: `{employeeId}_{timestamp}.{extension}` (e.g., `1756722715145_1643273823847.jpeg`)
- **Owner profiles**: `owner_{employeeId}_{timestamp}.{extension}`
- **Other categories**: `{timestamp}.{extension}`

### 2. Employee Details Not Loading in Edit Mode
**Problem**: When editing employees, the modal didn't show previous images or selected services.

**Solution**: Enhanced `StaffManagement.tsx` `handleEditStaff` function to:
- Fetch complete employee details from API: `GET /api/v1/employees/details/{id}`
- Map API response fields to local component structure
- Pre-populate profile images, specializations, and other details

### 3. Services Not Pre-selected in Edit Mode
**Problem**: Previously selected employee specializations weren't shown when editing.

**Solution**: Updated `AddEmployeeModal.tsx` to:
- Properly map employee specializations from API response
- Pre-select services when editing existing employees
- Handle serves_gender preference for barbers

## Key Changes Made

### Image Upload Service Updates
```typescript
// Before
private generateStoragePath(category, salonId, fileName, employeeId?) {
  return `salons/${salonId}/${category}/${timestamp}_${sanitizedFileName}`;
}

// After  
private generateStoragePath(category, salonId, fileName, employeeId?) {
  const fileExtension = fileName.split('.').pop() || 'jpg';
  
  if (category === 'employee-profiles' && employeeId) {
    const timestamp = Date.now();
    return `salons/${salonId}/${category}/${employeeId}_${timestamp}.${fileExtension}`;
  }
  // ... other categories
}
```

### Staff Management Enhancement
```typescript
// New async function to load complete employee data
const handleEditStaff = async (staffMember: Staff) => {
  try {
    const fullEmployeeData = await apiService.getEmployeeDetails(staffMember.id);
    
    const mappedEmployee: Staff = {
      ...staffMember,
      profileImage: fullEmployeeData.profile_image_url || '',
      specialties: fullEmployeeData.specializations?.map((spec, index) => ({
        id: index + 1,
        name: spec
      })) || [],
      // ... other mapped fields
    };
    
    setEditingStaff(mappedEmployee);
    setIsModalOpen(true);
  } catch (error) {
    // Fallback to basic staff data
  }
};
```

### API Service Addition
```typescript
// New method to get complete employee details
async getEmployeeDetails(employeeId: string | number): Promise<EmployeeRegistrationResponse> {
  const endpoint = `/employees/${employeeId}/details`;
  return this.request<EmployeeRegistrationResponse>(endpoint);
}

// New method to get all employees by salon
async getAllEmployeesBySalon(salonId: string | number): Promise<EmployeeRegistrationResponse[]> {
  const endpoint = `/employees/salon/${salonId}`;
  return this.request<EmployeeRegistrationResponse[]>(endpoint);
}
```

## API Endpoints Used

1. **Get Employee Details**: `GET /api/v1/employees/details/{employeeId}`
2. **Get All Employees by Salon**: `GET /api/v1/employees/salon/{salonId}`

## File Structure Impact

### Firebase Storage Structure (Updated)
```
salons/
  {salonId}/
    employee-profiles/
      {employeeId}_{timestamp}.jpg  # Consistent naming
    owner-profiles/
      owner_{ownerId}_{timestamp}.jpg
    salon-gallery/
      {timestamp}.jpg
```

### Component Updates
- ✅ `src/services/imageUploadService.ts` - Consistent naming logic
- ✅ `src/components/owner/StaffManagement.tsx` - Fetch complete employee data
- ✅ `src/components/owner/AddEmployeeModal.tsx` - Pre-populate form with full data
- ✅ `src/components/shared/ImageUploader.tsx` - Already supports employeeId
- ✅ `src/services/api.ts` - New employee details endpoints

## Testing Checklist

### Image Upload Testing
- [ ] Upload new employee profile picture
- [ ] Verify Firebase storage uses format: `{employeeId}_{timestamp}.{extension}`
- [ ] Edit existing employee and upload new picture
- [ ] Verify old image is automatically deleted

### Employee Edit Testing  
- [ ] Click edit on existing employee
- [ ] Verify profile picture is displayed in modal
- [ ] Verify specializations/services are pre-selected
- [ ] Verify all form fields are populated
- [ ] Save changes and verify updates work

### Error Handling
- [ ] Test with employee that has no profile picture
- [ ] Test with employee that has no specializations  
- [ ] Test API failure scenarios (network issues)
- [ ] Verify fallback to basic staff data when API fails

## Benefits

1. **Consistent File Naming**: Makes Firebase storage more organized and manageable
2. **Automatic Cleanup**: Old images are automatically deleted when uploading new ones
3. **Complete Data Loading**: Edit mode shows all previously saved information
4. **Better User Experience**: Users see their current settings when editing
5. **Improved Performance**: Uses specific API endpoints for complete data

## Notes

- The system maintains backward compatibility with existing images
- Employee ID is used from the staff member data for consistent naming
- Error handling ensures the modal still works even if API calls fail
- Image uploads include progress tracking and validation
