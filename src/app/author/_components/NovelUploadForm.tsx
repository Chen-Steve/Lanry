'use client';

import { useState, useEffect } from 'react';
import { generateNovelSlug } from '@/lib/utils';
import supabase from '@/lib/supabaseClient';

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
    <div className="max-w-5xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <h3 className="mb-4">My Novels</h3>
          <div className="space-y-2">
            {novels.map((novel) => (
              <div
                key={novel.id}
                className={`p-3 border rounded hover:bg-gray-100 cursor-pointer ${
                  editingNovel?.id === novel.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div onClick={() => handleNovelClick(novel)}>
                    <h4>{novel.title}</h4>
                    <p>by {novel.author}</p>
                    <span className="bg-gray-200 px-2 py-1 rounded mt-2 inline-block">
                      {novel.status}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(novel.id);
                    }}
                    className="hover:text-red-700 p-1"
                    title="Delete novel"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="mb-4">
              {editingNovel ? 'Edit Novel' : 'Add New Novel'}
            </h3>

            <div>
              <input
                type="text"
                placeholder="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <textarea
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border rounded min-h-[100px]"
                required
              />
            </div>

            <div>
              <input
                type="text"
                placeholder="Author (leave empty to use your username)"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <select
                aria-label="Status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as Novel['status'] })}
                className="w-full p-2 border rounded"
                required
              >
                <option value="ONGOING">Ongoing</option>
                <option value="COMPLETED">Completed</option>
                <option value="HIATUS">Hiatus</option>
              </select>
            </div>

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
        </div>
      </div>
    </div>
  );
} 