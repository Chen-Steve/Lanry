'use client';

import supabase from '@/lib/supabaseClient';

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif';
  resize?: 'cover' | 'contain' | 'fill';
}

/**
 * Optimizes a Supabase storage URL with transformation parameters
 * @param url The original Supabase storage URL
 * @param options Image transformation options
 * @returns Optimized image URL with transformation parameters
 */
export const getOptimizedImageUrl = (url: string, options: ImageTransformOptions = {}): string => {
  if (!url || !url.startsWith('http')) {
    return url;
  }

  const params = new URLSearchParams();

  if (options.width) {
    params.append('width', options.width.toString());
  }
  
  if (options.height) {
    params.append('height', options.height.toString());
  }

  // Default to 80% quality if not specified
  params.append('quality', (options.quality || 80).toString());
  
  // Default to WebP format for better compression if not specified
  params.append('format', options.format || 'webp');

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
};

/**
 * Gets optimized image URL based on the display size
 * @param url The original Supabase storage URL
 * @param size 'thumbnail' | 'small' | 'medium' | 'large'
 * @returns Optimized image URL with appropriate size parameters
 */
export const getResponsiveImageUrl = (url: string, size: 'thumbnail' | 'small' | 'medium' | 'large'): string => {
  const sizeMap: Record<typeof size, ImageTransformOptions> = {
    thumbnail: { 
      width: 100, 
      quality: 60,
      format: 'webp'
    },
    small: { 
      width: 300, 
      quality: 70,
      format: 'webp'
    },
    medium: { 
      width: 600, 
      quality: 80,
      format: 'webp'
    },
    large: { 
      width: 1200, 
      quality: 85,
      format: 'webp'
    }
  };

  return getOptimizedImageUrl(url, sizeMap[size]);
};

/**
 * Gets the public URL for a storage path
 * @param path The storage path
 * @returns Promise resolving to the public URL
 */
export const getPublicUrl = async (path: string): Promise<string> => {
  const { data } = await supabase.storage.from('public').getPublicUrl(path);
  return data.publicUrl;
}; 