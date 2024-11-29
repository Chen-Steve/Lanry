'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ForumPost, CategoryBasicInfo } from '@/types/database';

export interface CreatePostButtonProps {
  threadId?: string;
  mode: 'thread' | 'reply';
  categories?: CategoryBasicInfo[];
  onPostCreated?: (newPost: ForumPost) => void;
}

export default function CreatePostButton({ threadId, mode, categories, onPostCreated }: CreatePostButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content) return;

    try {
      setIsSubmitting(true);
      const response = await fetch(mode === 'thread' ? '/api/forum/threads' : '/api/forum/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          mode === 'thread' 
            ? { title, content, categoryId: selectedCategory }
            : { threadId, content }
        ),
      });

      if (!response.ok) throw new Error(`Failed to create ${mode}`);
      
      const newPost = await response.json();
      onPostCreated?.(newPost);

      // Reset form and close modal
      setContent('');
      setTitle('');
      setSelectedCategory('');
      setIsOpen(false);
    } catch (error) {
      console.error(`Error creating ${mode}:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          {mode === 'thread' ? 'Create Thread' : 'Reply to Thread'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'thread' ? 'Create New Thread' : 'Reply to Thread'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'thread' && (
            <>
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">Thread Title</label>
                <input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium">Category</label>
                <select
                  id="category"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select a category</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="space-y-2">
            <label htmlFor="content" className="text-sm font-medium">
              Your Reply
            </label>
            <Textarea
              id="content"
              value={content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
              placeholder="Write your reply here..."
              required
              rows={5}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Posting...' : 'Post Reply'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 