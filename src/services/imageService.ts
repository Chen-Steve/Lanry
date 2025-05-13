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
    try {
      // Parse the URL properly to handle query parameters correctly
      const parsedUrl = new URL(url);
      
      // Add transformation parameters
      if (options.width) parsedUrl.searchParams.set('width', options.width.toString());
      if (options.height) parsedUrl.searchParams.set('height', options.height.toString());
      if (options.quality) parsedUrl.searchParams.set('quality', options.quality.toString());
      
      // Only set format if not already present
      if (!parsedUrl.searchParams.has('format')) {
        parsedUrl.searchParams.set('format', 'webp');
      }
      
      // Add resize mode if specified
      if (options.resize) parsedUrl.searchParams.set('resize', options.resize);
      
      return parsedUrl.toString();
    } catch (error) {
      console.error('Error parsing image URL:', error);
      return url; // Return original URL if parsing fails
    }
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