import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../config/firebase';

export interface UploadProgress {
  progress: number;
  isUploading: boolean;
  error: string | null;
  downloadURL: string | null;
}

export type ImageCategory = 
  | 'employee-profiles' 
  | 'salon-gallery' 
  | 'service-images' 
  | 'owner-profiles'
  | 'salon-logos';

class ImageUploadService {
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  /**
   * Validate file before upload
   */
  validateFile(file: File): { isValid: boolean; error?: string } {
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid file type. Please upload JPEG, PNG, WebP, or GIF images.'
      };
    }

    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: 'File size too large. Please upload files smaller than 5MB.'
      };
    }

    return { isValid: true };
  }

  /**
   * Generate organized storage path with consistent naming for employee profiles
   */
  private generateStoragePath(category: ImageCategory, salonId: number, fileName: string, employeeId?: string): string {
    const fileExtension = fileName.split('.').pop() || 'jpg';
    
    // For employee profiles, use consistent naming with employeeId
    if (category === 'employee-profiles' && employeeId) {
      const timestamp = Date.now();
      return `salons/${salonId}/${category}/${employeeId}_${timestamp}.${fileExtension}`;
    }
    
    // For owner profiles, use consistent naming
    if (category === 'owner-profiles' && employeeId) {
      const timestamp = Date.now();
      return `salons/${salonId}/${category}/owner_${employeeId}_${timestamp}.${fileExtension}`;
    }
    
    // For other categories, use timestamp only
    const timestamp = Date.now();
    return `salons/${salonId}/${category}/${timestamp}.${fileExtension}`;
  }

  /**
   * Upload employee profile image with automatic old image deletion
   */
  async uploadEmployeeProfile(
    file: File,
    salonId: number,
    employeeId: string,
    currentImageUrl?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    // Delete old image if exists
    if (currentImageUrl) {
      try {
        await this.deleteImage(currentImageUrl);
        console.log('Old profile image deleted successfully');
      } catch (error) {
        console.warn('Failed to delete old profile image:', error);
        // Continue with upload even if deletion fails
      }
    }

    // Upload new image with consistent naming
    return this.uploadImageWithId(file, 'employee-profiles', salonId, employeeId, onProgress);
  }

  /**
   * Upload image with custom ID for consistent naming
   */
  async uploadImageWithId(
    file: File,
    category: ImageCategory,
    salonId: number,
    customId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        const error = validation.error || 'Invalid file';
        onProgress?.({
          progress: 0,
          isUploading: false,
          error,
          downloadURL: null
        });
        reject(new Error(error));
        return;
      }

      // Create storage reference with custom ID
      const storagePath = this.generateStoragePath(category, salonId, file.name, customId);
      const storageRef = ref(storage, storagePath);

      // Create upload task
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Initialize progress
      onProgress?.({
        progress: 0,
        isUploading: true,
        error: null,
        downloadURL: null
      });

      // Monitor upload progress
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.({
            progress,
            isUploading: true,
            error: null,
            downloadURL: null
          });
        },
        (error) => {
          // Handle upload errors
          let errorMessage = 'Upload failed. Please try again.';
          
          switch (error.code) {
            case 'storage/unauthorized':
              errorMessage = 'You do not have permission to upload files.';
              break;
            case 'storage/canceled':
              errorMessage = 'Upload was canceled.';
              break;
            case 'storage/unknown':
              errorMessage = 'An unknown error occurred during upload.';
              break;
            case 'storage/invalid-format':
              errorMessage = 'Invalid file format.';
              break;
            case 'storage/invalid-checksum':
              errorMessage = 'File integrity check failed.';
              break;
            default:
              errorMessage = error.message || errorMessage;
          }

          onProgress?.({
            progress: 0,
            isUploading: false,
            error: errorMessage,
            downloadURL: null
          });
          
          reject(new Error(errorMessage));
        },
        async () => {
          try {
            // Upload completed successfully
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            onProgress?.({
              progress: 100,
              isUploading: false,
              error: null,
              downloadURL
            });
            
            resolve(downloadURL);
          } catch (error) {
            const errorMessage = 'Failed to get download URL.';
            onProgress?.({
              progress: 0,
              isUploading: false,
              error: errorMessage,
              downloadURL: null
            });
            reject(new Error(errorMessage));
          }
        }
      );
    });
  }

  /**
   * Upload image with progress tracking
   */
  async uploadImage(
    file: File,
    category: ImageCategory,
    salonId: number,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        const error = validation.error || 'Invalid file';
        onProgress?.({
          progress: 0,
          isUploading: false,
          error,
          downloadURL: null
        });
        reject(new Error(error));
        return;
      }

      // Create storage reference
      const storagePath = this.generateStoragePath(category, salonId, file.name);
      const storageRef = ref(storage, storagePath);

      // Create upload task
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Initialize progress
      onProgress?.({
        progress: 0,
        isUploading: true,
        error: null,
        downloadURL: null
      });

      // Monitor upload progress
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.({
            progress,
            isUploading: true,
            error: null,
            downloadURL: null
          });
        },
        (error) => {
          // Handle upload errors
          let errorMessage = 'Upload failed. Please try again.';
          
          switch (error.code) {
            case 'storage/unauthorized':
              errorMessage = 'You do not have permission to upload files.';
              break;
            case 'storage/canceled':
              errorMessage = 'Upload was canceled.';
              break;
            case 'storage/unknown':
              errorMessage = 'An unknown error occurred during upload.';
              break;
            case 'storage/invalid-format':
              errorMessage = 'Invalid file format.';
              break;
            case 'storage/invalid-checksum':
              errorMessage = 'File integrity check failed.';
              break;
            default:
              errorMessage = error.message || errorMessage;
          }

          onProgress?.({
            progress: 0,
            isUploading: false,
            error: errorMessage,
            downloadURL: null
          });
          
          reject(new Error(errorMessage));
        },
        async () => {
          try {
            // Upload completed successfully
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            onProgress?.({
              progress: 100,
              isUploading: false,
              error: null,
              downloadURL
            });
            
            resolve(downloadURL);
          } catch (error) {
            const errorMessage = 'Failed to get download URL.';
            onProgress?.({
              progress: 0,
              isUploading: false,
              error: errorMessage,
              downloadURL: null
            });
            reject(new Error(errorMessage));
          }
        }
      );
    });
  }

  /**
   * Delete image from storage by URL
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // For Firebase Storage URLs, we need to create a reference using the full URL
      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);
    } catch (error: any) {
      // If the URL is a full HTTP URL, we need to extract the path
      try {
        // Try to parse the URL and extract the path
        const url = new URL(imageUrl);
        const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
        if (pathMatch) {
          const storagePath = decodeURIComponent(pathMatch[1]);
          const storageRef = ref(storage, storagePath);
          await deleteObject(storageRef);
          return;
        }
      } catch (urlError) {
        // If URL parsing fails, continue with original error handling
      }

      if (error.code === 'storage/object-not-found') {
        // File doesn't exist, which is fine
        console.warn('File not found in storage:', imageUrl);
        return;
      }
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  /**
   * Upload multiple images with batch progress
   */
  async uploadMultipleImages(
    files: File[],
    category: ImageCategory,
    salonId: number,
    onBatchProgress?: (completed: number, total: number, currentFile?: string) => void
  ): Promise<string[]> {
    const results: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        onBatchProgress?.(i, files.length, file.name);
        
        const downloadURL = await this.uploadImage(file, category, salonId);
        results.push(downloadURL);
        
        onBatchProgress?.(i + 1, files.length);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        throw error;
      }
    }
    
    return results;
  }

  /**
   * Compress image before upload (basic implementation)
   */
  async compressImage(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Return original if compression fails
            }
          },
          file.type,
          quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }
}

export const imageUploadService = new ImageUploadService();
