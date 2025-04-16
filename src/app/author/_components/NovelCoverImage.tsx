import { Icon } from '@iconify/react';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { nanoid } from 'nanoid';
import { useSupabase } from '@/app/providers';

// Add a helper function to get direct CDN URL
function getDirectCDNUrl(publicUrl: string) {
  // Convert Supabase storage URL to direct CDN URL
  return publicUrl.replace('.supabase.co/storage/v1/object/public/', '.supabase.co/storage/v1/render/image/public/');
}

interface NovelCoverImageProps {
  coverImageUrl?: string;
  onUpdate: (url: string) => Promise<void>;
  onDelete?: () => Promise<void>;
}

export default function NovelCoverImage({ coverImageUrl, onUpdate, onDelete }: NovelCoverImageProps) {
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { supabase } = useSupabase();

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
      // Generate a unique filename with original extension
      const ext = file.name.split('.').pop();
      const filename = `${nanoid()}.${ext}`;

      // Upload directly to Supabase Storage
      const { data, error } = await supabase.storage
        .from('novel-covers')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('novel-covers')
        .getPublicUrl(data.path);

      await onUpdate(publicUrl);
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

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the file upload click
    if (!onDelete) return;
    
    try {
      await onDelete();
    } catch (error) {
      console.error('Error deleting cover:', error);
      toast.error('Failed to delete cover image');
    }
  };

  return (
    <div className="relative">
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
                src={getDirectCDNUrl(coverImageUrl)}
                alt="Novel cover"
                fill
                sizes="180px"
                className="object-cover"
                priority
                unoptimized
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
      {coverImageUrl && onDelete && (
        <button
          onClick={handleDelete}
          className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full shadow-sm hover:bg-red-600 hover:scale-110 transition-all z-10"
          aria-label="Delete cover image"
          title="Delete cover image"
        >
          <Icon icon="mdi:delete" className="w-4 h-4" />
        </button>
      )}
    </div>
  );
} 