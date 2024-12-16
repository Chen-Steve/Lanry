'use client';

import { useState, useEffect } from 'react';
import { generateNovelSlug } from '@/lib/utils';
import supabase from '@/lib/supabaseClient';
import { Icon } from '@iconify/react';

interface NovelUploadFormProps {
  authorOnly?: boolean;
}

interface Novel {
  id: string;
  title: string;
  description: string;
  author: string;
  status: 'ONGOING' | 'COMPLETED' | 'HIATUS';
  slug: string;
  created_at: string;
  updated_at: string;
  author_profile_id: string;
}

export default function NovelUploadForm({ authorOnly = false }: NovelUploadFormProps) {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [editingNovel, setEditingNovel] = useState<Novel | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: '',
    status: 'ONGOING' as Novel['status'],
    slug: '',
  });
  const [isNovelListVisible, setIsNovelListVisible] = useState(true);

  useEffect(() => {
    fetchNovels();
  }, []);

  const fetchNovels = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      let query = supabase
        .from('novels')
        .select('*')
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('You must be logged in to create or edit a novel');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', session.user.id)
        .single();

      const slug = generateNovelSlug(formData.title);
      const isCustomAuthor = Boolean(formData.author.trim());
      const authorName = isCustomAuthor ? formData.author.trim() : (profile?.username || 'Anonymous');

      const novelData = {
        id: crypto.randomUUID(),
        ...formData,
        author: authorName,
        slug,
        author_profile_id: session.user.id,
        is_author_name_custom: isCustomAuthor,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        translator_id: isCustomAuthor ? session.user.id : null
      };

      let error;

      if (editingNovel) {
        // Update existing novel
        const { error: updateError } = await supabase
          .from('novels')
          .update({
            ...novelData,
            id: editingNovel.id
          })
          .eq('id', editingNovel.id);
        error = updateError;
      } else {
        // Insert new novel
        const { error: insertError } = await supabase
          .from('novels')
          .insert([novelData]);
        error = insertError;
      }

      if (error) throw error;

      // Reset form and refresh novels
      setFormData({
        title: '',
        description: '',
        author: '',
        status: 'ONGOING',
        slug: '',
      });
      setEditingNovel(null);
      fetchNovels();
    } catch (error) {
      console.error(`Error ${editingNovel ? 'updating' : 'creating'} novel:`, error);
      alert(`Failed to ${editingNovel ? 'update' : 'create'} novel`);
    }
  };

  const handleNovelClick = (novel: Novel) => {
    setEditingNovel(novel);
    setFormData({
      title: novel.title,
      description: novel.description,
      author: novel.author,
      status: novel.status,
      slug: novel.slug,
    });
  };

  const handleCancelEdit = () => {
    setEditingNovel(null);
    setFormData({
      title: '',
      description: '',
      author: '',
      status: 'ONGOING',
      slug: '',
    });
  };

  const handleDelete = async (novelId: string) => {
    if (!confirm('Are you sure you want to delete this novel? This action cannot be undone.')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('novels')
        .delete()
        .eq('id', novelId)
        .eq('author_profile_id', session.user.id);

      if (error) throw error;

      if (editingNovel?.id === novelId) {
        handleCancelEdit();
      }

      fetchNovels();
      alert('Novel deleted successfully!');
    } catch (error) {
      console.error('Error deleting novel:', error);
      alert('Failed to delete novel');
    }
  };

  return (
    <div className="space-y-6">
      {/* Novel List Section */}
      <section>
        <button
          onClick={() => setIsNovelListVisible(!isNovelListVisible)}
          className="w-full flex justify-between items-center p-3 bg-gray-100 rounded-lg"
        >
          <h3 className="font-medium text-black">My Novels</h3>
          <Icon 
            icon={isNovelListVisible ? 'mdi:chevron-up' : 'mdi:chevron-down'} 
            className="w-6 h-6 text-black"
          />
        </button>
        
        <div className={`space-y-2 transition-all duration-300 overflow-hidden ${
          isNovelListVisible ? 'max-h-[1000px] mt-4' : 'max-h-0'
        }`}>
          {novels.map((novel) => (
            <div
              key={novel.id}
              className={`p-3 border rounded hover:bg-gray-100 cursor-pointer ${
                editingNovel?.id === novel.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <div onClick={() => handleNovelClick(novel)}>
                  <h4 className="text-black">{novel.title}</h4>
                  <p className="text-black">by {novel.author}</p>
                  <span className="bg-gray-200 px-2 py-1 rounded mt-2 inline-block text-black">
                    {novel.status}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(novel.id);
                  }}
                  className="text-black hover:text-red-700 p-1"
                  title="Delete novel"
                >
                  <Icon icon="mdi:delete" className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Novel Form Section */}
      <section>
        <form onSubmit={handleSubmit} className="space-y-4">
          <h3 className="mb-4">
            {editingNovel ? 'Edit Novel' : 'Add New Novel'}
          </h3>

          <input
            type="text"
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />

          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-2 border rounded min-h-[100px]"
            required
          />

          <input
            type="text"
            placeholder="Author (leave empty to use your username)"
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            className="w-full p-2 border rounded"
          />

          <select
            aria-label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as Novel['status'] })}
            className="w-full p-2 border rounded text-black"
            required
          >
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
            <option value="HIATUS">Hiatus</option>
          </select>

          <div className="flex gap-4">
            <button
              type="submit"
              className="flex-1 bg-blue-500 py-2 px-4 rounded hover:bg-blue-600"
            >
              {editingNovel ? 'Update Novel' : 'Add Novel'}
            </button>
            {editingNovel && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 bg-gray-500 py-2 px-4 rounded hover:bg-gray-600"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
} 