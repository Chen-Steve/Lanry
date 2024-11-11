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
      const response = await fetch(`/api/novels/${selectedNovel}/chapters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          chapterNumber: parseInt(formData.chapterNumber),
        }),
      });

      if (!response.ok) throw new Error('Failed to create chapter');

      // Reset form and refresh chapters
      setFormData({
        chapterNumber: '',
        title: '',
        content: '',
      });
      fetchChapters(selectedNovel);
      alert('Chapter created successfully!');
    } catch (error) {
      console.error('Error creating chapter:', error);
      alert('Failed to create chapter');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
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
        <>
          <form onSubmit={handleSubmit} className="mb-8">
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

              <button
                type="submit"
                className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                Add Chapter
              </button>
            </div>
          </form>

          <div>
            <h3 className="text-lg font-semibold mb-4">Existing Chapters</h3>
            <div className="space-y-2">
              {chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  className="p-4 border rounded bg-gray-50"
                >
                  <h4 className="font-medium">
                    Chapter {chapter.chapterNumber}: {chapter.title}
                  </h4>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
} 