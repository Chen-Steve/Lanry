'use client';

import { useState, useEffect } from 'react';

type Novel = {
  id: string;
  title: string;
  description: string;
  author: string;
  status: 'ONGOING' | 'COMPLETED' | 'HIATUS';
};

export default function NovelUploadForm() {
  const [novels, setNovels] = useState<Novel[]>([]);
  const [editingNovel, setEditingNovel] = useState<Novel | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    author: '',
    status: 'ONGOING' as Novel['status'],
  });

  useEffect(() => {
    fetchNovels();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingNovel 
        ? `/api/novels/${editingNovel.id}`
        : '/api/novels';

      const response = await fetch(url, {
        method: editingNovel ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error(`Failed to ${editingNovel ? 'update' : 'create'} novel`);

      // Reset form and refresh novels
      setFormData({
        title: '',
        description: '',
        author: '',
        status: 'ONGOING',
      });
      setEditingNovel(null);
      fetchNovels();
      alert(`Novel ${editingNovel ? 'updated' : 'created'} successfully!`);
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
    });
  };

  const handleCancelEdit = () => {
    setEditingNovel(null);
    setFormData({
      title: '',
      description: '',
      author: '',
      status: 'ONGOING',
    });
  };

  const handleDelete = async (novelId: string) => {
    if (!confirm('Are you sure you want to delete this novel? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/novels/${novelId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete novel');

      // Reset form if we're currently editing this novel
      if (editingNovel?.id === novelId) {
        setEditingNovel(null);
        setFormData({
          title: '',
          description: '',
          author: '',
          status: 'ONGOING',
        });
      }

      // Refresh novels list
      fetchNovels();
      alert('Novel deleted successfully!');
    } catch (error) {
      console.error('Error deleting novel:', error);
      alert('Failed to delete novel');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <h3 className="text-lg font-semibold mb-4">Existing Novels</h3>
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
                    <h4 className="font-medium">{novel.title}</h4>
                    <p className="text-sm text-gray-600">by {novel.author}</p>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">{novel.status}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(novel.id);
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
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
            <h3 className="text-lg font-semibold mb-4">
              {editingNovel ? 'Edit Novel' : 'Add New Novel'}
            </h3>

            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                title="Title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                title="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full p-2 border rounded"
                rows={4}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Author</label>
              <input
                title="Author"
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full p-2 border rounded"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                title="Status"
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
                className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
              >
                {editingNovel ? 'Update Novel' : 'Add Novel'}
              </button>
              {editingNovel && (
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
    </div>
  );
} 