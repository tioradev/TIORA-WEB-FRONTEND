# Profile Image Display and Upload Fixes

## Issues Fixed

### Issue 1: Profile Images Not Displaying in Staff Management
**Problem**: Employee profile pictures were not showing in the staff management cards - only initials were displayed.

**Solution**: 
- Updated `StaffManagement.tsx` to properly display profile images when available
- Added fallback to initials when image fails to load or is not available
- Enhanced the staff data mapping to include profile image URLs from API responses

### Issue 2: Old Profile Pictures Not Being Overwritten
**Problem**: When updating an employee's profile picture, the old image remained in Firebase Storage, causing filename conflicts and storage bloat.

**Solution**:
- Enhanced `ImageUploadService` with employee-specific upload methods
- Added automatic old image deletion before uploading new ones
- Implemented consistent naming pattern: `employee_{employeeId}.{extension}`
- Created `uploadEmployeeProfile()` method that handles the complete workflow

## Changes Made

### 1. ImageUploadService.ts
```typescript
// New Methods Added:
- uploadEmployeeProfile() - Handles employee profile uploads with old image deletion
- uploadImageWithId() - Generic method for consistent naming with custom IDs  
- Enhanced deleteImage() - Better handling of Firebase Storage URLs

// New Features:
- Consistent file naming for employee profiles
- Automatic old image cleanup
- Better error handling for URL parsing
```

### 2. StaffManagement.tsx
```typescript
// Profile Image Display:
- Added proper img tag with fallback to initials
- Enhanced error handling for broken image URLs
- Added profile image mapping from API responses

// API Data Mapping:
- Maps profile_image_url, profileImageUrl, profileImage, imageUrl fields
- Added mapping for both receptionists and barbers
```

### 3. ImageUploader.tsx
```typescript
// New Props:
- employeeId?: string - For employee-specific uploads

// Enhanced Upload Logic:
- Uses uploadEmployeeProfile() when employeeId is provided
- Automatically deletes old images before uploading new ones
- Maintains backward compatibility for other image categories
```

### 4. AddEmployeeModal.tsx
```typescript
// Enhanced Integration:
- Passes employeeId to ImageUploader in edit mode
- Ensures consistent naming and old image deletion
- Better integration with Firebase upload service
```

## How It Works

### For New Employees:
1. Upload uses timestamp-based naming initially
2. When employee is created, image can be re-uploaded with consistent naming

### For Existing Employees:
1. ImageUploader receives employeeId from AddEmployeeModal
2. uploadEmployeeProfile() deletes the old image (if exists)
3. New image is uploaded with consistent name: `employee_{employeeId}.jpg`
4. Staff management automatically displays the new image

### File Naming Pattern:
```
salons/{salonId}/employee-profiles/employee_{employeeId}.{extension}
```

## Benefits

1. **Consistent Storage**: All employee profile pictures have predictable names
2. **No Storage Bloat**: Old images are automatically deleted
3. **Better UX**: Users see profile pictures immediately in staff management
4. **Reliable Updates**: Profile picture updates work correctly without duplicates
5. **Error Resilience**: Fallback to initials if image fails to load

## Testing Instructions

1. **Test Profile Picture Display**:
   - Navigate to Staff Management
   - Verify existing employees show profile pictures (if they have them)
   - Check that employees without pictures show initials

2. **Test New Employee Creation**:
   - Add a new employee with a profile picture
   - Verify the image uploads successfully
   - Check that the image appears in staff management

3. **Test Profile Picture Updates**:
   - Edit an existing employee with a profile picture
   - Upload a different profile picture
   - Verify the old image is replaced (not duplicated)
   - Check Firebase Storage console to confirm old image is deleted

4. **Test Error Handling**:
   - Try uploading invalid file types
   - Test with very large files
   - Verify error messages are displayed properly

## Firebase Storage Structure
```
salons/
  └── {salonId}/
      └── employee-profiles/
          ├── employee_1.jpg
          ├── employee_2.png
          └── employee_3.jpg
```

## Notes
- Changes are backward compatible
- Existing images will continue to work
- New uploads will use the consistent naming pattern
- Old images will be cleaned up when profiles are updated
