import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader, CheckCircle, AlertCircle } from 'lucide-react';
// Using real Firebase service now that configuration is complete
import { imageUploadService, ImageCategory, UploadProgress } from '../../services/imageUploadService';
// Mock service no longer needed:
// import { imageUploadService, ImageCategory, UploadProgress } from '../../services/mockImageUploadService';

interface ImageUploaderProps {
  category: ImageCategory;
  salonId: number;
  onUploadComplete: (downloadURL: string) => void;
  onUploadError?: (error: string) => void;
  currentImage?: string;
  onImageDelete?: () => void;
  maxWidth?: number;
  maxHeight?: number;
  className?: string;
  placeholder?: string;
  multiple?: boolean;
  accept?: string;
  disabled?: boolean;
  showPreview?: boolean;
  compressImages?: boolean;
  employeeId?: string; // Add support for employee-specific uploads
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  category,
  salonId,
  onUploadComplete,
  onUploadError,
  currentImage,
  onImageDelete,
  maxWidth = 400,
  maxHeight = 300,
  className = '',
  placeholder,
  multiple = false,
  accept = 'image/*',
  disabled = false,
  showPreview = true,
  compressImages = true,
  employeeId
}) => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    progress: 0,
    isUploading: false,
    error: null,
    downloadURL: null
  });
  const [dragActive, setDragActive] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProgress = useCallback((progress: UploadProgress) => {
    setUploadProgress(progress);
    
    if (progress.error) {
      onUploadError?.(progress.error);
    }
    
    if (progress.downloadURL) {
      onUploadComplete(progress.downloadURL);
      // Clear preview after successful upload
      if (!multiple) {
        setPreviewImages([]);
      }
    }
  }, [onUploadComplete, onUploadError, multiple]);

  const processAndUploadFile = async (file: File) => {
    try {
      let processedFile = file;
      
      if (compressImages && file.type.startsWith('image/')) {
        processedFile = await imageUploadService.compressImage(file, 1200, 0.8);
      }
      
      // Use employee-specific upload if employeeId is provided and category is employee-profiles
      if (employeeId && category === 'employee-profiles') {
        await imageUploadService.uploadEmployeeProfile(
          processedFile,
          salonId,
          employeeId,
          currentImage,
          handleProgress
        );
      } else {
        await imageUploadService.uploadImage(
          processedFile,
          category,
          salonId,
          handleProgress
        );
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(prev => ({
        ...prev,
        isUploading: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }));
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Create preview URLs
    if (showPreview) {
      const newPreviews = fileArray.map(file => URL.createObjectURL(file));
      setPreviewImages(multiple ? [...previewImages, ...newPreviews] : newPreviews);
    }

    // Upload files
    if (multiple) {
      // Handle multiple file upload
      imageUploadService.uploadMultipleImages(
        fileArray,
        category,
        salonId,
        (completed, total) => {
          const progress = (completed / total) * 100;
          setUploadProgress({
            progress,
            isUploading: completed < total,
            error: null,
            downloadURL: null
          });
        }
      ).then(downloadURLs => {
        downloadURLs.forEach(url => onUploadComplete(url));
        setUploadProgress(prev => ({ ...prev, isUploading: false }));
      }).catch(error => {
        setUploadProgress({
          progress: 0,
          isUploading: false,
          error: error.message,
          downloadURL: null
        });
      });
    } else {
      // Handle single file upload
      processAndUploadFile(fileArray[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const handleDelete = async () => {
    if (currentImage && onImageDelete) {
      try {
        await imageUploadService.deleteImage(currentImage);
        onImageDelete();
      } catch (error) {
        console.error('Delete error:', error);
        onUploadError?.('Failed to delete image');
      }
    }
  };

  const clearPreviews = () => {
    previewImages.forEach(url => URL.revokeObjectURL(url));
    setPreviewImages([]);
  };

  const renderUploadArea = () => (
    <div
      className={`
        relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
        ${dragActive 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
      style={{ maxWidth: `${maxWidth}px`, maxHeight: `${maxHeight}px` }}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {uploadProgress.isUploading ? (
        <div className="space-y-4">
          <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
          <div className="space-y-2">
            <p className="text-gray-600 font-medium">Uploading...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">{Math.round(uploadProgress.progress)}%</p>
          </div>
        </div>
      ) : uploadProgress.error ? (
        <div className="space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <div>
            <p className="text-red-600 font-medium">Upload Failed</p>
            <p className="text-sm text-red-500 mt-1">{uploadProgress.error}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setUploadProgress({ progress: 0, isUploading: false, error: null, downloadURL: null });
              }}
              className="mt-2 text-sm text-blue-600 hover:text-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Upload className="w-12 h-12 text-gray-400 mx-auto" />
          <div>
            <p className="text-gray-600 font-medium">
              {placeholder || (multiple ? 'Upload Images' : 'Upload Image')}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Drag and drop or click to select {multiple ? 'files' : 'file'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Supports JPEG, PNG, WebP, GIF up to 5MB
            </p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Current Image Preview */}
      {currentImage && showPreview && (
        <div className="relative inline-block">
          <img
            src={currentImage}
            alt="Current"
            className="w-32 h-32 object-cover rounded-xl border border-gray-200"
          />
          {onImageDelete && (
            <button
              onClick={handleDelete}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Preview Images */}
      {previewImages.length > 0 && showPreview && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Preview</p>
            <button
              onClick={clearPreviews}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {previewImages.map((preview, index) => (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => {
                    URL.revokeObjectURL(preview);
                    setPreviewImages(prev => prev.filter((_, i) => i !== index));
                  }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Area */}
      {renderUploadArea()}

      {/* Upload Success */}
      {uploadProgress.downloadURL && (
        <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-lg">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">Upload completed successfully!</span>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
