'use client';

import { useState } from 'react';

enum NovelStatus {
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  HIATUS = 'HIATUS'
}

type FormData = {
  title: string;
  author: string;
  description: string;
  status: NovelStatus;
};

export default function NovelUploadForm() {
  const [formData, setFormData] = useState<FormData>({
    title: '',
    author: '',
    description: '',
    status: NovelStatus.ONGOING,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/novels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to create novel');

      // Reset form
      setFormData({
        title: '',
        author: '',
        description: '',
        status: NovelStatus.ONGOING,
      });

      alert('Novel created successfully!');
    } catch (error) {
      console.error('Error creating novel:', error);
      alert('Failed to create novel');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-4">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            aria-label="Title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Author</label>
          <input
            aria-label="Author"
            type="text"
            value={formData.author}
            onChange={(e) => setFormData({ ...formData, author: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            aria-label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-2 border rounded"
            rows={4}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            aria-label="Status"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as NovelStatus })}
            className="w-full p-2 border rounded"
          >
            <option value={NovelStatus.ONGOING}>Ongoing</option>
            <option value={NovelStatus.COMPLETED}>Completed</option>
            <option value={NovelStatus.HIATUS}>Hiatus</option>
          </select>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Upload Novel
        </button>
      </div>
    </form>
  );
} 