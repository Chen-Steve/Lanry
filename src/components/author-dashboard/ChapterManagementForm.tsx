'use client';

import { useState, useEffect } from 'react';
import supabase from '@/lib/supabaseClient';
import { generateChapterSlug } from '@/lib/utils';

interface ChapterManagementFormProps {
  authorOnly?: boolean;
}

interface Novel {
  id: string;
  title: string;
  author_profile_id?: string;
}

interface Chapter {
  id: string;
  chapter_number: number;
  title: string;
  content: string;
  novel_id: string;
  slug: string;
  publish_at?: string;
  created_at: string;
  updated_at: string;
}

export default function ChapterManagementForm({ authorOnly = false }: ChapterManagementFormProps) {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [selectedNovel, setSelectedNovel] = useState<string>('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [formData, setFormData] = useState({
    chapterNumber: '',
    title: '',
    content: '',
    slug: '',
    publishAt: '',
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

      let query = supabase
        .from('novels')
        .select('id, title, author_profile_id')
        .order('created_at', { ascending: false });

      if (authorOnly) {
        query = query.eq('author_profile_id', session.user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setNovels(data || []);
    } catch (error) {
      console.error('Error fetching novels:', error);
    }
  };

  const fetchChapters = async (novelId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      if (authorOnly) {
        const { data: novel } = await supabase
          .from('novels')
          .select('author_profile_id')
          .eq('id', novelId)
          .single();

        if (novel?.author_profile_id !== session.user.id) {
          throw new Error('Not authorized to view these chapters');
        }
      }

      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .eq('novel_id', novelId)
        .order('chapter_number', { ascending: true });

      if (error) throw error;
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

      if (authorOnly) {
        const { data: novel } = await supabase
          .from('novels')
          .select('author_profile_id')
          .eq('id', selectedNovel)
          .single();

        if (novel?.author_profile_id !== session.user.id) {
          throw new Error('Not authorized to modify chapters for this novel');
        }
      }

      const slug = generateChapterSlug(parseInt(formData.chapterNumber));

      if (editingChapter) {
        const { error } = await supabase
          .from('chapters')
          .update({
            chapter_number: parseInt(formData.chapterNumber),
            title: formData.title,
            content: formData.content,
            slug,
            publish_at: formData.publishAt ? new Date(formData.publishAt).toISOString() : null,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingChapter.id)
          .eq('novel_id', selectedNovel);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('chapters')
          .insert({
            novel_id: selectedNovel,
            chapter_number: parseInt(formData.chapterNumber),
            title: formData.title,
            content: formData.content,
            slug,
            publish_at: formData.publishAt ? new Date(formData.publishAt).toISOString() : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      setFormData({
        chapterNumber: '',
        title: '',
        content: '',
        slug: '',
        publishAt: '',
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
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Novel</label>
        <select
          aria-label="Select Novel"
          value={selectedNovel}
          onChange={(e) => setSelectedNovel(e.target.value)}
          className="w-full p-3 border rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Select a novel...</option>
          {novels.map((novel) => (
            <option key={novel.id} value={novel.id}>
              {novel.title}
            </option>
          ))}
        </select>
      </div>

      {selectedNovel && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Chapters</h3>
            <div className="space-y-2">
              {chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  onClick={() => handleChapterClick(chapter)}
                  className={`p-4 border rounded cursor-pointer ${
                    editingChapter?.id === chapter.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <h4 className="font-medium">
                    Chapter {chapter.chapter_number}
                    {chapter.title && `: ${chapter.title}`}
                  </h4>
                  {chapter.publish_at && (
                    <p className="text-sm text-gray-500">
                      Publishes: {new Date(chapter.publish_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingChapter ? 'Edit Chapter' : 'Add New Chapter'}
              </h3>

              <div>
                <label className="block text-sm font-medium mb-2">Chapter Number</label>
                <input
                  aria-label="Chapter Number"
                  type="number"
                  value={formData.chapterNumber}
                  onChange={(e) => setFormData({ ...formData, chapterNumber: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Title (Optional)</label>
                <input
                  aria-label="Title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <textarea
                  aria-label="Content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full p-3 border rounded-lg min-h-[300px]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Schedule Publication (Optional)
                </label>
                <input
                  aria-label="Schedule Publication"
                    type="datetime-local"
                  value={formData.publishAt}
                  onChange={(e) => setFormData({ ...formData, publishAt: e.target.value })}
                  className="w-full p-3 border rounded-lg"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600"
                >
                  {editingChapter ? 'Update Chapter' : 'Add Chapter'}
                </button>
                {editingChapter && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200"
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