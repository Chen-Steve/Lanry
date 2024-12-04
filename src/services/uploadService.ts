import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { nanoid } from 'nanoid';

const supabase = createClientComponentClient();

export async function uploadImage(file: File, userId: string | null): Promise<string> {
  try {
    if (!userId) {
      throw new Error('Must be logged in to upload images');
    }

    // Generate unique filename
    const ext = file.name.split('.').pop();
    const filename = `${nanoid()}.${ext}`;
    
    // Upload to Supabase bucket
    const { data, error: uploadError } = await supabase.storage
      .from('novel-covers')
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

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('novel-covers')
      .getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to upload image');
  }
} 