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
  onCancel: () => void;
  onSave: () => void;
}

export default function ChapterEditForm({ 
  novelId,
  chapterId,
  userId,
  onCancel,
  onSave
}: ChapterEditFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

  useEffect(() => {
    if (chapterId) {
      fetchChapterDetails();
    } else {
      setIsLoading(false);
    }
  }, [chapterId]);

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
      }
    } catch (error) {
      console.error('Error fetching chapter:', error);
      toast.error('Failed to load chapter');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent form submission
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
          author_thoughts: formData.authorThoughts
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Icon icon="mdi:loading" className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col h-full">
      <div className="flex justify-between items-center bg-white py-2 sticky top-0 z-10 px-4">
        <h3 className="text-lg font-semibold">
          {chapterId ? 'Edit Chapter' : 'Add New Chapter'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
          title="Close"
          aria-label="Close chapter editor"
        >
          <Icon icon="mdi:close" className="w-6 h-6" />
        </button>
      </div>

      <div className="flex gap-3 sticky z-10 bg-white py-2 px-4 border-b">
        <div className="w-24">
          <input
            id="chapterNumber"
            type="number"
            min="1"
            value={formData.chapterNumber}
            onChange={(e) => setFormData({ ...formData, chapterNumber: e.target.value })}
            className="w-full text-black py-2 px-3 border rounded-lg"
            placeholder="Ch #"
            required
          />
        </div>

        <div className="w-28">
          <input
            id="partNumber"
            type="number"
            min="1"
            value={formData.partNumber}
            onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
            className="w-full text-black py-2 px-3 border rounded-lg"
            placeholder="Part #"
          />
        </div>

        <div className="flex-1">
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full py-2 px-3 border rounded-lg"
            placeholder="Title (Optional)"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-4">
          <ChapterEditor
            value={formData.content}
            onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
            authorThoughts={formData.authorThoughts}
            onAuthorThoughtsChange={(thoughts) => setFormData(prev => ({ ...prev, authorThoughts: thoughts }))}
          />

          <ChapterPublishSettings
            publishAt={formData.publishAt}
            coins={formData.coins}
            onSettingsChange={(settings) => setFormData(prev => ({ ...prev, ...settings }))}
          />
        </div>
      </div>

      <div className="flex gap-4 bg-white py-2 px-4 sticky bottom-0 z-10 border-t">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200"
        >
          Cancel
        </button>
      </div>
    </form>
  );
} 