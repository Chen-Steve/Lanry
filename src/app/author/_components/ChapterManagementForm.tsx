'use client';

import { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';
import { Novel, Chapter, ChapterFormData } from '@/types/novel';
import * as authorChapterService from '../_services/authorChapterService';
import ChapterEditor from './ChapterEditor';
import ChapterPublishSettings from './ChapterPublishSettings';
import ChapterList from './ChapterList';
import { Icon } from '@iconify/react';

interface ChapterManagementFormProps {
  authorOnly?: boolean;
}

export default function ChapterManagementForm({ authorOnly = false }: ChapterManagementFormProps) {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [selectedNovel, setSelectedNovel] = useState<string>('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isChapterListVisible, setIsChapterListVisible] = useState(false);
  const [formData, setFormData] = useState<ChapterFormData>({
    chapterNumber: '',
    title: '',
    content: '',
    slug: '',
    publishAt: '',
    coins: '0',
  });
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);

  useEffect(() => {
    fetchNovels();
  }, []);

  useEffect(() => {
    if (selectedNovel) {
      fetchChapters(selectedNovel);
    }
  }, [selectedNovel]);

  const fetchNovels = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const data = await authorChapterService.fetchAuthorNovels(session.user.id, authorOnly);
      setNovels(data || []);
    } catch (error) {
      console.error('Error fetching novels:', error);
    }
  };

  const fetchChapters = async (novelId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const data = await authorChapterService.fetchNovelChapters(novelId, session.user.id, authorOnly);
      setChapters(data || []);
    } catch (error) {
      console.error('Error fetching chapters:', error);
      setChapters([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNovel) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const chapterData = {
        chapter_number: parseInt(formData.chapterNumber),
        title: formData.title,
        content: formData.content,
        publish_at: formData.publishAt ? new Date(formData.publishAt).toISOString() : null,
        coins: parseInt(formData.coins) || 0,
      };

      if (editingChapter) {
        await authorChapterService.updateChapter(
          editingChapter.id,
          selectedNovel,
          session.user.id,
          chapterData
        );
      } else {
        await authorChapterService.createChapter(
          selectedNovel,
          session.user.id,
          chapterData
        );
      }

      setFormData({
        chapterNumber: '',
        title: '',
        content: '',
        slug: '',
        publishAt: '',
        coins: '0',
      });
      setEditingChapter(null);
      fetchChapters(selectedNovel);
      alert(`Chapter ${editingChapter ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleChapterClick = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setFormData({
      chapterNumber: chapter.chapter_number.toString(),
      title: chapter.title,
      content: chapter.content,
      slug: chapter.slug,
      publishAt: chapter.publish_at ? new Date(chapter.publish_at).toISOString().slice(0, 16) : '',
      coins: chapter.coins?.toString() || '0',
    });
  };

  const handleCancelEdit = () => {
    setEditingChapter(null);
    setFormData({
      chapterNumber: '',
      title: '',
      content: '',
      slug: '',
      publishAt: '',
      coins: '0',
    });
  };

  const handleDeleteChapter = async (chapterId: string) => {
    if (!selectedNovel || !window.confirm('Are you sure you want to delete this chapter? This action cannot be undone.')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      await authorChapterService.deleteChapter(chapterId, selectedNovel, session.user.id);

      if (editingChapter?.id === chapterId) {
        handleCancelEdit();
      }
      
      fetchChapters(selectedNovel);
      alert('Chapter deleted successfully!');
    } catch (error) {
      console.error('Error deleting chapter:', error);
      alert(error instanceof Error ? error.message : 'An error occurred while deleting the chapter');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4">
      <div className="mb-4 sm:mb-6">
        <select
          title="Select a novel"
          value={selectedNovel}
          onChange={(e) => setSelectedNovel(e.target.value)}
          className="w-full p-2 sm:p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
        >
          <option value="" className="text-black">Select a novel...</option>
          {novels.map((novel) => (
            <option key={novel.id} value={novel.id} className="text-black">
              {novel.title}
            </option>
          ))}
        </select>
      </div>

      {selectedNovel && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          <button
            onClick={() => setIsChapterListVisible(!isChapterListVisible)}
            className="lg:hidden flex items-center gap-2 mb-2 px-3 py-2 text-black bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            <Icon 
              icon={isChapterListVisible ? "mdi:chevron-up" : "mdi:chevron-down"} 
              className="w-5 h-5" 
            />
            {isChapterListVisible ? "Hide Chapters" : "Show Chapters"}
          </button>

          <div className={`lg:col-span-1 ${isChapterListVisible ? 'block' : 'hidden'} lg:block`}>
            <ChapterList
              chapters={chapters}
              editingChapterId={editingChapter?.id || null}
              onChapterClick={handleChapterClick}
              onDeleteChapter={handleDeleteChapter}
            />
          </div>

          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <h3 className="text-lg font-semibold mb-2 sm:mb-4">
                {editingChapter ? 'Edit Chapter' : 'Add New Chapter'}
              </h3>

              <div className="flex gap-2 sm:gap-4">
                <div className="w-1/3">
                  <input
                    type="number"
                    placeholder="Ch. #"
                    value={formData.chapterNumber}
                    onChange={(e) => setFormData({ ...formData, chapterNumber: e.target.value })}
                    className="w-full p-2 sm:p-3 border rounded-lg"
                    required
                  />
                </div>

                <div className="w-2/3">
                  <input
                    type="text"
                    placeholder="Title (Optional)"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2 sm:p-3 border rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <ChapterEditor
                  value={formData.content}
                  onChange={(value) => setFormData(prev => ({ ...prev, content: value }))}
                />
              </div>

              <ChapterPublishSettings
                publishAt={formData.publishAt}
                coins={formData.coins}
                onSettingsChange={(settings) => setFormData(prev => ({ ...prev, ...settings }))}
              />

              <div className="flex gap-2 sm:gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-blue-600"
                >
                  {editingChapter ? 'Update Chapter' : 'Add Chapter'}
                </button>
                {editingChapter && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-gray-200"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 