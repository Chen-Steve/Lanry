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
      author_thoughts,
      age_rating
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
    age_rating?: 'EVERYONE' | 'TEEN' | 'MATURE';
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
    age_rating?: 'EVERYONE' | 'TEEN' | 'MATURE';
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

  // Create the chapter
  const chapterId = generateUUID();
  const { error } = await supabase
    .from('chapters')
    .insert({
      id: chapterId,
      novel_id: novelId,
      ...chapterData,
      volume_id: chapterData.volumeId,
      slug: generateChapterSlug(chapterData.chapter_number, chapterData.part_number),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (error) throw error;

  // Apply auto-release schedule if no publish date is set
  if (!chapterData.publish_at) {
    await applyAutoReleaseSchedule(novelId, userId, chapterId);
  }

  return chapterId; // Return the generated chapterId
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

export async function updateAdvancedChapterCoins(
  novelId: string,
  userId: string,
  defaultCoins: number
) {
  await verifyNovelAuthor(novelId, userId);

  const { error } = await supabase
    .from('chapters')
    .update({ coins: defaultCoins })
    .eq('novel_id', novelId)
    .gt('publish_at', new Date().toISOString());

  if (error) throw error;
}

export async function updateGlobalSettings(
  novelId: string,
  userId: string,
  settings: {
    autoReleaseEnabled: boolean;
    autoReleaseInterval: number;
    fixedPriceEnabled: boolean;
    fixedPriceAmount: number;
  }
) {
  await verifyNovelAuthor(novelId, userId);

  const { error: novelError } = await supabase
    .from('novels')
    .update({
      auto_release_enabled: settings.autoReleaseEnabled,
      auto_release_interval: settings.autoReleaseInterval,
      fixed_price_enabled: settings.fixedPriceEnabled,
      fixed_price_amount: settings.fixedPriceAmount,
      updated_at: new Date().toISOString()
    })
    .eq('id', novelId);

  if (novelError) throw novelError;

  // If fixed price is enabled, update all future chapters with the fixed price
  if (settings.fixedPriceEnabled) {
    const { error: chapterError } = await supabase
      .from('chapters')
      .update({ coins: settings.fixedPriceAmount })
      .eq('novel_id', novelId)
      .gt('publish_at', new Date().toISOString());

    if (chapterError) throw chapterError;
  }
}

export async function getGlobalSettings(novelId: string, userId: string) {
  await verifyNovelAuthor(novelId, userId);

  const { data, error } = await supabase
    .from('novels')
    .select(`
      auto_release_enabled,
      auto_release_interval,
      fixed_price_enabled,
      fixed_price_amount
    `)
    .eq('id', novelId)
    .single();

  if (error) throw error;

  return {
    autoReleaseEnabled: data.auto_release_enabled,
    autoReleaseInterval: data.auto_release_interval,
    fixedPriceEnabled: data.fixed_price_enabled,
    fixedPriceAmount: data.fixed_price_amount
  };
}

// Function to apply auto-release schedule to a new chapter
export async function applyAutoReleaseSchedule(
  novelId: string,
  userId: string,
  chapterId: string,
  baseDate?: Date // Optional base date for bulk uploads
) {
  await verifyNovelAuthor(novelId, userId);

  // Get novel settings
  const { data: novel, error: novelError } = await supabase
    .from('novels')
    .select(`
      auto_release_enabled,
      auto_release_interval,
      fixed_price_enabled,
      fixed_price_amount
    `)
    .eq('id', novelId)
    .single();

  if (novelError) throw novelError;

  if (!novel.auto_release_enabled) return;

  let publishAt: Date;

  if (baseDate) {
    // If a base date is provided (for bulk uploads), use it directly
    publishAt = new Date(baseDate);
    publishAt.setDate(publishAt.getDate() + novel.auto_release_interval);
  } else {
    // Get the latest published chapter's publish date
    const { data: latestChapter, error: chapterError } = await supabase
      .from('chapters')
      .select('publish_at')
      .eq('novel_id', novelId)
      .not('id', 'eq', chapterId) // Exclude the current chapter
      .order('publish_at', { ascending: false })
      .limit(1)
      .single();

    if (chapterError && chapterError.message !== 'No rows found') throw chapterError;

    // Calculate the next publish date
    const baseDate = latestChapter?.publish_at 
      ? new Date(latestChapter.publish_at) 
      : new Date();
    publishAt = new Date(baseDate);
    publishAt.setDate(publishAt.getDate() + novel.auto_release_interval);
  }

  // Update the chapter with the calculated publish date and price
  interface ChapterUpdateData {
    publish_at: string;
    coins?: number;
  }

  const updateData: ChapterUpdateData = {
    publish_at: publishAt.toISOString()
  };

  if (novel.fixed_price_enabled) {
    updateData.coins = novel.fixed_price_amount;
  }

  const { error: updateError } = await supabase
    .from('chapters')
    .update(updateData)
    .eq('id', chapterId);

  if (updateError) throw updateError;

  return publishAt; // Return the publish date for sequential scheduling
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