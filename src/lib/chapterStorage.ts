import { getSupabase } from '@/lib/supabase';

interface ChapterStoragePayload {
  content: string;
  author_thoughts?: string | null;
  content_format?: string; // e.g., 'html' | 'markdown' | 'richtext'
  content_updated_at?: string; // ISO string
  word_count?: number;
}

export function getChapterStoragePath(novelId: string, chapterId: string): string {
  return `${novelId}/${chapterId}.json`;
}

export async function uploadChapterToStorage(
  novelId: string,
  chapterId: string,
  payload: ChapterStoragePayload
): Promise<{ path: string } | null> {
  try {
    const supabase = getSupabase();
    const path = getChapterStoragePath(novelId, chapterId);
    const body = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const { error } = await supabase.storage.from('chapters').upload(path, body, {
      upsert: true,
      contentType: 'application/json',
      cacheControl: '60',
    });
    if (error) {
      // Non-fatal for dual-write migration: log and continue
      console.error('Failed to upload chapter to storage', { novelId, chapterId, error });
      return null;
    }
    return { path };
  } catch (err) {
    console.error('Unexpected error uploading chapter to storage', err);
    return null;
  }
}

export async function downloadChapterFromStorage(
  novelId: string,
  chapterId: string
): Promise<ChapterStoragePayload | null> {
  try {
    const supabase = getSupabase();
    const path = getChapterStoragePath(novelId, chapterId);
    const { data, error } = await supabase.storage.from('chapters').download(path);
    if (error || !data) return null;
    let text: string;

    type WithText = { text: () => Promise<string> };
    type WithArrayBuffer = { arrayBuffer: () => Promise<ArrayBuffer> };
    const hasText = (d: unknown): d is WithText => !!d && typeof (d as WithText).text === 'function';
    const hasArrayBuffer = (d: unknown): d is WithArrayBuffer => !!d && typeof (d as WithArrayBuffer).arrayBuffer === 'function';

    const raw: unknown = data as unknown;
    if (hasText(raw)) {
      text = await (raw as WithText).text();
    } else if (hasArrayBuffer(raw)) {
      const buf = await (raw as WithArrayBuffer).arrayBuffer();
      text = new TextDecoder().decode(buf);
    } else if (typeof Blob !== 'undefined' && raw instanceof Blob) {
      text = await (raw as Blob).text();
    } else {
      text = String(raw);
    }
    try {
      const parsed = JSON.parse(text) as ChapterStoragePayload;
      return parsed;
    } catch {
      return { content: text } as ChapterStoragePayload;
    }
  } catch {
    return null;
  }
}

export async function removeChapterFromStorage(
  novelId: string,
  chapterId: string
): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const path = getChapterStoragePath(novelId, chapterId);
    const { error } = await supabase.storage.from('chapters').remove([path]);
    if (error) {
      console.error('Failed to remove chapter from storage', { novelId, chapterId, error });
      return false;
    }
    return true;
  } catch (err) {
    console.error('Unexpected error removing chapter from storage', err);
    return false;
  }
}

// Utility: Estimate word count from HTML or plain text
export function estimateWordCountFromHtml(text: string): number {
  try {
    const stripped = text
      // remove script/style
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      // strip tags
      .replace(/<[^>]+>/g, ' ')
      // collapse whitespace
      .replace(/\s+/g, ' ')
      .trim();
    if (!stripped) return 0;
    return stripped.split(' ').length;
  } catch {
    return 0;
  }
}


