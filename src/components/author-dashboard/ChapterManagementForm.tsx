'use client';

import { useState, useEffect, useRef } from 'react';
import supabase from '@/lib/supabaseClient';
import { generateChapterSlug } from '@/lib/utils';
import { handleKeyDown, saveCaretPosition, restoreCaretPosition } from '@/lib/textEditor';

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
  coins?: number;
  created_at: string;
  updated_at: string;
}

const isAdvancedChapter = (chapter: Chapter): boolean => {
  const now = new Date();
  const publishDate = chapter.publish_at ? new Date(chapter.publish_at) : null;
  
  return (publishDate !== null && publishDate > now) && 
         (chapter.coins !== undefined && chapter.coins > 0);
};

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
    coins: '0',
  });
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = formData.content || '';
    }
  }, [formData.content]);

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
            coins: parseInt(formData.coins) || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingChapter.id)
          .eq('novel_id', selectedNovel);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('chapters')
          .insert({
            id: crypto.randomUUID(),
            novel_id: selectedNovel,
            chapter_number: parseInt(formData.chapterNumber),
            title: formData.title,
            content: formData.content,
            slug,
            coins: parseInt(formData.coins) || 0,
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

  const handleEditorChange = (e: React.FormEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const position = saveCaretPosition(element);
    const content = element.innerHTML;
    
    setFormData(prev => ({ ...prev, content }));
    
    requestAnimationFrame(() => {
      restoreCaretPosition(element, position);
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

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="mb-6">
        <select
          title="Select a novel"
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
            <div className="space-y-2 h-[calc(100vh-250px)] overflow-y-auto pr-2">
              {chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  onClick={() => handleChapterClick(chapter)}
                  className={`p-4 border rounded cursor-pointer relative ${
                    editingChapter?.id === chapter.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                  }`}
                >
                  {isAdvancedChapter(chapter) && (
                    <span className="absolute top-2 right-2 text-xs font-semibold px-2 py-1 bg-purple-100 text-purple-700 rounded">
                      Advanced
                    </span>
                  )}
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

              <div className="flex gap-4">
                <div className="w-1/3">
                  <input
                    type="number"
                    placeholder="Chapter Number"
                    value={formData.chapterNumber}
                    onChange={(e) => setFormData({ ...formData, chapterNumber: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                    required
                  />
                </div>

                <div className="w-2/3">
                  <input
                    type="text"
                    placeholder="Title (Optional)"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onKeyDown={handleKeyDown}
                  onInput={handleEditorChange}
                  className="w-full p-3 border rounded-lg min-h-[300px] focus:outline-none focus:ring-2 focus:ring-blue-500 empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400"
                  data-placeholder="Content"
                  dangerouslySetInnerHTML={{ __html: formData.content }}
                />
                <p className="text-sm text-gray-600">
                  Use Ctrl+B for bold, Ctrl+I for italic, Ctrl+U for underline
                </p>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="datetime-local"
                    placeholder="Schedule Publication (Optional)"
                    value={formData.publishAt}
                    onChange={(e) => {
                      const newPublishAt = e.target.value;
                      setFormData({ 
                        ...formData, 
                        publishAt: newPublishAt,
                        coins: newPublishAt ? formData.coins : '0'
                      });
                    }}
                    className="w-full p-3 border rounded-lg"
                  />
                </div>
                <div className="w-1/3">
                  <input
                    type="number"
                    min="1"
                    placeholder="Set Cost"
                    value={formData.coins}
                    disabled={!formData.publishAt}
                    onKeyDown={(e) => {
                      if (e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[eE]/g, '');
                      setFormData({ ...formData, coins: value });
                    }}
                    onBlur={(e) => {
                      if (formData.publishAt) {
                        const value = parseInt(e.target.value) || 1;
                        setFormData({ ...formData, coins: Math.max(1, value).toString() });
                      }
                    }}
                    className="w-full p-3 border rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed"
                    title={formData.publishAt ? "Set coins required to access this chapter" : "Set publish date first to enable paid chapter"}
                  />
                </div>
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