import { Icon } from '@iconify/react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';

interface NovelCoverImageProps {
  coverImageUrl?: string;
  onUpdate: (url: string) => Promise<void>;
}

export default function NovelCoverImage({ coverImageUrl, onUpdate }: NovelCoverImageProps) {
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCoverImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only allow image files
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Max file size: 5MB
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      await onUpdate(data.url);
      toast.success('Cover image updated successfully');
    } catch (error) {
      console.error('Error uploading cover:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload cover image');
    } finally {
      setIsUploadingCover(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div 
      className="w-[180px] h-[270px] relative rounded-lg overflow-hidden shadow-md flex-shrink-0 group cursor-pointer"
      onClick={handleCoverImageClick}
    >
      {isUploadingCover ? (
        <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center">
          <Icon icon="mdi:loading" className="w-8 h-8 text-background animate-spin" />
        </div>
      ) : (
        <>
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt="Novel cover"
              fill
              sizes="180px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-accent flex items-center justify-center">
              <span className="text-muted-foreground text-sm font-medium">Cover image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-foreground/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Icon icon="mdi:camera" className="w-8 h-8 text-background" />
          </div>
        </>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload cover image"
      />
    </div>
  );
} 