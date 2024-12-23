'use client';

import { useState, useEffect } from 'react';
import { generateNovelSlug } from '@/lib/utils';
import supabase from '@/lib/supabaseClient';
import { uploadImage } from '@/services/uploadService';
import { toast } from 'react-hot-toast';
import NovelList from './NovelList';
import NovelCoverUpload from './NovelCoverUpload';
import NovelFormFields from './NovelFormFields';
import { NovelCategory } from '@/types/database';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

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

type FormStep = 'cover' | 'details' | 'categories';

export default function NovelUploadForm({ authorOnly = false }: NovelUploadFormProps) {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [editingNovel, setEditingNovel] = useState<Novel | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<FormStep>('cover');
  const [selectedCategories, setSelectedCategories] = useState<NovelCategory[]>([]);
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
    fetchUserRole();
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
      
      const novelsWithCategories = data?.map(novel => ({
        ...novel,
        categories: novel.categories?.map((c: CategoryData) => c.category) || []
      })) || [];

      setNovels(novelsWithCategories);
    } catch (error) {
      console.error('Error fetching novels:', error);
      toast.error('Failed to fetch novels');
    }
  };

  const fetchUserRole = async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;

      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (error) throw error;
      setUserRole(profileData.role);
    } catch (error) {
      console.error('Error fetching user role:', error);
      toast.error('Failed to fetch user role');
    }
  };

  const handleImageChange = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    setImageFile(file);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    setIsUploading(true);
    const toastId = toast.loading('Uploading novel...');

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
      const isTranslator = userRole === 'TRANSLATOR';
      const authorName = isTranslator ? formData.author.trim() : (profile?.username || 'Anonymous');
      const novelId = editingNovel?.id || crypto.randomUUID();

      let coverImageUrl = editingNovel?.cover_image_url;
      if (imageFile) {
        try {
          coverImageUrl = await uploadImage(imageFile, session.user.id);
        } catch (error) {
          console.error('Error uploading image:', error);
          toast.error('Failed to upload cover image', { id: toastId });
          return;
        }
      }

      const novelData = {
        id: novelId,
        ...formData,
        author: authorName,
        slug,
        author_profile_id: session.user.id,
        is_author_name_custom: isTranslator,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        translator_id: isTranslator ? session.user.id : null,
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

      if (selectedCategories.length > 0) {
        const categoryLinks = selectedCategories.map(category => ({
          novel_id: novelId,
          category_id: category.id
        }));

        if (editingNovel) {
          await supabase
            .from('categories_on_novels')
            .delete()
            .eq('novel_id', novelId);
        }

        const { error: categoryError } = await supabase
          .from('categories_on_novels')
          .insert(categoryLinks);

        if (categoryError) throw categoryError;
      }

      handleCancelEdit();
      fetchNovels();
      toast.success(`Novel ${editingNovel ? 'updated' : 'created'} successfully!`, { id: toastId });
    } catch (error) {
      console.error(`Error ${editingNovel ? 'updating' : 'creating'} novel:`, error);
      toast.error(`Failed to ${editingNovel ? 'update' : 'create'} novel`, { id: toastId });
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
    setSelectedCategories(novel.categories || []);
    setCurrentStep('cover');
    if (novel.cover_image_url) {
      setImagePreview(novel.cover_image_url);
    }
  };

  const handleCancelEdit = () => {
    setEditingNovel(null);
    setImageFile(null);
    setImagePreview('');
    setSelectedCategories([]);
    setFormData({
      title: '',
      description: '',
      author: '',
      status: 'ONGOING',
      slug: '',
    });
    setCurrentStep('cover');
  };

  const handleDelete = async (novelId: string) => {
    toast((t) => (
      <div className="flex flex-col gap-2">
        <p>Are you sure you want to delete this novel?</p>
        <div className="flex gap-2">
          <button
            onClick={async () => {
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
                toast.success('Novel deleted successfully!');
              } catch (error) {
                console.error('Error deleting novel:', error);
                toast.error('Failed to delete novel');
              }
              toast.dismiss(t.id);
            }}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const handleNextStep = () => {
    const steps: FormStep[] = ['cover', 'details', 'categories'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handlePrevStep = () => {
    const steps: FormStep[] = ['cover', 'details', 'categories'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'cover' as FormStep, label: 'Cover', icon: 'mdi:image' },
      { id: 'details' as FormStep, label: 'Details', icon: 'mdi:form-textbox' },
      { id: 'categories' as FormStep, label: 'Categories', icon: 'mdi:tag-multiple' }
    ];

    return (
      <div className="flex justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <button
              type="button"
              onClick={() => setCurrentStep(step.id)}
              className={`flex flex-col items-center ${
                currentStep === step.id
                  ? 'text-blue-500'
                  : steps.indexOf(steps.find(s => s.id === currentStep)!) > index
                  ? 'text-green-500'
                  : 'text-gray-400'
              }`}
            >
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center
                ${currentStep === step.id
                  ? 'bg-blue-100 border-2 border-blue-500'
                  : steps.indexOf(steps.find(s => s.id === currentStep)!) > index
                  ? 'bg-green-100 border-2 border-green-500'
                  : 'bg-gray-100 border-2 border-gray-300'}
                hover:bg-opacity-80 transition-colors
              `}>
                <Icon icon={step.icon} className="w-5 h-5" />
              </div>
              <span className="text-xs mt-1">{step.label}</span>
            </button>
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 ${
                steps.indexOf(steps.find(s => s.id === currentStep)!) > index
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderFormStep = () => {
    const formContent = {
      cover: (
        <NovelCoverUpload
          imagePreview={imagePreview}
          coverImageUrl={editingNovel?.cover_image_url}
          onImageChange={handleImageChange}
          onImageRemove={() => {
            setImageFile(null);
            setImagePreview('');
          }}
        />
      ),
      details: (
        <NovelFormFields
          formData={formData}
          onFormDataChange={setFormData}
          userRole={userRole}
          editingNovel={editingNovel}
          onCategoriesChange={undefined}
        />
      ),
      categories: (
        <NovelFormFields
          formData={formData}
          onFormDataChange={setFormData}
          userRole={userRole}
          editingNovel={editingNovel ? editingNovel : { id: crypto.randomUUID() }}
          section="categories"
          onCategoriesChange={(categories) => {
            setSelectedCategories(categories);
            if (editingNovel) {
              setEditingNovel(prev => prev ? {
                ...prev,
                categories
              } : null);
            }
          }}
        />
      )
    };

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {formContent[currentStep]}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="space-y-6">
      <NovelList
        novels={novels}
        isVisible={isNovelListVisible}
        onToggleVisibility={() => setIsNovelListVisible(!isNovelListVisible)}
        onNovelClick={handleNovelClick}
        onNovelDelete={handleDelete}
        editingNovelId={editingNovel?.id}
      />

      <section>
        <div className="bg-white rounded-lg p-8 shadow-lg border">
          <h3 className="text-2xl font-bold text-center mb-6">
            {editingNovel ? 'Edit Novel' : 'Upload New Novel'}
          </h3>

          {renderStepIndicator()}

          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
            {renderFormStep()}

            <div className="flex justify-between mt-8">
              <button
                type="button"
                onClick={handlePrevStep}
                className={`px-6 py-2 rounded flex items-center gap-2 ${
                  currentStep === 'cover'
                    ? 'invisible'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                <Icon icon="mdi:arrow-left" />
                Previous
              </button>

              <div className="flex gap-4">
                {editingNovel && (
                  <>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-6 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-2"
                    >
                      <Icon icon="mdi:close" />
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmit()}
                      disabled={isUploading}
                      className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isUploading ? (
                        <>
                          <Icon icon="mdi:loading" className="animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Icon icon="mdi:check" />
                          Update Novel
                        </>
                      )}
                    </button>
                    {currentStep !== 'categories' && (
                      <button
                        type="button"
                        onClick={() => handleNextStep()}
                        className="px-6 py-2 bg-blue-100 text-blue-800 rounded hover:bg-blue-200 flex items-center gap-2"
                      >
                        Next
                        <Icon icon="mdi:arrow-right" />
                      </button>
                    )}
                  </>
                )}
                {!editingNovel && (
                  <button
                    type="button"
                    onClick={() => currentStep === 'categories' ? handleSubmit() : handleNextStep()}
                    disabled={isUploading}
                    className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <Icon icon="mdi:loading" className="animate-spin" />
                        Uploading...
                      </>
                    ) : currentStep === 'categories' ? (
                      <>
                        <Icon icon="mdi:check" />
                        Create Novel
                      </>
                    ) : (
                      <>
                        Next
                        <Icon icon="mdi:arrow-right" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
} 