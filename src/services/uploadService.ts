'use client';

import supabase from '@/lib/supabaseClient';
import { nanoid } from 'nanoid';

type ImageBucket = 'novel-covers' | 'footnote-images';

export async function listFootnoteImages(): Promise<string[]> {
  try {
    const { data, error } = await supabase.storage
      .from('footnote-images')
      .list();

    if (error) {
      console.error('Error listing images:', error);
      throw error;
    }

    return data
      .filter(file => file.name.match(/\.(jpg|jpeg|png|gif)$/i))
      .map(file => {
        const { data: { publicUrl } } = supabase.storage
          .from('footnote-images')
          .getPublicUrl(file.name);
        return publicUrl;
      });
  } catch (error) {
    console.error('Error listing images:', error);
    throw error;
  }
}

export async function uploadImage(file: File, userId: string | null, bucket: ImageBucket = 'novel-covers'): Promise<string> {
  try {
    // Validate file type
    const allowedTypes = ['image/webp', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Please select a WebP, JPG, or PNG image file');
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Image size should be less than 5MB');
    }

    // Generate unique filename with original extension
    const ext = file.name.split('.').pop() || 'webp';
    const filename = `${nanoid()}.${ext}`;
    
    // Upload to Supabase bucket
    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading to storage:', uploadError);
      throw new Error(uploadError.message);
    }

    if (!data?.path) {
      throw new Error('Upload failed - no path returned');
    }

    // Try to get transformed WebP version
    try {
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path, {
          transform: {
            format: 'origin',
            quality: 80,
          },
        });
      
      return publicUrl;
    } catch (transformError) {
      // If transformation fails, use original format
      console.warn('Image transformation failed:', transformError);
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);
      
      return publicUrl;
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to upload image');
  }
} 