'use client';

import supabase from '@/lib/supabaseClient';

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif';
  resize?: 'cover' | 'contain' | 'fill';
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

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

  // If it's a Supabase storage URL, use Supabase's image transformation
  if (url.includes(SUPABASE_URL as string)) {
    const transformOptions = new URLSearchParams();
    
    if (options.width) transformOptions.append('width', options.width.toString());
    if (options.height) transformOptions.append('height', options.height.toString());
    if (options.quality) transformOptions.append('quality', options.quality.toString());
    
    // Always use WebP for better compression
    transformOptions.append('format', 'webp');
    
    // Add resize mode if specified
    if (options.resize) transformOptions.append('resize', options.resize);
    
    return `${url}?${transformOptions.toString()}`;
  }

  // For non-Supabase URLs, return as is
  return url;
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
      height: 150,
      quality: 60,
      format: 'webp',
      resize: 'cover'
    },
    small: { 
      width: 200,
      height: 300,
      quality: 75,
      format: 'webp',
      resize: 'cover'
    },
    medium: { 
      width: 300,
      height: 450,
      quality: 80,
      format: 'webp',
      resize: 'cover'
    },
    large: { 
      width: 400,
      height: 600,
      quality: 85,
      format: 'webp',
      resize: 'cover'
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
  const { data } = await supabase.storage
    .from('public')
    .getPublicUrl(path);
  return data.publicUrl;
}; 