// Temporary mock Firebase service for testing
// Replace this with real Firebase when ready

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

class MockImageUploadService {
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

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

  async uploadImage(
    file: File,
    category: ImageCategory,
    salonId: number,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
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

      // Simulate upload progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          // Create a temporary URL for the uploaded file
          const mockUrl = `https://mock-firebase-storage.com/salons/${salonId}/${category}/${Date.now()}_${file.name}`;
          
          onProgress?.({
            progress: 100,
            isUploading: false,
            error: null,
            downloadURL: mockUrl
          });
          
          resolve(mockUrl);
        } else {
          onProgress?.({
            progress,
            isUploading: true,
            error: null,
            downloadURL: null
          });
        }
      }, 200);
    });
  }

  async deleteImage(imageUrl: string): Promise<void> {
    console.log('Mock: Deleted image:', imageUrl);
    return Promise.resolve();
  }

  async uploadMultipleImages(
    files: File[],
    category: ImageCategory,
    salonId: number,
    onBatchProgress?: (completed: number, total: number) => void
  ): Promise<string[]> {
    const results: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      onBatchProgress?.(i, files.length);
      const downloadURL = await this.uploadImage(file, category, salonId);
      results.push(downloadURL);
      onBatchProgress?.(i + 1, files.length);
    }
    
    return results;
  }

  async compressImage(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> {
    // Mock compression - just return the original file
    console.log('Mock: Compressing image:', file.name, 'maxWidth:', maxWidth, 'quality:', quality);
    return Promise.resolve(file);
  }
}

export const imageUploadService = new MockImageUploadService();
