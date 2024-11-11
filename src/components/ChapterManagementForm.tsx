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
};

export default function ChapterManagementForm() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [selectedNovel, setSelectedNovel] = useState<string>('');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [formData, setFormData] = useState({
    chapterNumber: '',
    title: '',
    content: '',
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

      const response = await fetch(url, {
        method: editingChapter ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          chapterNumber: parseInt(formData.chapterNumber),
        }),
      });

      if (!response.ok) throw new Error(`Failed to ${editingChapter ? 'update' : 'create'} chapter`);

      // Reset form and refresh chapters
      setFormData({ chapterNumber: '', title: '', content: '' });
      setEditingChapter(null);
      fetchChapters(selectedNovel);
      alert(`Chapter ${editingChapter ? 'updated' : 'created'} successfully!`);
    } catch (error) {
      console.error(`Error ${editingChapter ? 'updating' : 'creating'} chapter:`, error);
      alert(`Failed to ${editingChapter ? 'update' : 'create'} chapter`);
    }
  };

  const handleChapterClick = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setFormData({
      chapterNumber: chapter.chapterNumber.toString(),
      title: chapter.title,
      content: chapter.content,
    });
  };

  const handleCancelEdit = () => {
    setEditingChapter(null);
    setFormData({ chapterNumber: '', title: '', content: '' });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">Select Novel</label>
        <select
          title="Select a novel"
          value={selectedNovel}
          onChange={(e) => setSelectedNovel(e.target.value)}
          className="w-full p-2 border rounded"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Existing Chapters</h3>
            <div className="space-y-2">
              {chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className={`p-1 border rounded hover:bg-gray-100 cursor-pointer ${
                    editingChapter?.id === chapter.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'bg-gray-50'
                  }`}
                  onClick={() => handleChapterClick(chapter)}
                >
                  <h4 className="font-medium">
                    Chapter {chapter.chapterNumber}: {chapter.title}
                  </h4>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <form onSubmit={handleSubmit} className="mb-8">
              <h3 className="text-lg font-semibold mb-4">
                {editingChapter ? 'Edit Chapter' : 'Add New Chapter'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Chapter Number
                  </label>
                  <input
                    title="Enter the chapter number"
                    type="number"
                    value={formData.chapterNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, chapterNumber: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Chapter Title
                  </label>
                  <input
                    title="Enter the chapter title"
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Content</label>
                  <textarea
                    title="Enter the chapter content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                    rows={10}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                  {editingChapter ? 'Update Chapter' : 'Add Chapter'}
                </button>
                {editingChapter && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
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