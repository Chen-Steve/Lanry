import { useState, useEffect } from 'react';

type Novel = {
  id: string;
  title: string;
};

type Chapter = {
  id: string;
  chapterNumber: number;
  title: string;
  content: string;
  novelId: string;
  slug: string;
  publishAt?: Date;
};

// Add a helper function to check if a chapter is published
const isChapterPublished = (chapter: Chapter) => {
  if (!chapter.publishAt) return true;
  return new Date(chapter.publishAt) <= new Date();
};

export default function ChapterManagementForm() {
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
      const response = await fetch('/api/novels');
      if (!response.ok) throw new Error('Failed to fetch novels');
      const data = await response.json();
      setNovels(data);
    } catch (error) {
      console.error('Error fetching novels:', error);
    }
  };

  const fetchChapters = async (novelId: string) => {
    try {
      const response = await fetch(`/api/novels/${novelId}/chapters`);
      if (!response.ok) throw new Error('Failed to fetch chapters');
      const data = await response.json();
      setChapters(data);
    } catch (error) {
      console.error('Error fetching chapters:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNovel) return;

    try {
      const url = editingChapter
        ? `/api/novels/${selectedNovel}/chapters/${editingChapter.id}`
        : `/api/novels/${selectedNovel}/chapters`;

      const requestBody = {
        chapterNumber: parseInt(formData.chapterNumber),
        title: formData.title.trim() || undefined,
        content: formData.content,
        slug: formData.slug.trim() || undefined,
        publishAt: formData.publishAt ? new Date(formData.publishAt).toISOString() : undefined,
      };

      const response = await fetch(url, {
        method: editingChapter ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${editingChapter ? 'update' : 'create'} chapter`);
      }

      // Reset form and refresh chapters
      setFormData({ chapterNumber: '', title: '', content: '', slug: '', publishAt: '' });
      setEditingChapter(null);
      fetchChapters(selectedNovel);
      alert(`Chapter ${editingChapter ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error(`Error ${editingChapter ? 'updating' : 'creating'} chapter:`, error);
      alert(error instanceof Error ? error.message : `Failed to ${editingChapter ? 'update' : 'create'} chapter`);
    }
  };

  const handleChapterClick = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setFormData({
      chapterNumber: chapter.chapterNumber.toString(),
      title: chapter.title,
      content: chapter.content,
      slug: chapter.slug,
      publishAt: chapter.publishAt ? new Date(chapter.publishAt).toISOString().slice(0, 16) : '',
    });
  };

  const handleCancelEdit = () => {
    setEditingChapter(null);
    setFormData({ chapterNumber: '', title: '', content: '', slug: '', publishAt: '' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Novel Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">Select Novel</label>
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
        <div className="block lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Chapters List */}
          <div className="mb-6 lg:mb-0">
            <div className="lg:sticky lg:top-4">
              <h3 className="text-lg font-semibold mb-4">Existing Chapters</h3>
              <div className="bg-white rounded-lg border shadow-sm max-h-[300px] lg:max-h-[calc(100vh-200px)] overflow-y-auto">
                {chapters.length === 0 ? (
                  <p className="p-4 text-gray-500 text-center">No chapters yet</p>
                ) : (
                  <div className="divide-y">
                    {chapters.map((chapter) => (
                      <button
                        key={chapter.id}
                        onClick={() => handleChapterClick(chapter)}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                          editingChapter?.id === chapter.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-medium">
                            Chapter {chapter.chapterNumber}
                            {chapter.title && `: ${chapter.title}`}
                          </h4>
                          {!isChapterPublished(chapter) && (
                            <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                              Advanced
                            </span>
                          )}
                        </div>
                        {chapter.publishAt && (
                          <p className="text-sm text-gray-500 mt-1">
                            {isChapterPublished(chapter) 
                              ? `Published on ${new Date(chapter.publishAt).toLocaleDateString()}`
                              : `Scheduled for ${new Date(chapter.publishAt).toLocaleString()}`
                            }
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chapter Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg border shadow-sm p-4 lg:p-6">
              <h3 className="text-lg font-semibold mb-6">
                {editingChapter ? 'Edit Chapter' : 'Add New Chapter'}
              </h3>
              
              <div className="space-y-4 lg:space-y-6">
                {/* Chapter Number */}
                <div>
                  <input
                    title="Enter the chapter number"
                    type="number"
                    placeholder="Chapter Number"
                    value={formData.chapterNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, chapterNumber: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Chapter Title */}
                <div>
                  <input
                    title="Enter the chapter title (optional)"
                    type="text"
                    placeholder="Chapter Title (optional)"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Slug */}
                <div>
                  <input
                    title="Enter custom slug (optional)"
                    type="text"
                    placeholder="Custom Slug (auto-generated if empty)"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') })
                    }
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Content */}
                <div>
                  <textarea
                    title="Enter the chapter content"
                    placeholder="Chapter Content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[200px] lg:min-h-[300px]"
                    required
                  />
                </div>

                {/* Schedule Publication */}
                <div>
                  <label className="block text-sm font-medium mb-2">Schedule Publication (optional)</label>
                  <input
                    title="Schedule publication date and time"
                    type="datetime-local"
                    value={formData.publishAt}
                    onChange={(e) =>
                      setFormData({ ...formData, publishAt: e.target.value })
                    }
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {formData.publishAt && (
                    <p className="text-sm text-gray-500 mt-1">
                      This chapter will be published on {new Date(formData.publishAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {editingChapter ? 'Update Chapter' : 'Add Chapter'}
                </button>
                {editingChapter && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
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