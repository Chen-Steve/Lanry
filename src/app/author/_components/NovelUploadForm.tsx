'use client';

import { useState, useEffect } from 'react';
import { generateNovelSlug } from '@/lib/utils';
import supabase from '@/lib/supabaseClient';
import { Icon } from '@iconify/react';
import Image from 'next/image';
import { uploadImage } from '@/services/uploadService';
import { toast } from 'react-hot-toast';
import CategorySelect from './CategorySelect';
import { NovelCategory } from '@/types/database';

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
  cover_image_url?: string;
  categories?: NovelCategory[];
}

interface CategoryData {
  category: NovelCategory;
}

export default function NovelUploadForm({ authorOnly = false }: NovelUploadFormProps) {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [editingNovel, setEditingNovel] = useState<Novel | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
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
        .select(`
          *,
          categories:categories_on_novels (
            category:category_id (
              id,
              name,
              created_at,
              updated_at
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (authorOnly) {
        query = query.eq('author_profile_id', session.user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Transform the nested category data
      const novelsWithCategories = data?.map(novel => ({
        ...novel,
        categories: novel.categories?.map((c: CategoryData) => c.category) || []
      })) || [];

      setNovels(novelsWithCategories);
    } catch (error) {
      console.error('Error fetching novels:', error);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setImageFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

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
      const novelId = editingNovel?.id || crypto.randomUUID();

      let coverImageUrl = editingNovel?.cover_image_url;
      if (imageFile) {
        try {
          coverImageUrl = await uploadImage(imageFile, session.user.id);
        } catch (error) {
          console.error('Error uploading image:', error);
          toast.error('Failed to upload cover image');
          return;
        }
      }

      const novelData = {
        id: novelId,
        ...formData,
        author: authorName,
        slug,
        author_profile_id: session.user.id,
        is_author_name_custom: isCustomAuthor,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        translator_id: isCustomAuthor ? session.user.id : null,
        cover_image_url: coverImageUrl,
      };

      let error;

      if (editingNovel) {
        const { error: updateError } = await supabase
          .from('novels')
          .update({
            ...novelData,
            id: editingNovel.id
          })
          .eq('id', editingNovel.id);
        error = updateError;
      } else {
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
      setImageFile(null);
      setImagePreview('');
      fetchNovels();
      toast.success(`Novel ${editingNovel ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error(`Error ${editingNovel ? 'updating' : 'creating'} novel:`, error);
      toast.error(`Failed to ${editingNovel ? 'update' : 'create'} novel`);
    } finally {
      setIsUploading(false);
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
    setImageFile(null);
    setImagePreview('');
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

      {/* Form Section */}
      <section>
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-6">
            {editingNovel ? 'Edit Novel' : 'Upload New Novel'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Cover Image
              </label>
              <div className="flex items-center space-x-4">
                {(imagePreview || editingNovel?.cover_image_url) && (
                  <div className="relative w-32 h-48 border rounded overflow-hidden">
                    <Image
                      src={imagePreview || (editingNovel?.cover_image_url?.startsWith('http') 
                        ? editingNovel.cover_image_url 
                        : `/novel-covers/${editingNovel?.cover_image_url}`
                      ) || ''}
                      alt="Cover preview"
                      fill
                      className="object-cover"
                      sizes="128px"
                    />
                    <button
                      title="Remove cover image"
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <Icon icon="mdi:close" className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex-1">
                  <label className="flex flex-col items-center px-4 py-6 bg-white text-blue-500 rounded-lg border-2 border-blue-500 border-dashed cursor-pointer hover:bg-blue-50">
                    <Icon icon="mdi:cloud-upload" className="w-8 h-8" />
                    <span className="mt-2 text-sm">Click to upload cover image</span>
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
              </div>
            </div>

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

            {/* Categories - Only show when editing a novel */}
            {editingNovel && (
              <CategorySelect
                novelId={editingNovel.id}
                initialCategories={editingNovel.categories}
                onCategoriesChange={(categories) => {
                  setEditingNovel(prev => prev ? {
                    ...prev,
                    categories
                  } : null);
                }}
              />
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isUploading}
                className="flex-1 bg-blue-500 py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading...' : (editingNovel ? 'Update Novel' : 'Add Novel')}
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
      </section>
    </div>
  );
} 