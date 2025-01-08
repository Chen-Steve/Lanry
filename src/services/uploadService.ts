import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { nanoid } from 'nanoid';

const supabase = createClientComponentClient();

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
    // Generate unique filename
    const ext = file.name.split('.').pop();
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

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
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