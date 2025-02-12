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
    volume_id?: string;
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

  // Get novel settings for fixed pricing
  const { data: novel, error: novelError } = await supabase
    .from('novels')
    .select('fixed_price_enabled, fixed_price_amount')
    .eq('id', novelId)
    .single();

  if (novelError) throw novelError;

  // Create the chapter
  const chapterId = generateUUID();
  const { error } = await supabase
    .from('chapters')
    .insert({
      id: chapterId,
      novel_id: novelId,
      ...chapterData,
      // Apply fixed price if enabled, otherwise use provided coins value
      coins: novel.fixed_price_enabled ? novel.fixed_price_amount : chapterData.coins,
      volume_id: chapterData.volume_id,
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

// Helper function to get next publishing date based on selected days
function getNextPublishingDate(currentDate: Date, selectedDays: string[]): Date {
  if (!selectedDays || selectedDays.length === 0) return currentDate;

  const dayMap: { [key: string]: number } = {
    'SUNDAY': 0,
    'MONDAY': 1,
    'TUESDAY': 2,
    'WEDNESDAY': 3,
    'THURSDAY': 4,
    'FRIDAY': 5,
    'SATURDAY': 6
  };

  // Convert selected days to numbers and sort them
  const selectedDayNumbers = selectedDays
    .map(day => dayMap[day])
    .sort((a, b) => a - b);

  const currentDay = currentDate.getDay();
  const nextDate = new Date(currentDate);

  // Find the next available day
  let daysToAdd = 1;
  let foundNextDay = false;

  for (let i = 0; i < 7; i++) {
    const checkingDay = (currentDay + i) % 7;
    if (selectedDayNumbers.includes(checkingDay) && (i > 0 || currentDay !== checkingDay)) {
      daysToAdd = i;
      foundNextDay = true;
      break;
    }
  }

  // If no day found in the current week, get the first day of next week
  if (!foundNextDay) {
    daysToAdd = 7 - currentDay + selectedDayNumbers[0];
  }

  nextDate.setDate(nextDate.getDate() + daysToAdd);
  return nextDate;
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
  const now = new Date();
  
  // Function to adjust time to target hour (in local time)
  const adjustToTargetHour = (date: Date, targetHour: number = 5) => {
    const adjustedDate = new Date(date);
    adjustedDate.setHours(targetHour, 0, 0, 0);
    return adjustedDate;
  };

  // Function to convert local time to UTC for storage
  const convertToUTCString = (localDate: Date) => {
    return new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000).toISOString();
  };

  // Check if using publishing days from localStorage
  const savedUsePublishingDays = localStorage.getItem(`usePublishingDays_${novelId}`);
  const usePublishingDays = savedUsePublishingDays ? JSON.parse(savedUsePublishingDays) : false;

  if (usePublishingDays) {
    const savedDays = localStorage.getItem(`publishingDays_${novelId}`);
    const publishingDays = savedDays ? JSON.parse(savedDays) : [];

    if (baseDate) {
      publishAt = getNextPublishingDate(new Date(baseDate), publishingDays);
    } else {
      // First, try to find the latest advanced chapter
      const { data: advancedChapters, error: advancedError } = await supabase
        .from('chapters')
        .select('publish_at, chapter_number')
        .eq('novel_id', novelId)
        .not('id', 'eq', chapterId)
        .gt('publish_at', now.toISOString())
        .order('publish_at', { ascending: false })
        .limit(1);

      if (advancedError) throw advancedError;

      if (advancedChapters && advancedChapters.length > 0) {
        // If we found an advanced chapter, use its publish date as base
        publishAt = getNextPublishingDate(new Date(advancedChapters[0].publish_at), publishingDays);
      } else {
        // If no advanced chapters exist, use current date
        publishAt = getNextPublishingDate(now, publishingDays);
      }
    }
  } else {
    // Use the original interval-based logic
    if (baseDate) {
      const localBaseDate = new Date(baseDate);
      // Ensure the time is set to 5 AM local time
      publishAt = adjustToTargetHour(localBaseDate);
      publishAt.setDate(publishAt.getDate() + novel.auto_release_interval);
    } else {
      // First, try to find the latest advanced chapter
      const { data: advancedChapters, error: advancedError } = await supabase
        .from('chapters')
        .select('publish_at, chapter_number')
        .eq('novel_id', novelId)
        .not('id', 'eq', chapterId)
        .gt('publish_at', now.toISOString())
        .order('publish_at', { ascending: false })
        .limit(1);

      if (advancedError) throw advancedError;

      if (advancedChapters && advancedChapters.length > 0) {
        // Convert UTC database time to local time
        const lastPublishDate = new Date(advancedChapters[0].publish_at);
        
        // Calculate next date while preserving 5 AM local time
        publishAt = new Date(lastPublishDate);
        publishAt.setDate(publishAt.getDate() + novel.auto_release_interval);
        publishAt = adjustToTargetHour(publishAt);
      } else {
        // If no advanced chapters exist, start from tomorrow at 5 AM local time
        publishAt = adjustToTargetHour(new Date(now.getTime() + 24 * 60 * 60 * 1000));
      }
    }
  }

  // Convert local 5 AM time to UTC for storage
  const publishAtISO = convertToUTCString(publishAt);

  // Update the chapter with the calculated publish date and price
  interface ChapterUpdateData {
    publish_at: string;
    coins?: number;
  }

  const updateData: ChapterUpdateData = {
    publish_at: publishAtISO
  };

  if (novel.fixed_price_enabled) {
    updateData.coins = novel.fixed_price_amount;
  }

  const { error: updateError } = await supabase
    .from('chapters')
    .update(updateData)
    .eq('id', chapterId);

  if (updateError) throw updateError;

  return publishAt;
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