'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { toast } from 'react-hot-toast';
import ChapterEditor from './ChapterEditor';
import ChapterPublishSettings from './ChapterPublishSettings';
import * as authorChapterService from '../_services/authorChapterService';

interface ChapterEditFormProps {
  novelId: string;
  chapterId?: string;
  userId: string;
  volumeId?: string;
  onCancel: () => void;
  onSave: () => void;
  autoScheduleEnabled?: boolean;
  autoScheduleInterval: number;
  autoScheduleTime?: string;
  autoScheduleStartDate?: string;
}

export default function ChapterEditForm({ 
  novelId,
  chapterId,
  userId,
  volumeId,
  onCancel,
  onSave,
  autoScheduleEnabled = false,
  autoScheduleInterval,
  autoScheduleTime = '12:00',
  autoScheduleStartDate = ''
}: ChapterEditFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSchedulePopup, setShowSchedulePopup] = useState(false);
  const [formData, setFormData] = useState({
    chapterNumber: '',
    partNumber: '',
    title: '',
    content: '',
    slug: '',
    publishAt: '',
    coins: '0',
    authorThoughts: '',
  });
  const [autoSchedule, setAutoSchedule] = useState({
    enabled: autoScheduleEnabled,
    interval: autoScheduleInterval,
    scheduleTime: autoScheduleTime,
    startDate: autoScheduleStartDate,
    isOverridden: false
  });

  useEffect(() => {
    if (chapterId) {
      fetchChapterDetails();
    } else {
      setIsLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    if (!autoSchedule.isOverridden) {
      setAutoSchedule({
        enabled: autoScheduleEnabled,
        interval: autoScheduleInterval,
        scheduleTime: autoScheduleTime,
        startDate: autoScheduleStartDate,
        isOverridden: false
      });
    }
  }, [autoScheduleEnabled, autoScheduleInterval, autoScheduleTime, autoScheduleStartDate]);

  // Calculate next publish date based on auto-schedule settings
  useEffect(() => {
    if (autoSchedule.enabled && !chapterId) {
      const baseDate = autoSchedule.startDate ? new Date(autoSchedule.startDate) : new Date();
      const nextPublishDate = new Date(baseDate);
      nextPublishDate.setDate(baseDate.getDate() + autoSchedule.interval);
      const [hours, minutes] = autoSchedule.scheduleTime.split(':').map(Number);
      nextPublishDate.setHours(hours, minutes, 0, 0);
      
      setFormData(prev => ({
        ...prev,
        publishAt: nextPublishDate.toISOString().slice(0, 16)
      }));
    }
  }, [autoSchedule.enabled, autoSchedule.interval, autoSchedule.scheduleTime, autoSchedule.startDate]);

  const fetchChapterDetails = async () => {
    try {
      setIsLoading(true);
      const chapters = await authorChapterService.fetchNovelChapters(novelId, userId, true);
      const chapter = chapters.find(ch => ch.id === chapterId);
      
      if (chapter) {
        setFormData({
          chapterNumber: chapter.chapter_number.toString(),
          partNumber: chapter.part_number?.toString() || '',
          title: chapter.title || '',
          content: chapter.content || '',
          slug: chapter.slug || '',
          publishAt: chapter.publish_at ? new Date(chapter.publish_at).toISOString().slice(0, 16) : '',
          coins: chapter.coins?.toString() || '0',
          authorThoughts: chapter.author_thoughts || '',
        });
        
        // Keep auto-schedule enabled if it was auto-scheduled
        setAutoSchedule(prev => ({
          ...prev,
          enabled: autoScheduleEnabled,
          isOverridden: false
        }));
      }
    } catch (error) {
      console.error('Error fetching chapter:', error);
      toast.error('Failed to load chapter');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (chapterId) {
        await authorChapterService.updateChapter(chapterId, novelId, userId, {
          chapter_number: parseInt(formData.chapterNumber),
          part_number: formData.partNumber ? parseInt(formData.partNumber) : null,
          title: formData.title,
          content: formData.content,
          publish_at: formData.publishAt || null,
          coins: parseInt(formData.coins),
          author_thoughts: formData.authorThoughts
        });
      } else {
        await authorChapterService.createChapter(novelId, userId, {
          chapter_number: parseInt(formData.chapterNumber),
          part_number: formData.partNumber ? parseInt(formData.partNumber) : null,
          title: formData.title,
          content: formData.content,
          publish_at: formData.publishAt || null,
          coins: parseInt(formData.coins),
          author_thoughts: formData.authorThoughts,
          volumeId: volumeId
        });
      }
      toast.success(chapterId ? 'Chapter updated successfully' : 'Chapter created successfully');
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

  const handleScheduleOverride = () => {
    setAutoSchedule(prev => {
      const newEnabled = !prev.enabled;
      if (newEnabled) {
        // If enabling auto-schedule, calculate next publish date
        const nextPublishDate = new Date();
        nextPublishDate.setDate(nextPublishDate.getDate() + prev.interval);
        const [hours, minutes] = prev.scheduleTime.split(':').map(Number);
        nextPublishDate.setHours(hours, minutes, 0, 0);
        setFormData(prevForm => ({
          ...prevForm,
          publishAt: nextPublishDate.toISOString().slice(0, 16)
        }));
      }
      return {
        ...prev,
        enabled: newEnabled,
        isOverridden: true
      };
    });
  };

  const handleAutoScheduleChange = (settings: {
    enabled: boolean;
    interval: number;
    scheduleTime: string;
    startDate: string;
  }) => {
    setAutoSchedule({
      interval: settings.interval,
      enabled: settings.enabled,
      scheduleTime: settings.scheduleTime,
      startDate: settings.startDate,
      isOverridden: true
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Icon icon="mdi:loading" className="w-8 h-8 animate-spin text-primary/60" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col h-full">
      <div className="flex justify-between items-center bg-background py-2 sticky top-0 z-10 px-4 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">
          {chapterId ? 'Edit Chapter' : 'Add New Chapter'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Close"
          aria-label="Close chapter editor"
        >
          <Icon icon="mdi:close" className="w-6 h-6" />
        </button>
      </div>

      <div className="flex gap-3 sticky z-10 bg-background py-2 px-4 border-b border-border">
        <div className="w-16">
          <input
            id="chapterNumber"
            type="number"
            min="1"
            value={formData.chapterNumber}
            onChange={(e) => setFormData({ ...formData, chapterNumber: e.target.value })}
            className="w-full text-foreground py-2 px-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="Ch #"
            required
          />
        </div>

        <div className="w-16">
          <input
            id="partNumber"
            type="number"
            min="1"
            value={formData.partNumber}
            onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
            className="w-full text-foreground py-2 px-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-muted-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="Part #"
          />
        </div>

        <div className="flex-1 flex gap-2 items-center">
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full text-foreground py-2 px-3 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary placeholder:text-muted-foreground"
            placeholder="Title (Optional)"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleScheduleOverride}
              className={`px-3 py-2 rounded-lg border transition-colors flex items-center gap-2 whitespace-nowrap ${
                autoSchedule.enabled
                  ? 'bg-primary/10 border-primary text-primary hover:bg-primary/20'
                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              title={autoSchedule.enabled 
                ? `Auto-scheduled every ${autoSchedule.interval} days at ${autoSchedule.scheduleTime}` 
                : formData.publishAt 
                  ? `Manual release at ${new Date(formData.publishAt).toLocaleString()}` 
                  : 'Set release date'}
            >
              <Icon icon={autoSchedule.enabled ? "mdi:calendar-check" : "mdi:calendar-clock"} className="w-4 h-4" />
              <span className="text-sm font-medium">
                {autoSchedule.enabled ? 'Auto-scheduled' : 'Manual Release'}
              </span>
            </button>
            {!autoSchedule.enabled && (
              <>
                <input
                  type="datetime-local"
                  value={formData.publishAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, publishAt: e.target.value }))}
                  className="w-44 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary px-3 py-2"
                  placeholder="Select release date"
                />
                <div className="flex items-center gap-2 ml-2">
                  <div className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg bg-background">
                    <Icon icon="mdi:coins" className="w-4 h-4 text-yellow-500" />
                    <input
                      type="number"
                      min="0"
                      value={formData.coins}
                      onChange={(e) => setFormData(prev => ({ ...prev, coins: e.target.value }))}
                      className="w-16 bg-transparent focus:outline-none text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="Coins"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={`${isExpanded ? 'fixed inset-0 z-50 bg-background overflow-hidden' : 'flex-1 overflow-y-auto px-4 py-4'}`}>
        <div className={`${isExpanded ? 'h-full p-4 flex flex-col' : 'space-y-4'}`}>
          <div className={`relative ${isExpanded ? 'flex-1 flex flex-col' : ''}`}>
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="absolute right-2 top-2 p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
              title={isExpanded ? "Exit fullscreen" : "Enter fullscreen"}
            >
              <Icon icon={isExpanded ? "mdi:fullscreen-exit" : "mdi:fullscreen"} className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            <ChapterEditor
              value={formData.content}
              onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
              authorThoughts={formData.authorThoughts}
              onAuthorThoughtsChange={(thoughts) => setFormData(prev => ({ ...prev, authorThoughts: thoughts }))}
              className={isExpanded ? 'flex-1' : ''}
            />
          </div>

          {!isExpanded && (
            <ChapterPublishSettings
              publishAt={formData.publishAt}
              coins={formData.coins}
              onSettingsChange={(settings) => setFormData(prev => ({ ...prev, ...settings }))}
              autoScheduleInterval={autoSchedule.interval}
              useAutoSchedule={autoSchedule.enabled}
              autoScheduleTime={autoSchedule.scheduleTime}
              autoScheduleStartDate={autoSchedule.startDate}
              onAutoScheduleChange={handleAutoScheduleChange}
              isNewChapter={!chapterId}
              showSchedulePopup={showSchedulePopup}
              onCloseSchedulePopup={() => setShowSchedulePopup(false)}
            />
          )}
        </div>
      </div>

      {!isExpanded && (
        <div className="flex gap-4 bg-background py-2 px-4 sticky bottom-0 z-10 border-t border-border">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-primary text-primary-foreground py-3 px-4 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? (
              <span className="inline-flex items-center gap-2">
                <Icon icon="mdi:loading" className="w-5 h-5 animate-spin" />
                Saving...
              </span>
            ) : (
              chapterId ? 'Update Chapter' : 'Create Chapter'
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-accent text-accent-foreground py-3 px-4 rounded-lg hover:bg-accent/80 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </form>
  );
} 