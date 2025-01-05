import { Icon } from '@iconify/react';
import Image from 'next/image';
import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface NovelCoverUploadProps {
  imagePreview: string;
  coverImageUrl?: string;
  onImageChange: (file: File) => void;
  onImageRemove: () => void;
}

export default function NovelCoverUpload({
  imagePreview,
  coverImageUrl,
  onImageChange,
  onImageRemove
}: NovelCoverUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.[0]) {
      onImageChange(acceptedFiles[0]);
    }
  }, [onImageChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: false
  });

  return (
    <div className="space-y-3 md:space-y-4 px-2 md:px-0">
      <h2 className="text-base md:text-lg font-semibold text-gray-900">
        Cover Image
      </h2>
      <p className="text-xs md:text-sm text-gray-500">
        Upload a cover image for your novel. Recommended size: 600x900px (2:3 ratio).
        Maximum file size: 5MB.
      </p>

      <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-start">
        {/* Preview Section */}
        <div className="w-48 md:w-64 mx-auto md:mx-0 flex-shrink-0">
          {(imagePreview || coverImageUrl) ? (
            <div className="relative aspect-[2/3] rounded-lg overflow-hidden group">
              <Image
                src={
                  imagePreview || 
                  (coverImageUrl ? (
                    coverImageUrl.includes('://') 
                      ? coverImageUrl 
                      : `/novel-covers/${coverImageUrl.replace(/^\/+/, '')}`
                  ) : '/placeholder-cover.jpg')
                }
                alt="Cover preview"
                fill
                className="object-cover transition-all duration-200 group-hover:scale-105"
                sizes="(max-width: 768px) 192px, 256px"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <button
                type="button"
                onClick={onImageRemove}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-500 text-white p-2 md:p-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                title="Remove cover image"
              >
                <Icon icon="mdi:trash" className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </div>
          ) : (
            <div className="aspect-[2/3] bg-gray-100 rounded-lg flex items-center justify-center">
              <Icon icon="mdi:image-off" className="w-8 h-8 md:w-12 md:h-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Upload Section */}
        <div className="flex-1">
          <div
            {...getRootProps()}
            className={`
              relative border-2 border-dashed rounded-lg p-4 md:p-8
              transition-colors duration-200 cursor-pointer
              flex flex-col items-center justify-center min-h-[180px] md:min-h-[240px]
              ${isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-500 hover:bg-gray-50'
              }
            `}
          >
            <input {...getInputProps()} />
            
            <Icon 
              icon={isDragActive ? 'mdi:cloud-upload' : 'mdi:cloud-upload-outline'} 
              className={`w-8 h-8 md:w-12 md:h-12 mb-3 md:mb-4 ${
                isDragActive ? 'text-blue-500' : 'text-gray-400'
              }`}
            />
            
            {isDragActive ? (
              <p className="text-blue-500 font-medium text-center text-sm md:text-base">
                Drop your image here
              </p>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 mb-2 text-sm md:text-base">
                  Drag and drop your cover image here, or click to select
                </p>
                <p className="text-xs md:text-sm text-gray-500">
                  Supports: JPG, PNG, WebP
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 