'use client';

import { useState, useRef, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'react-hot-toast';
import { uploadImage, listFootnoteImages } from '@/services/uploadService';
import { createPortal } from 'react-dom';
import Image from 'next/image';

interface FootnoteImageUploaderProps {
  userId: string;
  onImageUploaded: (imageUrl: string) => void;
}

export default function FootnoteImageUploader({ userId, onImageUploaded }: FootnoteImageUploaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);

  // Handle component mounting for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Load images when modal opens
  useEffect(() => {
    if (isOpen) {
      loadImages();
    }
  }, [isOpen]);

  const loadImages = async () => {
    setIsLoading(true);
    try {
      const imageUrls = await listFootnoteImages();
      setImages(imageUrls);
    } catch (error) {
      console.error('Error loading images:', error);
      toast.error('Failed to load images');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Max file size: 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const imageUrl = await uploadImage(file, userId, 'footnote-images');
      onImageUploaded(imageUrl);
      setIsOpen(false);
      toast.success('Image uploaded successfully');
      // Refresh the image list
      await loadImages();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImageClick = (imageUrl: string) => {
    onImageUploaded(imageUrl);
    setIsOpen(false);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        className="p-1.5 md:p-2 hover:bg-accent/50 rounded-lg transition-colors"
        title="Add Image"
      >
        <Icon icon="mdi:image-plus" className="w-4 h-4 md:w-5 md:h-5 text-foreground" />
      </button>

      {mounted && isOpen && createPortal(
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0"
            onClick={() => !isUploading && setIsOpen(false)}
          />

          {/* Modal */}
          <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-2xl translate-x-[-50%] translate-y-[-50%] animate-in fade-in-0 zoom-in-95 duration-200">
            <div className="p-6 bg-background border border-border rounded-lg shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Insert Image</h3>
                <button
                  onClick={() => !isUploading && setIsOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  disabled={isUploading}
                  aria-label="Close upload dialog"
                >
                  <Icon icon="mdi:close" className="w-5 h-5" />
                </button>
              </div>

              {/* Upload Section */}
              <div 
                onClick={handleButtonClick}
                className="border-2 border-dashed border-border hover:border-primary rounded-lg p-6 text-center cursor-pointer transition-colors"
              >
                <div className="flex flex-col items-center gap-2">
                  <Icon icon="mdi:cloud-upload" className="w-8 h-8 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">
                    Click to upload a new image
                    <br />
                    <span className="text-xs">PNG, JPG, GIF up to 5MB</span>
                  </div>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                aria-label="Upload image"
                title="Choose an image file to upload"
              />

              {/* Previously Uploaded Images */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Previously Uploaded Images</h4>
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Icon icon="mdi:loading" className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : images.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto p-1">
                    {images.map((imageUrl, index) => (
                      <button
                        key={index}
                        onClick={() => handleImageClick(imageUrl)}
                        className="relative aspect-square group rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
                        title={`Insert image ${index + 1}`}
                        aria-label={`Insert image ${index + 1}`}
                      >
                        <Image
                          src={imageUrl}
                          alt={`Previously uploaded image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Icon icon="mdi:plus" className="w-6 h-6 text-white" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                    No images uploaded yet
                  </div>
                )}
              </div>

              {isUploading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                  <span>Uploading...</span>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
} 