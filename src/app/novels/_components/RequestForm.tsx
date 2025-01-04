import { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import type { NovelRequest } from '@/types/database';
import { createNovelRequest } from '@/services/novelRequestService';
import { toast } from 'react-hot-toast';
import Image from 'next/image';
import { uploadImage } from '@/services/uploadService';
import { useAuth } from '@/hooks/useAuth';

interface RequestFormProps {
  onSubmit: (request: NovelRequest) => void;
  onClose: () => void;
}

export const RequestForm = ({ onSubmit, onClose }: RequestFormProps) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [originalLanguage, setOriginalLanguage] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const { userId, isAuthenticated } = useAuth();
  const formRef = useRef<HTMLDivElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setCoverImage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please sign in to create a request');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let finalCoverImage = coverImage;
      
      if (imageFile) {
        setIsUploading(true);
        const uploadedUrl = await uploadImage(imageFile, userId);
        finalCoverImage = uploadedUrl;
        setIsUploading(false);
      }

      const request = await createNovelRequest(
        title, 
        author, 
        description, 
        originalLanguage, 
        finalCoverImage,
        userId
      );
      
      if (request) {
        onSubmit(request);
        setTitle('');
        setAuthor('');
        setDescription('');
        setOriginalLanguage('');
        setCoverImage('');
        setImageFile(null);
        setImagePreview('');
        toast.success('Novel request submitted successfully!');
      }
    } catch (error: unknown) {
      console.error('Error submitting request:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to submit request. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 md:relative md:bg-transparent">
      <div ref={formRef} className="fixed inset-x-0 bottom-0 bg-background rounded-t-xl p-4 md:relative md:rounded-lg md:p-6">
        <div className="flex items-center justify-between mb-4 md:hidden">
          <h3 className="text-lg font-medium text-foreground">New Request</h3>
          <button aria-label="Close" onClick={onClose} className="p-2 -mr-2 text-foreground">
            <Icon icon="mdi:close" className="text-xl" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Novel Title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-base bg-background text-foreground placeholder:text-muted-foreground"
            />

            <input
              type="text"
              placeholder="Original Author *"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-base bg-background text-foreground placeholder:text-muted-foreground"
            />

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="cover-image-upload"
                />
                <label
                  htmlFor="cover-image-upload"
                  className="flex-1 px-4 py-3 text-foreground rounded-lg border border-border cursor-pointer hover:bg-accent transition-colors text-center"
                >
                  {imagePreview ? 'Change Image' : 'Upload Cover Image'}
                </label>
                {imagePreview && (
                  <button
                    aria-label="Remove Image"
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview('');
                    }}
                    className="p-2 text-muted-foreground hover:text-foreground"
                  >
                    <Icon icon="mdi:close" className="text-xl" />
                  </button>
                )}
              </div>
              
              {imagePreview && (
                <div className="relative w-20 h-28 mx-auto">
                  <Image
                    src={imagePreview}
                    alt="Cover preview"
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="relative">
                <input
                  type="url"
                  placeholder="Or paste cover image URL"
                  value={coverImage}
                  onChange={(e) => {
                    setCoverImage(e.target.value);
                    setImageFile(null);
                    setImagePreview('');
                  }}
                  disabled={!!imageFile}
                  className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-base bg-background text-foreground placeholder:text-muted-foreground disabled:bg-muted disabled:text-muted-foreground"
                />
              </div>
            </div>

            <select
              aria-label="Original Language"
              value={originalLanguage}
              onChange={(e) => setOriginalLanguage(e.target.value)}
              required
              className="w-full px-4 py-3 text-foreground rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-base bg-background"
            >
              <option value="">Select Language *</option>
              <option value="Chinese">Chinese</option>
              <option value="Korean">Korean</option>
              <option value="Japanese">Japanese</option>
              <option value="Other">Other</option>
            </select>

            <textarea
              placeholder="Brief description of the novel *"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-base bg-background text-foreground placeholder:text-muted-foreground resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-lg font-medium disabled:opacity-50 transition-opacity"
          >
            {isUploading ? 'Uploading Image...' : isSubmitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  );
}; 