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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      const chapterData = {
        chapter_number: parseInt(formData.chapterNumber),
        part_number: formData.partNumber ? parseInt(formData.partNumber) : null,
        title: formData.title,
        content: formData.content,
        publish_at: formData.publishAt ? new Date(formData.publishAt).toISOString() : null,
        coins: parseInt(formData.coins),
        author_thoughts: formData.authorThoughts,
      };

      if (chapterId) {
        await authorChapterService.updateChapter(chapterId, novelId, userId, chapterData);
        toast.success('Chapter updated successfully');
      } else {
        await authorChapterService.createChapter(novelId, userId, {
          ...chapterData,
          volumeId: undefined
        });
        toast.success('Chapter created successfully');
      }
      onSave();
    } catch (error) {
      console.error('Error saving chapter:', error);
      toast.error('Failed to save chapter');
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex justify-between items-center mb-4">
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

      <div className="flex gap-4">
        <div className="w-1/4">
          <label htmlFor="chapterNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Chapter Number
          </label>
          <input
            id="chapterNumber"
            type="number"
            min="1"
            value={formData.chapterNumber}
            onChange={(e) => setFormData({ ...formData, chapterNumber: e.target.value })}
            className="w-full text-black p-3 border rounded-lg"
            required
          />
        </div>

        <div className="w-1/4">
          <label htmlFor="partNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Part Number (Optional)
          </label>
          <input
            id="partNumber"
            type="number"
            min="1"
            value={formData.partNumber}
            onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
            className="w-full text-black p-3 border rounded-lg"
          />
        </div>

        <div className="w-2/4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title (Optional)
          </label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full p-3 border rounded-lg"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Chapter Content
        </label>
        <ChapterEditor
          value={formData.content}
          onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
          authorThoughts={formData.authorThoughts}
          onAuthorThoughtsChange={(thoughts) => setFormData(prev => ({ ...prev, authorThoughts: thoughts }))}
        />
      </div>

      <ChapterPublishSettings
        publishAt={formData.publishAt}
        coins={formData.coins}
        onSettingsChange={(settings) => setFormData(prev => ({ ...prev, ...settings }))}
      />

      <div className="flex gap-4">
        <button
          type="submit"
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