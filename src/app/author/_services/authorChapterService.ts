import supabase from '@/lib/supabaseClient';
import { generateChapterSlug, generateUUID } from '@/lib/utils';
import { notificationService } from '@/services/notificationService';
import { PostgrestError } from '@supabase/supabase-js';

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

  // Check if we should send notifications
  const { shouldNotify, chapterData: notificationData } = await shouldNotifyForChapter(chapterId);
  if (shouldNotify && notificationData) {
    await sendChapterNotifications(notificationData);
  }
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
    if (chapterData.part_number) {
      const duplicatePart = existingChapters.some(ch => ch.part_number === chapterData.part_number);
      if (duplicatePart) {
        throw new Error(`Chapter ${chapterData.chapter_number} Part ${chapterData.part_number} already exists`);
      }
    } else if (!chapterData.part_number && existingChapters.some(ch => !ch.part_number)) {
      throw new Error(`Chapter ${chapterData.chapter_number} already exists`);
    }
  }

  // Get novel settings for fixed pricing and auto-release
  const { data: novel, error: novelError } = await supabase
    .from('novels')
    .select('fixed_price_enabled, fixed_price_amount, auto_release_enabled, auto_release_interval')
    .eq('id', novelId)
    .single();

  if (novelError) throw novelError;

  const chapterId = generateUUID();
  
  // Determine coins:
  // 1. If fixed price is enabled and no specific coins set, use fixed price
  // 2. If specific coins provided in chapterData, use that
  // 3. If both disabled and no specific coins set, default to 0 (free)
  const finalCoins = novel.fixed_price_enabled && chapterData.coins === undefined 
    ? novel.fixed_price_amount 
    : chapterData.coins ?? 0; // Default to 0 if not specified

  // Determine publish date:
  // 1. If specific publish_at provided in chapterData, use that
  // 2. If auto-release enabled and no specific date set, set to null for auto-release handling
  // 3. If both disabled and no specific date set, set to current time (immediate release)
  let publishAt: string | null;
  if (chapterData.publish_at !== undefined && chapterData.publish_at !== null) {
    // Use specifically set publish date
    publishAt = chapterData.publish_at;
  } else if (novel.auto_release_enabled) {
    // For auto-release, we need to set this to null initially so the schedule can be applied later
    publishAt = null;
  } else {
    // Default to immediate release in local time
    const now = new Date();
    publishAt = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString();
  }

  // Determine if we should apply auto-release
  // Changed condition: we should apply auto-release if auto_release is enabled and the user hasn't
  // manually set a specific publish date (regardless of coin value at this point)
  const shouldApplyAutoRelease = novel.auto_release_enabled && !chapterData.publish_at;
  
  // Prepare chapter data without publish_at and coins to prevent overriding
  const cleanChapterData = {
    chapter_number: chapterData.chapter_number,
    part_number: chapterData.part_number,
    title: chapterData.title,
    content: chapterData.content,
    author_thoughts: chapterData.author_thoughts,
    age_rating: chapterData.age_rating,
    volume_id: chapterData.volume_id,
  };
  
  const { error } = await supabase
    .from('chapters')
    .insert({
      id: chapterId,
      novel_id: novelId,
      ...cleanChapterData,
      coins: finalCoins,
      publish_at: publishAt,
      slug: generateChapterSlug(chapterData.chapter_number, chapterData.part_number),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (error) throw error;

  // Check if we should send notifications
  const { shouldNotify, chapterData: notificationData } = await shouldNotifyForChapter(chapterId);
  if (shouldNotify && notificationData) {
    await sendChapterNotifications(notificationData);
  }

  // Only apply auto-release schedule if conditions are met
  if (shouldApplyAutoRelease) {
    await applyAutoReleaseSchedule(novelId, userId, chapterId);
  }

  return chapterId;
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

  let publishAt: Date = new Date(); // Initialize with current date as fallback
  const now = new Date();
  
  // Get the default release hour for this novel from localStorage (e.g., '13:00' for 1:00 PM)
  let defaultReleaseHour = 5;
  if (typeof window !== 'undefined') {
    const hourStr = localStorage.getItem(`defaultReleaseHour_${novelId}`) || '05:00';
    const parsed = parseInt(hourStr.split(':')[0], 10);
    if (!isNaN(parsed)) defaultReleaseHour = parsed;
  }

  // Function to check if a date is indefinitely locked (more than 50 years in the future)
  const isIndefinitelyLocked = (dateStr: string): boolean => {
    const publishDate = new Date(dateStr);
    const fiftyYearsFromNow = new Date();
    fiftyYearsFromNow.setFullYear(fiftyYearsFromNow.getFullYear() + 50);
    return publishDate > fiftyYearsFromNow;
  };

  // Function to adjust time to target hour (in local time)
  const adjustToTargetHour = (date: Date, targetHour: number = defaultReleaseHour) => {
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
  let shouldUsePublishingDays = savedUsePublishingDays ? JSON.parse(savedUsePublishingDays) : false;

  if (shouldUsePublishingDays) {
    const savedDays = localStorage.getItem(`publishingDays_${novelId}`);
    const publishingDays = savedDays ? JSON.parse(savedDays) : [];

    if (publishingDays.length === 0) {
      // If no publishing days are selected, fall back to interval-based scheduling
      shouldUsePublishingDays = false;
    } else {
      if (baseDate) {
        publishAt = getNextPublishingDate(new Date(baseDate), publishingDays);
      } else {
        // First check for advanced chapters - EXCLUDE indefinitely locked chapters
        const { data: advancedChapters, error: advancedError } = await supabase
          .from('chapters')
          .select('publish_at')
          .eq('novel_id', novelId)
          .not('id', 'eq', chapterId)
          .gt('publish_at', now.toISOString())
          .order('publish_at', { ascending: false });

        if (advancedError) throw advancedError;

        // Filter out indefinitely locked chapters
        const validAdvancedChapters = advancedChapters.filter(
          ch => ch.publish_at && !isIndefinitelyLocked(ch.publish_at)
        );

        if (validAdvancedChapters.length > 0) {
          // Base new date on the latest advanced chapter, but use publishing days
          const lastPublishDate = new Date(validAdvancedChapters[0].publish_at);
          publishAt = getNextPublishingDate(lastPublishDate, publishingDays);
        } else {
          // No advanced chapters, use current time and find next publishing day
          publishAt = getNextPublishingDate(now, publishingDays);
        }
        // Always adjust to target hour after finding the next publishing day
        publishAt = adjustToTargetHour(publishAt, defaultReleaseHour);
      }
    }
  }

  // Use interval-based scheduling if not using publishing days or if no publishing days were selected
  if (!shouldUsePublishingDays) {
    if (baseDate) {
      const localBaseDate = new Date(baseDate);
      // Ensure the time is set to 5 AM local time
      publishAt = adjustToTargetHour(localBaseDate, defaultReleaseHour);
      publishAt.setDate(publishAt.getDate() + novel.auto_release_interval);
    } else {
      // First check for advanced chapters - EXCLUDE indefinitely locked chapters
      const { data: advancedChapters, error: advancedError } = await supabase
        .from('chapters')
        .select('publish_at')
        .eq('novel_id', novelId)
        .not('id', 'eq', chapterId)
        .gt('publish_at', now.toISOString())
        .order('publish_at', { ascending: false });

      if (advancedError) throw advancedError;

      // Filter out indefinitely locked chapters
      const validAdvancedChapters = advancedChapters.filter(
        ch => ch.publish_at && !isIndefinitelyLocked(ch.publish_at)
      );

      if (validAdvancedChapters.length > 0) {
        // Base new date on the latest advanced chapter
        const lastPublishDate = new Date(validAdvancedChapters[0].publish_at);
        publishAt = new Date(lastPublishDate.getTime() + novel.auto_release_interval * 24 * 60 * 60 * 1000);
        publishAt = adjustToTargetHour(publishAt, defaultReleaseHour);
      } else {
        // No advanced chapters, use current time
        publishAt = new Date(now.getTime() + novel.auto_release_interval * 24 * 60 * 60 * 1000);
        publishAt = adjustToTargetHour(publishAt, defaultReleaseHour);
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

  // Check if we need to update coins
  // First get the current chapter to check its coin value
  const { data: chapter, error: chapterError } = await supabase
    .from('chapters')
    .select('coins')
    .eq('id', chapterId)
    .single();

  if (chapterError) throw chapterError;

  // Always apply fixed price if enabled
  if (novel.fixed_price_enabled) {
    updateData.coins = novel.fixed_price_amount;
  } 
  // If auto-release is enabled, ensure coins is at least 1
  else if (novel.auto_release_enabled && (!chapter.coins || chapter.coins < 1)) {
    // Get default coin value from localStorage or use 1 as fallback
    let defaultCoins = 1;
    if (typeof window !== 'undefined') {
      const savedCoins = localStorage.getItem('defaultChapterCoins');
      if (savedCoins) {
        const parsedCoins = parseInt(savedCoins);
        defaultCoins = !isNaN(parsedCoins) && parsedCoins > 0 ? parsedCoins : 1;
      }
    }
    updateData.coins = defaultCoins;
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

// Helper function to check if a chapter should trigger notifications
async function shouldNotifyForChapter(chapterId: string): Promise<{
  shouldNotify: boolean;
  chapterData?: {
    title: string;
    chapterNumber: number;
    partNumber: number | null;
    novelId: string;
    novelTitle: string;
    novelSlug: string;
    authorId: string;
    coins: number;
    publishAt: string | null;
  };
}> {
  type ChapterWithNovel = {
    title: string;
    chapter_number: number;
    part_number: number | null;
    novel_id: string;
    coins: number;
    publish_at: string | null;
    created_at: string;
    updated_at: string;
    novels: {
      title: string;
      author_profile_id: string;
      slug: string;
    };
  };

  console.log('Checking notifications for chapter:', chapterId);

  const { data: chapter, error: chapterError } = await supabase
    .from('chapters')
    .select(`
      title,
      chapter_number,
      part_number,
      novel_id,
      coins,
      publish_at,
      created_at,
      updated_at,
      novels:novels!inner (
        title,
        author_profile_id,
        slug
      )
    `)
    .eq('id', chapterId)
    .single() as { data: ChapterWithNovel | null; error: PostgrestError | null };

  if (chapterError || !chapter) {
    console.error('Error fetching chapter for notification check:', chapterError);
    return { shouldNotify: false };
  }

  // Get current time in UTC
  const now = new Date();
  const createdAt = new Date(chapter.created_at);
  const publishAt = chapter.publish_at ? new Date(chapter.publish_at) : null;

  // Convert all times to UTC timestamps for comparison
  const nowUTCTimestamp = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  );

  const createdAtUTCTimestamp = Date.UTC(
    createdAt.getUTCFullYear(),
    createdAt.getUTCMonth(),
    createdAt.getUTCDate(),
    createdAt.getUTCHours(),
    createdAt.getUTCMinutes(),
    createdAt.getUTCSeconds()
  );

  const publishAtUTCTimestamp = publishAt ? Date.UTC(
    publishAt.getUTCFullYear(),
    publishAt.getUTCMonth(),
    publishAt.getUTCDate(),
    publishAt.getUTCHours(),
    publishAt.getUTCMinutes(),
    publishAt.getUTCSeconds()
  ) : null;

  // Log detailed timezone information
  console.log('Detailed time information:', {
    currentTime: {
      local: now.toLocaleString(),
      utc: now.toUTCString(),
      iso: now.toISOString(),
      timestamp: nowUTCTimestamp,
      timezoneOffset: now.getTimezoneOffset()
    },
    createdAt: {
      original: chapter.created_at,
      parsed: createdAt.toISOString(),
      utc: createdAt.toUTCString(),
      timestamp: createdAtUTCTimestamp
    },
    publishAt: publishAt ? {
      original: chapter.publish_at,
      parsed: publishAt.toISOString(),
      utc: publishAt.toUTCString(),
      timestamp: publishAtUTCTimestamp
    } : null
  });

  // Check conditions using UTC timestamps
  const isNewlyCreated = nowUTCTimestamp - createdAtUTCTimestamp <= 60 * 1000;
  const isPublishedAndFree = (!publishAtUTCTimestamp || publishAtUTCTimestamp <= nowUTCTimestamp) && chapter.coins === 0;

  console.log('Notification check results:', {
    isNewlyCreated,
    isPublishedAndFree,
    timeSinceCreation: nowUTCTimestamp - createdAtUTCTimestamp,
    coins: chapter.coins
  });

  if (isNewlyCreated || isPublishedAndFree) {
    const reason = isNewlyCreated ? 'newly created chapter' : 'published and free chapter';
    console.log(`Will send notification for chapter - ${reason}`);
    return {
      shouldNotify: true,
      chapterData: {
        title: chapter.title,
        chapterNumber: chapter.chapter_number,
        partNumber: chapter.part_number,
        novelId: chapter.novel_id,
        novelTitle: chapter.novels.title,
        novelSlug: chapter.novels.slug,
        authorId: chapter.novels.author_profile_id,
        coins: chapter.coins,
        publishAt: chapter.publish_at
      }
    };
  }

  console.log('Will NOT send notification for chapter - not newly created and not published/free');
  return { shouldNotify: false };
}

// Helper function to send notifications for a published chapter
async function sendChapterNotifications(chapterData: {
  title: string;
  chapterNumber: number;
  partNumber: number | null;
  novelId: string;
  novelTitle: string;
  novelSlug: string;
  authorId: string;
  coins: number;
  publishAt: string | null;
}) {
  try {
    await notificationService.sendChapterReleaseNotifications({
      novelId: chapterData.novelId,
      chapterNumber: chapterData.chapterNumber,
      partNumber: chapterData.partNumber,
      chapterTitle: chapterData.title,
      novelTitle: chapterData.novelTitle,
      novelSlug: chapterData.novelSlug,
      authorId: chapterData.authorId,
      coins: chapterData.coins,
      publishAt: chapterData.publishAt ? new Date(chapterData.publishAt) : null
    });
  } catch (error) {
    console.error('Error sending chapter notifications:', error);
    // Don't throw error to prevent blocking chapter creation
  }
} 