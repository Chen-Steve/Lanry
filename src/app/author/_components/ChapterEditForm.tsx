'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'sonner';
import ChapterEditor from './ChapterEditor';
import ChapterPublishSettings from './ChapterPublishSettings';
import * as authorChapterService from '../_services/authorChapterService';
import { toLocalDatetimeValue } from '@/utils/dateUtils';
import { isChapterPublished } from '@/services/chapterService';

interface ChapterEditFormProps {
  novelId: string;
  chapterId?: string;
  userId: string;
  volumeId?: string;
  onCancel: () => void;
  onSave: () => void;
  autoReleaseEnabled?: boolean;
}

export default function ChapterEditForm({ 
  novelId,
  chapterId,
  userId,
  volumeId,
  onCancel,
  onSave,
  autoReleaseEnabled = false
}: ChapterEditFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);
  const [isExtraChapter, setIsExtraChapter] = useState(false);
  const [isAlreadyPublished, setIsAlreadyPublished] = useState(false);
  const [advancedDates, setAdvancedDates] = useState<{ date: Date; chapterNumber: number }[]>([]);
  const [currentChapterId, setCurrentChapterId] = useState<string | undefined>(chapterId);
  const [formData, setFormData] = useState({
    chapterNumber: '',
    partNumber: '',
    title: '',
    content: '',
    slug: '',
    publishAt: '',
    coins: '0',
    authorThoughts: '',
    ageRating: 'EVERYONE' as 'EVERYONE' | 'TEEN' | 'MATURE',
    volumeId: '',
  });
  const [isDraft, setIsDraft] = useState(false);

  const getDbChapterNumber = (isDraftSave: boolean) => {
    const num = parseInt(formData.chapterNumber);
    return isDraftSave ? -Math.abs(num) : Math.abs(num);
  };

  const handleScheduleSave = async () => {
    try {
      const chapterData = {
        chapter_number: getDbChapterNumber(isDraft),
        part_number: isExtraChapter ? -1 : (formData.partNumber ? parseInt(formData.partNumber) : null),
        publish_at: formData.publishAt || null,
        coins: parseInt(formData.coins) || 0,
        title: formData.title,
        content: formData.content,
        author_thoughts: formData.authorThoughts,
        age_rating: formData.ageRating,
      };

      if (currentChapterId) {
        await authorChapterService.updateChapter(currentChapterId, novelId, userId, chapterData);
        toast.success('Schedule settings saved');
      } else {
        const result = await authorChapterService.createChapter(novelId, userId, {
          ...chapterData,
          volume_id: volumeId
        });
        // If this is a new chapter, update the chapterId after creation
        // The result from createChapter is a chapterId string
        setCurrentChapterId(result);
        window.history.replaceState(null, '', `?chapterId=${result}`);
        toast.success('Chapter saved as draft with schedule settings');
      }
    } catch (error) {
      console.error('Error saving schedule settings:', error);
      toast.error('Failed to save schedule settings');
    }
  };

  const handleSaveDraft = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setIsDraft(true);
    try {
      const chapterData = {
        chapter_number: getDbChapterNumber(true),
        part_number: isExtraChapter ? -1 : (formData.partNumber ? parseInt(formData.partNumber) : null),
        title: formData.title,
        content: formData.content,
        publish_at: formData.publishAt || null,
        coins: parseInt(formData.coins) || 0,
        author_thoughts: formData.authorThoughts,
        age_rating: formData.ageRating,
      };
      if (currentChapterId) {
        await authorChapterService.updateChapter(currentChapterId, novelId, userId, chapterData);
      } else {
        const newChapterId = await authorChapterService.createChapter(novelId, userId, {
          ...chapterData,
          volume_id: volumeId
        });
        setCurrentChapterId(newChapterId);
      }
      toast.success('Draft saved successfully');
      onSave();
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('Failed to save draft');
    } finally {
      setIsSaving(false);
      setIsDraft(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    setIsSaving(true);
    setIsDraft(false);
    try {
      const chapterData = {
        chapter_number: getDbChapterNumber(false),
        part_number: isExtraChapter ? -1 : (formData.partNumber ? parseInt(formData.partNumber) : null),
        title: formData.title,
        content: formData.content,
        publish_at: formData.publishAt || null,
        coins: parseInt(formData.coins) || 0,
        author_thoughts: formData.authorThoughts,
        age_rating: formData.ageRating,
      };

      if (currentChapterId) {
        await authorChapterService.updateChapter(currentChapterId, novelId, userId, chapterData);
      } else {
        const newChapterId = await authorChapterService.createChapter(novelId, userId, {
          ...chapterData,
          volume_id: volumeId
        });
        setCurrentChapterId(newChapterId);
      }
      toast.success(currentChapterId ? 'Chapter updated successfully' : 'Chapter published successfully');
      onSave();
    } catch (error) {
      console.error('Error saving chapter:', error);
      if (error instanceof Error && error.message.includes('already exists')) {
        toast.error(error.message);
      } else {
        toast.error('Failed to save chapter');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const fetchChapterDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const chapters = await authorChapterService.fetchNovelChapters(novelId, userId, true);
      const chapter = chapters.find(ch => ch.id === currentChapterId);
      
      if (chapter) {
        setIsExtraChapter(chapter.part_number === -1);
        const published = await isChapterPublished(chapter.publish_at);
        setIsAlreadyPublished(published);
        setFormData({
          chapterNumber: Math.abs(chapter.chapter_number).toString(),
          partNumber: chapter.part_number === -1 ? '' : (chapter.part_number?.toString() || ''),
          title: chapter.title || '',
          content: chapter.content || '',
          slug: chapter.slug || '',
          publishAt: chapter.publish_at ? toLocalDatetimeValue(chapter.publish_at) : '',
          coins: chapter.coins?.toString() || '0',
          authorThoughts: chapter.author_thoughts || '',
          ageRating: chapter.age_rating || 'EVERYONE',
          volumeId: chapter.volume_id || '',
        });
      }
    } catch (error) {
      console.error('Error fetching chapter:', error);
      toast.error('Failed to load chapter');
    } finally {
      setIsLoading(false);
    }
  }, [novelId, userId, currentChapterId]);

  useEffect(() => {
    if (currentChapterId) {
      fetchChapterDetails();
    } else {
      setIsLoading(false);
      setFormData(prev => {
        if (prev.authorThoughts) return prev;
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('defaultAuthorThoughts');
          if (saved) {
            return { ...prev, authorThoughts: saved };
          }
        }
        return prev;
      });
    }
  }, [currentChapterId, fetchChapterDetails]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch all chapters to get advanced dates
        const allChapters = await authorChapterService.fetchNovelChapters(novelId, userId, true);
        const advancedChapterDates = allChapters
          .filter(chapter => {
            const publishDate = chapter.publish_at ? new Date(chapter.publish_at) : null;
            const now = new Date();
            return publishDate && publishDate > now && (chapter.coins || 0) > 0;
          })
          .map(chapter => ({
            date: new Date(chapter.publish_at!),
            chapterNumber: chapter.chapter_number
          }));
        
        setAdvancedDates(advancedChapterDates);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load chapter data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentChapterId, novelId, userId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Icon icon="mdi:loading" className="w-8 h-8 animate-spin text-primary/60" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col h-full">
      <div className="flex justify-between items-center bg-background py-2 sticky top-0 z-10 px-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="bg-muted text-foreground py-2 px-3 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-border inline-flex items-center gap-1"
            aria-label="Go back"
          >
            <Icon icon="mdi:arrow-left" className="w-4 h-4" />
            <span className="inline-flex items-center gap-1">Back</span>
          </button>
          <h3 className="text-lg font-semibold text-foreground">
            {currentChapterId ? 'Edit Chapter' : 'Add New Chapter'}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="bg-muted text-foreground py-2 px-3 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-border inline-flex items-center gap-2"
          >
            {isSaving && isDraft ? (
              <span className="inline-flex items-center gap-1">
                <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Icon icon="mdi:content-save-edit" className="w-4 h-4" />
                Save Draft
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary text-primary-foreground py-2 px-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
          >
            {isSaving && !isDraft ? (
              <span className="inline-flex items-center gap-1">
                <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                Saving...
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Icon icon="mdi:content-save" className="w-4 h-4" />
                {isAlreadyPublished ? 'Save' : 'Publish'}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-muted text-foreground py-2 px-3 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-border inline-flex items-center gap-1"
            aria-label="Close chapter editor"
          >
            <Icon icon="mdi:close" className="w-4 h-4" />
            <span className="inline-flex items-center gap-1">Close</span>
          </button>
        </div>
      </div>

      {autoReleaseEnabled && !currentChapterId && (
        <div className="px-4 py-2 bg-primary/10 border-b border-border">
          <div className="flex items-start gap-2">
            <Icon icon="mdi:information" className="text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm text-primary">
              Auto-release is enabled. This chapter will be scheduled based on your global release settings after saving.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-3 sticky z-10 bg-background px-4">
        <div className="w-24">
          <input
            id="chapterNumber"
            type="number"
            min="1"
            value={formData.chapterNumber}
            onChange={(e) => setFormData({ ...formData, chapterNumber: e.target.value })}
            className="w-full text-foreground py-2 px-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
            placeholder="Ch #"
            required
          />
        </div>

        {!isExtraChapter && (
          <div className="w-24">
            <input
              id="partNumber"
              type="number"
              min="1"
              value={formData.partNumber}
              onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
              className="w-full text-foreground py-2 px-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
              placeholder="Part #"
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsExtraChapter(!isExtraChapter)}
          className={`px-3 py-1.5 rounded-lg border border-border flex items-center gap-2 transition-colors ${
            isExtraChapter 
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 border-purple-300 dark:border-purple-700' 
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          }`}
          title={isExtraChapter ? "Convert to regular chapter" : "Convert to extra chapter"}
        >
          <Icon icon={isExtraChapter ? "material-symbols:star-rounded" : "material-symbols:star-outline-rounded"} className="w-4 h-4" />
          <span className="text-sm font-medium">Extra</span>
        </button>

        <input
          id="title"
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="flex-1 min-w-[200px] text-foreground py-2 px-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
          placeholder="Title (Optional)"
        />

        <select
          value={formData.ageRating}
          onChange={(e) => setFormData({ ...formData, ageRating: e.target.value as 'EVERYONE' | 'TEEN' | 'MATURE' })}
          className="px-3 py-2 rounded-lg border border-border text-foreground bg-background hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
          title="Age Rating"
        >
          <option value="EVERYONE">Everyone</option>
          <option value="TEEN">Teen</option>
          <option value="MATURE">Mature</option>
        </select>
        <button
          type="button"
          onClick={() => setShowSchedulePopup(true)}
          className="px-3 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center gap-2 whitespace-nowrap"
          title="Configure publishing settings"
        >
          <Icon icon="mdi:calendar-clock" className="w-4 h-4" />
          <span className="text-sm font-medium">
            {formData.publishAt ? (
              <span className="flex items-center gap-1">
                {new Date(formData.publishAt) > new Date() ? 'Scheduled:' : 'Published:'}{' '}
                {new Date(formData.publishAt).toLocaleDateString()}
              </span>
            ) : (
              'Schedule'
            )}
          </span>
        </button>
      </div>

      <div className={`${isExpanded ? 'fixed inset-0 z-50 bg-background overflow-hidden' : 'flex-1 overflow-y-auto px-4 pt-2'}`}>
        <div className={`${isExpanded ? 'h-full p-4 flex flex-col' : 'space-y-4'}`}>
          <div className={`relative ${isExpanded ? 'flex-1 flex flex-col overflow-hidden' : ''}`}>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="absolute right-2 top-2 p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors z-10"
              title={isExpanded ? "Exit fullscreen" : "Enter fullscreen"}
            >
              <Icon icon={isExpanded ? "mdi:fullscreen-exit" : "mdi:fullscreen"} className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <ChapterEditor
              value={formData.content}
              onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
              authorThoughts={formData.authorThoughts}
              onAuthorThoughtsChange={(thoughts) => setFormData(prev => ({ ...prev, authorThoughts: thoughts }))}
              className={isExpanded ? 'flex-1 overflow-hidden' : ''}
              userId={userId}
            />
          </div>

          {!isExpanded && (
            <ChapterPublishSettings
              key={currentChapterId || 'new-chapter'}
              publishAt={formData.publishAt}
              coins={formData.coins}
              onSettingsChange={(settings) => setFormData(prev => ({ ...prev, ...settings }))}
              showSchedulePopup={showSchedulePopup}
              onCloseSchedulePopup={() => setShowSchedulePopup(false)}
              onSave={handleScheduleSave}
              isSaving={isSaving}
              autoReleaseEnabled={autoReleaseEnabled}
              advancedDates={advancedDates}
            />
          )}
        </div>
      </div>
    </form>
  );
} 