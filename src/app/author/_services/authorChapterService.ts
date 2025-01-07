import supabase from '@/lib/supabaseClient';
import { generateChapterSlug, generateUUID } from '@/lib/utils';

export async function fetchAuthorNovels(userId: string, authorOnly: boolean) {
  let query = supabase
    .from('novels')
    .select(`
      id,
      title,
      author_profile_id,
      cover_image_url,
      chapters (count)
    `)
    .order('created_at', { ascending: false });

  if (authorOnly) {
    query = query.eq('author_profile_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;
  
  return data?.map(novel => ({
    ...novel,
    chaptersCount: novel.chapters[0].count
  }));
}

export async function fetchNovelChapters(novelId: string, userId: string, authorOnly: boolean) {
  if (authorOnly) {
    const { data: novel } = await supabase
      .from('novels')
      .select('author_profile_id')
      .eq('id', novelId)
      .single();

    if (novel?.author_profile_id !== userId) {
      throw new Error('Not authorized to view these chapters');
    }
  }

  const { data, error } = await supabase
    .from('chapters')
    .select(`
      id,
      chapter_number,
      part_number,
      title,
      content,
      novel_id,
      volume_id,
      slug,
      publish_at,
      coins,
      created_at,
      updated_at,
      author_thoughts
    `)
    .eq('novel_id', novelId)
    .order('chapter_number', { ascending: true });

  if (error) throw error;
  return data;
}

export async function updateChapter(
  chapterId: string,
  novelId: string,
  userId: string,
  chapterData: {
    chapter_number: number;
    part_number?: number | null;
    title: string;
    content: string;
    publish_at: string | null;
    coins: number;
    author_thoughts?: string;
  }
) {
  await verifyNovelAuthor(novelId, userId);
  
  const { error } = await supabase
    .from('chapters')
    .update({
      ...chapterData,
      slug: generateChapterSlug(chapterData.chapter_number, chapterData.part_number),
      updated_at: new Date().toISOString()
    })
    .eq('id', chapterId)
    .eq('novel_id', novelId);

  if (error) throw error;
}

export async function createChapter(
  novelId: string,
  userId: string,
  chapterData: {
    chapter_number: number;
    part_number?: number | null;
    title: string;
    content: string;
    publish_at: string | null;
    coins: number;
    author_thoughts?: string;
    volumeId?: string;
  }
) {
  await verifyNovelAuthor(novelId, userId);

  // Check for existing chapter with same number
  const { data: existingChapters } = await supabase
    .from('chapters')
    .select('chapter_number, part_number')
    .eq('novel_id', novelId)
    .eq('chapter_number', chapterData.chapter_number);

  if (existingChapters && existingChapters.length > 0) {
    // If checking for both chapter and part number
    if (chapterData.part_number) {
      const duplicatePart = existingChapters.some(ch => ch.part_number === chapterData.part_number);
      if (duplicatePart) {
        throw new Error(`Chapter ${chapterData.chapter_number} Part ${chapterData.part_number} already exists`);
      }
    } else if (!chapterData.part_number && existingChapters.some(ch => !ch.part_number)) {
      // If no part number and a chapter with this number exists without a part number
      throw new Error(`Chapter ${chapterData.chapter_number} already exists`);
    }
  }

  const { error } = await supabase
    .from('chapters')
    .insert({
      id: generateUUID(),
      novel_id: novelId,
      ...chapterData,
      volume_id: chapterData.volumeId,
      slug: generateChapterSlug(chapterData.chapter_number, chapterData.part_number),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (error) throw error;
}

export async function deleteChapter(chapterId: string, novelId: string, userId: string) {
  await verifyNovelAuthor(novelId, userId);

  const { error } = await supabase
    .from('chapters')
    .delete()
    .eq('id', chapterId)
    .eq('novel_id', novelId);

  if (error) throw error;
}

export async function fetchNovelVolumes(novelId: string, userId: string) {
  await verifyNovelAuthor(novelId, userId);

  const { data, error } = await supabase
    .from('volumes')
    .select(`
      id,
      volume_number,
      title,
      description,
      created_at,
      updated_at
    `)
    .eq('novel_id', novelId)
    .order('volume_number', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createVolume(
  novelId: string,
  userId: string,
  volumeData: {
    volumeNumber: number;
    title: string;
    description?: string;
  }
) {
  await verifyNovelAuthor(novelId, userId);

  const { error } = await supabase
    .from('volumes')
    .insert({
      id: generateUUID(),
      novel_id: novelId,
      volume_number: volumeData.volumeNumber,
      title: volumeData.title,
      description: volumeData.description,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (error) throw error;
}

export async function updateVolume(
  volumeId: string,
  novelId: string,
  userId: string,
  volumeData: {
    title: string;
    description?: string;
  }
) {
  await verifyNovelAuthor(novelId, userId);

  const { error } = await supabase
    .from('volumes')
    .update({
      ...volumeData,
      updated_at: new Date().toISOString()
    })
    .eq('id', volumeId)
    .eq('novel_id', novelId);

  if (error) throw error;
}

export async function deleteVolume(volumeId: string, novelId: string, userId: string) {
  await verifyNovelAuthor(novelId, userId);

  const { error } = await supabase
    .from('volumes')
    .delete()
    .eq('id', volumeId)
    .eq('novel_id', novelId);

  if (error) throw error;
}

export async function assignChaptersToVolume(
  chapterIds: string[],
  volumeId: string | null,
  novelId: string,
  userId: string
) {
  await verifyNovelAuthor(novelId, userId);

  const { error } = await supabase
    .from('chapters')
    .update({ volume_id: volumeId, updated_at: new Date().toISOString() })
    .in('id', chapterIds)
    .eq('novel_id', novelId);

  if (error) throw error;
}

async function verifyNovelAuthor(novelId: string, userId: string) {
  const { data: novel } = await supabase
    .from('novels')
    .select('author_profile_id')
    .eq('id', novelId)
    .single();

  if (novel?.author_profile_id !== userId) {
    throw new Error('Not authorized to modify chapters for this novel');
  }
}

export interface AutoScheduleSettings {
  enabled: boolean;
  interval: number;
  scheduleTime: string;
  startDate: string;
}

export async function saveAutoScheduleSettings(
  novelId: string,
  userId: string,
  settings: AutoScheduleSettings
): Promise<void> {
  const response = await fetch(`/api/author/novels/${novelId}/auto-schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      ...settings
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to save auto-schedule settings');
  }
}

export async function fetchAutoScheduleSettings(
  novelId: string,
  userId: string
): Promise<AutoScheduleSettings> {
  const response = await fetch(`/api/author/novels/${novelId}/auto-schedule?userId=${userId}`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch auto-schedule settings');
  }

  return response.json();
} 